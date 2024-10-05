import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions, {authenticate, keyGenerator, handler} from "../structures/ServerFunctions"
import fs from "fs"
import path from "path"

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
            if (!tag) return res.status(400).send("Bad tag")
            let result = await sql.tag.tag(tag)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/related", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return res.status(400).send("Bad tag")
            let result = await sql.tag.relatedTags(tag)
            res.status(200).json(result?.related || [])
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/unverified", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return res.status(400).send("Bad tag")
            let result = await sql.tag.unverifiedTags([tag])
            res.status(200).json(result?.[0])
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/counts", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tag.tagCounts(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/list", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tag.tags(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/map", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tag.tags(tags.filter(Boolean))
            const tagMap = {} as {[key: string]: any}
            for (const tag of result) {
                tagMap[tag.tag] = tag
            }
            res.status(200).json(tagMap)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.delete("/api/tag/delete", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const tag = req.query.tag as string
            if (!tag) return res.status(400).send("Invalid tag")
            const tagExists = await sql.tag.tag(tag.trim())
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!tagExists) return res.status(400).send("Bad tag")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await serverFunctions.deleteFolder(`history/tag/${tag.trim()}`).catch(() => null)
            await serverFunctions.deleteFile(functions.getTagPath(tagExists.type, tagExists.image)).catch(() => null)
            await sql.tag.deleteTag(tag.trim())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/takedown", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!tag) return res.status(400).send("Bad tag")
            if (req.session.role !== "admin") return res.status(403).end()
            const tagObj = await sql.tag.tag(tag)
            if (!tagObj) return res.status(404).send("Doesn't exist")
            const allPosts = await sql.search.search([tag], "all", "all", "all", "date", undefined, "9999")
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

    app.put("/api/tag/edit", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {tag, key, description, image, aliases, implications, pixivTags, social, twitter, website, fandom, reason, updater, updatedDate, silent} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!tag) return res.status(400).send("Bad tag")
            const tagObj = await sql.tag.tag(tag)
            if (!tagObj) return res.status(400).send("Bad tag")
            let imageFilename = tagObj.image
            let tagDescription = tagObj.description
            if (description !== undefined) {
                await sql.tag.updateTag(tag, "description", description)
                tagDescription = description
            }
            let vanillaImageBuffer = null as any
            let imgChange = false
            if (image?.[0]) {
                if (tagObj.image) {
                    try {
                        const imagePath = functions.getTagPath(tagObj.type, tagObj.image)
                        vanillaImageBuffer = await serverFunctions.getFile(imagePath)
                        await serverFunctions.deleteFile(imagePath)
                        tagObj.image = null
                    } catch {
                        tagObj.image = null
                    }
                }
                if (image[0] !== "delete") {
                    const filename = `${tag}.${functions.fileExtension(image)}`
                    const imagePath = functions.getTagPath(tagObj.type, filename)
                    const newBuffer = Buffer.from(Object.values(image) as any)
                    imgChange = serverFunctions.buffersChanged(vanillaImageBuffer, newBuffer)
                    await serverFunctions.uploadFile(imagePath, newBuffer)
                    await sql.tag.updateTag(tag, "image", filename)
                    tagObj.image = filename
                    imageFilename = filename
                } else {
                    await sql.tag.updateTag(tag, "image", null as any)
                    imageFilename = null
                }
            }
            if (aliases !== undefined) {
                await sql.tag.purgeAliases(tag)
                for (let i = 0; i < aliases.length; i++) {
                    if (!aliases[i]?.trim()) break
                    await sql.tag.insertAlias(tag, aliases[i])
                }
            } 
            if (implications !== undefined) {
                await sql.tag.purgeImplications(tag)
                let promises = [] as Promise<void>[]
                for (let i = 0; i < implications.length; i++) {
                    if (!implications[i]?.trim()) break
                    await sql.tag.insertImplication(tag, implications[i])
                    const promise = serverFunctions.updateImplication(tag, implications[i])
                    promises.push(promise)
                }
                if (key.trim() !== tag) await Promise.all(promises)
            }
            if (pixivTags !== undefined) {
                await sql.tag.updateTag(tag, "pixivTags", pixivTags)
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
            }
            if (!updater) updater = req.session.username
            if (!updatedDate) updatedDate = new Date().toISOString()
            await sql.tag.updateTag(tag, "updater", updater)
            await sql.tag.updateTag(tag, "updatedDate", updatedDate)
            let targetTag = tag
            if (key.trim() !== tag) {
                if (tagObj.image) {
                    const newFilename = image ? `${key.trim()}.${functions.fileExtension(image)}` : `${key.trim()}.${path.extname(tagObj.image).replace(".", "")}`
                    const oldImagePath = functions.getTagPath(tagObj.type, tagObj.image)
                    const newImagePath = functions.getTagPath(tagObj.type, newFilename)
                    await serverFunctions.renameFile(oldImagePath, newImagePath)
                    await sql.tag.updateTag(tag, "image", newFilename)
                    imageFilename = newFilename
                }
                await sql.tag.updateTag(tag, "tag", key.trim())
                targetTag = key.trim()
            }
            if (req.session.role === "admin" || req.session.role === "mod") {
                if (silent) return res.status(200).send("Success")
            }

            const tagHistory = await sql.history.tagHistory(targetTag)
            const nextKey = await serverFunctions.getNextKey("tag", key)
            if (!tagHistory.length || (imgChange && nextKey === 1)) {
                let vanilla = await sql.tag.tag(targetTag)
                vanilla.date = vanilla.createDate 
                vanilla.user = vanilla.creator
                vanilla.key = targetTag
                vanilla.aliases = vanilla.aliases.map((alias: any) => alias?.alias)
                vanilla.implications = vanilla.implications.map((implication: any) => implication?.implication)
                if (vanilla.image && vanillaImageBuffer) {
                    if (imgChange) {
                        const newImagePath = functions.getTagHistoryPath(targetTag, 1, vanilla.image)
                        await serverFunctions.uploadFile(newImagePath, vanillaImageBuffer)
                        vanilla.image = newImagePath
                    }
                } else {
                    vanilla.image = null
                }
                await sql.history.insertTagHistory(vanilla.user, vanilla.tag, vanilla.key, vanilla.type, vanilla.image, vanilla.description, vanilla.aliases, vanilla.implications, vanilla.pixivTags, vanilla.website, vanilla.social, vanilla.twitter, vanilla.fandom)
                if (image?.[0] && imageFilename) {
                    if (imgChange) {
                        const imagePath = functions.getTagHistoryPath(key, 2, imageFilename)
                        await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(image) as any))
                        imageFilename = imagePath
                    }
                }
                await sql.history.insertTagHistory(req.session.username, targetTag, key, tagObj.type, imageFilename, tagDescription, aliases, implications, pixivTags, website, social, twitter, fandom, reason)
            } else {
                if (image?.[0] && imageFilename) {
                    if (imgChange) {
                        const imagePath = functions.getTagHistoryPath(key, nextKey, imageFilename)
                        await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(image) as any))
                        imageFilename = imagePath
                    }
                }
                await sql.history.insertTagHistory(req.session.username, targetTag, key, tagObj.type, imageFilename, tagDescription, aliases, implications, pixivTags, website, social, twitter, fandom, reason)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/tag/aliasto", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!tag || !aliasTo) return res.status(400).send("Bad tag or aliasTo")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const exists = await sql.tag.tag(aliasTo)
            if (!exists) return res.status(400).send("Bad tag")
            await sql.tag.renameTagMap(tag, aliasTo)
            await sql.tag.deleteTag(tag)
            await sql.tag.insertAlias(aliasTo, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/list/unverified", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tag.unverifiedTags(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/tag/delete/request", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, reason} = req.body
            if (!tag) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const exists = await sql.tag.tag(tag)
            if (!exists) return res.status(400).send("Bad tag")
            await sql.request.insertTagDeleteRequest(req.session.username, tag, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/delete/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.request.tagDeleteRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/delete/request/fulfill", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag, accepted} = req.body
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.request.deleteTagDeleteRequest(username, tag)
            if (accepted) {
                let message = `Tag deletion request on ${functions.getDomain()}/tag/${tag} has been approved. Thanks!`
                await serverFunctions.systemMessage(username, "Notice: Tag deletion request has been approved", message)
            } else {
                let message = `Tag deletion request on ${functions.getDomain()}/tag/${tag} has been rejected. This tag can stay up. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Tag deletion request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo, reason} = req.body
            if (!tag || !aliasTo) return res.status(400).send("Bad tag or aliasTo")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const exists = await sql.tag.tag(tag)
            if (!exists) return res.status(400).send("Bad tag")
            const exists2 = await sql.tag.tag(aliasTo)
            if (!exists2) return res.status(400).send("Bad aliasTo")
            await sql.request.insertAliasRequest(req.session.username, tag, aliasTo, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/aliasto/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.request.aliasRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request/fulfill", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag, aliasTo, accepted} = req.body
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
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

    app.post("/api/tag/edit/request", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, key, description, image, aliases, implications, pixivTags, social, twitter, website, fandom, reason} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!tag) return res.status(400).send("Bad tag")
            const tagObj = await sql.tag.tag(tag)
            if (!tagObj) return res.status(400).send("Bad tag")
            let imagePath = null as any
            if (image?.[0]) {
                if (image[0] !== "delete") {
                    const filename = `${tag}.${functions.fileExtension(image)}`
                    imagePath = functions.getTagPath(tagObj.type, filename)
                    await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(image) as any))
                } else {
                    imagePath = "delete"
                }
            }
            await sql.request.insertTagEditRequest(req.session.username, tag, key, description, imagePath, aliases?.[0] ? aliases : null, implications?.[0] ? implications : null, pixivTags?.[0] ? pixivTags : null, social, twitter, website, fandom, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/edit/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.request.tagEditRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/edit/request/fulfill", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag, image, accepted} = req.body
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            if (image) await serverFunctions.deleteUnverifiedFile(image)
            await sql.request.deleteTagEditRequest(username, tag)
            if (accepted) {
                let message = `Tag edit request on ${functions.getDomain()}/tag/${tag} has been approved. Thanks for the contribution!`
                await serverFunctions.systemMessage(username, "Notice: Tag edit request has been approved", message)
            } else {
                let message = `Tag edit request on ${functions.getDomain()}/tag/${tag} has been rejected. The original tag details can stay. Thanks!`
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
            const tag = req.query.tag as string
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const result = await sql.history.tagHistory(tag, offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/tag/history/delete", authenticate, tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, historyID} = req.query
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const tagHistory = await sql.history.tagHistory(tag as string)
            if (tagHistory[0]?.historyID === historyID) {
                return res.status(400).send("Bad request")
            } else {
                const currentHistory = tagHistory.find((history: any) => history.historyID === historyID)
                if (currentHistory.image?.includes("history/")) {
                    await serverFunctions.deleteFile(currentHistory.image)
                    await serverFunctions.deleteIfEmpty(path.dirname(currentHistory.image))
                }
                await sql.history.deleteTagHistory(Number(historyID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default TagRoutes