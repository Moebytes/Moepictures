import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import sharp from "sharp"
import waifu2x from "waifu2x"
import phash from "sharp-phash"
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
            if (!permissions.isMod(req.session)) {
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
            if (!permissions.isMod(req.session)) {
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
            if (!permissions.isMod(req.session)) {
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
            if (!permissions.isAdmin(req.session)) return res.status(403).end()
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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

    app.post("/api/post/lock", csrfProtection, postUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {postID} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const post = await sql.post.post(Number(postID)).catch(() => null)
            if (!post) return res.status(404).send("Doesn't exist")
            if (post.locked) {
                await sql.post.updatePost(Number(postID), "locked", false)
            } else {
                await sql.post.updatePost(Number(postID), "locked", true)
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
            if (!permissions.isMod(req.session)) {
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
            if (!permissions.isMod(req.session)) {
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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
            const postID = Number(req.body.postID)
            const unverified = String(req.body.unverified) === "true"
            let type = req.body.type 
            const restrict = req.body.restrict 
            const style = req.body.style
            const source = req.body.source
            let artists = req.body.artists
            let characters = req.body.characters
            let series = req.body.series
            let tags = req.body.tags
            let reason = req.body.reason
            let silent = req.body.silent

            let sourceEdit = source ? true : false
    
            if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")

            const post = unverified ? await sql.post.unverifiedPost(postID) :  await sql.post.post(postID)
            if (!post) return res.status(400).send("Bad request")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")

            if (sourceEdit) {
                const updatedDate = new Date().toISOString()

                if (unverified) {
                    await sql.post.bulkUpdateUnverifiedPost(postID, {
                        title: source.title ? source.title : null,
                        translatedTitle: source.translatedTitle ? source.translatedTitle : null,
                        artist: source.artist ? source.artist : null,
                        drawn: source.date ? source.date : null,
                        link: source.link ? source.link : null,
                        commentary: source.commentary ? source.commentary : null,
                        translatedCommentary: source.translatedCommentary ? source.translatedCommentary : null,
                        bookmarks: source.bookmarks ? source.bookmarks : null,
                        mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
                        updatedDate,
                        updater: req.session.username
                    })
                } else {
                    await sql.post.bulkUpdatePost(postID, {
                        title: source.title ? source.title : null,
                        translatedTitle: source.translatedTitle ? source.translatedTitle : null,
                        artist: source.artist ? source.artist : null,
                        drawn: source.date ? source.date : null,
                        link: source.link ? source.link : null,
                        commentary: source.commentary ? source.commentary : null,
                        translatedCommentary: source.translatedCommentary ? source.translatedCommentary : null,
                        bookmarks: source.bookmarks ? source.bookmarks : null,
                        mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
                        updatedDate,
                        updater: req.session.username
                    })
                }
            } else {
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
                    
                    await serverFunctions.migratePost(post, oldR18, newR18)
                }
            }

            if (unverified) return res.status(200).send("Success")
            
            if (permissions.isMod(req.session)) {
                if (silent) return res.status(200).send("Success")
            }

            const updated = await sql.post.post(postID)
            const updatedCategories = await serverFunctions.tagCategories(updated.tags)
            updated.artists = updatedCategories.artists.map((a: any) => a.tag)
            updated.characters = updatedCategories.characters.map((c: any) => c.tag)
            updated.series = updatedCategories.series.map((s: any) => s.tag)
            updated.tags = updatedCategories.tags.map((t: any) => t.tag)

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
                    postID, username: req.session.username, images, uploader: updated.uploader, updater: updated.updater, 
                    uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, restrict: updated.restrict, 
                    style: updated.style, thirdParty: updated.thirdParty, title: updated.title, translatedTitle: updated.translatedTitle, 
                    drawn: updated.drawn, artist: updated.artist, link: updated.link, commentary: updated.commentary, 
                    translatedCommentary: updated.translatedCommentary, bookmarks: updated.bookmarks, mirrors: updated.mirrors, 
                    hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: updated.artists, 
                    characters: updated.characters, series: updated.series, tags: updated.tags, reason})
            } else {
                let images = [] as any
                for (let i = 0; i < post.images.length; i++) {
                    images.push(functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename))
                }
                await sql.history.insertPostHistory({
                    postID, username: req.session.username, images, uploader: updated.uploader, updater: updated.updater, 
                    uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, restrict: updated.restrict, 
                    style: updated.style, thirdParty: updated.thirdParty, title: updated.title, translatedTitle: updated.translatedTitle, 
                    drawn: updated.drawn, artist: updated.artist, link: updated.link, commentary: updated.commentary, 
                    translatedCommentary: updated.translatedCommentary, bookmarks: updated.bookmarks, mirrors: updated.mirrors, 
                    hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: updated.artists, 
                    characters: updated.characters, series: updated.series, tags: updated.tags, reason})
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
            let restrict = req.body.restrict 
            let style = req.body.style
            let source = req.body.source
            let artists = req.body.artists
            let characters = req.body.characters
            let series = req.body.series
            let tags = req.body.tags
            let reason = req.body.reason

            let sourceEdit = source ? true : false
    
            if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")

            const originalPostID = postID as any
            const post = await sql.post.post(originalPostID)
            if (!post) return res.status(400).send("Bad postID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            postID = await sql.post.insertUnverifiedPost()

            if (sourceEdit) {
                const categories = await serverFunctions.tagCategories(post.tags)
                artists = categories.artists.map((a: any) => a.tag)
                characters = categories.characters.map((c: any) => c.tag)
                series = categories.series.map((s: any) => s.tag)
                tags = categories.tags.map((t: any) => t.tag)
                type = post.type
                restrict = post.restrict
                style = post.style
            } else {
                source = {
                    title: post.title,
                    translatedTitle: post.translatedTitle,
                    artist: post.artist,
                    drawn: post.drawn ? functions.formatDate(new Date(post.drawn), true) : null,
                    link: post.link,
                    commentary: post.commentary,
                    translatedCommentary: post.translatedCommentary,
                    bookmarks: post.bookmarks,
                    mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : null
                }
            }
    
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
                    const animated = functions.isAnimatedWebp(current)
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
                    dimensions = await sharp(buffer).metadata()
                } else {
                    hash = await phash(current).then((hash: string) => functions.binaryToHex(hash))
                    dimensions = await sharp(current).metadata()
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
                title: source.title ? source.title : null,
                translatedTitle: source.translatedTitle ? source.translatedTitle : null,
                artist: source.artist ? source.artist : null,
                drawn: source.date ? source.date : null,
                link: source.link ? source.link : null,
                commentary: source.commentary ? source.commentary : null,
                translatedCommentary: source.translatedCommentary ? source.translatedCommentary : null,
                bookmarks: source.bookmarks ? source.bookmarks : null,
                mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
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
            const historyID = req.query.historyID as string
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (historyID) {
                const result = await sql.history.postHistoryID(postID, historyID)
                if (req.session.captchaNeeded) delete result.tags
                res.status(200).json(result)
            } else {
                const result = await sql.history.postHistory(postID, offset)
                if (req.session.captchaNeeded) functions.stripTags(result)
                res.status(200).json(result)
            }
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
            if (!permissions.isMod(req.session)) return res.status(403).end()
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
            await sql.history.updateSearchHistory(req.session.username, postID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/compress", csrfProtection, postLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {postID, quality, format, maxDimension, maxUpscaledDimension, original, upscaled} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            let post = await sql.post.unverifiedPost(Number(postID))
            if (!post) return res.status(400).send("Invalid postID")

            if (post.type === "video" || post.type === "audio" || post.type === "model") return res.status(400).send("Bad request")
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
                    const file = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
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
            const {postID, upscaler, scaleFactor, compressJPG} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            let post = await sql.post.unverifiedPost(Number(postID))
            if (!post) return res.status(400).send("Invalid postID")

            if (post.type === "video" || post.type === "audio" || post.type === "model") return res.status(400).send("Bad request")

            for (let i = 0; i < post.images.length; i++) {
                const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
                const newFile = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
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