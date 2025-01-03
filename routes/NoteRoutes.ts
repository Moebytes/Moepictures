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
import {NoteSaveParams, NoteEditParams, NoteApproveParams, NoteHistory, NoteHistoryParams, NoteHistoryDeleteParams, Note, BulkTag} from "../types/Types"
import {insertImages, updatePost, insertTags} from "./UploadRoutes"

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
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                    item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                    item.strokeColor, item.strokeWidth, item.breakWord)
                }
            } else {
                let noMatch = [] as Note[]
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteNote(note.noteID)
                    } else {
                        const match = data.find((item) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.resaveNote(note.noteID, req.session.username, match.transcript, match.translation, match.x,
                            match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay,
                            match.fontSize, match.backgroundColor, match.textColor, match.fontFamily, match.backgroundAlpha, match.bold, match.italic,
                            match.strokeColor, match.strokeWidth, match.breakWord)
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
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                        item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                        item.strokeColor, item.strokeWidth, item.breakWord)
                    }
                }
            }
            const {addedEntries, removedEntries, styleChanged} = functions.parseNoteChanges(notes, data)
            await sql.history.insertNoteHistory({postID, order, updater: req.session.username, notes: JSON.stringify(data), styleChanged, addedEntries, removedEntries, reason})
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
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                    item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                    item.strokeColor, item.strokeWidth, item.breakWord)
                }
            } else {
                let noMatch = [] as Note[]
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteNote(note.noteID)
                    } else {
                        const match = data.find((item) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.resaveNote(note.noteID, req.session.username, match.transcript, match.translation, match.x,
                            match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay,
                            match.fontSize, match.backgroundColor, match.textColor, match.fontFamily, match.backgroundAlpha, match.bold, match.italic,
                            match.strokeColor, match.strokeWidth, match.breakWord)
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
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                        item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                        item.strokeColor, item.strokeWidth, item.breakWord)
                    }
                }
            }

            if (permissions.isMod(req.session)) {
                if (silent) return res.status(200).send("Success")
            }
        
            const {addedEntries, removedEntries, styleChanged} = functions.parseNoteChanges(notes, data)
            await sql.history.insertNoteHistory({postID, order, updater: req.session.username, notes: JSON.stringify(data), styleChanged, addedEntries, removedEntries, reason: ""})
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

            const originalPostID = postID as string
            const post = await sql.post.post(originalPostID)
            if (!post) return res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            postID = await sql.post.insertUnverifiedPost()

            const {artists, characters, series, tags: newTags} = await serverFunctions.tagCategories(post.tags)
            let tags = newTags.map((t) => t.tag)
            let type = post.type
            let rating = post.rating
            let style = post.style
            let source = {
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

            if (post.parentID) {
                await sql.post.insertUnverifiedChild(postID, post.parentID)
            }

            let {hasOriginal, hasUpscaled} = await insertImages(postID, {unverified: true, images: post.images, upscaledImages: post.images,
            characters, imgChanged: true, type, rating, source})

            await updatePost(postID, {unverified: true, isNote: true, artists, hasOriginal, hasUpscaled, rating, type, style,
            source, originalID: originalPostID, reason, parentID: post.parentID, updater: req.session.username, uploader: post.uploader,
            uploadDate: post.uploadDate})

            await insertTags(postID, {unverified: true, tags, artists, characters, series, newTags, username: req.session.username})

            const notes = await sql.note.notes(postID, order)
            let {addedEntries, removedEntries} = functions.parseNoteChanges(notes, data)
            for (const item of data) {
                await sql.note.insertUnverifiedNote(postID, originalPostID, req.session.username, order, item.transcript, item.translation, item.x, 
                item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay, item.fontSize, item.backgroundColor,
                item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic, item.strokeColor, item.strokeWidth, item.breakWord,
                addedEntries, removedEntries, reason)
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
            const post = await sql.post.unverifiedPost(postID)
            if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
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
            if (!data) return res.status(400).send("Bad data")

            const post = await sql.post.unverifiedPost(postID)
            if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()

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
                    await sql.note.insertUnverifiedNote(postID, originalID || null, req.session.username, order, item.transcript, item.translation,
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay, item.fontSize,
                    item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                    item.strokeColor, item.strokeWidth, item.breakWord, addedEntries, removedEntries, reason)
                }
            } else {
                let noMatch = [] as Note[]
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteUnverifiedNote(note.noteID)
                    } else {
                        const match = data.find((item) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.resaveUnverifiedNote(note.noteID, match.transcript, match.translation, match.x, match.y, 
                            match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay, match.fontSize,
                            match.backgroundColor, match.textColor, match.fontFamily, match.backgroundAlpha, match.bold, match.italic,
                            match.strokeColor, match.strokeWidth, match.breakWord, reason)
                        } else {
                            noMatch.push(note)
                        }
                    }
                }
                for (const item of noMatch) {
                    if (item.noteID) {
                        await sql.note.deleteUnverifiedNote(item.noteID)
                    } else {
                        await sql.note.insertUnverifiedNote(postID, originalID || null, req.session.username, order, item.transcript, item.translation,
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay, item.fontSize,
                        item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                        item.strokeColor, item.strokeWidth, item.breakWord, addedEntries, removedEntries, reason)
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
                    item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                    item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                    item.strokeColor, item.strokeWidth, item.breakWord)
                }
            } else {
                let noMatch = [] as Note[]
                for (const note of notes) {
                    if (!data.length) {
                        await sql.note.deleteNote(note.noteID)
                    } else {
                        const match = data.find((item) => item.noteID === note.noteID)
                        if (match) {
                            await sql.note.resaveNote(note.noteID, req.session.username, match.transcript, match.translation, match.x,
                            match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay,
                            match.fontSize, match.backgroundColor, match.textColor, match.fontFamily, match.backgroundAlpha, match.bold, match.italic,
                            match.strokeColor, match.strokeWidth, match.breakWord)
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
                        item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                        item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                        item.strokeColor, item.strokeWidth, item.breakWord)
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
                if (history) result = [history]
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