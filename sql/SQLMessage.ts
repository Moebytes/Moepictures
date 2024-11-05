import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLMessage {
    /** Insert DM message. */
    public static insertMessage = async (creator: string, title: string, content: string, r18: boolean) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO messages ("creator", "createDate", "updater", "updatedDate", "title", "content", "r18") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "messageID"`,
        values: [creator, now, creator, now, title, content, r18]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0]?.messageID as number
    }

    /** Bulk insert message recipients. */
    public static bulkInsertRecipients = async (messageID: number, recipients: string[]) => {
        if (!recipients.length) return
        let dupeCheck = new Set<string>()
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < recipients.length; j++) {
            if (dupeCheck.has(recipients[j])) continue
            dupeCheck.add(recipients[j])
            valueArray.push(`($${i}, $${i + 1})`)
            rawValues.push(messageID)
            rawValues.push(recipients[j])
            i += 2
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "message recipients" ("messageID", "recipient") ${valueQuery}`,
            values: [...rawValues]
        }
        return SQLQuery.run(query)
    }

    /** Bulk delete message recipients. */
    public static bulkDeleteRecipients = async (messageID: number, recipients: string[]) => {
        if (!recipients.length) return
        let dupeCheck = new Set<string>()
        let rawValues = [messageID] as any
        let valueArray = [] as any 
        let i = 2
        for (let j = 0; j < recipients.length; j++) {
            if (dupeCheck.has(recipients[j])) continue
            dupeCheck.add(recipients[j])
            valueArray.push(`$${i}`) 
            rawValues.push(recipients[j])
            i++
        }
        let valueQuery = valueArray.join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "message recipients" WHERE "messageID" = $1 AND "recipient" IN (${valueQuery})`,
            values: [...rawValues]
        }
        return SQLQuery.run(query)
    }

    /** Search all messages. */
    public static allMessages = async (username: string, search: string, sort: string, offset?: string, limit?: string) => {
        let i = 2
        let whereQuery = `WHERE (messages.creator = $1 OR "message recipients".recipient = $1)`
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
            if (Number(limit) > 100) limit = "100"
            limitQuery = `LIMIT $${i}`
            i++
        }
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT messages.*, array_agg(DISTINCT "message recipients".recipient) AS recipients,
                json_agg(DISTINCT "message recipients".*) AS "recipientData",
                COUNT(*) OVER() AS "messageCount"
                FROM messages
                JOIN "message recipients" ON messages."messageID" = "message recipients"."messageID"
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
            SELECT messages.*, array_agg(DISTINCT "message recipients".recipient) AS recipients,
            json_agg(DISTINCT "message recipients".*) AS "recipientData",
            COUNT(*) OVER() AS "messageCount"
            FROM messages
            JOIN "message recipients" ON messages."messageID" = "message recipients"."messageID"
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
                SELECT messages.*, array_agg(DISTINCT "message recipients".recipient) AS recipients,
                json_agg(DISTINCT "message recipients".*) AS "recipientData",
                users.role, users.image, users.banned, users."imagePost", users."imageHash"
                FROM messages
                JOIN "message recipients" ON messages."messageID" = "message recipients"."messageID"
                JOIN users ON users.username = messages.creator
                WHERE messages."messageID" = $1
                GROUP BY messages."messageID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
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

    /** Update recipient */
    public static updateRecipient = async (messageID: number, recipient: string, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "message recipients" SET "${column}" = $1 WHERE "messageID" = $2 AND "recipient" = $3`,
            values: [value, messageID, recipient]
        }
        return SQLQuery.run(query)
    }

    /** Insert message reply. */
    public static insertMessageReply = async (messageID: number, creator: string, content: string, r18: boolean) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "message replies" ("messageID", "creator", "createDate", "updatedDate", "content", "r18") VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [messageID, creator, now, now, content, r18]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get message replies. */
    public static messageReplies = async (messageID: number, offset?: string) => {
        if (offset && Number(offset) < 0) offset = "0"
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "message replies".*, users.role, users.image, users.banned, users."imagePost", users."imageHash",
                COUNT(*) OVER() AS "replyCount"
                FROM "message replies" 
                JOIN users ON users.username = "message replies".creator
                WHERE "message replies"."messageID" = $1 
                GROUP BY "message replies"."replyID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
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
                SELECT "message replies".*, users.role, users.image, users.banned, users."imagePost", users."imageHash",
                COUNT(*) OVER() AS "replyCount"
                FROM "message replies" 
                JOIN users ON users.username = "message replies".creator
                WHERE "message replies".creator = $1 
                GROUP BY "message replies"."replyID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
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
                SELECT "message replies".*, users.role, users.image, users.banned, users."imagePost", users."imageHash"
                FROM "message replies" 
                JOIN users ON users.username = "message replies".creator
                WHERE "message replies"."replyID" = $1
                GROUP BY "message replies"."replyID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
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
                SELECT messages.*, array_agg(DISTINCT "message recipients".recipient) AS recipients,
                json_agg(DISTINCT "message recipients".*) AS "recipientData"
                FROM messages
                JOIN "message recipients" ON messages."messageID" = "message recipients"."messageID"
                WHERE (messages."creator" = $1 AND (messages."read" = false OR messages."read" IS NULL)) OR 
                ("message recipients".recipient = $1 AND ("message recipients".read = false OR "message recipients".read IS NULL))
                GROUP BY messages."messageID"
            `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }
}