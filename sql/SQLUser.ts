import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import axios from "axios"

export default class SQLUser {
    /** Get uploads. */
    public static uploads = async (username: string, limit?: string, offset?: string, type?: string, rating?: string, style?: string, sort?: string, sessionUsername?: string) => {
        const {postJSON, values, limitValue, offsetValue} = 
        SQLQuery.search.boilerplate({i: 2, type, rating, style, sort, offset, limit, username: sessionUsername})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT post_json.*,
                COUNT(*) OVER() AS "postCount"
                FROM post_json
                WHERE post_json."uploader" = $1
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${offsetValue}` : ""}
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Create a new user. */
    public static insertUser = async (username: string, email: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "users" ("username", "email") VALUES ($1, $2)`,
        values: [username, email]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates a user */
    public static updateUser = async (username: string, column: string, value: string | number | boolean | null) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "users" SET "${column}" = $1 WHERE "username" = $2`,
            values: [value, username]
        }
        return SQLQuery.run(query)
    }

    /** Get user. */
    public static user = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT users.*
            FROM users
            WHERE users."username" = $1
            GROUP BY users."username"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get user by email. */
    public static userByEmail = async (email: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT users.*
            FROM users
            WHERE users."email" = $1
            GROUP BY users."username"
            `),
            values: [email]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Delete user. */
    public static deleteUser = async (username: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM users WHERE users."username" = $1`),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get all admins. */
    public static admins = async () => {
        const query: QueryConfig = {
            text: /*sql*/`SELECT * FROM users WHERE users."role" = 'admin'`
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert login history. */
    public static insertLoginHistory = async (username: string, type: string, ip: string, device: string) => {
        const ipInfo = await axios.get(`http://ip-api.com/json/${ip}`).then((r) => r.data).catch(() => null)
        let region = ipInfo?.regionName || "unknown"
        if (ip === "127.0.0.1" || ip.startsWith("192.168.68")) region = "localhost"
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "login history" ("username", "type", "ip", "device", "region", "timestamp") VALUES ($1, $2, $3, $4, $5, $6)`,
            values: [username, type, ip, device, region, now]
        }
        return SQLQuery.run(query)
    }

    /** Get login history. */
    public static loginHistory = async (username: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT "login history".*, 
                to_json((array_agg(users.*))[1]) AS user
                FROM "login history"
                JOIN users ON users.username = "login history"."username"
                WHERE "login history"."username" = $1
                GROUP BY "login history"."loginID"
                ORDER BY "login history"."timestamp" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Destroy other sessions. */
    public static destroyOtherSessions = async (username: string, currentSession: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM sessions WHERE session->>'username' = $1 AND "sessionID" != $2`,
            values: [username, currentSession]
        }
        return SQLQuery.run(query)
    }

    /** Set banner */
    public static setBanner = async (text: string, link: string) => {
        let now = new Date().toISOString()
        if (!text) {
            text = null as any
            link = null as any
            now = null as any
        }
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO banner ("bannerID", "text", "link", "date")
                VALUES (1, $1, $2, $3)
                ON CONFLICT ("bannerID")
                DO UPDATE SET "text" = $1, "link" = $2, "date" = $3
            `),
            values: [text, link, now]
        }
        return SQLQuery.run(query)
    }

    /** Get banner. */
    public static getBanner = async () => {
        const query: QueryConfig = {
            text: /*sql*/`SELECT * FROM banner`
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }
}