import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {Thread, ThreadSearch, ThreadUser, ThreadReply, ThreadRead} from "../types/Types"

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
        return String(result.flat(Infinity)[0])
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
        return result as Promise<Thread[]>
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
        return result as Promise<Thread[]>
    }

    /** Search threads. */
    public static searchThreads = async (search: string, sort: string, offset?: number, sessionUsername?: string) => {
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
                ${sessionUsername ? `LEFT JOIN "thread reads" ON "thread reads"."threadID" = threads."threadID" 
                AND "thread reads".username = $${userValue}` : ""}
                ${whereQuery}
                GROUP BY threads."threadID"${sessionUsername ? `, "thread reads".read` : ""}
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `)
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query)
        return result as Promise<ThreadSearch[]>
    }

    /** Search threads by username. */
    public static searchThreadsByUsername = async (usernames: string[], search: string, sort: string, offset?: number, 
        sessionUsername?: string) => {
        let i = 2
        let whereQuery = `WHERE (threads."creator" = ANY ($1) OR replies."creator" = ANY ($1))`
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
                SELECT DISTINCT threads.*, ${sessionUsername ? `"thread reads".read,` : ""}
                COUNT(*) OVER() AS "threadCount"
                FROM threads
                LEFT JOIN replies ON replies."threadID" = threads."threadID"
                ${sessionUsername ? `LEFT JOIN "thread reads" ON "thread reads"."threadID" = threads."threadID" 
                AND "thread reads".username = $${userValue}` : ""}
                ${whereQuery}
                GROUP BY threads."threadID"${sessionUsername ? `, "thread reads".read` : ""}
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [usernames]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result as Promise<ThreadSearch[]>
    }

    /** Get thread. */
    public static thread = async (threadID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT threads.*, users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount"
                FROM threads 
                JOIN users ON users.username = threads.creator
                WHERE threads."threadID" = $1
                GROUP BY threads."threadID", users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount"
            `),
        values: [threadID]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<ThreadUser | undefined>
    }

    /** Update thread */
    public static updateThread = async (threadID: string, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "threads" SET "${column}" = $1 WHERE "threadID" = $2`,
            values: [value, threadID]
        }
        await SQLQuery.run(query)
    }

    /** Delete thread. */
    public static deleteThread = async (threadID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM threads WHERE threads."threadID" = $1`),
        values: [threadID]
        }
        await SQLQuery.run(query)
    }

    /** Insert reply. */
    public static insertReply = async (threadID: string, creator: string, content: string, r18: boolean) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO replies ("threadID", "creator", "createDate", "updater", "updatedDate", "content", "r18") 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "replyID"`,
            rowMode: "array",
            values: [threadID, creator, now, creator, now, content, r18]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Get replies. */
    public static replies = async (threadID: string, offset?: number) => {
        if (offset && Number(offset) < 0) offset = 0
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT replies.*, users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount",
                COUNT(*) OVER() AS "replyCount"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies."threadID" = $1 
                GROUP BY replies."replyID", users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount"
                ${offset ? "OFFSET $2" : ""}
            `),
        values: [threadID]
        }
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result as Promise<ThreadReply[]>
    }

    /** Get user replies. */
    public static userReplies = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT replies.*, users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount",
                COUNT(*) OVER() AS "replyCount"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies.creator = $1 
                GROUP BY replies."replyID", users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount"
            `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<ThreadReply[]>
    }

    /** Get reply. */
    public static reply = async (replyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT replies.*, users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies."replyID" = $1
                GROUP BY replies."replyID", users.role, users.image, users.banned, 
                users."imagePost", users."imageHash", users."postCount"
            `),
        values: [replyID]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<ThreadReply | undefined>
    }

    /** Update reply */
    public static updateReply = async (replyID: string, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "replies" SET "${column}" = $1 WHERE "replyID" = $2`,
            values: [value, replyID]
        }
        await SQLQuery.run(query)
    }

    /** Delete reply */
    public static deleteReply = async (replyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM replies WHERE replies."replyID" = $1`),
        values: [replyID]
        }
        await SQLQuery.run(query)
    }

    /** Bulk update thread reads */
    public static bulkUpdateReads = async (threadID: string, value: boolean, ignoreUser: string) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "thread reads" SET "read" = $1 WHERE "threadID" = $2 AND "username" != $3`,
            values: [value, threadID, ignoreUser]
        }
        await SQLQuery.run(query)
    }

    /** Update thread read */
    public static updateRead = async (threadID: string, username: string, value: boolean) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO "thread reads" ("threadID", "username", "read")
                VALUES ($1, $2, $3)
                ON CONFLICT ("threadID", "username") DO UPDATE
                SET "read" = EXCLUDED."read"
            `),
            values: [threadID, username, value]
        }
        await SQLQuery.run(query)
    }

    /** Get thread read */
    public static getRead = async (threadID: string, username: string) => {
        const query: QueryConfig = {
            text: /*sql*/`SELECT * FROM "thread reads" WHERE "threadID" = $1 AND "username" = $2`,
            values: [threadID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<ThreadRead | undefined>
    }

    /** Get post count of user */
    public static postCount = async (username: string) => {
        const query: QueryArrayConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH "threadCounts" AS (
                    SELECT creator, COUNT(*) AS "threadCount"
                    FROM threads
                    WHERE creator = $1
                    GROUP BY creator
                ),
                "replyCounts" AS (
                    SELECT creator, COUNT(*) AS "replyCount"
                    FROM replies
                    WHERE creator = $1
                    GROUP BY creator
                )
                SELECT (COALESCE("threadCount", 0) + COALESCE("replyCount", 0)) AS postCount
                FROM "threadCounts"
                LEFT JOIN "replyCounts"
                ON "threadCounts".creator = "replyCounts".creator
            `),
            rowMode: "array",
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return Number(result[0] || 0)
    }
}