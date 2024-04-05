import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"

const threadLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const ThreadRoutes = (app: Express) => {
    app.post("/api/thread/create", threadLimiter, async (req: Request, res: Response) => {
        try {
            const {title, content, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!title || !content) return res.status(400).send("Bad title or content")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            await sql.insertThread(req.session.username, title, content)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/thread/edit", threadLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, title, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!title || !content) return res.status(400).send("Bad title or content")
            const thread = await sql.thread(Number(threadID))
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to edit")
            }
            await sql.updateThread(Number(threadID), "title", title)
            await sql.updateThread(Number(threadID), "content", content)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/thread", threadLimiter, async (req: Request, res: Response) => {
        try {
            const threadID = req.query.threadID
            if (!threadID) return res.status(400).send("Bad threadID")
            const result = await sql.thread(Number(threadID))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/thread/delete", threadLimiter, async (req: Request, res: Response) => {
        try {
            const threadID = req.query.threadID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!threadID) return res.status(400).send("Bad threadID")
            const thread = await sql.thread(Number(threadID))
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to delete")
            }
            await sql.deleteThread(Number(threadID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/sticky", threadLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad threadID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const thread = await sql.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            await sql.updateThread(thread.threadID, "sticky", !thread.sticky)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/lock", threadLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad threadID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const thread = await sql.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            await sql.updateThread(thread.threadID, "locked", !thread.locked)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/reply", threadLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!threadID || !content) return res.status(400).send("Bad threadID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const thread = await sql.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.locked) return res.status(400).send("Thread is locked")
            await sql.insertReply(Number(threadID), req.session.username, content)
            await sql.updateThread(Number(threadID), "updater", req.session.username)
            await sql.updateThread(Number(threadID), "updatedDate", new Date().toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/thread/replies", threadLimiter, async (req: Request, res: Response) => {
        try {
            const threadID = req.query.threadID as string
            const offset = req.query.offset as string
            if (!threadID) return res.status(400).send("Bad threadID")
            const result = await sql.replies(Number(threadID), offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/reply/edit", threadLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!replyID || !content) return res.status(400).send("Bad replyID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const reply = await sql.reply(replyID)
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to edit")
            }
            await sql.updateReply(Number(replyID), "content", content)
            await sql.updateReply(Number(replyID), "updatedDate", new Date().toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/reply/delete", threadLimiter, async (req: Request, res: Response) => {
        try {
            const replyID = req.query.replyID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!replyID) return res.status(400).send("Bad replyID")
            const reply = await sql.reply(Number(replyID))
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to delete")
            }
            await sql.deleteReply(Number(replyID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default ThreadRoutes