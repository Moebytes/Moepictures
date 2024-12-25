import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import path from "path"
import sharp from "sharp"
import phash from "sharp-phash"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import {NoteSaveParams, NoteEditParams, NoteApproveParams, NoteHistory, NoteHistoryParams, NoteHistoryDeleteParams} from "../types/Types"

const noteLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const NoteRoutes = (app: Express) => {
    app.post("/api/note/save", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, reason} = req.body as NoteSaveParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!data) return res.status(400).send("Bad data")

            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")

            const notes = await sql.note.notes(postID, order)
            if (!notes?.[0]) {
                if (!data.length) return res.status(200).send("Success")
                for (const item of data) {
                    await sql.note.insertNote(postID, req.session.username, order, item.transcript, item.translation,
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay)
                }
            } else {
                let noMatch = [] as any
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteNote(note.noteID)
                    } else {
                        const match = data.find((item: any) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.updateNote(note.noteID, req.session.username, match.transcript, match.translation, match.x,
                            match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay)
                        } else {
                            noMatch.push(note)
                        }
                    }
                }
                for (const item of noMatch) {
                    if (item.noteID) {
                        await sql.note.deleteNote(item.noteID)
                    } else {
                        await sql.note.insertNote(postID, req.session.username, order, item.transcript, item.translation,
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay)
                    }
                }
            }
            const {addedEntries, removedEntries} = functions.parseNoteChanges(notes, data)
            await sql.history.insertNoteHistory({postID, order, updater: req.session.username, notes: JSON.stringify(data), addedEntries, removedEntries, reason})
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/note/save", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, silent} = req.body as NoteEditParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!data) return res.status(400).send("Bad data")

            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")

            const notes = await sql.note.notes(postID, order)
            if (!notes?.[0]) {
                if (!data.length) return res.status(200).send("Success")
                for (const item of data) {
                    await sql.note.insertNote(postID, req.session.username, order, item.transcript, item.translation,
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay)
                }
            } else {
                let noMatch = [] as any
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteNote(note.noteID)
                    } else {
                        const match = data.find((item: any) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.updateNote(note.noteID, req.session.username, match.transcript, match.translation, match.x,
                            match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay)
                        } else {
                            noMatch.push(note)
                        }
                    }
                }
                for (const item of noMatch) {
                    if (item.noteID) {
                        await sql.note.deleteNote(item.noteID)
                    } else {
                        await sql.note.insertNote(postID, req.session.username, order, item.transcript, item.translation,
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay)
                    }
                }
            }

            if (permissions.isMod(req.session)) {
                if (silent) return res.status(200).send("Success")
            }
        
            const {addedEntries, removedEntries} = functions.parseNoteChanges(notes, data)
            await sql.history.insertNoteHistory({postID, order, updater: req.session.username, notes: JSON.stringify(data), addedEntries, removedEntries, reason: ""})
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/notes", noteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const notes = await sql.note.postNotes(postID)
            serverFunctions.sendEncrypted(notes, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/note/save/request", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            let {postID, order, data, reason} = req.body as NoteSaveParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!data) return res.status(400).send("Bad data")

            const originalPostID = postID as any
            const post = await sql.post.post(originalPostID)
            if (!post) return res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            postID = await sql.post.insertUnverifiedPost()

            const categories = await serverFunctions.tagCategories(post.tags)
            let artists = categories.artists.map((a: any) => a.tag)
            let characters = categories.characters.map((c: any) => c.tag)
            let series = categories.series.map((s: any) => s.tag)
            let tags = categories.tags.map((t: any) => t.tag)
            let type = post.type
            let rating = post.rating
            let style = post.style
            let source = {
                title: post.title,
                englishTitle: post.englishTitle,
                artist: post.artist,
                posted: post.posted ? functions.formatDate(new Date(post.posted), true) : null as any,
                source: post.source,
                commentary: post.commentary,
                englishCommentary: post.englishCommentary,
                bookmarks: post.bookmarks,
                buyLink: post.buyLink,
                mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : null
            }

            if (post.parentID) {
                await sql.post.insertUnverifiedChild(postID, post.parentID)
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
                    characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
                    `${postID}.${ext}`
                }
                if (post.images[i].upscaledFilename) {
                    let upscaledExt = path.extname(post.images[i].upscaledFilename).replace(".", "")
                    upscaledFilename = post.title ? `${post.title}.${upscaledExt}` : 
                    characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${upscaledExt}` :
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
                isNote: true,
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

            const notes = await sql.note.notes(postID, order)
            let {addedEntries, removedEntries} = functions.parseNoteChanges(notes, data)
            for (const item of data) {
                await sql.note.insertUnverifiedNote(postID, originalPostID, req.session.username, order, item.transcript, item.translation, item.x, 
                item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay, addedEntries, removedEntries, reason)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/notes/unverified", noteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const notes = await sql.note.unverifiedPostNotes(postID)
            serverFunctions.sendEncrypted(notes, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/note/save/unverified", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, reason} = req.body as NoteSaveParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            if (!data) return res.status(400).send("Bad data")

            const notes = await sql.note.unverifiedNotes(postID, order)
            let {addedEntries, removedEntries} = functions.parseNoteChanges(notes, data)

            let originalID = "" as any
            for (const note of notes) {
                if (note.originalID) {
                    originalID = note.originalID
                    break
                }
            }

            if (!notes?.[0]) {
                if (!data.length) return res.status(200).send("Success")
                for (const item of data) {
                    await sql.note.insertUnverifiedNote(postID, originalID, req.session.username, order, item.transcript, item.translation,
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay, addedEntries, 
                    removedEntries, reason)
                }
            } else {
                let noMatch = [] as any
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteUnverifiedNote(note.noteID)
                    } else {
                        const match = data.find((item: any) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.updateUnverifiedNote(note.noteID, match.transcript, match.translation, match.x, match.y, 
                            match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay, reason)
                        } else {
                            noMatch.push(note)
                        }
                    }
                }
                for (const item of noMatch) {
                    if (item.noteID) {
                        await sql.note.deleteUnverifiedNote(item.noteID)
                    } else {
                        await sql.note.insertUnverifiedNote(postID, originalID, req.session.username, order, item.transcript, item.translation,
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay, addedEntries, 
                        removedEntries, reason)
                    }
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/note/list/unverified", noteLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.note.allUnverifiedNotes(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/note/approve", csrfProtection, noteLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {postID, originalID, order, username, data} = req.body as NoteApproveParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const unverified = await sql.post.unverifiedPost(postID)
            if (!unverified) return res.status(400).send("Bad postID")
            await sql.post.deleteUnverifiedPost(postID)
            for (let i = 0; i < unverified.images.length; i++) {
                const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
                const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
                await serverFunctions.deleteUnverifiedFile(file)
                await serverFunctions.deleteUnverifiedFile(upscaledFile)
            }

            const notes = await sql.note.notes(originalID, order)
            if (!notes?.[0]) {
                if (!data.length) return res.status(200).send("Success")
                for (const item of data) {
                    await sql.note.insertNote(postID, req.session.username, order, item.transcript, item.translation,
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay)
                }
            } else {
                let noMatch = [] as any
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteNote(note.noteID)
                    } else {
                        const match = data.find((item: any) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.updateNote(note.noteID, req.session.username, match.transcript, match.translation, match.x,
                            match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay)
                        } else {
                            noMatch.push(note)
                        }
                    }
                }
                for (const item of noMatch) {
                    if (item.noteID) {
                        await sql.note.deleteNote(item.noteID)
                    } else {
                        await sql.note.insertNote(postID, req.session.username, order, item.transcript, item.translation,
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay)
                    }
                }
            }

            const unverifiedNotes = await sql.note.unverifiedNotes(postID, order)
            for (const unverifiedNote of unverifiedNotes) {
                await sql.note.deleteUnverifiedNote(unverifiedNote.noteID)
            }

            let message = `Notes you added on ${functions.getDomain()}/post/${postID} have been approved. Thanks for the contribution!`
            await serverFunctions.systemMessage(username, "Notice: Notes have been approved", message)

            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/note/reject", csrfProtection, noteLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {postID, originalID, order, username, data} = req.body as NoteApproveParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const unverified = await sql.post.unverifiedPost(postID)
            if (!unverified) return res.status(400).send("Bad postID")
            await sql.post.deleteUnverifiedPost(postID)
            for (let i = 0; i < unverified.images.length; i++) {
                const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
                const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
                await serverFunctions.deleteUnverifiedFile(file)
                await serverFunctions.deleteUnverifiedFile(upscaledFile)
            }
            const unverifiedNotes = await sql.note.unverifiedNotes(postID, order)
            for (const unverifiedNote of unverifiedNotes) {
                await sql.note.deleteUnverifiedNote(unverifiedNote.noteID)
            }

            let message = `Notes you added on ${functions.getDomain()}/post/${postID} have been rejected. They might be incorrect.`
            // await serverFunctions.systemMessage(username, "Notice: Notes have been rejected", message)
            
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/note/history", noteLimiter, async (req: Request, res: Response) => {
        try {
            let {postID, order, historyID, username, query, offset} = req.query as unknown as NoteHistoryParams
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            let result = [] as NoteHistory[]
            if (historyID) {
                const history = await sql.history.noteHistoryID(postID, historyID)
                result = [history]
            } else if (username) {
                result = await sql.history.userNoteHistory(username)
            } else {
                result = await sql.history.noteHistory(postID, order, Number(offset), query)
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/note/history/delete", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, historyID} = req.query as unknown as NoteHistoryDeleteParams
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const noteHistory = await sql.history.noteHistory(postID, order)
            if (noteHistory[0]?.historyID === historyID) {
                return res.status(400).send("Bad historyID")
            } else {
                await sql.history.deleteNoteHistory(historyID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default NoteRoutes