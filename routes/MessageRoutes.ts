import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import enLocale from "../assets/locales/en.json"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import {MessageCreateParams, MessageEditParams, MessageReplyParams, MessageReplyEditParams,
MessageForwardParams} from "../types/Types"

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
            const {title, content, r18, recipients} = req.body as MessageCreateParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            if (!title || !content) return void res.status(400).send("Bad title or content")
            if (recipients?.length < 1) return void res.status(400).send("Bad recipients")
            if (recipients.length > 5 && !permissions.isMod(req.session)) return void res.status(403).send("Recipient limit exceeded")
            const badTitle = functions.validateTitle(title, enLocale)
            if (badTitle) return void res.status(400).send("Bad title")
            const badContent = functions.validateThread(content, enLocale)
            if (badContent) return void res.status(400).send("Bad content")
            for (const recipient of recipients) {
                if (req.session.username === recipient) return void res.status(400).send("Cannot send message to yourself")
                const user = await sql.user.user(recipient)
                if (!user) return void res.status(400).send("Invalid recipients")
                if (r18 && !user.showR18) return void res.status(400).send("Cannot send r18 message")
            }
            const messageID = await sql.message.insertMessage(req.session.username, title, content, r18)
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
            const {messageID, title, content, r18} = req.body as MessageEditParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!title || !content) return void res.status(400).send("Bad title or content")
            const badTitle = functions.validateTitle(title, enLocale)
            if (badTitle) return void res.status(400).send("Bad title")
            const badContent = functions.validateThread(content, enLocale)
            if (badContent) return void res.status(400).send("Bad content")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return void res.status(403).send("No permission to edit")
            }
            await sql.message.updateMessage(messageID, "title", title)
            await sql.message.updateMessage(messageID, "content", content)
            await sql.message.updateMessage(messageID, "r18", r18)
            await sql.message.updateMessage(messageID, "updater", req.session.username)
            await sql.message.updateMessage(messageID, "updatedDate", new Date().toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/message", messageLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID as string
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Bad messageID")
            let canView = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) {
                    canView = true
                }
            }
            if (message.r18 && !req.session.showR18) canView = false
            if (!canView && !permissions.isMod(req.session)) return void res.status(403).send("No permission to view")
            serverFunctions.sendEncrypted(message, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/message/delete", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID as string
            if (!messageID) return void res.status(400).send("Bad messageID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return void res.status(403).send("No permission to delete")
            }
            await sql.message.deleteMessage(messageID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/reply", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID, content, r18} = req.body as MessageReplyParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            if (!messageID || !content) return void res.status(400).send("Bad messageID or content")
            const badReply = functions.validateReply(content, enLocale)
            if (badReply) return void res.status(400).send("Bad reply")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            let canReply = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) {
                    canReply = true
                }
            }
            if (message.r18 && !req.session.showR18) canReply = false
            if (!canReply && !permissions.isMod(req.session)) return void res.status(403).send("No permission to reply")
            if (message.role === "system") return void res.status(403).send("Cannot reply to system messages")
            await sql.message.insertMessageReply(messageID, req.session.username, content, r18)
            await sql.message.updateMessage(messageID, "updater", req.session.username)
            await sql.message.updateMessage(messageID, "updatedDate", new Date().toISOString())
            await sql.message.updateMessage(messageID, "delete", false)
            for (const recipient of message.recipients) {
                if (!recipient) continue
                await sql.message.updateRecipient(messageID, recipient, "delete", false)
            }
            if (req.session.username === message.creator) {
                for (const recipient of message.recipients) {
                    if (!recipient) continue
                    await sql.message.updateRecipient(messageID, recipient, "read", false)
                    pushNotification(recipient)
                }
            } else {
                await sql.message.updateMessage(messageID, "read", false)
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
            let {messageID, offset} = req.query as unknown as {messageID: string, offset: number}
            if (!offset) offset = 0
            if (!messageID) return void res.status(400).send("Bad messageID")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            let canView = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) {
                    canView = true
                }
            }
            if (message.r18 && !req.session.showR18) canView = false
            if (!canView && !permissions.isMod(req.session)) return void res.status(403).send("No permission to view replies")
            let result = await sql.message.messageReplies(messageID, Number(offset))
            if (!req.session.showR18) {
                result = result.filter((r: any) => !r.r18)
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/message/reply/edit", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {replyID, content, r18} = req.body as MessageReplyEditParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!replyID || !content) return void res.status(400).send("Bad replyID or content")
            const badReply = functions.validateReply(content, enLocale)
            if (badReply) return void res.status(400).send("Bad reply")
            const reply = await sql.message.messageReply(replyID)
            if (!reply) return void res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return void res.status(403).send("No permission to edit")
            }
            await sql.message.updateMessageReply(replyID, "content", content)
            await sql.message.updateMessageReply(replyID, "updater", req.session.username)
            await sql.message.updateMessageReply(replyID, "updatedDate", new Date().toISOString())
            await sql.message.updateMessageReply(replyID, "r18", r18)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/message/reply/delete", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const messageID = req.query.messageID as string
            const replyID = req.query.replyID as string
            if (!messageID || !replyID) return void res.status(400).send("Bad messageID or replyID")
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            const reply = await sql.message.messageReply(replyID)
            if (!reply) return void res.status(400).send("Invalid replyID")
            if (reply.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return void res.status(403).send("No permission to delete")
            }
            const replies = await sql.message.messageReplies(messageID)
            const lastReply = replies[replies.length - 1]
            if (lastReply.replyID === reply.replyID) {
                await sql.message.deleteMessageReply(replyID)
                const penultReply = replies[replies.length - 2]
                if (penultReply) {
                    await sql.message.updateMessage(messageID, "updater", penultReply.creator)
                    await sql.message.updateMessage(messageID, "updatedDate", penultReply.createDate)
                } else {
                    await sql.message.updateMessage(messageID, "updater", message.creator)
                    await sql.message.updateMessage(messageID, "updatedDate", message.createDate)
                }
            } else {
                await sql.message.deleteMessageReply(replyID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/message/softdelete", csrfProtection, messageUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {messageID} = req.body as {messageID: string}
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!messageID) return void res.status(400).send("Bad messageID")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            let canDelete = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) canDelete = true
            }
            if (!canDelete && !permissions.isMod(req.session)) return void res.status(403).send("No permission to soft delete")
            const isCreator = req.session.username === message.creator
            if (isCreator) {
                await sql.message.updateMessage(messageID, "delete", true)
                let allDeleted = true
                for (const data of message.recipientData) {
                    if (!data.delete) {
                        allDeleted = false
                        break
                    }
                }
                if (allDeleted) await sql.message.deleteMessage(messageID)
            } else {
                for (const recipient of message.recipients) {
                    if (req.session.username === recipient) {
                        await sql.message.updateRecipient(messageID, recipient, "delete", true)
                        if (message.delete) await sql.message.deleteMessage(messageID)
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
            const {messageID, forceRead} = req.body as {messageID: string, forceRead?: boolean}
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!messageID) return void res.status(400).send("Bad messageID")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            let canRead = false
            for (const recipient of message.recipients) {
                if (req.session.username === message.creator || req.session.username === recipient) canRead = true
            }
            if (!canRead && !permissions.isMod(req.session)) return void res.status(403).send("No permission to read")
            if (req.session.username === message.creator) {
                if (!message.read || forceRead) {
                    await sql.message.updateMessage(messageID, "read", true)
                } else {
                    await sql.message.updateMessage(messageID, "read", false)
                }
            } else {
                for (const data of message.recipientData) {
                    if (req.session.username === data.recipient) {
                        if (!data.read || forceRead) {
                            await sql.message.updateRecipient(messageID, data.recipient, "read", true)
                        } else {
                            await sql.message.updateRecipient(messageID, data.recipient, "read", false)
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
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (readStatus === undefined) return void res.status(400).send("No readStatus specified")
            const messages = await sql.message.allMessages(req.session.username, "", "date", undefined, 99999)
            for (const message of messages) {
                if (message.creator === req.session.username) {
                    await sql.message.updateMessage(message.messageID, "read", readStatus)
                } else {
                    for (const recipient of message.recipients) {
                        if (req.session.username === recipient) {
                            await sql.message.updateRecipient(message.messageID, recipient, "read", readStatus)
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
            const {messageID, recipients} = req.body as MessageForwardParams
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            if (!messageID) return void res.status(400).send("Bad messageID or content")
            const message = await sql.message.message(messageID)
            if (!message) return void res.status(400).send("Invalid messageID")
            if (message.creator !== req.session.username) {
                if (!permissions.isMod(req.session)) return void res.status(403).send("No permission to forward")
            }
            if (recipients?.length < 1) return void res.status(400).send("Bad recipients")
            if (recipients.length > 5 && !permissions.isMod(req.session)) return void res.status(403).send("Recipient limit exceeded")
            for (const recipient of recipients) {
                if (req.session.username === recipient) return void res.status(400).send("Cannot send message to yourself")
                const user = await sql.user.user(recipient)
                if (!user) return void res.status(400).send("Invalid recipients")
                if (message.r18 && !user.showR18) return void res.status(400).send("Cannot send r18 message")
            }
            let toAdd = recipients.filter((r: string) => !message.recipients.includes(r))
            let toRemove = message.recipients.filter((r) => r !== null && !recipients.includes(r))
            await sql.message.bulkDeleteRecipients(messageID, functions.filterNulls(toRemove))
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
            if (!req.session.username) return void res.status(403).send("Unauthorized")
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