import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import enLocale from "../assets/locales/en.json"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"

const threadLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const threadUpdateLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const pushMentionNotification = async (content: string, threadID: number, replyID?: number) => {
    try {
        const notified = new Set<string>()
        const thread = await sql.thread.thread(threadID)
        const pieces = functions.parsePieces(content)
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.includes(">")) {
                const matchPart = piece.match(/(>>>(\[\d+\])?)(.*?)(?=$|>)/gm)?.[0] ?? ""
                const userPart = matchPart.replace(/(>>>(\[\d+\])?\s*)/, "")
                let username = userPart?.split(/ +/g)?.[0]?.toLowerCase() || ""
                const user = await sql.user.user(username)
                if (user) {
                    if (notified.has(username)) return
                    notified.add(username)
                    if (replyID) {
                        let message = `You were quoted in the thread "${thread.title}".\n\n${functions.getDomain()}/thread/${threadID}?reply=${replyID}`
                        await serverFunctions.systemMessage(username, `You were quoted in the thread ${thread.title}`, message)
                    } else {
                        let message = `You were quoted in the thread "${thread.title}".\n\n${functions.getDomain()}/thread/${threadID}`
                        await serverFunctions.systemMessage(username, `You were quoted in the thread ${thread.title}`, message)
                    }
                }
            }
        }
        const parts = content.split(/(@\w+)/g)
        parts.forEach(async (part, index) => {
            if (part.startsWith("@")) {
                const username = part.slice(1).toLowerCase()
                const user = await sql.user.user(username)
                if (user) {
                    if (notified.has(username)) return
                    notified.add(username)
                    if (replyID) {
                        let message = `You were mentioned in the thread "${thread.title}".\n\n${functions.getDomain()}/thread/${threadID}?reply=${replyID}`
                        await serverFunctions.systemMessage(username, `You were mentioned in the thread ${thread.title}`, message)
                    } else {
                        let message = `You were mentioned in the thread "${thread.title}".\n\n${functions.getDomain()}/thread/${threadID}`
                        await serverFunctions.systemMessage(username, `You were mentioned in the thread ${thread.title}`, message)
                    }
                }
            }
        })
    } catch (e) {
        console.log(e)
    }
}

