import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import sql from "../sql/SQLQuery"
import functions from "../functions/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import path from "path"
import {TagHistory, Tag, Post, AliasToParams, TagDeleteRequestFulfillParams, AliasToRequestParams, AliasToRequestFulfillParams,
TagEditRequestFulfillParams, TagHistoryParams, TagEditParams, TagEditRequestParams, AliasHistoryType} from "../types/Types"
import ServerFunctions from "../structures/ServerFunctions"

const tagLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const tagUpdateLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const TagRoutes = (app: Express) => {
    app.get("/api/tag", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return void res.status(400).send("Bad tag")
            let result = await sql.tag.tag(tag)
            if (!result) {
                const alias = await sql.tag.alias(tag)
                if (alias) result = await sql.tag.tag(alias.tag)
                if (!alias && functions.util.isJapaneseText(tag)) {
                    const pixivTag = await sql.tag.tagFromPixivTag(tag)
                    if (pixivTag) result = await sql.tag.tag(pixivTag.tag)
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/related", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return void res.status(400).send("Bad tag")
            let result = await sql.tag.relatedTags(tag)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/unverified", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return void res.status(400).send("Bad tag")
            let result = await sql.tag.unverifiedTags([tag])
            const unverifiedTag = result[0]
            serverFunctions.sendEncrypted(unverifiedTag, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/counts", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tag.tagCounts(tags.filter(Boolean))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/list", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tag.tags(tags.filter(Boolean))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/map", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tag.tags(tags.filter(Boolean))
            const tagMap = {} as {[key: string]: Tag}
            for (const tag of result) {
                tagMap[tag.tag] = tag
            }
            serverFunctions.sendEncrypted(tagMap, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.delete("/api/tag/delete", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const tag = req.query.tag as string
            if (!tag) return void res.status(400).send("Invalid tag")
            const tagObj = await sql.tag.tag(tag.trim())
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!tagObj) return void res.status(400).send("Bad tag")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            await serverFunctions.deleteTag(tagObj)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/takedown", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag} = req.body as {tag: string}
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!tag) return void res.status(400).send("Bad tag")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const tagObj = await sql.tag.tag(tag)
            if (!tagObj) return void res.status(404).send("Doesn't exist")
            const allPosts = await sql.search.search([tag], "all", "all", "all", "date", undefined, 9999)
            if (tagObj.banned) {
                await sql.tag.updateTag(tag, "banned", false)
                for (const post of allPosts) {
                    await sql.post.updatePost(post.postID, "hidden", false)
                }
            } else {
                await sql.tag.updateTag(tag, "banned", true)
                for (const post of allPosts) {
                    await sql.post.updatePost(post.postID, "hidden", true)
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/tag/edit", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {tag, key, type, description, image, aliases, implications, pixivTags, social, twitter, 
            website, fandom, wikipedia, r18, featuredPost, reason, updater, updatedDate, silent} = req.body as TagEditParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isContributor(req.session)) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            if (!tag) return void res.status(400).send("Bad tag")
            if (type && !functions.validation.validTagType(type, true)) return void res.status(400).send("Bad type")
            const tagObj = await sql.tag.tag(tag)
            if (!tagObj) return void res.status(400).send("Bad tag")
            let imageFilename = tagObj.image
            let imageHash = tagObj.imageHash
            if (!updater) updater = req.session.username
            if (!updatedDate) updatedDate = new Date().toISOString()
            if (implications !== undefined) {
                let verifiedImplications = [] as string[]
                for (let i = 0; i < implications.length; i++) {
                    const implication = implications[i]?.trim()
                    const exists = await sql.tag.tag(implication)
                    if (exists) verifiedImplications.push(implication)
                }
                implications = verifiedImplications
                if (implications.length) {
                    const oldImplications = tagObj.implications?.filter(Boolean).map((i: any) => i.implication) || []
                    const newImplications = implications
                    const toRemove = oldImplications.filter((implication: string) => !newImplications.includes(implication)).filter(Boolean)
                    const toAdd = newImplications.filter((implication: string) => !oldImplications.includes(implication)).filter(Boolean)

                    const posts = await sql.tag.tagPosts(tag)
                    const postIDs = posts.map((p: any) => p.postID)

                    if (posts.length >  1000 && !permissions.isMod(req.session)) {
                        return void res.status(400).send("No permission to edit implications")
                    } 
                    await sql.tag.bulkDeleteImplications(tag, toRemove)
                    await sql.tag.bulkInsertImplications(tag, toAdd)

                    for (const implication of toAdd) {
                        await sql.tag.insertImplicationHistory(updater, tag, implication, "implication", postIDs, reason)
                    }

                    if (key && key.trim() !== tag) {
                        await serverFunctions.updateImplications(posts, toAdd)
                    } else {
                        serverFunctions.updateImplications(posts, toAdd)
                    }
                }
            }
            if (aliases !== undefined) {
                let noConflictAliases = [] as string[]
                for (let i = 0; i < aliases.length; i++) {
                    const alias = aliases[i]?.trim()
                    const conflict = await sql.tag.tag(alias)
                    if (!conflict) noConflictAliases.push(alias)
                }
                aliases = noConflictAliases
                if (aliases.length) {
                    const oldAliases = tagObj.aliases?.filter(Boolean).map((a: any) => a.alias) || []
                    const newAliases = aliases.map((a: any) => a?.trim())
                    const toRemove = oldAliases.filter((alias: string) => !newAliases.includes(alias)).filter(Boolean)
                    const toAdd = newAliases.filter((alias: string) => !oldAliases.includes(alias)).filter(Boolean)
    
                    await sql.tag.bulkDeleteAliases(tag, toRemove)
                    await sql.tag.bulkInsertAliases(tag, toAdd)
                }
            }
            if (pixivTags !== undefined) {
                await sql.tag.updateTag(tag, "pixivTags", pixivTags)
            }
            if (description !== undefined) {
                await sql.tag.updateTag(tag, "description", description)
            }
            let vanillaImageBuffer = null as any
            let imgChange = false
            if (image?.[0]) {
                if (tagObj.image) {
                    try {
                        const imagePath = functions.link.getTagPath(tagObj.type, tagObj.image)
                        vanillaImageBuffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.deleteFile(imagePath, false)
                        tagObj.image = null
                        tagObj.imageHash = null
                    } catch {
                        tagObj.image = null
                        tagObj.imageHash = null
                    }
                }
                if (image[0] !== "delete") {
                    const filename = `${tag}.${functions.byte.fileExtension(image as number[])}`
                    const imagePath = functions.link.getTagPath(tagObj.type, filename)
                    const newBuffer = Buffer.from(Object.values(image) as any)
                    imgChange = serverFunctions.buffersChanged(vanillaImageBuffer, newBuffer)
                    await serverFunctions.uploadFile(imagePath, newBuffer, false)
                    const hash = serverFunctions.md5(newBuffer)
                    await sql.tag.updateTag(tag, "image", filename)
                    await sql.tag.updateTag(tag, "imageHash", hash)
                    tagObj.image = filename
                    tagObj.imageHash = hash
                    imageFilename = filename
                    imageHash = hash
                } else {
                    await sql.tag.updateTag(tag, "image", null as any)
                    await sql.tag.updateTag(tag, "imageHash", null as any)
                    imageFilename = null
                    imageHash = null
                }
            }
            if (tagObj.type === "artist") {
                if (website !== undefined) {
                    await sql.tag.updateTag(tag, "website", website)
                }
                if (social !== undefined) {
                    await sql.tag.updateTag(tag, "social", social)
                }
                if (twitter !== undefined) {
                    await sql.tag.updateTag(tag, "twitter", twitter)
                }
            }
            if (tagObj.type === "character") {
                if (fandom !== undefined) {
                    await sql.tag.updateTag(tag, "fandom", fandom)
                }
            }
            if (tagObj.type === "series") {
                if (website !== undefined) {
                    await sql.tag.updateTag(tag, "website", website)
                }
                if (twitter !== undefined) {
                    await sql.tag.updateTag(tag, "twitter", twitter)
                }
                if (wikipedia !== undefined) {
                    await sql.tag.updateTag(tag, "wikipedia", wikipedia)
                }
            }
            if (r18 !== undefined) {
                await sql.tag.updateTag(tag, "r18", r18)
            }
            if (featuredPost !== undefined) {
                await sql.tag.updateTag(tag, "featuredPost", featuredPost)
            }
            if (type !== undefined) {
                await sql.tag.updateTag(tag, "type", type)
            }
            await sql.tag.updateTag(tag, "updater", updater)
            await sql.tag.updateTag(tag, "updatedDate", updatedDate)
            let targetTag = tag
            if (key && key.trim() !== tag) {
                const exists = await sql.tag.tag(key.trim())
                if (exists) return void res.status(400).send("Tag name conflict")

                if (tagObj.image) {
                    let newFilename = `${key.trim()}.${path.extname(tagObj.image).replace(".", "")}`
                    if (image && image[0] !== "delete") newFilename = `${key.trim()}.${functions.byte.fileExtension(image as number[])}`
                    const oldImagePath = functions.link.getTagPath(tagObj.type, tagObj.image)
                    const newImagePath = functions.link.getTagPath(tagObj.type, newFilename)
                    await serverFunctions.renameFile(oldImagePath, newImagePath, false, false)
                    await sql.tag.updateTag(tag, "image", newFilename)
                    imageFilename = newFilename
                }

                const result = await sql.history.tagHistory(targetTag)
                for (const tagHistory of result) {
                    if (!tagHistory.image?.startsWith("history/tag")) {
                        if (tagHistory.image) await sql.history.updateTagHistory(tagHistory.historyID, "image", imageFilename)
                    } else {
                        const parts = tagHistory.image.split("/")
                        let keep = parts.slice(3).join("/")
                        const newPath = `history/tag/${key.trim()}/${keep}`
                        await sql.history.updateTagHistory(tagHistory.historyID, "image", newPath)
                    }
                }
                ServerFunctions.renameFolder(`history/tag/${tag}`, `history/tag/${key.trim()}`, false)
                await sql.tag.updateTag(tag, "tag", key.trim())
                targetTag = key.trim()
            }
            if (!key) key = targetTag
            if (permissions.isMod(req.session)) {
                if (silent) return void res.status(200).send("Success")
            }

            const updated = await sql.tag.tag(targetTag) as Tag
            const updatedAliases = updated.aliases?.filter(Boolean).map((a: any) => a.alias)
            const updatedImplications = updated.implications?.filter(Boolean).map((i: any) => i.implication)
            const changes = functions.compare.parseTagChanges(tagObj, updated)

            const tagHistory = await sql.history.tagHistory(targetTag)
            const nextKey = await serverFunctions.getNextKey("tag", key, false)
            if (!tagHistory.length) {
                let vanilla = tagObj as unknown as TagHistory
                vanilla.date = tagObj.createDate 
                vanilla.user = tagObj.creator
                vanilla.aliases = vanilla.aliases.map((alias: any) => alias?.alias)
                vanilla.implications = vanilla.implications.map((implication: any) => implication?.implication)
                if (vanilla.image && vanillaImageBuffer) {
                    if (imgChange) {
                        const newImagePath = functions.link.getTagHistoryPath(targetTag, 1, vanilla.image)
                        await serverFunctions.uploadFile(newImagePath, vanillaImageBuffer, false)
                        vanilla.image = newImagePath
                    }
                } else {
                    vanilla.image = null
                }
                await sql.history.insertTagHistory({username: vanilla.user, tag: targetTag, key: vanilla.tag, type: vanilla.type, image: vanilla.image, imageHash: vanilla.imageHash,
                    description: vanilla.description, aliases: functions.util.filterNulls(vanilla.aliases), implications: functions.util.filterNulls(vanilla.implications), pixivTags: functions.util.filterNulls(vanilla.pixivTags), 
                    website: vanilla.website, social: vanilla.social, twitter: vanilla.twitter, fandom: vanilla.fandom, wikipedia: vanilla.wikipedia, r18: vanilla.r18, featuredPost: vanilla.featuredPost?.postID, imageChanged: false, changes: null})
                if (image?.[0] && imageFilename) {
                    if (imgChange) {
                        const imagePath = functions.link.getTagHistoryPath(key, 2, imageFilename)
                        const buffer = Buffer.from(Object.values(image) as any)
                        await serverFunctions.uploadFile(imagePath, buffer, false)
                        imageFilename = imagePath
                    }
                }
                await sql.history.insertTagHistory({username: req.session.username, tag: targetTag, key, type: updated.type, image: imageFilename, imageHash: updated.imageHash,
                description: updated.description, aliases: functions.util.filterNulls(updatedAliases), implications: functions.util.filterNulls(updatedImplications), pixivTags: functions.util.filterNulls(updated.pixivTags), 
                website: updated.website, social: updated.social, twitter: updated.twitter, fandom: updated.fandom, wikipedia: updated.wikipedia, r18: updated.r18, featuredPost: updated.featuredPost?.postID,
                imageChanged: imgChange, changes, reason})
            } else {
                if (image?.[0] && imageFilename) {
                    if (imgChange) {
                        const imagePath = functions.link.getTagHistoryPath(key, nextKey, imageFilename)
                        const buffer = Buffer.from(Object.values(image) as any)
                        await serverFunctions.uploadFile(imagePath, buffer, false)
                        imageFilename = imagePath

                        const result = await sql.history.tagHistory(targetTag)
                        if (result.length > 1) {
                            const lastResult = result[result.length - 1]
                            const penultResult = result[result.length - 2]
                            const lastImage = lastResult.image
                            const penultImage = penultResult.image
                            if (lastResult.image && penultImage?.startsWith("history/tag") && !lastImage?.startsWith("history/tag")) {
                                await sql.history.updateTagHistory(lastResult.historyID, "image", penultImage)
                            }
                        }
                    }
                }
                await sql.history.insertTagHistory({username: req.session.username, tag: targetTag, key, type: updated.type, image: imageFilename, imageHash: updated.imageHash,
                description: updated.description, aliases: functions.util.filterNulls(updatedAliases), implications: functions.util.filterNulls(updatedImplications), pixivTags: functions.util.filterNulls(updated.pixivTags), 
                website: updated.website, social: updated.social, twitter: updated.twitter, fandom: updated.fandom, wikipedia: updated.wikipedia, r18: updated.r18, featuredPost: updated.featuredPost?.postID,
                imageChanged: imgChange, changes, reason})
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/tag/aliasto", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {tag, aliasTo, username, reason, silent, skipAliasing} = req.body as AliasToParams
            tag = tag?.trim()
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!tag || !aliasTo) return void res.status(400).send("Bad tag or aliasTo")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const tagObj = await sql.tag.tag(tag)
            if (!tagObj) return void res.status(400).send("Bad aliasTo")
            const aliasObj = await sql.tag.tag(aliasTo)
            if (!aliasObj) return void res.status(400).send("Bad aliasTo")
            const sourceData = JSON.stringify(tagObj)
            const posts = await sql.tag.tagPosts(tag)
            const postIDs = posts.map((p) => p.postID)
            let targetUser = username ? username : req.session.username
            if (!silent) await sql.tag.insertAliasHistory(targetUser, tag, aliasTo, "alias", postIDs, sourceData, reason)
            await sql.tag.renameTagMap(tag, aliasTo)
            await sql.note.renameCharacterNotes(tag, aliasTo)
            await serverFunctions.deleteTag(tagObj)
            if (!skipAliasing) await sql.tag.bulkInsertAliases(aliasTo, [tag])
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/undo", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {historyID} = req.body as {historyID: string}
            if (Number.isNaN(Number(historyID))) return void res.status(400).send("Invalid historyID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const aliasHistory = await sql.tag.aliasHistoryID(historyID)
            if (!aliasHistory) return void res.status(400).send("Bad historyID")
            const tag = aliasHistory.source
            const aliasTo = aliasHistory.target
            const sourceData = aliasHistory.sourceData
            const affectedPosts = aliasHistory.affectedPosts || []

            await sql.tag.bulkDeleteAliases(aliasTo, [tag])
            await sql.tag.insertTagFromData(sourceData)
            const aliases = sourceData.aliases?.filter(Boolean).map((a: any) => a.alias)
            const implicatons = sourceData.implications?.filter(Boolean).map((i: any) => i.implicaton)
            await sql.tag.bulkInsertAliases(tag, aliases)
            await sql.tag.bulkInsertImplications(tag, implicatons)
            for (const postID of affectedPosts) {
                await sql.tag.deleteTagMap(postID, [aliasTo])
                await sql.tag.insertTagMap(postID, [tag])
            }
            await sql.note.renameCharacterNotes(aliasTo, tag)
            await sql.tag.insertAliasHistory(req.session.username, tag, aliasTo, "undo alias", affectedPosts, sourceData)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/implication/undo", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {historyID} = req.body as {historyID: string}
            if (Number.isNaN(Number(historyID))) return void res.status(400).send("Invalid historyID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const implicationHistory = await sql.tag.implicationHistoryID(historyID)
            if (!implicationHistory) return void res.status(400).send("Bad historyID")
            const tag = implicationHistory.source
            const implication = implicationHistory.target
            const affectedPosts = implicationHistory.affectedPosts || []

            const posts = await sql.search.posts(affectedPosts)
            await sql.tag.bulkDeleteImplications(tag, [implication])
            for (const post of posts) {
                if (post.tags.includes(implication)) {
                    await sql.tag.deleteTagMap(post.postID, [implication])
                }
            }
            await sql.tag.insertImplicationHistory(req.session.username, tag, implication, "undo implication", affectedPosts)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/implication/redo", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {historyID} = req.body as {historyID: string}
            if (Number.isNaN(Number(historyID))) return void res.status(400).send("Invalid historyID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const implicationHistory = await sql.tag.implicationHistoryID(historyID)
            if (!implicationHistory) return void res.status(400).send("Bad historyID")
            const tag = implicationHistory.source
            const implication = implicationHistory.target
            const affectedPosts = implicationHistory.affectedPosts || []

            const posts = await sql.search.posts(affectedPosts)
            await sql.tag.bulkInsertImplications(tag, [implication])
            for (const post of posts) {
                if (!post.tags.includes(implication)) {
                    await sql.tag.insertTagMap(post.postID, [implication])
                }
            }
            await sql.tag.insertImplicationHistory(req.session.username, tag, implication, "implication", affectedPosts)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/list/unverified", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            let result = await sql.tag.unverifiedTags(tags.filter(Boolean))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.post("/api/tag/delete/request", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, reason} = req.body as {tag: string, reason: string}
            if (!tag) return void res.status(400).send("Invalid postID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            const exists = await sql.tag.tag(tag)
            if (!exists) return void res.status(400).send("Bad tag")
            await sql.request.insertTagDeleteRequest(req.session.username, tag, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/delete/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const result = await sql.request.tagDeleteRequests(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/delete/request/fulfill", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag, accepted} = req.body as TagDeleteRequestFulfillParams
            if (!tag) return void res.status(400).send("Invalid tag")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!username) return void res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            await sql.request.deleteTagDeleteRequest(username, tag)
            if (accepted) {
                let message = `Tag deletion request on ${functions.config.getDomain()}/tag/${tag} has been approved. Thanks!`
                await serverFunctions.systemMessage(username, "Notice: Tag deletion request has been approved", message)
            } else {
                let message = `Tag deletion request on ${functions.config.getDomain()}/tag/${tag} has been rejected. This tag can stay up. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Tag deletion request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo, reason} = req.body as AliasToRequestParams
            if (!tag || !aliasTo) return void res.status(400).send("Bad tag or aliasTo")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const exists = await sql.tag.tag(tag)
            if (!exists) return void res.status(400).send("Bad tag")
            const exists2 = await sql.tag.tag(aliasTo)
            if (!exists2) return void res.status(400).send("Bad aliasTo")
            await sql.request.insertAliasRequest(req.session.username, tag, aliasTo, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/aliasto/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const result = await sql.request.aliasRequests(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request/fulfill", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag, aliasTo, accepted} = req.body as AliasToRequestFulfillParams
            if (!tag) return void res.status(400).send("Invalid tag")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!username) return void res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            await sql.request.deleteAliasRequest(username, tag)
            if (accepted) {
                let message = `Tag alias request on ${tag} -> ${aliasTo} has been approved. Thanks!`
                await serverFunctions.systemMessage(username, "Notice: Tag alias request has been approved", message)
            } else {
                let message = `Tag alias request on ${tag} -> ${aliasTo} has been rejected. This tag can continue to be on its own. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Tag alias request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/edit/request", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {tag, key, type, description, image, aliases, implications, pixivTags, social, twitter, website, 
            fandom, wikipedia, r18, featuredPost, reason} = req.body as TagEditRequestParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!tag) return void res.status(400).send("Bad tag")
            const tagObj = await sql.tag.tag(tag)
            if (!tagObj) return void res.status(400).send("Bad tag")
            if (key === undefined) key = tagObj.tag
            if (type === undefined) type = tagObj.type
            if (description === undefined) description = tagObj.description
            if (aliases === undefined) aliases = tagObj.aliases?.filter(Boolean).map((a: any) => a.alias) || []
            if (implications === undefined) implications = tagObj.implications?.filter(Boolean).map((i: any) => i.implication) || []
            if (pixivTags === undefined) pixivTags = tagObj.pixivTags
            if (social === undefined) social = tagObj.social
            if (twitter === undefined) twitter = tagObj.twitter
            if (website === undefined) website = tagObj.website
            if (fandom === undefined) fandom = tagObj.fandom
            if (wikipedia === undefined) wikipedia = tagObj.wikipedia
            if (r18 === undefined) r18 = tagObj.r18 || false
            if (featuredPost === undefined) featuredPost = tagObj.featuredPost?.postID
            let imagePath = tagObj.image
            let imageHash = tagObj.imageHash
            let imageChanged = false
            if (image?.[0]) {
                if (image[0] !== "delete") {
                    const filename = `${tag}.${functions.byte.fileExtension(image as number[])}`
                    imagePath = functions.link.getTagPath(tagObj.type, filename)
                    const buffer = Buffer.from(Object.values(image))
                    await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                    imageHash = serverFunctions.md5(buffer)
                } else {
                    imagePath = "delete"
                    imageHash = null
                }
                imageChanged = true
            }
            let featuredObj = null as Post | null
            if (featuredPost) featuredObj = await sql.post.post(featuredPost) ?? null
            const changes = functions.compare.parseTagChanges(tagObj, {tag: key, type, description, aliases, implications, 
            pixivTags, website, social, twitter, fandom, wikipedia, featuredObj, r18} as unknown as Tag)
            aliases = aliases?.[0] ? aliases : []
            implications = implications?.[0] ? implications : []
            pixivTags = pixivTags?.[0] ? pixivTags : []
            await sql.request.insertTagEditRequest(req.session.username, tag, key, type, description, imagePath, imageHash, aliases, implications, pixivTags, social, 
            twitter, website, fandom, wikipedia, r18, featuredPost, imageChanged, changes, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/edit/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const result = await sql.request.tagEditRequests(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/edit/request/fulfill", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag, image, accepted} = req.body as TagEditRequestFulfillParams
            if (!tag) return void res.status(400).send("Invalid tag")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!username) return void res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            if (image) await serverFunctions.deleteUnverifiedFile(image)
            await sql.request.deleteTagEditRequest(username, tag)
            if (accepted) {
                let message = `Tag edit request on ${functions.config.getDomain()}/tag/${tag} has been approved. Thanks for the contribution!`
                await serverFunctions.systemMessage(username, "Notice: Tag edit request has been approved", message)
            } else {
                let message = `Tag edit request on ${functions.config.getDomain()}/tag/${tag} has been rejected. The original tag details can stay. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Tag edit request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/history", tagLimiter, async (req: Request, res: Response) => {
        try {
            let {tag, historyID, username, query, offset} = req.query as unknown as TagHistoryParams
            if (!offset) offset = 0
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            let result = [] as TagHistory[]
            if (tag && historyID) {
                const history = await sql.history.tagHistoryID(tag, historyID)
                if (history) result = [history]
            } else if (username) {
                result = await sql.history.userTagHistory(username)
            } else {
                result = await sql.history.tagHistory(tag, Number(offset), query)
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/tag/history/delete", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, historyID} = req.query as {tag: string, historyID: string}
            if (Number.isNaN(Number(historyID))) return void res.status(400).send("Invalid historyID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const tagHistory = await sql.history.tagHistory(tag as string)
            if (tagHistory[0]?.historyID === historyID) {
                return void res.status(400).send("Bad request")
            } else {
                const currentHistory = tagHistory.find((history: any) => history.historyID === historyID)
                if (!currentHistory) return void res.status(400).send("Bad request")
                if (currentHistory.image?.includes("history/")) {
                    await serverFunctions.deleteFile(currentHistory.image, false)
                    await serverFunctions.deleteIfEmpty(path.dirname(currentHistory.image), false)
                }
                await sql.history.deleteTagHistory(historyID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/alias/history", tagLimiter, async (req: Request, res: Response) => {
        try {
            let {query, offset} = req.query as unknown as {query?: string, offset?: number}
            if (!offset) offset = 0
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const result = await sql.tag.aliasImplicationHistory(Number(offset), query)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/alias/history/delete", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {historyID, type} = req.query as {historyID: string, type: AliasHistoryType}
            if (Number.isNaN(Number(historyID))) return void res.status(400).send("Invalid historyID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            if (type === "alias" || type === "undo alias") {
                await sql.tag.deleteAliasHistory(historyID)
            } else if (type === "implication" || type === "undo implication") {
                await sql.tag.deleteImplicationHistory(historyID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/tag/massimply", csrfProtection, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {wildcard, implyTo} = req.body as {wildcard: string, implyTo: string}
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!wildcard || !implyTo) return void res.status(400).send("Bad wildcard or implyTo")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            const implyTag = await sql.tag.tag(implyTo)
            if (!implyTag) return void res.status(400).send("Bad implyTo")
            const tags = await sql.tag.wildcardTags(wildcard.replaceAll("*", ""), implyTag.type)

            for (const tag of tags) {
                const oldImplications = tag.implications?.filter(Boolean).map((i: any) => i.implication) || []
                if (oldImplications.includes(implyTag.tag)) continue
                const toAdd = [implyTag.tag]

                const posts = await sql.tag.tagPosts(tag.tag)
                const postIDs = posts.map((p) => p.postID)

                await sql.tag.bulkInsertImplications(tag.tag, toAdd)

                for (const implication of toAdd) {
                    await sql.tag.insertImplicationHistory(req.session.username, tag.tag, implication, "implication", postIDs, null)
                }
                serverFunctions.updateImplications(posts, toAdd)
            }

            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default TagRoutes