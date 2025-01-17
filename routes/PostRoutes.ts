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
import mediaInfoFactory from "mediainfo.js"
import fs from "fs"
import path from "path"
import {PostSearch, PostFull, PostDeleteRequestFulfillParams, PostHistoryParams, PostCompressParams, PostUpscaleParams,
PostQuickEditParams, PostQuickEditUnverifiedParams, PostHistory} from "../types/Types"
import {cleanStringTags, insertImages, updatePost, insertTags} from "./UploadRoutes"

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

    app.get("/api/post/deleted", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, offset} = req.query as unknown as {query: string, offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return res.status(403).end()
            const result = await sql.search.deletedPosts(query, Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
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

            if (post.deleted) {
                await serverFunctions.deletePost(post)
                return res.status(200).send("Success")
            }

            let deletionDate = new Date()
            deletionDate.setDate(deletionDate.getDate() + 30)
            await sql.post.updatePost(post.postID, "deleted", true)
            await sql.post.updatePost(post.postID, "deletionDate", deletionDate.toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/post/emptybin", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return res.status(403).end()

            const deletedPosts = await sql.search.deletedPosts()
            for (const post of deletedPosts) {
                if (post.deleted) {
                    await serverFunctions.deletePost(post)
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/post/undelete", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID} = req.body as {postID: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return res.status(403).end()
            const post = await sql.post.post(postID).catch(() => null)
            if (!post) return res.status(200).send("Doesn't exist")

            await sql.post.updatePost(post.postID, "deleted", false)
            await sql.post.updatePost(post.postID, "deletionDate", null)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/post/delete/unverified", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const unverified = await sql.post.unverifiedPost(postID)
            if (!unverified) return res.status(400).send("Bad postID")
            if (unverified.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
            await serverFunctions.deleteUnverifiedPost(unverified)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/post/undelete/unverified", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID} = req.body as {postID: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const unverified = await sql.post.unverifiedPost(postID)
            if (!unverified) return res.status(400).send("Bad postID")

            await sql.post.updateUnverifiedPost(unverified.postID, "deleted", false)
            await sql.post.updateUnverifiedPost(unverified.postID, "deletionDate", null)
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
            await sql.invalidateCache("post")
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
            await sql.invalidateCache("post")
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
            await sql.invalidateCache("post")
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
                result = result.filter((r) => !r.post.hidden)
            }
            if (!req.session.showR18) {
                result = result.filter((r) => !functions.isR18(r.post.rating))
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
            let post = await sql.post.unverifiedPost(postID)
            if (!post) return res.status(400).send("Invalid postID") 
            if (post.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
            if (post.images.length > 1) {
                post.images = post.images.sort((a: any, b: any) => a.order - b.order)
            }
            serverFunctions.sendEncrypted(post, req, res)
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

    app.get("/api/post/deleted/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.search.deletedUnverifiedPosts(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/pending", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const result = await sql.search.unverifiedUserPosts(req.session.username)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/rejected", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const result = await sql.search.deletedUnverifiedUserPosts(req.session.username)
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
            const posts = await sql.post.unverifiedChildPosts(postID)
            if (!posts.length) return serverFunctions.sendEncrypted([], req, res)
            if (posts[0]?.post.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
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
            const post = await sql.post.unverifiedParent(postID)
            if (!post) return serverFunctions.sendEncrypted(undefined, req, res)
            if (post?.post.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
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

    app.post("/api/post/appeal", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, reason} = req.body as {postID: string, reason: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const post = await sql.post.unverifiedPost(postID)
            if (!post) return res.status(400).send("Bad postID")
            if (post.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
            if (!post.deleted) return res.status(400).send("Post is still pending")
            if (post.appealed) return res.status(400).send("Cannot appeal again")

            await sql.post.updateUnverifiedPost(post.postID, "appealed", true)
            await sql.post.updateUnverifiedPost(post.postID, "appealer", req.session.username)
            await sql.post.updateUnverifiedPost(post.postID, "appealReason", reason)
            await sql.post.updateUnverifiedPost(post.postID, "deleted", false)
            await sql.post.updateUnverifiedPost(post.postID, "deletionDate", null)
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
            if (!unverified && !permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!reason) reason = null

            const post = unverified ? await sql.post.unverifiedPost(postID) : await sql.post.post(postID)
            if (!post) return res.status(400).send("Bad request")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            if (unverified) {
                if (post.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            }


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

                let newSlug = functions.postSlug(source.title, source.englishTitle)
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
                        slug: newSlug,
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
                        slug: newSlug,
                        updatedDate,
                        updater: req.session.username
                    })
                }

                if (post.slug && post.slug !== newSlug) {
                    await sql.report.insertRedirect(postID, post.slug)
                }
            } 
            if (tagEdit) {
                if (!functions.cleanArray(artists)[0]) artists = ["unknown-artist"]
                if (!functions.cleanArray(series)[0]) series = characters?.includes("original") ? ["no-series"] : ["unknown-series"]
                if (!functions.cleanArray(characters)[0]) characters = ["unknown-character"]
                if (!functions.cleanArray(tags)[0]) tags = ["needs-tags"]
                artists = artists!
                characters = characters!
                series = series!
                tags = tags!

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
                        let bulkObj = {tag: tags[i], type: tagObjectMapping[tags[i]]?.type || "tag", description: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`, image: null, imageHash: null} as any
                        bulkTagUpdate.push(bulkObj)
                    }
                }

                for (let i = 0; i < addedTags.length; i++) {
                    const implications = await sql.tag.implications(addedTags[i])
                    if (implications?.[0]) {
                        for (const i of implications) {
                            if (!oldTagsSet.has(i.implication)) addedTags.push(i.implication)
                            const tag = await sql.tag.tag(i.implication)
                            bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type || "tag", description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
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
            if (!functions.validType(type)) return res.status(400).send("Invalid type")
            if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
            if (!functions.validStyle(style)) return res.status(400).send("Invalid style")
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

            artists = cleanStringTags(artists, "artists")
            characters = cleanStringTags(characters, "characters")
            series = cleanStringTags(series, "series")
            tags = cleanStringTags(tags, "tags")

            let invalidTags = functions.invalidTags(characters, series, tags)
            if (invalidTags) {
                return res.status(400).send(invalidTags)
            }
    
            if (parentID) {
                await sql.post.insertUnverifiedChild(postID, parentID)
            }
            
            let artistTags = await Promise.all((artists.map((a) => sql.tag.tag(a)))).then((a) => a.filter((a) => a !== undefined))
            let characterTags = await Promise.all((characters.map((c) => sql.tag.tag(c)))).then((c) => c.filter((c) => c !== undefined))
            let seriesTags = await Promise.all((series.map((s) => sql.tag.tag(s)))).then((s) => s.filter((s) => s !== undefined))
            let newTags = await Promise.all((tags.map((t) => sql.tag.tag(t)))).then((t) => t.filter((t) => t !== undefined))

            let {hasOriginal, hasUpscaled} = await insertImages(postID, {unverified: true, images: post.images, upscaledImages: post.images,
            characters: characterTags, imgChanged: true, type, rating, source})

            await updatePost(postID, {unverified: true, artists: artistTags, hasOriginal, hasUpscaled, rating, type, style,
            source, originalID: originalPostID, reason, parentID: post.parentID, updater: req.session.username, uploader: post.uploader,
            uploadDate: post.uploadDate})

            await insertTags(postID, {unverified: true, tags, artists: artistTags, characters: characterTags, 
            series: seriesTags, newTags, username: req.session.username})
    
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

    app.get("/api/post/redirects", postLimiter, async (req: Request, res: Response) => {
        try {
            let {postID} = req.query as {postID: string}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            let result = await sql.report.redirects(postID)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/metadata", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            let {postID, order} = req.body as {postID: string, order: number}
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Bad postID")
            const image = post.images[(order || 1) - 1]
            let filename = req.session.upscaledImages ? image.upscaledFilename || image.filename : image.filename
            const key = functions.getImagePath(image.type, image.postID, image.order, filename)
            let upscaled = req.session.upscaledImages as boolean
            let buffer = await serverFunctions.getFile(key, upscaled, post.rating === functions.r18())
            if (!buffer.byteLength) buffer = await serverFunctions.getFile(key, false, post.rating === functions.r18())
            const mediainfo = await mediaInfoFactory()
            const readChunk = async (chunkSize: number, offset: number) => {
                return new Uint8Array(buffer.subarray(offset, offset + chunkSize))
            }
            let result = {} as any
            if (image.type === "image" || image.type === "comic" || image.type === "animation") {
                const rawInfo = await mediainfo.analyzeData(buffer.byteLength, readChunk)
                let info = rawInfo.media?.track.find((track) => track["@type"] === "Image")
                if (!info) info = rawInfo.media?.track.find((track) => track["@type"] === "Video") as any
                let metadata = await sharp(buffer, {limitInputPixels: false}).metadata()
                let format = path.extname(filename).replace(".", "")
                let subsampling = info?.ChromaSubsampling ? `${info?.ColorSpace} ${info?.ChromaSubsampling}` : metadata.chromaSubsampling
                result = {
                    format,
                    width: metadata.width,
                    height: metadata.height,
                    size: metadata.size,
                    colorSpace: metadata.space,
                    colorChannels: metadata.channels,
                    progressive: metadata.isProgressive,
                    alpha: metadata.hasAlpha,
                    dpi: metadata.density,
                    // @ts-expect-error
                    bitdepth: info?.BitDepth || metadata.paletteBitDepth,
                    chromaSubsampling: subsampling,
                    frames: metadata.pages,
                    duration: metadata.delay?.reduce((sum, delay) => sum + delay / 1000, 0)
                }
            } else if (image.type === "audio") {
                const rawInfo = await mediainfo.analyzeData(buffer.byteLength, readChunk)
                const info = rawInfo.media?.track.find((track) => track["@type"] === "Audio")
                let format = path.extname(filename).replace(".", "")
                result = {
                    format,
                    duration: info?.Duration,
                    bitrate: info?.BitRate,
                    audioChannels: info?.Channels,
                    sampleRate: info?.SamplingRate,
                    size: buffer.byteLength
                }
            } else if (image.type === "video") {
                const rawInfo = await mediainfo.analyzeData(buffer.byteLength, readChunk)
                const info = rawInfo.media?.track.find((track) => track["@type"] === "Video")
                let format = path.extname(filename).replace(".", "")
                let subsampling = info?.ChromaSubsampling ? `${info?.ColorSpace} ${info?.ChromaSubsampling}` : undefined
                result = {
                    format,
                    width: info?.Width,
                    height: info?.Height,
                    duration: info?.Duration,
                    framerate: info?.FrameRate,
                    bitrate: info?.BitRate,
                    bitdepth: info?.BitDepth,
                    chromaSubsampling: subsampling,
                    encoder: info?.Encoded_Library_Name,
                    scanType: info?.ScanType,
                    colorMatrix: info?.matrix_coefficients,
                    size: buffer.byteLength
                }
            } else {
                let format = path.extname(filename).replace(".", "")
                if (image.type === "live2d") format = "live2d"
                let width = req.session.upscaledImages ? image.upscaledWidth || image.width : image.width
                let height = req.session.upscaledImages ? image.upscaledHeight || image.height : image.height
                let size = req.session.upscaledImages ? image.upscaledSize || image.size : image.size
                result = {
                    format,
                    width,
                    height,
                    size
                }
            }
            res.status(200).send(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default PostRoutes