import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import {NoteSaveParams, NoteEditParams, NoteApproveParams, NoteHistory, NoteHistoryParams, NoteHistoryDeleteParams, Note, BulkTag} from "../types/Types"
import {insertImages, updatePost, insertTags, updateTagGroups} from "./UploadRoutes"

const noteLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const noteEquality = (a: Note, b: Note) => {
    return (
        a.transcript === b.transcript &&
        a.translation === b.translation &&
        a.x === b.x &&
        a.y === b.y &&
        a.width === b.width &&
        a.height === b.height &&
        a.rotation === b.rotation &&
        a.imageWidth === b.imageWidth &&
        a.imageHeight === b.imageHeight &&
        a.overlay === b.overlay &&
        a.fontSize === b.fontSize &&
        a.backgroundColor === b.backgroundColor &&
        a.textColor === b.textColor &&
        a.fontFamily === b.fontFamily &&
        a.backgroundAlpha === b.backgroundAlpha &&
        a.bold === b.bold &&
        a.italic === b.italic &&
        a.strokeColor === b.strokeColor &&
        a.strokeWidth === b.strokeWidth &&
        a.breakWord === b.breakWord &&
        a.borderRadius === b.borderRadius &&
        a.character === b.character &&
        a.characterTag === b.characterTag
    )
}

const insertNotes = async (oldNotes: Note[], newNotes: Note[], data: {postID: string, order: number, 
    username: string, unverified?: boolean, originalID?: string, addedEntries?: string[], 
    removedEntries?: string[], reason?: string}) => {
    const {postID, order, username, unverified, originalID, addedEntries, removedEntries, reason} = data
    if (!oldNotes?.[0]) {
        if (!newNotes.length) return
        // If there are no oldNotes, insert every note
        for (const item of newNotes) {
            if (unverified) {
                await sql.note.insertUnverifiedNote(postID, originalID || null, username, order, item.transcript, item.translation,
                item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                item.strokeColor, item.strokeWidth, item.breakWord, item.rotation, item.borderRadius, item.character, item.characterTag || null,
                addedEntries, removedEntries, reason)
            } else {
                await sql.note.insertNote(postID, username, order, item.transcript, item.translation,
                item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                item.strokeColor, item.strokeWidth, item.breakWord, item.rotation, item.borderRadius, item.character, item.characterTag || null)
            }
        }
    } else {
        const matchIndexes = new Set<number>()
        for (const note of oldNotes) {
            const matchIndex = newNotes.findIndex((n) => noteEquality(note, n))

            if (matchIndex !== -1) {
                // Update oldNotes that are already in newNotes
                const match = newNotes[matchIndex]
                matchIndexes.add(matchIndex)

                if (unverified) {
                    await sql.note.resaveUnverifiedNote(note.noteID, match.transcript, match.translation, match.x,
                    match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay,
                    match.fontSize, match.backgroundColor, match.textColor, match.fontFamily, match.backgroundAlpha, match.bold, match.italic,
                    match.strokeColor, match.strokeWidth, match.breakWord, match.rotation, match.borderRadius, match.character, match.characterTag || null, 
                    reason)
                } else {
                    await sql.note.resaveNote(note.noteID, username, match.transcript, match.translation, match.x,
                    match.y, match.width, match.height, match.imageWidth, match.imageHeight, match.imageHash, match.overlay,
                    match.fontSize, match.backgroundColor, match.textColor, match.fontFamily, match.backgroundAlpha, match.bold, match.italic,
                    match.strokeColor, match.strokeWidth, match.breakWord, match.rotation, match.borderRadius, match.character, match.characterTag || null)
                }
            } else {
                // Delete oldNotes not in newNotes
                if (unverified) {
                    await sql.note.deleteUnverifiedNote(note.noteID)
                } else {
                    await sql.note.deleteNote(note.noteID)
                }
            }
        }

        for (let i = 0; i < newNotes.length; i++) {
            if (matchIndexes.has(i)) continue

            // Insert newNotes not in oldNotes
            const item = newNotes[i]
            if (unverified) {
                await sql.note.insertUnverifiedNote(postID, originalID || null, username, order, item.transcript, item.translation,
                item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                item.strokeColor, item.strokeWidth, item.breakWord, item.rotation, item.borderRadius, item.character, item.characterTag || null,
                addedEntries, removedEntries, reason)
            } else {
                await sql.note.insertNote(postID, username, order, item.transcript, item.translation,
                item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
                item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
                item.strokeColor, item.strokeWidth, item.breakWord, item.rotation, item.borderRadius, item.character, item.characterTag || null)
            }
        }
    }
}

