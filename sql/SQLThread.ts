import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLThread {
    /** Insert thread. */
    public static insertThread = async (creator: string, title: string, content: string, r18: boolean) => {
        const now = new Date().toISOString()
        const sticky = false
        const locked = false
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO threads ("creator", "createDate", "updater", "updatedDate", "sticky", "locked", "title", "content", "r18") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING "threadID"`,
            rowMode: "array",
            values: [creator, now, creator, now, sticky, locked, title, content, r18]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Get user threads */
    public static userThreads = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT threads.*,
            COUNT(*) OVER() AS "threadCount"
            FROM threads
            WHERE threads.creator = $1
            GROUP BY threads."threadID"
            ORDER BY threads."updatedDate" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get sticky threads */
    public static stickyThreads = async (sessionUsername?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT threads.*, ${sessionUsername ? `"thread reads".read,` : ""}
            COUNT(*) OVER() AS "threadCount"
            FROM threads
            ${sessionUsername ? `LEFT JOIN "thread reads" ON "thread reads"."threadID" = threads."threadID" AND "thread reads".username = $1` : ""}
            WHERE threads.sticky = 'true' 
            GROUP BY threads."threadID"${sessionUsername ? `, "thread reads".read` : ""}
            ORDER BY threads."updatedDate" DESC
        `),
            values: []
        }
        if (sessionUsername) query.values?.push(sessionUsername)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Search threads. */
    public static searchThreads = async (search: string, sort: string, offset?: string, sessionUsername?: string) => {
        let whereQuery = `WHERE threads.sticky = 'false'`
        let i = 1
        let values = [] as any
        if (search) {
            values.push(search.toLowerCase())
            whereQuery += ` AND lower(threads."title") LIKE '%' || $${i} || '%'`
            i++
        }
        let userValue = i
        if (sessionUsername) {
            values.push(sessionUsername)
            i++
        }
        if (offset) values.push(offset)
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY threads."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY threads."updatedDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT threads.*, ${sessionUsername ? `"thread reads".read,` : ""}
                COUNT(*) OVER() AS "threadCount"
                FROM threads
                ${sessionUsername ? `LEFT JOIN "thread reads" ON "thread reads"."threadID" = threads."threadID" AND "thread reads".username = $${userValue}` : ""}
                ${whereQuery}
                GROUP BY threads."threadID"${sessionUsername ? `, "thread reads".read` : ""}
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `)
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get thread. */
    public static thread = async (threadID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT threads.*, users.role, users.image, users.banned, users."imagePost", users."imageHash"
                FROM threads 
                JOIN users ON users.username = threads.creator
                WHERE threads."threadID" = $1
                GROUP BY threads."threadID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
            `),
        values: [threadID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Update thread */
    public static updateThread = async (threadID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "threads" SET "${column}" = $1 WHERE "threadID" = $2`,
            values: [value, threadID]
        }
        return SQLQuery.run(query)
    }

    /** Delete thread. */
    public static deleteThread = async (threadID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM threads WHERE threads."threadID" = $1`),
        values: [threadID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert reply. */
    public static insertReply = async (threadID: number, creator: string, content: string, r18: boolean) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO replies ("threadID", "creator", "createDate", "updatedDate", "content", "r18") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "replyID"`,
            rowMode: "array",
            values: [threadID, creator, now, now, content, r18]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Get replies. */
    public static replies = async (threadID: number, offset?: string) => {
        if (offset && Number(offset) < 0) offset = "0"
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT replies.*, users.role, users.image, users.banned, users."imagePost", users."imageHash",
                COUNT(*) OVER() AS "replyCount"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies."threadID" = $1 
                GROUP BY replies."replyID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
                ${offset ? "OFFSET $2" : ""}
            `),
        values: [threadID]
        }
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user replies. */
    public static userReplies = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT replies.*, users.role, users.image, users.banned, users."imagePost", users."imageHash",
                COUNT(*) OVER() AS "replyCount"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies.creator = $1 
                GROUP BY replies."replyID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
            `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get reply. */
    public static reply = async (replyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT replies.*, users.role, users.image, users.banned, users."imagePost", users."imageHash"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies."replyID" = $1
                GROUP BY replies."replyID", users.role, users.image, users.banned, users."imagePost", users."imageHash"
            `),
        values: [replyID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Update reply */
    public static updateReply = async (replyID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "replies" SET "${column}" = $1 WHERE "replyID" = $2`,
            values: [value, replyID]
        }
        return SQLQuery.run(query)
    }

    /** Delete reply */
    public static deleteReply = async (replyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM replies WHERE replies."replyID" = $1`),
        values: [replyID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Bulk update thread reads */
    public static bulkUpdateReads = async (threadID: number, value: boolean, ignoreUser: string) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "thread reads" SET "read" = $1 WHERE "threadID" = $2 AND "username" != $3`,
            values: [value, threadID, ignoreUser]
        }
        return SQLQuery.run(query)
    }

    /** Update thread read */
    public static updateRead = async (threadID: number, username: string, value: boolean) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO "thread reads" ("threadID", "username", "read")
                VALUES ($1, $2, $3)
                ON CONFLICT ("threadID", "username") DO UPDATE
                SET "read" = EXCLUDED."read"
            `),
            values: [threadID, username, value]
        }
        return SQLQuery.run(query)
    }

    /** Get thread read */
    public static getRead = async (threadID: number, username: string) => {
        const query: QueryConfig = {
            text: /*sql*/`SELECT * FROM "thread reads" WHERE "threadID" = $1 AND "username" = $2`,
            values: [threadID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }
}