const ThreadRoutes = (app: Express) => {
    app.post("/api/thread/create", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {title, content, r18} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!title || !content) return res.status(400).send("Bad title or content")
            const badTitle = functions.validateTitle(title, enLocale)
            if (badTitle) return res.status(400).send("Bad title")
            const badContent = functions.validateThread(content, enLocale)
            if (badContent) return res.status(400).send("Bad content")
            const threadID = await sql.thread.insertThread(req.session.username, title, content, r18)
            pushMentionNotification(content, threadID)
            await sql.thread.bulkUpdateReads(threadID, false, req.session.username)
            const postCount = await sql.thread.postCount(req.session.username)
            await sql.user.updateUser(req.session.username, "postCount", postCount)
            res.status(200).send(threadID)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/thread/edit", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, title, content, r18} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!title || !content) return res.status(400).send("Bad title or content")
            const badTitle = functions.validateTitle(title, enLocale)
            if (badTitle) return res.status(400).send("Bad title")
            const badContent = functions.validateThread(content, enLocale)
            if (badContent) return res.status(400).send("Bad content")
            const thread = await sql.thread.thread(Number(threadID))
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to edit")
            }
            await sql.thread.updateThread(Number(threadID), "title", title)
            await sql.thread.updateThread(Number(threadID), "content", content)
            await sql.thread.updateThread(Number(threadID), "r18", r18)
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
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/thread/delete", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const threadID = req.query.threadID
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad threadID")
            const thread = await sql.thread.thread(Number(threadID))
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to delete")
            }
            await sql.thread.deleteThread(Number(threadID))
            const postCount = await sql.thread.postCount(thread.creator)
            await sql.user.updateUser(thread.creator, "postCount", postCount)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/sticky", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad threadID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const thread = await sql.thread.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            await sql.thread.updateThread(thread.threadID, "sticky", !thread.sticky)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/lock", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad threadID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const thread = await sql.thread.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            await sql.thread.updateThread(thread.threadID, "locked", !thread.locked)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/reply", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, content, r18} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!threadID || !content) return res.status(400).send("Bad threadID or content")
            const badReply = functions.validateReply(content, enLocale)
            if (badReply) return res.status(400).send("Bad reply")
            const thread = await sql.thread.thread(threadID)
            if (!thread) return res.status(400).send("Invalid threadID")
            if (thread.locked) return res.status(400).send("Thread is locked")
            const replyID = await sql.thread.insertReply(Number(threadID), req.session.username, content, r18)
            await sql.thread.updateThread(Number(threadID), "updater", req.session.username)
            await sql.thread.updateThread(Number(threadID), "updatedDate", new Date().toISOString())
            pushMentionNotification(content, threadID, replyID)
            await sql.thread.bulkUpdateReads(threadID, false, req.session.username)
            const postCount = await sql.thread.postCount(req.session.username)
            await sql.user.updateUser(req.session.username, "postCount", postCount)
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
            let result = await sql.thread.replies(Number(threadID), offset)
            if (!req.session.showR18) {
                result = result.filter((r: any) => !r.r18)
            }
            serverFunctions.sendEncrypted(result, req, res)
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
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/reply/edit", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, content, r18} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!replyID || !content) return res.status(400).send("Bad replyID or content")
            const badReply = functions.validateReply(content, enLocale)
            if (badReply) return res.status(400).send("Bad reply")
            const reply = await sql.thread.reply(replyID)
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to edit")
            }
            await sql.thread.updateReply(Number(replyID), "content", content)
            await sql.thread.updateReply(Number(replyID), "updatedDate", new Date().toISOString())
            await sql.thread.updateReply(Number(replyID), "r18", r18)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/reply/delete", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const threadID = req.query.threadID
            const replyID = req.query.replyID
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!threadID || !replyID) return res.status(400).send("Bad threadID or replyID")
            const reply = await sql.thread.reply(Number(replyID))
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to delete")
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
            const postCount = await sql.thread.postCount(reply.creator)
            await sql.user.updateUser(reply.creator, "postCount", postCount)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/thread/report", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, reason} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
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

    app.post("/api/reply/report", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, reason} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
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

    app.post("/api/thread/report/fulfill", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {reportID, reporter, username, id, accepted} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!reportID) return res.status(400).send("Bad reportID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            await sql.report.deleteThreadReport(Number(reportID))
            if (accepted) {
                let message = `Thread report on ${functions.getDomain()}/thread/${id} was accepted. The thread posted by ${username} was removed.`
                await serverFunctions.systemMessage(reporter, "Report: Thread report has been accepted", message)
                
                let message2 = `The thread you posted on ${functions.getDomain()}/thread/${id} was removed for breaking the rules.`
                await serverFunctions.systemMessage(username, "Notice: Thread has been removed", message2)
            } else {
                let message = `Thread report on ${functions.getDomain()}/thread/${id} has been dismissed. The thread posted by ${username} is ok.`
                // await serverFunctions.systemMessage(reporter, "Report: Thread report has been dismissed", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/reply/report/fulfill", csrfProtection, threadUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {reportID, reporter, username, id, accepted} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!reportID) return res.status(400).send("Bad threadID")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            await sql.report.deleteReplyReport(Number(reportID))
            if (accepted) {
                let message = `Reply report on ${functions.getDomain()}/thread/${id} was accepted. The reply posted by ${username} was removed.`
                await serverFunctions.systemMessage(reporter, "Report: Reply report has been accepted", message)
                
                let message2 = `The reply you posted on ${functions.getDomain()}/thread/${id} was removed for breaking the rules.`
                await serverFunctions.systemMessage(username, "Notice: Reply has been removed", message2)
            } else {
                let message = `Reply report on ${functions.getDomain()}/thread/${id} has been dismissed. The reply posted by ${username} is ok.`
                // await serverFunctions.systemMessage(reporter, "Report: Reply report has been dismissed", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/thread/read", csrfProtection, threadLimiter, async (req: Request, res: Response) => {
        try {
            const {threadID, forceRead} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!threadID) return res.status(400).send("Bad thread ID")
            const threadRead = await sql.thread.getRead(threadID, req.session.username)
            if (!threadRead?.read || forceRead) {
                await sql.thread.updateRead(threadID, req.session.username, true)
            } else {
                await sql.thread.updateRead(threadID, req.session.username, false)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default ThreadRoutes