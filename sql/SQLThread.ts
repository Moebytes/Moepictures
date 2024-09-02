import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLThread {
    /** Insert thread. */
    public static insertThread = async (creator: string, title: string, content: string) => {
        const now = new Date().toISOString()
        const sticky = false
        const locked = false
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO threads ("creator", "createDate", "updater", "updatedDate", "sticky", "locked", "title", "content") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "threadID"`,
        values: [creator, now, creator, now, sticky, locked, title, content]
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
    public static stickyThreads = async () => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT threads.*,
            COUNT(*) OVER() AS "threadCount"
            FROM threads
            WHERE threads.sticky = 'true' 
            GROUP BY threads."threadID"
            ORDER BY threads."updatedDate" DESC
        `),
        values: []
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Search threads. */
    public static searchThreads = async (search: string, sort: string, offset?: string) => {
        let whereQuery = `WHERE threads.sticky = 'false'`
        let i = 1
        if (search) {
        whereQuery += ` AND lower(threads."title") LIKE '%' || $${i} || '%'`
        i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY threads."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY threads."updatedDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT threads.*,
                COUNT(*) OVER() AS "threadCount"
                FROM threads
                ${whereQuery}
                GROUP BY threads."threadID"
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get thread. */
    public static thread = async (threadID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT threads.*, users.role, users.image, users.banned, users."imagePost"
                FROM threads 
                JOIN users ON users.username = threads.creator
                WHERE threads."threadID" = $1
                GROUP BY threads."threadID", users.role, users.image, users.banned, users."imagePost"
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
    public static insertReply = async (threadID: number, creator: string, content: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO replies ("threadID", "creator", "createDate", "updatedDate", "content") VALUES ($1, $2, $3, $4, $5)`,
        values: [threadID, creator, now, now, content]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get replies. */
    public static replies = async (threadID: number, offset?: string) => {
        if (offset && Number(offset) < 0) offset = "0"
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT replies.*, users.role, users.image, users.banned, users."imagePost",
                COUNT(*) OVER() AS "replyCount"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies."threadID" = $1 
                GROUP BY replies."replyID", users.role, users.image, users.banned, users."imagePost"
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
                SELECT replies.*, users.role, users.image, users.banned, users."imagePost",
                COUNT(*) OVER() AS "replyCount"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies.creator = $1 
                GROUP BY replies."replyID", users.role, users.image, users.banned, users."imagePost"
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
                SELECT replies.*, users.role, users.image, users.banned, users."imagePost"
                FROM replies 
                JOIN users ON users.username = replies.creator
                WHERE replies."replyID" = $1
                GROUP BY replies."replyID", users.role, users.image, users.banned, users."imagePost"
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
}