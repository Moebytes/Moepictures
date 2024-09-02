import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLMessage {
    /** Insert DM message. */
    public static insertMessage = async (creator: string, recipient: string, title: string, content: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO messages ("creator", "createDate", "updatedDate", "recipient", "title", "content") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "messageID"`,
        values: [creator, now, now, recipient, title, content]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Search all messages. */
    public static allMessages = async (username: string, search: string, sort: string, offset?: string, limit?: string) => {
        let i = 2
        let whereQuery = `WHERE (messages.recipient = $1 OR messages.creator = $1)`
        if (search) {
            whereQuery += ` AND lower(messages."title") LIKE '%' || $${i} || '%'`
            i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY messages."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY messages."updatedDate" ASC`
        let limitQuery = "LIMIT 100"
        if (limit) {
            limitQuery = `LIMIT $${i}`
            i++
        }
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT messages.*,
                COUNT(*) OVER() AS "messageCount"
                FROM messages
                ${whereQuery}
                GROUP BY messages."messageID"
                ${sortQuery}
                ${limitQuery} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [username]
        }
        if (search) query.values?.push(search.toLowerCase())
        if (limit) query.values?.push(limit)
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user messages */
    public static userMessages = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT messages.*,
            COUNT(*) OVER() AS "messageCount"
            FROM messages
            WHERE messages.creator = $1
            GROUP BY messages."messageID"
            ORDER BY messages."updatedDate" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get message. */
    public static message = async (messageID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT messages.*, users.role, users.image, users.banned, users."imagePost"
                FROM messages
                JOIN users ON users.username = messages.creator
                WHERE messages."messageID" = $1
                GROUP BY messages."messageID", users.role, users.image, users.banned, users."imagePost"
            `),
        values: [messageID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Update message */
    public static updateMessage = async (messageID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "messages" SET "${column}" = $1 WHERE "messageID" = $2`,
            values: [value, messageID]
        }
        return SQLQuery.run(query)
    }

    /** Delete message */
    public static deleteMessage = async (messageID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM messages WHERE messages."messageID" = $1`),
        values: [messageID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert message reply. */
    public static insertMessageReply = async (messageID: number, creator: string, content: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "message replies" ("messageID", "creator", "createDate", "updatedDate", "content") VALUES ($1, $2, $3, $4, $5)`,
        values: [messageID, creator, now, now, content]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get message replies. */
    public static messageReplies = async (messageID: number, offset?: string) => {
        if (offset && Number(offset) < 0) offset = "0"
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "message replies".*, users.role, users.image, users.banned, users."imagePost",
                COUNT(*) OVER() AS "replyCount"
                FROM "message replies" 
                JOIN users ON users.username = "message replies".creator
                WHERE "message replies"."messageID" = $1 
                GROUP BY "message replies"."replyID", users.role, users.image, users.banned, users."imagePost"
                ${offset ? "OFFSET $2" : ""}
            `),
        values: [messageID]
        }
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user message replies. */
    public static userMessageReplies = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "message replies".*, users.role, users.image, users.banned, users."imagePost",
                COUNT(*) OVER() AS "replyCount"
                FROM "message replies" 
                JOIN users ON users.username = "message replies".creator
                WHERE "message replies".creator = $1 
                GROUP BY "message replies"."replyID", users.role, users.image, users.banned, users."imagePost"
            `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get message reply. */
    public static messageReply = async (replyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "message replies".*, users.role, users.image, users.banned, users."imagePost"
                FROM "message replies" 
                JOIN users ON users.username = "message replies".creator
                WHERE "message replies"."replyID" = $1
                GROUP BY "message replies"."replyID", users.role, users.image, users.banned, users."imagePost"
            `),
        values: [replyID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Update message reply */
    public static updateMessageReply = async (replyID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "message replies" SET "${column}" = $1 WHERE "replyID" = $2`,
            values: [value, replyID]
        }
        return SQLQuery.run(query)
    }

    /** Delete message reply */
    public static deleteMessageReply = async (replyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "message replies" WHERE "message replies"."replyID" = $1`),
        values: [replyID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Grab unread message from user (if exists) */
    public static grabUnread = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT messages.*
                FROM messages
                WHERE (messages."creator" = $1 AND (messages."creatorRead" = false OR messages."creatorRead" IS NULL)) OR 
                (messages."recipient" = $1 AND (messages."recipientRead" = false OR messages."recipientRead" IS NULL))
                GROUP BY messages."messageID"
            `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }
}