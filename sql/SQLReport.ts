import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {Report, Ban, Blacklist} from "../types/Types"

export default class SQLReport {
    /** Insert comment report. */
    public static insertCommentReport = async (username: string, commentID: string, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "reported comments" ("type", "reporter", "reportDate", "commentID", "reason") 
            VALUES ($1, $2, $3, $4, $5) RETURNING "reportID"`,
            rowMode: "array",
            values: ["comment", username, now, commentID, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete comment report. */
    public static deleteCommentReport = async (reportID: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "reported comments" WHERE "reported comments"."reportID" = $1`,
        values: [reportID]
        }
        await SQLQuery.run(query)
    }
    
    /** Insert thread report. */
    public static insertThreadReport = async (username: string, threadID: string, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "reported threads" ("type", "reporter", "reportDate", "threadID", "reason") 
            VALUES ($1, $2, $3, $4, $5) RETURNING "reportID"`,
            rowMode: "array",
            values: ["thread", username, now, threadID, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete comment report. */
    public static deleteThreadReport = async (reportID: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "reported threads" WHERE "reported threads"."reportID" = $1`,
        values: [reportID]
        }
        await SQLQuery.run(query)
    }

    /** Insert reply report. */
    public static insertReplyReport = async (username: string, replyID: string, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "reported replies" ("type", "reporter", "reportDate", "replyID", "reason") 
            VALUES ($1, $2, $3, $4, $5) RETURNING "reportID"`,
            rowMode: "array",
            values: ["reply", username, now, replyID, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete reply report. */
    public static deleteReplyReport = async (reportID: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "reported replies" WHERE "reported replies"."reportID" = $1`,
        values: [reportID]
        }
        await SQLQuery.run(query)
    }

    /** Get reports */
    public static reports = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH reports AS (
                SELECT * FROM "reported replies"
                UNION
                SELECT * FROM "reported threads"
                UNION
                SELECT * FROM "reported comments"
            )
            SELECT reports."replyID" AS id, reports."reportID", reports.type, reports.reporter,
            reports."reportDate", reports.reason, users.image, users."imagePost", users."imageHash",
            COUNT(*) OVER() AS "reportCount"
            FROM reports
            JOIN users ON users.username = reports.reporter
            ORDER BY reports."reportDate" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<Report[]>
    }

    /** Get user reports */
    public static userReports = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH reports AS (
            SELECT * FROM "reported replies"
            UNION
            SELECT * FROM "reported threads"
            UNION
            SELECT * FROM "reported comments"
            )
            SELECT reports."replyID" AS id, reports."reportID", reports.type, reports.reporter,
            reports."reportDate", reports.reason, users.image, users."imagePost", users."imageHash"
            FROM reports
            JOIN users ON users.username = reports.reporter
            WHERE reports.reporter = $1
            ORDER BY reports."reportDate" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<Report[]>
    }
    
    /** Insert ban */
    public static insertBan = async (username: string, ip: string, banner: string, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO bans ("username", "ip", "banner", "banDate", "reason", "active") 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING "banID"`,
            rowMode: "array",
            values: [username, ip, banner, now, reason, true]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete ban */
    public static deleteBan = async (banID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM bans WHERE bans."banID" = $1`),
        values: [banID]
        }
        await SQLQuery.run(query)
    }

    /** Update ban */
    public static updateBan = async (banID: string, column: "active", value: string | number | boolean | null) => {
        let whitelist = ["active"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE bans SET "${column}" = $1 WHERE "banID" = $2`,
            values: [value, banID]
        }
        await SQLQuery.run(query)
    }

    /** Get active ban */
    public static activeBan = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`SELECT * FROM bans WHERE bans."username" = $1 AND bans."active" = true`),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Ban | undefined>
    }

    /** Get banned IP */
    public static activeBannedIP = async (ip: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`SELECT * FROM bans WHERE bans."ip" = $1 AND bans."active" = true`),
        values: [ip]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Ban | undefined>
    }

    /** Insert blacklist */
    public static insertBlacklist = async (ip: string, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO blacklist ("ip", "reason", "blacklistDate") VALUES ($1, $2, $3)`,
            values: [ip, reason, now]
        }
        await SQLQuery.run(query)
    }

    /** Delete blacklist */
    public static deleteBlacklist = async (ip: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM blacklist WHERE blacklist."ip" = $1`,
            values: [ip]
        }
        await SQLQuery.run(query)
    }

    /** Get blacklist */
    public static blacklist = async () => {
        const query: QueryConfig = {
            text: /*sql*/`SELECT * FROM blacklist`
        }
        return SQLQuery.run(query) as Promise<Blacklist[]>
    }
}