const NoteRoutes = (app: Express) => {
    app.post("/api/note/save", csrfProtection, noteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, reason} = req.body as NoteSaveParams
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return void res.status(400).send("Invalid order")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isContributor(req.session)) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            if (!data) return void res.status(400).send("Bad data")

            const post = await sql.post.post(postID)
            if (!post) return void res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return void res.status(403).send("Unauthorized")

            const notes = await sql.note.notes(postID, order)
            await insertNotes(notes, data, {postID, order, username: req.session.username})
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
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return void res.status(400).send("Invalid order")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            if (!data) return void res.status(400).send("Bad data")

            const post = await sql.post.post(postID)
            if (!post) return void res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return void res.status(403).send("Unauthorized")

            const notes = await sql.note.notes(postID, order)
            await insertNotes(notes, data, {postID, order, username: req.session.username})

            if (permissions.isMod(req.session)) {
                if (silent) return void res.status(200).send("Success")
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
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
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
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return void res.status(400).send("Invalid order")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!data) return void res.status(400).send("Bad data")

            const originalPostID = postID as string
            const post = await sql.post.post(originalPostID)
            if (!post) return void res.status(400).send("Invalid post ID")
            if (post.locked && !permissions.isMod(req.session)) return void res.status(403).send("Unauthorized")
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

            await updateTagGroups(postID, {unverified: true, oldTagGroups: [], newTagGroups: post.tagGroups})

            const notes = await sql.note.notes(postID, order)
            let {addedEntries, removedEntries} = functions.parseNoteChanges(notes, data)
            for (const item of data) {
                await sql.note.insertUnverifiedNote(postID, originalPostID, req.session.username, order, item.transcript, item.translation, item.x, 
                item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay, item.fontSize, item.backgroundColor,
                item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic, item.strokeColor, item.strokeWidth, item.breakWord,
                item.rotation, item.borderRadius, item.character, item.characterTag || null, addedEntries, removedEntries, reason)
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
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const post = await sql.post.unverifiedPost(postID)
            if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return void res.status(403).end()
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
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return void res.status(400).send("Invalid order")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!data) return void res.status(400).send("Bad data")

            const post = await sql.post.unverifiedPost(postID)
            if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return void res.status(403).end()

            const notes = await sql.note.unverifiedNotes(postID, order)
            let {addedEntries, removedEntries} = functions.parseNoteChanges(notes, data)

            let originalID = "" as any
            for (const note of notes) {
                if (note.originalID) {
                    originalID = note.originalID
                    break
                }
            }

            await insertNotes(notes, data, {unverified: true, postID, order, originalID, addedEntries, 
            removedEntries, reason, username: req.session.username})
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
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const result = await sql.note.allUnverifiedNotes(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return void res.status(400).send("Bad request")
        }
    })

    app.post("/api/note/approve", csrfProtection, noteLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {postID, originalID, order, username, data} = req.body as NoteApproveParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const unverified = await sql.post.unverifiedPost(postID)
            if (!unverified) return void res.status(400).send("Bad postID")
            await sql.post.deleteUnverifiedPost(postID)
            for (let i = 0; i < unverified.images.length; i++) {
                const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
                const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
                await serverFunctions.deleteUnverifiedFile(file)
                await serverFunctions.deleteUnverifiedFile(upscaledFile)
            }

            const notes = await sql.note.notes(originalID, order)
            await insertNotes(notes, data, {postID, order, username})

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
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const unverified = await sql.post.unverifiedPost(postID)
            if (!unverified) return void res.status(400).send("Bad postID")
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
            if (!req.session.username) return void res.status(403).send("Unauthorized")
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
            if (Number.isNaN(Number(historyID))) return void res.status(400).send("Invalid historyID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return void res.status(403).end()
            const noteHistory = await sql.history.noteHistory(postID, order)
            if (noteHistory[0]?.historyID === historyID) {
                return void res.status(400).send("Bad historyID")
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