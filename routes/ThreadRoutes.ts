import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"

const threadLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const threadUpdateLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const ThreadRoutes = (app: Express) => {
    app.post("/api/thread/create", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {title, content, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!title || !content) return res.status(400).send("Bad title or content")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            const threadID = await sql.thread.insertThread(req.session.username, title, content)
            res.status(200).send(threadID)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/thread/edit", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, title, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!title || !content) return res.status(400).send("Bad title or content")
            const thread = await sql.thread.thread(Number(threadID))
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to edit")
            }
            await sql.thread.updateThread(Number(threadID), "title", title)
            await sql.thread.updateThread(Number(threadID), "content", content)
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
            const result = await sql.thread.thread(Number(threadID))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/thread/delete", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const threadID = req.query.threadID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!threadID) return res.status(400).send("Bad threadID")
            const thread = await sql.thread.thread(Number(threadID))
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to delete")
            }
            await sql.thread.deleteThread(Number(threadID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/sticky", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad threadID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const thread = await sql.thread.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            await sql.thread.updateThread(thread.threadID, "sticky", !thread.sticky)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/lock", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad threadID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const thread = await sql.thread.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            await sql.thread.updateThread(thread.threadID, "locked", !thread.locked)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/reply", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!threadID || !content) return res.status(400).send("Bad threadID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const thread = await sql.thread.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.locked) return res.status(400).send("Thread is locked")
            await sql.thread.insertReply(Number(threadID), req.session.username, content)
            await sql.thread.updateThread(Number(threadID), "updater", req.session.username)
            await sql.thread.updateThread(Number(threadID), "updatedDate", new Date().toISOString())
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
            const result = await sql.thread.replies(Number(threadID), offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/reply", threadLimiter, async (req: Request, res: Response) => {
        try {
            const replyID = req.query.replyID
            if (!replyID) return res.status(400).send("Bad replyID")
            const result = await sql.thread.reply(Number(replyID))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/reply/edit", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!replyID || !content) return res.status(400).send("Bad replyID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const reply = await sql.thread.reply(replyID)
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to edit")
            }
            await sql.thread.updateReply(Number(replyID), "content", content)
            await sql.thread.updateReply(Number(replyID), "updatedDate", new Date().toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/reply/delete", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const threadID = req.query.threadID
            const replyID = req.query.replyID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!threadID || !replyID) return res.status(400).send("Bad threadID or replyID")
            const reply = await sql.thread.reply(Number(replyID))
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to delete")
            }
            const replies = await sql.thread.replies(Number(threadID))
            const lastReply = replies[replies.length - 1]
            if (lastReply.replyID === reply.replyID) {
                await sql.thread.deleteReply(Number(replyID))
                const penultReply = replies[replies.length - 2]
                if (penultReply) {
                    await sql.thread.updateThread(Number(threadID), "updater", penultReply.creator)
                    await sql.thread.updateThread(Number(threadID), "updatedDate", penultReply.createDate)
                } else {
                    const thread = await sql.thread.thread(Number(threadID))
                    await sql.thread.updateThread(Number(threadID), "updater", thread.creator)
                    await sql.thread.updateThread(Number(threadID), "updatedDate", thread.createDate)
                }
            } else {
                await sql.thread.deleteReply(Number(replyID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/report", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, reason} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!threadID || !reason) return res.status(400).send("Bad threadID or reason")
            const thread = await sql.thread.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            await sql.report.insertThreadReport(req.session.username, Number(threadID), reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/reply/report", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, reason} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!replyID || !reason) return res.status(400).send("Bad replyID or reason")
            const reply = await sql.thread.reply(replyID)
            if (!reply) return res.status(400).send("Invalid replyID")
            await sql.report.insertReplyReport(req.session.username, Number(replyID), reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/report/fulfill", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {reportID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!reportID) return res.status(400).send("Bad reportID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.report.deleteThreadReport(Number(reportID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/reply/report/fulfill", threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {reportID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!reportID) return res.status(400).send("Bad threadID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.report.deleteReplyReport(Number(reportID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default ThreadRoutes