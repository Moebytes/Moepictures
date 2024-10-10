import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import phash from "sharp-phash"
import imageSize from "image-size"
import fs from "fs"
import path from "path"

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
            let result = await sql.post.post(Number(postID))
            if (!result) return res.status(404).send("Not found")
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                if (result.hidden) return res.status(403).end()
            }
            if (!req.session.showR18) {
                if (result.restrict === "explicit") return res.status(403).end()
            }
            if (result?.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            if (req.session.captchaNeeded) delete result.tags
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/tags", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            let result = await sql.post.postTags(Number(postID))
            if (!result) return res.status(400).send("Invalid postID")
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                if (result.hidden) return res.status(403).end()
            }
            if (!req.session.showR18) {
                if (result.restrict === "explicit") return res.status(403).end()
            }
            if (req.session.captchaNeeded) delete result.tags
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
    
    app.get("/api/post/comments", postLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const result = await sql.comment.comments(Number(postID))
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                if (result.hidden) return res.status(403).end()
            }
            if (!req.session.showR18) {
                if (result.restrict === "explicit") return res.status(403).end()
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/post/delete", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin") return res.status(403).end()
            const post = await sql.post.post(Number(postID)).catch(() => null)
            if (!post) return res.status(200).send("Doesn't exist")
            let r18 = post.restrict === "explicit"
            await sql.post.deletePost(Number(postID))
            for (let i = 0; i < post.images.length; i++) {
                const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
                const upscaledFile = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
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
            const {postID} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const post = await sql.post.post(Number(postID)).catch(() => null)
            if (!post) return res.status(404).send("Doesn't exist")
            if (post.hidden) {
                await sql.post.updatePost(Number(postID), "hidden", false)
            } else {
                await sql.post.updatePost(Number(postID), "hidden", true)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e) 
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/thirdparty", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            let posts = await sql.post.thirdParty(Number(postID))
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                posts = posts.filter((p: any) => !p?.hidden)
            }
            if (!req.session.showR18) {
                posts = posts.filter((p: any) => p?.restrict !== "explicit")
            }
            posts = functions.stripTags(posts)
            res.status(200).json(posts)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/parent", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const post = await sql.post.parent(Number(postID))
            if (!post) return res.status(200).json()
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                if (post.hidden) return res.status(403).end()
            }
            if (!req.session.showR18) {
                if (post.restrict === "explicit") return res.status(403).end()
            }
            delete post.tags
            res.status(200).json(post)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            let result = await sql.post.unverifiedPost(Number(postID))
            if (result.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/list/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.search.unverifiedPosts(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post-edits/list/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.search.unverifiedPostEdits(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/thirdparty/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const posts = await sql.post.unverifiedThirdParty(Number(postID))
            res.status(200).json(posts)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/parent/unverified", postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const post = await sql.post.unverifiedParent(Number(postID))
            res.status(200).json(post)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/delete/request", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, reason} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const post = await sql.post.post(Number(postID))
            if (!post) return res.status(400).send("Bad postID")
            await sql.request.insertPostDeleteRequest(req.session.username, Number(postID), reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/post/delete/request/list", postLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.request.postDeleteRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/post/delete/request/fulfill", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, postID, accepted} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()

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
            const postID = Number(req.body.postID)
            const unverified = String(req.body.unverified) === "true"
            let type = req.body.type 
            const restrict = req.body.restrict 
            const style = req.body.style
            let artists = req.body.artists
            let characters = req.body.characters
            let series = req.body.series
            let tags = req.body.tags
            let reason = req.body.reason
            let silent = req.body.silent
    
            if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")

            if (!artists?.[0]) artists = ["unknown-artist"]
            if (!series?.[0]) series = characters.includes("original") ? ["no-series"] : ["unknown-series"]
            if (!characters?.[0]) characters = ["unknown-character"]
            if (!tags?.[0]) tags = ["needs-tags"]

            let rawTags = `${artists.join(" ")} ${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
            if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
                return res.status(400).send("Invalid characters in tags: , _ / \\")
            }
    
            artists = artists.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            characters = characters.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            series = series.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
    
            if (!functions.validType(type)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
            if (!functions.validStyle(style)) return res.status(400).send("Invalid style")
    
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Bad request")
            let oldR18 = post.restrict === "explicit"
            let newR18 = restrict === "explicit"
    
            const updatedDate = new Date().toISOString()

            if (unverified) {
                await sql.post.bulkUpdateUnverifiedPost(postID, {
                    type,
                    restrict, 
                    style,
                    updatedDate,
                    updater: req.session.username
                })
            } else {
                await sql.post.bulkUpdatePost(postID, {
                    type,
                    restrict, 
                    style,
                    updatedDate,
                    updater: req.session.username
                })
            }
    
            let tagMap = [] as any
            let bulkTagUpdate = [] as any
    
            for (let i = 0; i < artists.length; i++) {
              if (!artists[i]) continue
              let bulkObj = {tag: artists[i], type: "artist", description: "Artist.", image: null} as any
              bulkTagUpdate.push(bulkObj)
              tagMap.push(artists[i])
            }
            
            for (let i = 0; i < characters.length; i++) {
                if (!characters[i]) continue
                let bulkObj = {tag: characters[i], type: "character", description: "Character.", image: null} as any
                bulkTagUpdate.push(bulkObj)
                tagMap.push(characters[i])
            }

            for (let i = 0; i < series.length; i++) {
                if (!series[i]) continue
                let bulkObj = {tag: series[i], type: "series", description: "Series.", image: null} as any
                bulkTagUpdate.push(bulkObj)
                tagMap.push(series[i])
            }

            for (let i = 0; i < tags.length; i++) {
                if (!tags[i]) continue
                let bulkObj = {tag: tags[i], type: functions.tagType(tags[i]), description: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`, image: null} as any
                bulkTagUpdate.push(bulkObj)
                tagMap.push(tags[i])
            }

            for (let i = 0; i < tagMap.length; i++) {
                const implications = await sql.tag.implications(tagMap[i])
                if (implications?.[0]) {
                    for (const i of implications) {
                      tagMap.push(i.implication)
                      const tag = await sql.tag.tag(i.implication)
                      bulkTagUpdate.push({tag: i.implication, type: functions.tagType(i.implication), description: tag?.description || null, image: tag?.image || null})
                    }
                }
            }
    
            tagMap = functions.removeDuplicates(tagMap)
            if (unverified) {
                await sql.tag.purgeUnverifiedTagMap(postID)
                await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate, true)
                await sql.tag.insertUnverifiedTagMap(postID, tagMap)
            } else {
                await sql.tag.purgeTagMap(postID)
                await sql.tag.bulkInsertTags(bulkTagUpdate, req.session.username, true)
                await sql.tag.insertTagMap(postID, tagMap)
            }

            await serverFunctions.migratePost(post, oldR18, newR18)

            if (req.session.role === "admin" || req.session.role === "mod") {
                if (silent) return res.status(200).send("Success")
            }

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
                    uploadDate: vanilla.uploadDate, updatedDate: vanilla.updatedDate, type: vanilla.type, restrict: vanilla.restrict, 
                    style: vanilla.style, thirdParty: vanilla.thirdParty, title: vanilla.title, translatedTitle: vanilla.translatedTitle, 
                    drawn: vanilla.drawn, artist: vanilla.artist, link: vanilla.link, commentary: vanilla.commentary, translatedCommentary: vanilla.translatedCommentary, 
                    bookmarks: vanilla.bookmarks, mirrors: vanilla.mirrors, hasOriginal: vanilla.hasOriginal, hasUpscaled: vanilla.hasUpscaled, 
                    artists: vanilla.artists, characters: vanilla.characters, series: vanilla.series, tags: vanilla.tags, reason})
                let images = [] as any
                for (let i = 0; i < post.images.length; i++) {
                    images.push(functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename))
                }
                await sql.history.insertPostHistory({
                    postID, username: req.session.username, images, uploader: post.uploader, updater: post.updater, 
                    uploadDate: post.uploadDate, updatedDate: post.updatedDate, type: post.type, restrict: post.restrict, 
                    style: post.style, thirdParty: post.thirdParty, title: post.title, translatedTitle: post.translatedTitle, 
                    drawn: post.drawn, artist: post.artist, link: post.link, commentary: post.commentary, 
                    translatedCommentary: post.translatedCommentary, bookmarks: post.bookmarks, mirrors: post.mirrors, 
                    hasOriginal: post.hasOriginal, hasUpscaled: post.hasUpscaled, artists, characters, series, tags, reason})
            } else {
                let images = [] as any
                for (let i = 0; i < post.images.length; i++) {
                    images.push(functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename))
                }
                await sql.history.insertPostHistory({
                    postID, username: req.session.username, images, uploader: post.uploader, updater: post.updater, 
                    uploadDate: post.uploadDate, updatedDate: post.updatedDate, type: post.type, restrict: post.restrict, 
                    style: post.style, thirdParty: post.thirdParty, title: post.title, translatedTitle: post.translatedTitle, 
                    drawn: post.drawn, artist: post.artist, link: post.link, commentary: post.commentary, 
                    translatedCommentary: post.translatedCommentary, bookmarks: post.bookmarks, mirrors: post.mirrors, 
                    hasOriginal: post.hasOriginal, hasUpscaled: post.hasUpscaled, artists, characters, series, tags, reason})
            }
            res.status(200).send("Success")
          } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
          }
    })

    app.put("/api/post/quickedit/unverified", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let postID = Number(req.body.postID)
            let type = req.body.type 
            const restrict = req.body.restrict 
            const style = req.body.style
            let artists = req.body.artists
            let characters = req.body.characters
            let series = req.body.series
            let tags = req.body.tags
            let reason = req.body.reason
    
            if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
    
            if (!artists?.[0]) artists = ["unknown-artist"]
            if (!series?.[0]) series = characters.includes("original") ? ["no-series"] : ["unknown-series"]
            if (!characters?.[0]) characters = ["unknown-character"]
            if (!tags?.[0]) tags = ["needs-tags"]

            let rawTags = `${artists.join(" ")} ${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
            if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
                return res.status(400).send("Invalid characters in tags: , _ / \\")
            }
    
            artists = artists.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            characters = characters.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            series = series.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
            tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))
    
            if (!functions.validType(type)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
            if (!functions.validStyle(style)) return res.status(400).send("Invalid style")
    
            const originalPostID = postID as any
            const post = await sql.post.post(originalPostID)
            if (!post) return res.status(400).send("Bad postID")
            postID = await sql.post.insertUnverifiedPost()

            if (post.thirdParty) {
                const thirdPartyID = await sql.post.parent(originalPostID).then((r) => r.parentID)
                await sql.post.insertUnverifiedThirdParty(postID, Number(thirdPartyID))
            }
            if (type !== "comic") type = "image"

            let hasOriginal = false
            let hasUpscaled = false
            let originalCheck = [] as string[]
            let upscaledCheck = [] as string[]
            let r18 = post.restrict === "explicit"

            for (let i = 0; i < post.images.length; i++) {
                const imagePath = functions.getImagePath(post.images[i].type, originalPostID, post.images[i].order, post.images[i].filename)
                const buffer = await serverFunctions.getFile(imagePath, false, r18) as Buffer
                const upscaledImagePath = functions.getUpscaledImagePath(post.images[i].type, originalPostID, post.images[i].order, post.images[i].filename)
                const upscaledBuffer = await serverFunctions.getFile(upscaledImagePath, false, r18) as Buffer

                let current = upscaledBuffer ? upscaledBuffer : buffer
                let order = i + 1
                const ext = path.extname(post.images[i].filename).replace(".", "")
                let fileOrder = post.images.length > 1 ? `${order}` : "1"
                const filename = post.title ? `${post.title}.${ext}` : 
                characters[0] !== "unknown-character" ? `${characters[0]}.${ext}` :
                `${postID}.${ext}`
                let kind = "image" as any
                if (type === "comic") {
                    kind = "comic"
                } else if (ext === "jpg" || ext === "png" || ext === "avif") {
                    kind = "image"
                } else if (ext === "webp") {
                    const animated = await functions.isAnimatedWebp(current)
                    if (animated) {
                        kind = "animation"
                    if (type !== "video") type = "animation"
                    } else {
                        kind = "image"
                    }
                } else if (ext === "gif") {
                    kind = "animation"
                    if (type !== "video") type = "animation"
                } else if (ext === "mp4" || ext === "webm") {
                    kind = "video"
                    type = "video"
                } else if (ext === "mp3" || ext === "wav") {
                    kind = "audio"
                    type = "audio"
                } else if (ext === "glb" || ext === "obj" || ext === "fbx") {
                    kind = "model"
                    type = "model"
                }
                if (buffer.byteLength) {
                    let newImagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
                    await serverFunctions.uploadUnverifiedFile(newImagePath, buffer)
                    hasOriginal = true
                    originalCheck.push(newImagePath)
                }
                if (upscaledBuffer.byteLength) {
                    let newImagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), filename)
                    await serverFunctions.uploadUnverifiedFile(newImagePath, upscaledBuffer)
                    hasUpscaled = true
                    upscaledCheck.push(newImagePath)
                }
                let dimensions = null as any
                let hash = ""
                if (kind === "video" || kind === "audio" || kind === "model") {
                    const buffer = functions.base64ToBuffer(post.thumbnail)
                    hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
                    dimensions = imageSize(buffer)
                } else {
                    hash = await phash(current).then((hash: string) => functions.binaryToHex(hash))
                    dimensions = imageSize(current)
                }
                await sql.post.insertUnverifiedImage(postID, filename, type, order, hash, dimensions.width, dimensions.height, String(current.byteLength))
            }
            if (upscaledCheck?.length > originalCheck?.length) hasOriginal = false
            if (originalCheck?.length > upscaledCheck?.length) hasUpscaled = false
    
            const updatedDate = new Date().toISOString()
            await sql.post.bulkUpdateUnverifiedPost(postID, {
                originalID: originalPostID ? originalPostID : null,
                reason: reason ? reason : null,
                type,
                restrict, 
                style, 
                thirdParty: post.thirdParty,
                title: post.title ? post.title : null,
                translatedTitle: post.translatedTitle ? post.translatedTitle : null,
                artist: post.artist ? post.artist : null,
                drawn: post.date ? post.date : null,
                link: post.link ? post.link : null,
                commentary: post.commentary ? post.commentary : null,
                translatedCommentary: post.translatedCommentary ? post.translatedCommentary : null,
                bookmarks: post.bookmarks ? post.bookmarks : null,
                mirrors: post.mirrors ? functions.mirrorsJSON(post.mirrors) : null,
                uploader: post.uploader,
                uploadDate: post.uploadDate,
                updatedDate,
                hasOriginal,
                hasUpscaled,
                updater: req.session.username
            })

            let tagMap = [] as any
            let bulkTagUpdate = [] as any
    
            for (let i = 0; i < artists.length; i++) {
                if (!artists[i]) continue
                let bulkObj = {tag: artists[i], type: "artist", description: "Artist.", image: null} as any
                const existingTag = await sql.tag.tag(artists[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("artist", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
                    }
                }
                bulkTagUpdate.push(bulkObj)
                tagMap.push(artists[i])
            }
            
            for (let i = 0; i < characters.length; i++) {
                if (!characters[i]) continue
                let bulkObj = {tag: characters[i], type: "character", description: "Character.", image: null} as any
                const existingTag = await sql.tag.tag(characters[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("character", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
                    }
                }
                bulkTagUpdate.push(bulkObj)
                tagMap.push(characters[i])
            }

            for (let i = 0; i < series.length; i++) {
                if (!series[i]) continue
                let bulkObj = {tag: series[i], type: "series", description: "Series.", image: null} as any
                const existingTag = await sql.tag.tag(series[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("series", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
                    }
                }
                bulkTagUpdate.push(bulkObj)
                tagMap.push(series[i])
            }

            for (let i = 0; i < tags.length; i++) {
                if (!tags[i]) continue
                let bulkObj = {tag: tags[i], type: functions.tagType(tags[i]), description: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`, image: null} as any
                const existingTag = await sql.tag.tag(tags[i])
                if (existingTag) {
                    if (existingTag.description) bulkObj.description = existingTag.description
                    if (existingTag.image) {
                        const imagePath = functions.getTagPath("tag", existingTag.image)
                        const buffer = await serverFunctions.getFile(imagePath, false, false)
                        await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
                        bulkObj.image = existingTag.image
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
                      bulkTagUpdate.push({tag: i.implication, type: functions.tagType(i.implication), description: tag?.description || null, image: tag?.image || null})
                    }
                }
            }
    
            tagMap = functions.removeDuplicates(tagMap)
            await sql.tag.purgeUnverifiedTagMap(postID)
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
            const postID = req.query.postID as string
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const result = await sql.history.postHistory(postID, offset)
            if (req.session.captchaNeeded) delete result.tags
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/post/history/delete", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, historyID} = req.query
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const postHistory = await sql.history.postHistory(Number(postID))
            if (postHistory[0]?.historyID === historyID) {
                return res.status(400).send("Bad historyID")
            } else {
                const currentHistory = postHistory.find((history: any) => history.historyID === historyID)
                let r18 = currentHistory.restrict === "explicit"
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
                await sql.history.deletePostHistory(Number(historyID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/view", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {postID} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            let result = await sql.post.post(Number(postID))
            if (!result) return res.status(400).send("Invalid postID")
            const history = await sql.history.searchHistory(req.session.username, postID)
            if (history) {
                await sql.history.updateSearchHistory(history.historyID)
            } else {
                await sql.history.insertSearchHistory(req.session.username, postID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
}

export default PostRoutes