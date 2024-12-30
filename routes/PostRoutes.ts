import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import sharp from "sharp"
import waifu2x from "waifu2x"
import phash from "sharp-phash"
import fs from "fs"
import path from "path"
import {PostSearch, PostFull, PostDeleteRequestFulfillParams, PostHistoryParams, PostCompressParams, PostUpscaleParams,
PostQuickEditParams, PostQuickEditUnverifiedParams, PostHistory} from "../types/Types"

const postLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const postUpdateLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const PostRoutes = (app: Express) => {
    app.get("/api/post", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            let result = await sql.post.post(postID)
            if (!result) return res.status(404).send("Not found")
            if (!permissions.isMod(req.session)) {
                if (result.hidden) return res.status(404).end()
            }
            if (!req.session.showR18) {
                if (functions.isR18(result.rating)) return res.status(404).end()
            }
            if (result.private) {
                const categories = await serverFunctions.tagCategories(result.tags)
                if (!permissions.canPrivate(req.session, categories.artists)) return res.status(403).end()
            }
            if (result?.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            // @ts-expect-error
            if (req.session.captchaNeeded) delete result.tags
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/posts", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postIDs = req.query.postIDs as string[]
            if (!postIDs?.length) return res.status(200).json([])
            if (!permissions.isMod(req.session)) return res.status(403).end()
            let result = await sql.search.posts(postIDs)
            if (!permissions.isMod(req.session)) {
                result = result.filter((p: any) => !p.hidden)
            }
            if (!req.session.showR18) {
                result = result.filter((p: any) => !functions.isR18(p.rating))
            }
            for (let i = result.length - 1; i >= 0; i--) {
                const post = result[i]
                if (post.private) {
                    const categories = await serverFunctions.tagCategories(post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) result.splice(i, 1)
                }
            }
            if (req.session.captchaNeeded) result = functions.stripTags(result)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/tags", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid postID")
            if (!permissions.isMod(req.session)) {
                if (post.hidden) return res.status(403).end()
            }
            if (!req.session.showR18) {
                if (functions.isR18(post.rating)) return res.status(403).end()
            }
            if (post.private) {
                const categories = await serverFunctions.tagCategories(post.tags)
                if (!permissions.canPrivate(req.session, categories.artists)) return res.status(403).end()
            }
            let result = await sql.post.postTags(postID)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
    
    app.get("/api/post/comments", postLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid postID")
            if (!permissions.isMod(req.session)) {
                if (post.hidden) return res.status(403).end()
            }
            if (!req.session.showR18) {
                if (functions.isR18(post.rating)) return res.status(403).end()
            }
            if (post.private) {
                const categories = await serverFunctions.tagCategories(post.tags)
                if (!permissions.canPrivate(req.session, categories.artists)) return res.status(403).end()
            }
            const result = await sql.comment.comments(postID)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/post/delete", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return res.status(403).end()
            const post = await sql.post.post(postID).catch(() => null)
            if (!post) return res.status(200).send("Doesn't exist")
            let r18 = functions.isR18(post.rating)
            await sql.post.deletePost(postID)
            for (let i = 0; i < post.images.length; i++) {
                const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
                const upscaledFile = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
                await serverFunctions.deleteFile(file, r18)
                await serverFunctions.deleteFile(upscaledFile, r18)
            }
            await serverFunctions.deleteFolder(`history/post/${postID}`, r18).catch(() => null)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/takedown", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID} = req.body as {postID: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const post = await sql.post.post(postID).catch(() => null)
            if (!post) return res.status(404).send("Doesn't exist")
            if (post.hidden) {
                await sql.post.updatePost(postID, "hidden", false)
            } else {
                await sql.post.updatePost(postID, "hidden", true)
            }
            await sql.flushDB()
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/lock", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID} = req.body as {postID: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const post = await sql.post.post(postID).catch(() => null)
            if (!post) return res.status(404).send("Post doesn't exist")
            if (post.locked) {
                await sql.post.updatePost(postID, "locked", false)
            } else {
                await sql.post.updatePost(postID, "locked", true)
            }
            await sql.flushDB()
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/private", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID} = req.body as {postID: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const post = await sql.post.post(postID).catch(() => null)
            if (!post) return res.status(404).send("Post doesn't exist")
            const categories = await serverFunctions.tagCategories(post.tags)
            if (!permissions.canPrivate(req.session, categories.artists)) return res.status(403).end()
            if (post.private) {
                await sql.post.updatePost(postID, "private", false)
            } else {
                await sql.post.updatePost(postID, "private", true)
            }
            await sql.flushDB()
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/children", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            let result = await sql.post.childPosts(postID)
            if (!permissions.isMod(req.session)) {
                result = result.filter((r: any) => !r.post?.hidden)
            }
            if (!req.session.showR18) {
                result = result.filter((r: any) => !functions.isR18(r.post?.rating))
            }
            for (let i = result.length - 1; i >= 0; i--) {
                const post = result[i].post
                if (post.private) {
                    const tags = await sql.post.postTags(post.postID)
                    const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                    if (!permissions.canPrivate(req.session, categories.artists)) result.splice(i, 1)
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/parent", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const parent = await sql.post.parent(postID)
            if (!parent) return res.status(200).json()
            if (!permissions.isMod(req.session)) {
                if (parent.post.hidden) return res.status(403).end()
            }
            if (!req.session.showR18) {
                if (functions.isR18(parent.post.rating)) return res.status(403).end()
            }
            if (parent.post.private) {
                const tags = await sql.post.postTags(parent.post.postID)
                const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                if (!permissions.canPrivate(req.session, categories.artists)) return res.status(403).end()
            }
            serverFunctions.sendEncrypted(parent, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            let result = await sql.post.unverifiedPost(postID)
            if (!result) return res.status(400).send("Invalid postID") 
            if (result.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/list/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.search.unverifiedPosts(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post-edits/list/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.search.unverifiedPostEdits(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/children/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const posts = await sql.post.unverifiedChildPosts(postID)
            serverFunctions.sendEncrypted(posts, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/parent/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const post = await sql.post.unverifiedParent(postID)
            serverFunctions.sendEncrypted(post, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/delete/request", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, reason} = req.body as {postID: string, reason: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Bad postID")
            await sql.request.insertPostDeleteRequest(req.session.username, postID, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/post/delete/request/list", postLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.request.postDeleteRequests(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/post/delete/request/fulfill", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, postID, accepted} = req.body as PostDeleteRequestFulfillParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return res.status(403).end()

            await sql.request.deletePostDeleteRequest(username, postID)
            if (accepted) {
                let message = `Post deletion request on ${functions.getDomain()}/post/${postID} has been approved. Thanks!`
                await serverFunctions.systemMessage(username, "Notice: Post deletion request has been approved", message)
            } else {
                let message = `Post deletion request on ${functions.getDomain()}/post/${postID} has been rejected. This post can stay up. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Post deletion request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/post/quickedit", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {postID, unverified, type, rating, style, source, parentID, artists, characters, 
            series, tags, reason, silent} = req.body as PostQuickEditParams

            let sourceEdit = source !== undefined ? true : false
            let tagEdit = tags !== undefined ? true : false
            let parentEdit = parentID !== undefined ? true : false
    
            if (Number.isNaN(Number(postID))) return res.status(400).send("Bad postID")
            if (parentID && Number.isNaN(Number(parentID))) return res.status(400).send("Bad parentID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!reason) reason = null

            const post = unverified ? await sql.post.unverifiedPost(postID) : await sql.post.post(postID)
            if (!post) return res.status(400).send("Bad request")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")


            let addedTags = [] as string[]
            let removedTags = [] as string[]

            if (parentEdit) {
                const updatedDate = new Date().toISOString()

                await sql.post.deleteChild(postID)
                if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertChild(postID, parentID)
                if (unverified) {
                    await sql.post.bulkUpdateUnverifiedPost(postID, {
                        parentID: parentID || null,
                        updatedDate,
                        updater: req.session.username
                    })
                } else {
                    await sql.post.bulkUpdatePost(postID, {
                        parentID: parentID || null,
                        updatedDate,
                        updater: req.session.username
                    })
                }
            } 
            if (source && sourceEdit) {
                const updatedDate = new Date().toISOString()

                if (unverified) {
                    await sql.post.bulkUpdateUnverifiedPost(postID, {
                        title: source.title ? source.title : null,
                        englishTitle: source.englishTitle ? source.englishTitle : null,
                        artist: source.artist ? source.artist : null,
                        posted: source.posted ? source.posted : null,
                        source: source.source ? source.source : null,
                        commentary: source.commentary ? source.commentary : null,
                        englishCommentary: source.englishCommentary ? source.englishCommentary : null,
                        bookmarks: source.bookmarks ? source.bookmarks : null,
                        buyLink: source.buyLink ? source.buyLink : null,
                        mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
                        slug: functions.postSlug(source.title, source.englishTitle),
                        updatedDate,
                        updater: req.session.username
                    })
                } else {
                    await sql.post.bulkUpdatePost(postID, {
                        title: source.title ? source.title : null,
                        englishTitle: source.englishTitle ? source.englishTitle : null,
                        artist: source.artist ? source.artist : null,
                        posted: source.posted ? source.posted : null,
                        source: source.source ? source.source : null,
                        commentary: source.commentary ? source.commentary : null,
                        englishCommentary: source.englishCommentary ? source.englishCommentary : null,
                        bookmarks: source.bookmarks ? source.bookmarks : null,
                        buyLink: source.buyLink ? source.buyLink : null,
                        mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
                        slug: functions.postSlug(source.title, source.englishTitle),
                        updatedDate,
                        updater: req.session.username
                    })
                }
            } 
            if (tagEdit) {
                if (!artists?.[0]) artists = ["unknown-artist"]
                if (!series?.[0]) series = characters?.includes("original") ? ["no-series"] : ["unknown-series"]
                if (!characters?.[0]) characters = ["unknown-character"]
                if (!tags?.[0]) tags = ["needs-tags"]

                let rawTags = `${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
                if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
                    return res.status(400).send("Invalid characters in tags: , _ / \\")
                }
        
                artists = artists.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
                characters = characters.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
                series = series.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
                tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
        
                if (!functions.validType(type)) return res.status(400).send("Invalid type")
                if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
                if (!functions.validStyle(style)) return res.status(400).send("Invalid style")
        
                let oldR18 = functions.isR18(post.rating)
                let newR18 = functions.isR18(rating)
                let oldType = post.type 
                let newType = type
        
                const updatedDate = new Date().toISOString()

                if (unverified) {
                    await sql.post.bulkUpdateUnverifiedPost(postID, {
                        type,
                        rating, 
                        style,
                        updatedDate,
                        updater: req.session.username
                    })
                } else {
                    await sql.post.bulkUpdatePost(postID, {
                        type,
                        rating, 
                        style,
                        updatedDate,
                        updater: req.session.username
                    })
                }
        
                let oldTagsSet = new Set<string>(post.tags)
                let newTagsSet = new Set<string>([...artists, ...characters, ...series, ...tags])
                addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
                removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)

                let bulkTagUpdate = [] as any
                let tagObjectMapping = await serverFunctions.tagMap()
        
                for (let i = 0; i < artists.length; i++) {
                    if (!artists[i]) continue
                    let bulkObj = {tag: artists[i], type: "artist", description: "Artist.", image: null, imageHash: null} as any
                    bulkTagUpdate.push(bulkObj)
                }
                
                for (let i = 0; i < characters.length; i++) {
                    if (!characters[i]) continue
                    let bulkObj = {tag: characters[i], type: "character", description: "Character.", image: null, imageHash: null} as any
                    bulkTagUpdate.push(bulkObj)
                }

                for (let i = 0; i < series.length; i++) {
                    if (!series[i]) continue
                    let bulkObj = {tag: series[i], type: "series", description: "Series.", image: null, imageHash: null} as any
                    bulkTagUpdate.push(bulkObj)
                }

                for (let i = 0; i < tags.length; i++) {
                    if (!tags[i]) continue
                    if (addedTags.includes(tags[i])) {
                        let bulkObj = {tag: tags[i], type: tagObjectMapping[tags[i]]?.type, description: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`, image: null, imageHash: null} as any
                        bulkTagUpdate.push(bulkObj)
                    }
                }

                for (let i = 0; i < addedTags.length; i++) {
                    const implications = await sql.tag.implications(addedTags[i])
                    if (implications?.[0]) {
                        for (const i of implications) {
                            if (!oldTagsSet.has(i.implication)) addedTags.push(i.implication)
                            const tag = await sql.tag.tag(i.implication)
                            bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type, description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
                        }
                    }
                }

                addedTags = functions.removeDuplicates(addedTags).filter(Boolean)
                if (unverified) {
                    await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate, true)
                    await sql.tag.deleteUnverifiedTagMap(postID, removedTags)
                    await sql.tag.insertUnverifiedTagMap(postID, addedTags)
                } else {
                    await sql.tag.bulkInsertTags(bulkTagUpdate, req.session.username, true)
                    await sql.tag.deleteTagMap(postID, removedTags)
                    await sql.tag.insertTagMap(postID, addedTags)
                    
                    await serverFunctions.migratePost(post as PostFull, oldType, newType, oldR18, newR18)
                }
            }

            if (unverified) return res.status(200).send("Success")
            
            if (permissions.isMod(req.session)) {
                if (silent) return res.status(200).send("Success")
            }

            const updated = await sql.post.post(postID) as PostSearch
            const updatedCategories = await serverFunctions.tagCategories(updated.tags)
            updated.artists = updatedCategories.artists.map((a: any) => a.tag)
            updated.characters = updatedCategories.characters.map((c: any) => c.tag)
            updated.series = updatedCategories.series.map((s: any) => s.tag)
            updated.tags = updatedCategories.tags.map((t: any) => t.tag)

            const changes = functions.parsePostChanges(post, updated)

            const postHistory = await sql.history.postHistory(postID)
            if (!postHistory.length) {
                const vanilla = JSON.parse(JSON.stringify(post))
                vanilla.date = vanilla.uploadDate 
                vanilla.user = vanilla.uploader
                const categories = await serverFunctions.tagCategories(vanilla.tags)
                vanilla.artists = categories.artists.map((a: any) => a.tag)
                vanilla.characters = categories.characters.map((c: any) => c.tag)
                vanilla.series = categories.series.map((s: any) => s.tag)
                vanilla.tags = categories.tags.map((t: any) => t.tag)
                let vanillaImages = [] as any
                for (let i = 0; i < vanilla.images.length; i++) {
                    vanillaImages.push(functions.getImagePath(vanilla.images[i].type, postID, vanilla.images[i].order, vanilla.images[i].filename))
                }
                await sql.history.insertPostHistory({
                    postID, username: vanilla.user, images: vanillaImages, uploader: vanilla.uploader, updater: vanilla.updater, 
                    uploadDate: vanilla.uploadDate, updatedDate: vanilla.updatedDate, type: vanilla.type, rating: vanilla.rating, 
                    style: vanilla.style, parentID: vanilla.parentID, title: vanilla.title, englishTitle: vanilla.englishTitle, 
                    posted: vanilla.posted, artist: vanilla.artist, source: vanilla.source, commentary: vanilla.commentary, englishCommentary: vanilla.englishCommentary, 
                    bookmarks: vanilla.bookmarks, buyLink: vanilla.buyLink, mirrors: vanilla.mirrors, slug: vanilla.slug, hasOriginal: vanilla.hasOriginal, hasUpscaled: vanilla.hasUpscaled, 
                    artists: vanilla.artists, characters: vanilla.characters, series: vanilla.series, tags: vanilla.tags, addedTags: [], removedTags: [], imageChanged: false,
                    changes: null, reason})
                let images = [] as any
                for (let i = 0; i < post.images.length; i++) {
                    images.push(functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename))
                }
                await sql.history.insertPostHistory({
                    postID, username: req.session.username, images, uploader: updated.uploader, updater: updated.updater, 
                    uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, 
                    style: updated.style, parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, 
                    posted: updated.posted, artist: updated.artist, source: updated.source, commentary: updated.commentary, slug: updated.slug,
                    englishCommentary: updated.englishCommentary, bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: JSON.stringify(updated.mirrors), 
                    hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: updated.artists, 
                    characters: updated.characters, series: updated.series, tags: updated.tags, addedTags, removedTags, imageChanged: false, changes, reason})
            } else {
                let images = [] as any
                for (let i = 0; i < post.images.length; i++) {
                    images.push(functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename))
                }
                await sql.history.insertPostHistory({
                    postID, username: req.session.username, images, uploader: updated.uploader, updater: updated.updater, 
                    uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, 
                    style: updated.style, parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, 
                    posted: updated.posted, artist: updated.artist, source: updated.source, commentary: updated.commentary, slug: updated.slug,
                    englishCommentary: updated.englishCommentary, bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: JSON.stringify(updated.mirrors), 
                    hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: updated.artists, 
                    characters: updated.characters, series: updated.series, tags: updated.tags, addedTags, removedTags, imageChanged: false, changes, reason})
            }
            res.status(200).send("Success")
          } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
          }
    })

    app.put("/api/post/quickedit/unverified", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {postID, type, rating, style, source, parentID, artists, characters, 
            series, tags, reason} = req.body as PostQuickEditUnverifiedParams

            let sourceEdit = source !== undefined ? true : false
            let tagEdit = tags !== undefined ? true : false
            let parentEdit = parentID !== undefined ? true : false
    
            if (Number.isNaN(Number(postID))) return res.status(400).send("Bad postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!reason) reason = null

            const originalPostID = postID as any
            const post = await sql.post.post(originalPostID)
            if (!post) return res.status(400).send("Bad postID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            postID = await sql.post.insertUnverifiedPost()

            if (!tagEdit) {
                const categories = await serverFunctions.tagCategories(post.tags)
                artists = categories.artists.map((a: any) => a.tag)
                characters = categories.characters.map((c: any) => c.tag)
                series = categories.series.map((s: any) => s.tag)
                tags = categories.tags.map((t: any) => t.tag)
                type = post.type
                rating = post.rating
                style = post.style
            } 
            if (!source || !sourceEdit) {
                source = {
                    title: post.title,
                    englishTitle: post.englishTitle,
                    artist: post.artist,
                    posted: post.posted ? functions.formatDate(new Date(post.posted), true) : null,
                    source: post.source,
                    commentary: post.commentary,
                    englishCommentary: post.englishCommentary,
                    bookmarks: post.bookmarks,
                    buyLink: post.buyLink,
                    mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : null
                }
            }
            if (!parentEdit) {
                const parentPost = await sql.post.parent(originalPostID)
                parentID = parentPost?.parentID || null
            }
    
            if (!artists?.[0]) artists = ["unknown-artist"]
            if (!series?.[0]) series = characters?.includes("original") ? ["no-series"] : ["unknown-series"]
            if (!characters?.[0]) characters = ["unknown-character"]
            if (!tags?.[0]) tags = ["needs-tags"]

            let rawTags = `${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
            if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
                return res.status(400).send("Invalid characters in tags: , _ / \\")
            }
    
            artists = artists.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            characters = characters.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            series = series.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
    
            if (!functions.validType(type)) return res.status(400).send("Invalid type")
            if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
            if (!functions.validStyle(style)) return res.status(400).send("Invalid style")
    
            if (parentID) {
                await sql.post.insertUnverifiedChild(postID, parentID)
            }
            if (type !== "comic") type = "image"

            let hasOriginal = false
            let hasUpscaled = false
            let originalCheck = [] as string[]
            let upscaledCheck = [] as string[]
            let r18 = functions.isR18(post.rating)

            for (let i = 0; i < post.images.length; i++) {
                const imagePath = functions.getImagePath(post.images[i].type, originalPostID, post.images[i].order, post.images[i].filename)
                const buffer = await serverFunctions.getFile(imagePath, false, r18) as Buffer
                const upscaledImagePath = functions.getUpscaledImagePath(post.images[i].type, originalPostID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
                const upscaledBuffer = await serverFunctions.getFile(upscaledImagePath, false, r18) as Buffer

                let original = buffer ? buffer : upscaledBuffer
                let upscaled = upscaledBuffer ? upscaledBuffer : buffer
                let order = i + 1
                const ext = path.extname(post.images[i].upscaledFilename || post.images[i].filename).replace(".", "")
                let fileOrder = post.images.length > 1 ? `${order}` : "1"
                let filename = null as any
                let upscaledFilename = null as any
                if (post.images[i].filename) {
                    let ext = path.extname(post.images[i].filename).replace(".", "")
                    filename = post.title ? `${post.title}.${ext}` : 
                    characters[0] !== "unknown-character" ? `${characters[0]}.${ext}` :
                    `${postID}.${ext}`
                }
                if (post.images[i].upscaledFilename) {
                    let upscaledExt = path.extname(post.images[i].upscaledFilename).replace(".", "")
                    upscaledFilename = post.title ? `${post.title}.${upscaledExt}` : 
                    characters[0] !== "unknown-character" ? `${characters[0]}.${upscaledExt}` :
                    `${postID}.${upscaledExt}`
                }
                let kind = "image" as any
                if (type === "comic") {
                    kind = "comic"
                  } else if (functions.isWebP(`.${ext}`)) {
                    const animated = functions.isAnimatedWebp(original)
                    if (animated) {
                      kind = "animation"
                      if (type !== "video") type = "animation"
                    } else {
                      kind = "image"
                    }
                  } else if (functions.isImage(`.${ext}`)) {
                    kind = "image"
                  } else if (functions.isGIF(`.${ext}`)) {
                    kind = "animation"
                    if (type !== "video") type = "animation"
                  } else if (functions.isVideo(`.${ext}`)) {
                    kind = "video"
                    type = "video"
                  } else if (functions.isAudio(`.${ext}`)) {
                    kind = "audio"
                    type = "audio"
                  } else if (functions.isModel(`.${ext}`)) {
                    kind = "model"
                    type = "model"
                  } else if (functions.isLive2D(`.${ext}`)) {
                    kind = "live2d"
                    type = "live2d"
                  }
                if (buffer.byteLength) {
                    let newImagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
                    await serverFunctions.uploadUnverifiedFile(newImagePath, buffer)
                    hasOriginal = true
                    originalCheck.push(newImagePath)
                }
                if (upscaledBuffer.byteLength) {
                    let newImagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), upscaledFilename)
                    await serverFunctions.uploadUnverifiedFile(newImagePath, upscaledBuffer)
                    hasUpscaled = true
                    upscaledCheck.push(newImagePath)
                }
                let dimensions = {} as {width: number, height: number}
                let hash = ""
                if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
                    hash = post.images[i].hash
                    dimensions.width = post.images[i].width
                    dimensions.height = post.images[i].height
                } else {
                    hash = await phash(original).then((hash: string) => functions.binaryToHex(hash))
                    dimensions = await sharp(upscaled).metadata() as {width: number, height: number}
                }
                await sql.post.insertUnverifiedImage(postID, filename, upscaledFilename, type, order, hash, dimensions.width, dimensions.height, upscaled.byteLength)
            }
            if (upscaledCheck?.length > originalCheck?.length) hasOriginal = false
            if (originalCheck?.length > upscaledCheck?.length) hasUpscaled = false
    
            const updatedDate = new Date().toISOString()
            await sql.post.bulkUpdateUnverifiedPost(postID, {
                originalID: originalPostID ? originalPostID : null,
                reason: reason ? reason : null,
                type,
                rating, 
                style, 
                parentID: post.parentID,
                title: source.title ? source.title : null,
                englishTitle: source.englishTitle ? source.englishTitle : null,
                artist: source.artist ? source.artist : null,
                posted: source.posted ? source.posted : null,
                source: source.source ? source.source : null,
                commentary: source.commentary ? source.commentary : null,
                englishCommentary: source.englishCommentary ? source.englishCommentary : null,
                bookmarks: source.bookmarks ? source.bookmarks : null,
                buyLink: source.buyLink ? source.buyLink : null,
                mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
                slug: functions.postSlug(source.title, source.englishTitle),
                uploader: post.uploader,
                uploadDate: post.uploadDate,
                updatedDate,
                hasOriginal,
                hasUpscaled,
                updater: req.session.username
            })

            let tagMap = [] as any
            let bulkTagUpdate = [] as any
            let tagObjectMapping = await serverFunctions.tagMap()
    
            for (let i = 0; i < artists.length; i++) {
                if (!artists[i]) continue
                let bulkObj = {tag: artists[i], type: "artist", description: "Artist.", image: null, imageHash: null} as any
                const existingTag = await sql.tag.tag(artists[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("artist", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
                        bulkObj.imageHash = serverFunctions.md5(buffer)
                    }
                }
                bulkTagUpdate.push(bulkObj)
                tagMap.push(artists[i])
            }
            
            for (let i = 0; i < characters.length; i++) {
                if (!characters[i]) continue
                let bulkObj = {tag: characters[i], type: "character", description: "Character.", image: null, imageHash: null} as any
                const existingTag = await sql.tag.tag(characters[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("character", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
                        bulkObj.imageHash = serverFunctions.md5(buffer)
                    }
                }
                bulkTagUpdate.push(bulkObj)
                tagMap.push(characters[i])
            }

            for (let i = 0; i < series.length; i++) {
                if (!series[i]) continue
                let bulkObj = {tag: series[i], type: "series", description: "Series.", image: null, imageHash: null} as any
                const existingTag = await sql.tag.tag(series[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("series", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
                        bulkObj.imageHash = serverFunctions.md5(buffer)
                    }
                }
                bulkTagUpdate.push(bulkObj)
                tagMap.push(series[i])
            }

            for (let i = 0; i < tags.length; i++) {
                if (!tags[i]) continue
                let bulkObj = {tag: tags[i], type: tagObjectMapping[tags[i]]?.type, description: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`, image: null, imageHash: null} as any
                const existingTag = await sql.tag.tag(tags[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("tag", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
                        bulkObj.imageHash = serverFunctions.md5(buffer)
                    }
                }
                bulkTagUpdate.push(bulkObj)
                tagMap.push(tags[i])
            }

            for (let i = 0; i < tagMap.length; i++) {
                const implications = await sql.tag.implications(tagMap[i])
                if (implications?.[0]) {
                    for (const i of implications) {
                      tagMap.push(i.implication)
                      const tag = await sql.tag.tag(i.implication)
                      bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type, description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
                    }
                }
            }
    
            tagMap = functions.removeDuplicates(tagMap).filter(Boolean)
            await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate, true)
            await sql.tag.insertUnverifiedTagMap(postID, tagMap)
    
            res.status(200).send("Success")
          } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
          }
    })


    app.get("/api/post/history", postLimiter, async (req: Request, res: Response) => {
        try {
            let {postID, historyID, username, query, offset} = req.query as unknown as PostHistoryParams
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            let result = [] as PostHistory[]
            if (postID && historyID) {
                const history = await sql.history.postHistoryID(postID, historyID)
                if (history) result = [history]
                if (req.session.captchaNeeded) result = functions.stripTags(result)
            } else if (username) {
                result = await sql.history.userPostHistory(username)
                if (req.session.captchaNeeded) result = functions.stripTags(result)
            } else {
                result = await sql.history.postHistory(postID, Number(offset), query)
                if (req.session.captchaNeeded) result = functions.stripTags(result)
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/post/history/delete", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            const historyID = req.query.historyID as string
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const postHistory = await sql.history.postHistory(postID)
            if (postHistory[0]?.historyID === historyID) {
                return res.status(400).send("Bad historyID")
            } else {
                const currentHistory = postHistory.find((history: any) => history.historyID === historyID)
                if (!currentHistory) return res.status(400).send("Bad historyID")
                let r18 = functions.isR18(currentHistory.rating)
                for (let i = 0; i < currentHistory.images?.length; i++) {
                    const image = currentHistory.images[i]
                    if (image?.includes("history/")) {
                        await serverFunctions.deleteFile(image, r18)
                        await serverFunctions.deleteFile(image.replace("original/", "upscaled/"), r18)
                    }
                }
                if (currentHistory.images?.[0]) {
                    await serverFunctions.deleteIfEmpty(path.dirname(currentHistory.images[0]), r18)
                    await serverFunctions.deleteIfEmpty(path.dirname(currentHistory.images[0].replace("original/", "upscaled/")), r18)
                }
                await sql.history.deletePostHistory(historyID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/view", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {postID} = req.body as {postID: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            let result = await sql.post.post(postID)
            if (!result) return res.status(400).send("Invalid postID")
            await sql.history.updateSearchHistory(req.session.username, postID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/compress", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {postID, quality, format, maxDimension, maxUpscaledDimension, original, upscaled} = req.body as PostCompressParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            let post = await sql.post.unverifiedPost(postID)
            if (!post) return res.status(400).send("Invalid postID")

            if (post.type === "video" || post.type === "audio" || post.type === "model" || post.type === "live2d") return res.status(400).send("Bad request")
            let animated = post.type === "animation"

            for (let i = 0; i < post.images.length; i++) {
                if (original) {
                    const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
                    const buffer = await serverFunctions.getUnverifiedFile(file, false)
                    const dirname = path.dirname(file)
                    const basename = path.basename(file, path.extname(file))

                    if (buffer.byteLength) {
                        const meta = await sharp(buffer, {limitInputPixels: false}).metadata()
                        let sharpProcess = null as unknown as sharp.Sharp
                        if (maxDimension && (meta.width! > Number(maxDimension) || meta.height! > Number(maxDimension))) {
                            sharpProcess = sharp(buffer, {animated, limitInputPixels: false}).resize(Number(maxDimension), Number(maxDimension), {fit: "inside"})
                        } else {
                            sharpProcess = sharp(buffer, {animated, limitInputPixels: false})
                        }
                        let newFile = file
                        let newFilename = post.images[i].filename
                        if (format === "jpg") {
                            newFile = path.join(dirname, `${basename}.jpg`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".jpg"
                            sharpProcess = sharpProcess.jpeg({optimiseScans: true, trellisQuantisation: true, quality: Number(quality)})
                        } else if (format === "png") {
                            newFile = path.join(dirname, `${basename}.png`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".png"
                            sharpProcess = sharpProcess.png({quality: Number(quality)})
                        } else if (format === "gif") {
                            newFile = path.join(dirname, `${basename}.gif`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".gif"
                            sharpProcess = sharpProcess.gif()
                        } else if (format === "webp") {
                            newFile = path.join(dirname, `${basename}.webp`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".webp"
                            sharpProcess = sharpProcess.webp({quality: Number(quality)})
                        } else if (format === "avif") {
                            newFile = path.join(dirname, `${basename}.avif`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".avif"
                            sharpProcess = sharpProcess.avif({quality: Number(quality)})
                        }
                        const newBuffer = await sharpProcess.toBuffer()
                        await serverFunctions.deleteUnverifiedFile(file)
                        await serverFunctions.uploadUnverifiedFile(newFile, newBuffer)
                        await sql.post.updateUnverifiedImage(post.images[i].imageID, "filename", newFilename)
                    }
                }

                if (upscaled) {
                    const file = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
                    const buffer = await serverFunctions.getUnverifiedFile(file, false)
                    const dirname = path.dirname(file)
                    const basename = path.basename(file, path.extname(file))

                    if (buffer.byteLength) {
                        const meta = await sharp(buffer, {limitInputPixels: false}).metadata()
                        let sharpProcess = null as unknown as sharp.Sharp
                        if (maxUpscaledDimension && (meta.width! > Number(maxUpscaledDimension) || meta.height! > Number(maxUpscaledDimension))) {
                            sharpProcess = sharp(buffer, {animated, limitInputPixels: false}).resize(Number(maxUpscaledDimension), Number(maxUpscaledDimension), {fit: "inside"})
                        } else {
                            sharpProcess = sharp(buffer, {animated, limitInputPixels: false})
                        }
                        let newFile = file
                        let newFilename = post.images[i].filename
                        if (format === "jpg") {
                            newFile = path.join(dirname, `${basename}.jpg`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".jpg"
                            sharpProcess = sharpProcess.jpeg({optimiseScans: true, trellisQuantisation: true, quality: Number(quality)})
                        } else if (format === "png") {
                            newFile = path.join(dirname, `${basename}.png`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".png"
                            sharpProcess = sharpProcess.png({quality: Number(quality)})
                        } else if (format === "gif") {
                            newFile = path.join(dirname, `${basename}.gif`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".gif"
                            sharpProcess = sharpProcess.gif()
                        } else if (format === "webp") {
                            newFile = path.join(dirname, `${basename}.webp`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".webp"
                            sharpProcess = sharpProcess.webp({quality: Number(quality)})
                        } else if (format === "avif") {
                            newFile = path.join(dirname, `${basename}.avif`)
                            newFilename = path.basename(newFilename, path.extname(newFilename)) + ".avif"
                            sharpProcess = sharpProcess.avif({quality: Number(quality)})
                        }
                        const newBuffer = await sharpProcess.toBuffer()
                        await serverFunctions.deleteUnverifiedFile(file)
                        await serverFunctions.uploadUnverifiedFile(newFile, newBuffer)
                        await sql.post.updateUnverifiedImage(post.images[i].imageID, "filename", newFilename)
                    }
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/upscale", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {postID, upscaler, scaleFactor, compressJPG} = req.body as PostUpscaleParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            let post = await sql.post.unverifiedPost(postID)
            if (!post) return res.status(400).send("Invalid postID")

            if (post.type === "video" || post.type === "audio" || post.type === "model" || post.type === "live2d") return res.status(400).send("Bad request")

            for (let i = 0; i < post.images.length; i++) {
                const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
                const newFile = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
                const buffer = await serverFunctions.getUnverifiedFile(file, false)
                const basename = path.basename(file)

                if (buffer.byteLength) {
                    const tempDir = path.join(__dirname, "assets/temp")
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, {recursive: true})
                    const tempDest = path.join(tempDir, basename)
                    fs.writeFileSync(tempDest, new Uint8Array(buffer))
                    let isAnimatedWebp = false
                    if (functions.isWebP(basename)) isAnimatedWebp = functions.isAnimatedWebp(buffer)

                    if (post.type === "image" || post.type === "comic") {
                        await waifu2x.upscaleImage(tempDest, tempDest, {rename: "", upscaler, scale: Number(scaleFactor)})
                    } else if (functions.isGIF(basename)) {
                        await waifu2x.upscaleGIF(tempDest, tempDest, {rename: "", upscaler, scale: Number(scaleFactor)})
                    } else if (isAnimatedWebp) {
                        await waifu2x.upscaleAnimatedWebp(tempDest, tempDest, {rename: "", upscaler, scale: Number(scaleFactor)})
                    }
                    let newBuffer = fs.readFileSync(tempDest)
                    if (compressJPG) {
                        if (functions.isGIF(basename) || isAnimatedWebp) {
                            newBuffer = await sharp(newBuffer, {animated: true, limitInputPixels: false}).webp().toBuffer()
                        } else {
                            newBuffer = await sharp(newBuffer, {limitInputPixels: false}).jpeg({optimiseScans: true, trellisQuantisation: true, quality: 95}).toBuffer()
                        }
                    }
                    await serverFunctions.uploadUnverifiedFile(newFile, newBuffer)
                    await sql.post.updateUnverifiedPost(post.postID, "hasUpscaled", true)
                    fs.unlinkSync(tempDest)
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
}

export default PostRoutes