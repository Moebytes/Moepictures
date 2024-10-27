import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"

const messageLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const messageUpdateLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

let connections = [] as {username: string, response: Response}[]

const pushNotification = (username: string) => {
    const connection = connections.find((c) => c.username === username)
    if (!connection) return
    connection.response.write(`event: message\n`)
    connection.response.write(`data: new message!\n\n`)
}

const MessageRoutes = (app: Express) => {
    app.post("/api/message/create", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {title, content, recipients} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!title || !content) return res.status(400).send("Bad title or content")
            if (recipients?.length < 1) return res.status(400).send("Bad recipients")
            if (recipients.length > 5 && !permissions.isMod(req.session)) return res.status(403).send("Recipient limit exceeded")
            const badTitle = functions.validateTitle(title)
            if (badTitle) return res.status(400).send("Bad title")
            const badContent = functions.validateThread(content)
            if (badContent) return res.status(400).send("Bad content")
            for (const recipient of recipients) {
                if (req.session.username === recipient) return res.status(400).send("Cannot send message to yourself")
                const user = await sql.user.user(recipient)
                if (!user) return res.status(400).send("Invalid recipients")
            }
            const messageID = await sql.message.insertMessage(req.session.username, title, content)
            await sql.message.bulkInsertRecipients(messageID, recipients)
            for (const recipient of recipients) {
                pushNotification(recipient)
            }
            res.status(200).send(messageID)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/message/edit", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, title, content} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!title || !content) return res.status(400).send("Bad title or content")
            const badTitle = functions.validateTitle(title)
            if (badTitle) return res.status(400).send("Bad title")
            const badContent = functions.validateThread(content)
            if (badContent) return res.status(400).send("Bad content")
            const message = await sql.message.message(Number(messageID))
            if (!message) return res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to edit")
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
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const message = await sql.message.message(Number(messageID))
            let canView = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) {
                    canView = true
                }
            }
            if (!canView && !permissions.isMod(req.session)) return res.status(403).send("No permission to view")
            res.status(200).json(message)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/message/delete", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID
            if (!messageID) return res.status(400).send("Bad messageID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const message = await sql.message.message(Number(messageID))
            if (!message) return res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to delete")
            }
            await sql.message.deleteMessage(Number(messageID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/reply", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, content} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!messageID || !content) return res.status(400).send("Bad messageID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const message = await sql.message.message(messageID)
            if (!message) return res.status(400).send("Invalid messageID")
            let canReply = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) {
                    canReply = true
                }
            }
            if (!canReply && !permissions.isMod(req.session)) return res.status(403).send("No permission to reply")
            if (message.role === "system") return res.status(403).send("Cannot reply to system messages")
            await sql.message.insertMessageReply(Number(messageID), req.session.username, content)
            await sql.message.updateMessage(Number(messageID), "updater", req.session.username)
            await sql.message.updateMessage(Number(messageID), "updatedDate", new Date().toISOString())
            await sql.message.updateMessage(Number(messageID), "delete", false)
            for (const recipient of message.recipients) {
                await sql.message.updateRecipient(Number(messageID), recipient, "delete", false)
            }
            if (req.session.username === message.creator) {
                for (const recipient of message.recipients) {
                    await sql.message.updateRecipient(Number(messageID), recipient, "read", false)
                    pushNotification(recipient)
                }
            } else {
                await sql.message.updateMessage(Number(messageID), "read", false)
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
            let canView = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) {
                    canView = true
                }
            }
            if (!canView && !permissions.isMod(req.session)) return res.status(403).send("No permission to view replies")
            const result = await sql.message.messageReplies(Number(messageID), offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/message/reply/edit", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, content} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!replyID || !content) return res.status(400).send("Bad replyID or content")
            const badReply = functions.validateReply(content)
            if (badReply) return res.status(400).send("Bad reply")
            const reply = await sql.message.messageReply(replyID)
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to edit")
            }
            await sql.message.updateMessageReply(Number(replyID), "content", content)
            await sql.message.updateMessageReply(Number(replyID), "updatedDate", new Date().toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/message/reply/delete", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID
            const replyID = req.query.replyID
            if (!messageID || !replyID) return res.status(400).send("Bad messageID or replyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const reply = await sql.message.messageReply(Number(replyID))
            if (!reply) return res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to delete")
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

    app.post("/api/message/softdelete", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!messageID) return res.status(400).send("Bad messageID")
            const message = await sql.message.message(messageID)
            if (!message) return res.status(400).send("Invalid messageID")
            let canDelete = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) canDelete = true
            }
            if (!canDelete && !permissions.isMod(req.session)) return res.status(403).send("No permission to soft delete")
            const isCreator = req.session.username === message.creator
            if (isCreator) {
                await sql.message.updateMessage(Number(messageID), "delete", true)
                let allDeleted = true
                for (const data of message.recipientData) {
                    if (!data.delete) {
                        allDeleted = false
                        break
                    }
                }
                if (allDeleted) await sql.message.deleteMessage(Number(messageID))
            } else {
                for (const recipient of message.recipients) {
                    if (req.session.username === recipient) {
                        await sql.message.updateRecipient(Number(messageID), recipient, "delete", true)
                        if (message.delete) await sql.message.deleteMessage(Number(messageID))
                    }
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/read", csrfProtection, messageLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, forceRead} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!messageID) return res.status(400).send("Bad messageID")
            const message = await sql.message.message(messageID)
            if (!message) return res.status(400).send("Invalid messageID")
            let canRead = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) canRead = true
            }
            if (!canRead && !permissions.isMod(req.session)) return res.status(403).send("No permission to read")
            if (req.session.username === message.creator) {
                if (!message.read || forceRead) {
                    await sql.message.updateMessage(Number(messageID), "read", true)
                } else {
                    await sql.message.updateMessage(Number(messageID), "read", false)
                }
            } else {
                for (const data of message.recipientData) {
                    if (req.session.username === data.recipient) {
                        if (!data.read || forceRead) {
                            await sql.message.updateRecipient(Number(messageID), data.recipient, "read", true)
                        } else {
                            await sql.message.updateRecipient(Number(messageID), data.recipient, "read", false)
                        }
                    }
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/bulkread", csrfProtection, messageLimiter, async (req: Request, res: Response) => {
        try {
            const {readStatus} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (readStatus === undefined) return res.status(400).send("No readStatus specified")
            const messages = await sql.message.allMessages(req.session.username, "", "date", undefined, "99999")
            for (const message of messages) {
                if (message.creator === req.session.username) {
                    await sql.message.updateMessage(Number(message.messageID), "read", readStatus)
                } else {
                    for (const recipient of message.recipients) {
                        if (req.session.username === recipient) {
                            await sql.message.updateRecipient(Number(message.messageID), recipient, "read", readStatus)
                        }
                    }
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/forward", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, recipients} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!messageID) return res.status(400).send("Bad messageID or content")
            const message = await sql.message.message(messageID)
            if (!message) return res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return res.status(403).send("No permission to forward")
            }
            if (recipients?.length < 1) return res.status(400).send("Bad recipients")
            if (recipients.length > 5 && !permissions.isMod(req.session)) return res.status(403).send("Recipient limit exceeded")
            for (const recipient of recipients) {
                if (req.session.username === recipient) return res.status(400).send("Cannot send message to yourself")
                const user = await sql.user.user(recipient)
                if (!user) return res.status(400).send("Invalid recipients")
            }
            let toAdd = recipients.filter((r: string) => !message.recipients.includes(r))
            let toRemove = message.recipients.filter((r: string) => !recipients.includes(r))
            await sql.message.bulkDeleteRecipients(messageID, toRemove)
            await sql.message.bulkInsertRecipients(messageID, toAdd)
            for (const recipient of toAdd) {
                pushNotification(recipient)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/notifications", messageLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
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