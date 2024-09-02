import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"

const messageLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const messageUpdateLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

let connections = [] as {username: string, response: Response}[]

const pushNotification = (username: string) => {
    const connection = connections.find((c) => c.username === username)
    if (!connection) return
    connection.response.write(`event: message\n`)
    connection.response.write(`data: new message!\n\n`)
}

const MessageRoutes = (app: Express) => {
    app.post("/api/message/create", messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {title, content, recipient} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!title || !content) return res.status(400).send("Bad title or content")
            if (req.session.username === recipient) return res.status(400).send("Cannot send message to yourself")
            const messageID = await sql.message.insertMessage(req.session.username, recipient, title, content)
            pushNotification(recipient)
            res.status(200).send(messageID)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/message/edit", messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, title, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!title || !content) return res.status(400).send("Bad title or content")
            const message = await sql.message.message(Number(messageID))
            if (!message) return res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to edit")
            }
            await sql.message.updateMessage(Number(messageID), "title", title)
            await sql.message.updateMessage(Number(messageID), "content", content)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/message", messageLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID
            if (!messageID) return res.status(400).send("Bad messageID")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const message = await sql.message.message(Number(messageID))
            if (req.session.username !== message.creator && req.session.username !== message.recipient) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(401).send("No permission to view")
            }
            res.status(200).json(message)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/message/delete", messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!messageID) return res.status(400).send("Bad messageID")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const message = await sql.message.message(Number(messageID))
            if (!message) return res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to delete")
            }
            await sql.message.deleteMessage(Number(messageID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/reply", messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!messageID || !content) return res.status(400).send("Bad messageID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const message = await sql.message.message(messageID)
            if (!message) return res.status(400).send("Invalid messageID")
            if (req.session.username !== message.creator && req.session.username !== message.recipient) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(401).send("No permission to reply")
            }
            if (message.role === "system") return res.status(403).send("Cannot reply to system messages")
            await sql.message.insertMessageReply(Number(messageID), req.session.username, content)
            await sql.message.updateMessage(Number(messageID), "updater", req.session.username)
            await sql.message.updateMessage(Number(messageID), "updatedDate", new Date().toISOString())
            await sql.message.updateMessage(Number(messageID), "creatorDelete", false)
            await sql.message.updateMessage(Number(messageID), "recipientDelete", false)
            if (req.session.username === message.creator) {
                await sql.message.updateMessage(Number(messageID), "recipientRead", false)
                pushNotification(message.recipient)
            } else if (req.session.username === message.recipient) {
                await sql.message.updateMessage(Number(messageID), "creatorRead", false)
                pushNotification(message.creator)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/message/replies", messageLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID as string
            const offset = req.query.offset as string
            if (!messageID) return res.status(400).send("Bad messageID")
            const message = await sql.message.message(Number(messageID))
            if (!message) return res.status(400).send("Invalid messageID")
            if (req.session.username !== message.creator && req.session.username !== message.recipient) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(401).send("No permission to view replies")
            }
            const result = await sql.message.messageReplies(Number(messageID), offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/message/reply/edit", messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, content} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!replyID || !content) return res.status(400).send("Bad replyID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const reply = await sql.message.messageReply(replyID)
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to edit")
            }
            await sql.message.updateMessageReply(Number(replyID), "content", content)
            await sql.message.updateMessageReply(Number(replyID), "updatedDate", new Date().toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/message/reply/delete", messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID
            const replyID = req.query.replyID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!messageID || !replyID) return res.status(400).send("Bad messageID or replyID")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const reply = await sql.message.messageReply(Number(replyID))
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission to delete")
            }
            const replies = await sql.message.messageReplies(Number(messageID))
            const lastReply = replies[replies.length - 1]
            if (lastReply.replyID === reply.replyID) {
                await sql.message.deleteMessageReply(Number(replyID))
                const penultReply = replies[replies.length - 2]
                if (penultReply) {
                    await sql.message.updateMessage(Number(messageID), "updater", penultReply.creator)
                    await sql.message.updateMessage(Number(messageID), "updatedDate", penultReply.createDate)
                } else {
                    const message = await sql.message.message(Number(messageID))
                    await sql.message.updateMessage(Number(messageID), "updater", message.creator)
                    await sql.message.updateMessage(Number(messageID), "updatedDate", message.createDate)
                }
            } else {
                await sql.message.deleteMessageReply(Number(replyID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/softdelete", messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!messageID) return res.status(400).send("Bad messageID")
            const message = await sql.message.message(messageID)
            if (!message) return res.status(400).send("Invalid messageID")
            if (req.session.username !== message.creator && req.session.username !== message.recipient) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(401).send("No permission to softdelete")
            }
            const isCreator = req.session.username === message.creator
            const isRecipient = req.session.username === message.recipient
            if (isCreator) {
                await sql.message.updateMessage(Number(messageID), "creatorDelete", true)
                if (message.recipientDelete) await sql.message.deleteMessage(Number(messageID))
            } else if (isRecipient) {
                await sql.message.updateMessage(Number(messageID), "recipientDelete", true)
                if (message.creatorDelete) await sql.message.deleteMessage(Number(messageID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/read", messageLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, forceRead} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!messageID) return res.status(400).send("Bad messageID")
            const message = await sql.message.message(messageID)
            if (!message) return res.status(400).send("Invalid messageID")
            if (req.session.username !== message.creator && req.session.username !== message.recipient) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(401).send("No permission to read")
            }
            const isCreator = req.session.username === message.creator
            const isRecipient = req.session.username === message.recipient
            if (isCreator) {
                if (!message.creatorRead || forceRead) {
                    await sql.message.updateMessage(Number(messageID), "creatorRead", true)
                } else {
                    await sql.message.updateMessage(Number(messageID), "creatorRead", false)
                }
            } else if (isRecipient) {
                if (!message.recipientRead || forceRead) {
                    await sql.message.updateMessage(Number(messageID), "recipientRead", true)
                } else {
                    await sql.message.updateMessage(Number(messageID), "recipientRead", false)
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/bulkread", messageLimiter, async (req: Request, res: Response) => {
        try {
            const {readStatus} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (readStatus === undefined) return res.status(400).send("No readStatus specified")
            const messages = await sql.message.allMessages(req.session.username, "", "date", undefined, "99999")
            for (const message of messages) {
                if (message.creator === req.session.username) {
                    await sql.message.updateMessage(Number(message.messageID), "creatorRead", readStatus)
                } else if (message.recipient === req.session.username) {
                    await sql.message.updateMessage(Number(message.messageID), "recipientRead", readStatus)
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/notifications", messageLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(401).send("Unauthorized")
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Connection": "keep-alive",
                "Cache-Control": "no-cache"
            })
            const index = connections.findIndex((c) => c.username === req.session.username)
            if (index !== -1) {
                connections[index].response = res
            } else {
                connections.push({username: req.session.username, response: res})
            }
            req.on("close", () => {
                connections = connections.filter((c) => c.username !== req.session.username)
            })
        } catch (e) {
            console.log(e)
        }
    })
}

export default MessageRoutes