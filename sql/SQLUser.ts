/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../functions/Functions"
import {PostSearch, User, LoginHistory, Banner} from "../types/Types"

export default class SQLUser {
    /** Get uploads. */
    public static uploads = async (username: string, limit?: number, offset?: number, type?: string, rating?: string, style?: string, 
        sort?: string, showChildren?: boolean, sessionUsername?: string) => {
        let condition = `posts."uploader" = $1`
        const {postJSON, countJSON, values, countValues} = 
        SQLQuery.search.boilerplate({i: 2, type, rating, style, sort, offset, 
        limit, showChildren, condition, username: sessionUsername, intermLimit: true})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT post_json.*,
                COUNT(*) OVER() AS "postCount"
                FROM post_json
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query, `user/uploads/${username}`) as PostSearch[]
        const count = await SQLQuery.search.count(countJSON, [username, ...countValues])
        result.forEach((r) => r.postCount = count)
        return result 
    }

    /** Create a new user. */
    public static insertUser = async (username: string, email: string, accountToken: string) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "users" ("username", "email", "accountToken") VALUES ($1, $2, $3) RETURNING "userID"`,
            rowMode: "array",
            values: [username, email, accountToken]
        }

        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Updates a user */
    public static updateUser = async (username: string, column: "username" | "password" | "role" | "ips" | "premium" | "premiumExpiration" | "banExpiration" | "banned"
        | "bio" | "email" | "upscaledImages" | "showTagBanner" | "downloadPixivID" | "showTagTooltips" | "showTooltips" | "emailVerified" | "$2fa" | "accountToken"
        | "image" | "imagePost" | "imageHash" | "showR18" | "savedSearches" | "autosearchInterval" | "publicFavorites" | "showRelated" | "lastLogin"
        | "postCount" | "joinDate" | "forceNoteBubbles" | "globalMusicPlayer" | "blacklist" | "cookieConsent" | "liveModelPreview" | "liveAnimationPreview" 
        | "publicTagFavorites" | "deletedPosts" | "lastNameChange" | "deleted" | "deletionDate", value?: string | number | boolean | null | string[]) => {

        let whitelist = ["username", "password", "role", "ips", "premium", "premiumExpiration", "banExpiration", "banned", "bio", "email",
        "upscaledImages", "showTagBanner", "downloadPixivID", "showTagTooltips", "showTooltips", "emailVerified", "$2fa", "accountToken",
        "image", "imagePost", "imageHash", "showR18", "savedSearches", "autosearchInterval", "publicFavorites", "showRelated", "lastLogin",
        "postCount", "joinDate", "forceNoteBubbles", "globalMusicPlayer", "blacklist", "cookieConsent", "liveModelPreview", "liveAnimationPreview",
        "publicTagFavorites", "deletedPosts", "lastNameChange", "deleted", "deletionDate"]
        
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "users" SET "${column}" = $1 WHERE "username" = $2`,
            values: [value, username]
        }
        await SQLQuery.run(query)
    }

    /** Get user. */
    public static user = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT users.*
            FROM users
            WHERE users."username" = $1
            GROUP BY users."userID"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<User | undefined>
    }

    /** Get user by email. */
    public static userByEmail = async (email: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT users.*
            FROM users
            WHERE users."email" = $1
            GROUP BY users."userID"
            `),
            values: [email]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<User | undefined>
    }

    /** Get user by accountToken. */
    public static userByAccountToken = async (accountToken: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT users.*
            FROM users
            WHERE users."accountToken" = $1
            GROUP BY users."userID"
            `),
            values: [accountToken]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<User | undefined>
    }

    /** Delete user. */
    public static deleteUser = async (username: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM users WHERE users."username" = $1`),
            values: [username]
        }
        await SQLQuery.run(query)
    }

    /** Get all admins. */
    public static admins = async () => {
        const query: QueryConfig = {
            text: /*sql*/`SELECT * FROM users WHERE users."role" = 'admin'`
        }
        const result = await SQLQuery.run(query)
        return result as Promise<User[]>
    }

    /** Insert login history. */
    public static insertLoginHistory = async (username: string, type: string, ip: string, device: string, region: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "login history" ("username", "type", "ip", "device", "region", "timestamp") 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING "loginID"`,
            rowMode: "array",
            values: [username, type, ip, device, region, now]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Get login history. */
    public static loginHistory = async (username: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT "login history".*
                FROM "login history"
                WHERE "login history"."username" = $1
                GROUP BY "login history"."loginID"
                ORDER BY "login history"."timestamp" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<LoginHistory[]>
    }

    /** Destroy other user sessions. */
    public static destroyOtherSessions = async (username: string, currentSession: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM sessions WHERE session->>'username' = $1 AND "sessionID" != $2`,
            values: [username, currentSession]
        }
        await SQLQuery.run(query)
    }

    /** Destroy other api sessions. */
    public static destroyOtherAPISessions = async (username: string, currentSession: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM sessions WHERE session->>'username' = $1 AND "sessionID" != $2 AND session->>'apiKey' = 'true'`,
            values: [username, currentSession]
        }
        await SQLQuery.run(query)
    }

    /** Destroy other ip sessions. */
    public static destroyOtherIPSessions = async (ip: string, currentSession: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM sessions WHERE session->>'ip' = $1 AND "sessionID" != $2`,
            values: [ip, currentSession]
        }
        await SQLQuery.run(query)
    }

    /** Destroy anon sessions. */
    public static pruneAnonSessions = async () => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM sessions WHERE NOT (session::jsonb ? 'username')`
        }
        await SQLQuery.run(query)
    }

    /** Prune expired sessions. */
    public static pruneExpiredSessions = async () => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM sessions WHERE expires < NOW()`
        }
        await SQLQuery.run(query)
    }

    public static countIPSessions = async (ip: string) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`SELECT COUNT(*) AS count FROM sessions WHERE session->>'ip' = $1`,
            values: [ip],
            rowMode: "array"
        }
        const result = await SQLQuery.run(query)
        return Number(result.flat(Infinity)[0])
    }

    public static pruneIPSessions = async (ip: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM sessions WHERE session->>'ip' = $1`,
            values: [ip]
        }
        await SQLQuery.run(query)
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
        await SQLQuery.run(query)
    }

    /** Get banner. */
    public static getBanner = async () => {
        const query: QueryConfig = {
            text: /*sql*/`SELECT * FROM banner`
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Banner | undefined>
    }

    /** Get deleted users. */
    public static deletedUsers = async () => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT users.*
                FROM users
                WHERE users."deleted" IS TRUE
                GROUP BY users."userID"
            `),
            values: []
        }
        const result = await SQLQuery.run(query, `search/users/deleted`)
        return result as Promise<User[]>
    }
}