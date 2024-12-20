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
            const {postID, order, data, reason} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!data) return res.status(400).send("Bad data")

            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")

            const note = await sql.note.note(postID, order)
            if (!note) {
                if (JSON.stringify(data) === "[]") return res.status(200).send("Success")
                await sql.note.insertNote(postID, req.session.username, order, JSON.stringify(data))
            } else {
                if (JSON.stringify(data) === "[]") {
                    await sql.note.deleteNote(note.noteID)
                } else {
                    await sql.note.updateNote(note.noteID, req.session.username, JSON.stringify(data))
                }
            }
            const {addedEntries, removedEntries} = functions.parseNoteDataChanges(note?.data, data)
            await sql.history.insertNoteHistory({postID, order, updater: req.session.username, data: JSON.stringify(data), addedEntries, removedEntries, reason})
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/note/save", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, silent} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!data) return res.status(400).send("Bad data")

            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")

            const note = await sql.note.note(postID, order)
            if (!note) {
                if (JSON.stringify(data) === "[]") return res.status(200).send("Success")
                await sql.note.insertNote(postID, req.session.username, order, JSON.stringify(data))
            } else {
                if (JSON.stringify(data) === "[]") {
                    await sql.note.deleteNote(note.noteID)
                } else {
                    await sql.note.updateNote(note.noteID, req.session.username, JSON.stringify(data))
                }
            }

            if (permissions.isMod(req.session)) {
                if (silent) return res.status(200).send("Success")
            }
        
            const {addedEntries, removedEntries} = functions.parseNoteDataChanges(note?.data, data)
            await sql.history.insertNoteHistory({postID, order, updater: req.session.username, data: JSON.stringify(data), addedEntries, removedEntries, reason: ""})
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/notes", noteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const notes = await sql.note.notes(Number(postID))
            serverFunctions.sendEncrypted(notes, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/note/save/request", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            let {postID, order, data, reason} = req.body
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
                link: post.link,
                commentary: post.commentary,
                englishCommentary: post.englishCommentary,
                bookmarks: post.bookmarks,
                purchaseLink: post.purchaseLink,
                mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : null
            }

            if (post.parentID) {
                await sql.post.insertUnverifiedChild(postID, Number(post.parentID))
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

                let current = upscaledBuffer ? upscaledBuffer : buffer
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
                    const animated = functions.isAnimatedWebp(current)
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
                let dimensions = null as any
                let hash = ""
                if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
                    const buffer = functions.base64ToBuffer(post.thumbnail)
                    hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
                    dimensions = await sharp(buffer).metadata()
                    if (kind === "live2d") {
                        dimensions.width = post.images[i].width
                        dimensions.height = post.images[i].height
                      }
                } else {
                    hash = await phash(current).then((hash: string) => functions.binaryToHex(hash))
                    dimensions = await sharp(current).metadata()
                }
                await sql.post.insertUnverifiedImage(postID, filename, upscaledFilename, type, order, hash, dimensions.width, dimensions.height, String(current.byteLength))
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
                link: source.link ? source.link : null,
                commentary: source.commentary ? source.commentary : null,
                englishCommentary: source.englishCommentary ? source.englishCommentary : null,
                bookmarks: source.bookmarks ? source.bookmarks : null,
                purchaseLink: source.purchaseLink ? source.purchaseLink : null,
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

            const note = await sql.note.note(postID, order)
            let {addedEntries, removedEntries} = functions.parseNoteDataChanges(note?.data, data)
            await sql.note.insertUnverifiedNote(postID, originalPostID, req.session.username, order, JSON.stringify(data), addedEntries, removedEntries, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/notes/unverified", noteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const notes = await sql.note.unverifiedPostNotes(Number(postID))
            serverFunctions.sendEncrypted(notes, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/note/save/unverified", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, reason} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            if (!data) return res.status(400).send("Bad data")

            const note = await sql.note.unverifiedNote(postID, order)
            if (!note) return res.status(400).send("Bad note")
            await sql.note.updateUnverifiedNote(note.noteID, JSON.stringify(data), reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/note/list/unverified", noteLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.note.unverifiedNotes(offset)
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/note/approve", csrfProtection, noteLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {noteID, username, postID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            noteID = Number(req.body.noteID)
            if (Number.isNaN(noteID)) return res.status(400).send("Bad noteID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const unverified = await sql.post.unverifiedPost(Number(postID))
            if (!unverified) return res.status(400).send("Bad postID")
            await sql.post.deleteUnverifiedPost(Number(postID))
            for (let i = 0; i < unverified.images.length; i++) {
                const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
                const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
                await serverFunctions.deleteUnverifiedFile(file)
                await serverFunctions.deleteUnverifiedFile(upscaledFile)
            }
            const unverifiedNote = await sql.note.unverifiedNoteID(Number(noteID))
            if (!unverifiedNote) return res.status(400).send("Bad noteID")
            await sql.note.insertNote(unverifiedNote.originalID, unverified.updater, unverified.order, JSON.stringify(unverified.data))
            await sql.note.deleteUnverifiedNote(Number(noteID))

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
            let {noteID, username, postID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            noteID = Number(req.body.noteID)
            if (Number.isNaN(noteID)) return res.status(400).send("Bad noteID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const unverified = await sql.post.unverifiedPost(Number(postID))
            if (!unverified) return res.status(400).send("Bad postID")
            await sql.post.deleteUnverifiedPost(Number(postID))
            for (let i = 0; i < unverified.images.length; i++) {
                const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
                const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
                await serverFunctions.deleteUnverifiedFile(file)
                await serverFunctions.deleteUnverifiedFile(upscaledFile)
            }
            const unverifiedNote = await sql.note.unverifiedNoteID(Number(noteID))
            if (!unverifiedNote) return res.status(400).send("Bad noteID")
            await sql.note.deleteUnverifiedNote(Number(noteID))

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
            const postID = req.query.postID as string
            const order = req.query.order as string
            const historyID = req.query.historyID as string
            const username = req.query.username as string
            const query = req.query.query as string
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            let result = null as any
            if (historyID) {
                result = await sql.history.noteHistoryID(postID, historyID)
            } else if (username) {
                result = await sql.history.userNoteHistory(username)
            } else {
                result = await sql.history.noteHistory(postID, order, offset, query)
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/note/history/delete", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            const order = req.query.order as string
            const historyID = req.query.historyID as string
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const noteHistory = await sql.history.noteHistory(postID, order)
            if (noteHistory[0]?.historyID === historyID) {
                return res.status(400).send("Bad historyID")
            } else {
                await sql.history.deleteNoteHistory(Number(historyID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default NoteRoutes