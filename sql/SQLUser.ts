import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import axios from "axios"

export default class SQLUser {
    /** Get uploads. */
    public static uploads = async (username: string, limit?: string, offset?: string, type?: string, restrict?: string, style?: string, sort?: string, sessionUsername?: string) => {
        let typeQuery = ""
        if (type === "image") typeQuery = `posts.type = 'image'`
        if (type === "animation") typeQuery = `posts.type = 'animation'`
        if (type === "video") typeQuery = `posts.type = 'video'`
        if (type === "comic") typeQuery = `posts.type = 'comic'`
        if (type === "audio") typeQuery = `posts.type = 'audio'`
        if (type === "model") typeQuery = `posts.type = 'model'`
        let restrictQuery = ""
        if (restrict === "safe") restrictQuery = `posts.restrict = 'safe'`
        if (restrict === "questionable") restrictQuery = `posts.restrict = 'questionable'`
        if (restrict === "explicit") restrictQuery = `posts.restrict = 'explicit'`
        if (restrict === "all") restrictQuery = `(posts.restrict = 'safe' OR posts.restrict = 'questionable')`
        let styleQuery = ""
        if (style === "2d") styleQuery = `lower(posts.style) = '2d'`
        if (style === "3d") styleQuery = `lower(posts.style) = '3d'`
        if (style === "pixel") styleQuery = `posts.style = 'pixel'`
        if (style === "chibi") styleQuery = `posts.style = 'chibi'`
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (!sort || sort === "date") sortQuery = `ORDER BY posts."uploadDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY posts."uploadDate" ASC`
        if (sort === "drawn") sortQuery = `ORDER BY posts.drawn DESC NULLS LAST`
        if (sort === "reverse drawn") sortQuery = `ORDER BY posts.drawn ASC NULLS LAST`
        if (sort === "cuteness") sortQuery = `ORDER BY "cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY "cuteness" ASC`
        if (sort === "popularity") sortQuery = `ORDER BY "favoriteCount" DESC`
        if (sort === "reverse popularity") sortQuery = `ORDER BY "favoriteCount" ASC`
        if (sort === "variations") sortQuery = `ORDER BY "imageCount" DESC`
        if (sort === "reverse variations") sortQuery = `ORDER BY "imageCount" ASC`
        if (sort === "thirdparty") sortQuery = `ORDER BY "hasThirdParty" DESC`
        if (sort === "reverse thirdparty") sortQuery = `ORDER BY "hasThirdParty" ASC`
        if (sort === "groups") sortQuery = `ORDER BY "isGrouped" DESC`
        if (sort === "reverse groups") sortQuery = `ORDER BY "isGrouped" ASC`
        if (sort === "tagcount") sortQuery = `ORDER BY "tagCount" DESC`
        if (sort === "reverse tagcount") sortQuery = `ORDER BY "tagCount" ASC`
        if (sort === "filesize") sortQuery = `ORDER BY "imageSize" DESC`
        if (sort === "reverse filesize") sortQuery = `ORDER BY "imageSize" ASC`
        if (sort === "width") sortQuery = `ORDER BY "imageWidth" DESC`
        if (sort === "reverse width") sortQuery = `ORDER BY "imageWidth" ASC`
        if (sort === "height") sortQuery = `ORDER BY "imageHeight" DESC`
        if (sort === "reverse height") sortQuery = `ORDER BY "imageHeight" ASC`
        if (sort === "bookmarks") sortQuery = `ORDER BY posts.bookmarks DESC NULLS LAST`
        if (sort === "reverse bookmarks") sortQuery = `ORDER BY posts.bookmarks ASC NULLS LAST`
        if (sort === "hidden") sortQuery = `ORDER BY posts.hidden DESC NULLS LAST`
        if (sort === "reverse hidden") sortQuery = `ORDER BY posts.hidden ASC NULLS LAST`
        if (sort === "locked") sortQuery = `ORDER BY posts.locked DESC NULLS LAST`
        if (sort === "reverse locked") sortQuery = `ORDER BY posts.locked ASC NULLS LAST`
        if (sort === "private") sortQuery = `ORDER BY posts.private DESC NULLS LAST`
        if (sort === "reverse private") sortQuery = `ORDER BY posts.private ASC NULLS LAST`
        let includeTags = sort === "tagcount" || sort === "reverse tagcount"
        let i = 2
        let values = [] as any
        let userValue = i
        if (sessionUsername) {
            values.push(sessionUsername)
            i++
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = "100"
            values.push(limit)
            i++
        }
        if (offset) values.push(offset)
        const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ${includeTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
                    ${includeTags ? `COUNT(DISTINCT "tag map"."tag") AS "tagCount",` : ""}
                    MAX(DISTINCT images."size") AS "imageSize",
                    MAX(DISTINCT images."width") AS "imageWidth",
                    MAX(DISTINCT images."height") AS "imageHeight",
                    COUNT(DISTINCT images."imageID") AS "imageCount",
                    COUNT(DISTINCT favorites."username") AS "favoriteCount",
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness",
                    CASE
                        WHEN COUNT("third party"."postID") > 0 
                        THEN true ELSE false
                    END AS "hasThirdParty",
                    CASE 
                        WHEN COUNT("group map"."groupID") > 0 
                        THEN true ELSE false 
                    END AS "isGrouped"
                    ${sessionUsername ? `,
                    CASE 
                        WHEN COUNT(favorites."username") FILTER (WHERE favorites."username" = $${userValue}) > 0 
                        THEN true ELSE false
                    END AS favorited,
                    CASE
                        WHEN COUNT("favgroup map"."username") FILTER (WHERE "favgroup map"."username" = $${userValue}) > 0 
                        THEN true ELSE false
                    END AS favgrouped` : ""}
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
                    FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    LEFT JOIN "third party" ON posts."postID" = "third party"."parentID"
                    LEFT JOIN "group map" ON posts."postID" = "group map"."postID"
                    ${sessionUsername ? `LEFT JOIN "favgroup map" ON posts."postID" = "favgroup map"."postID"` : ""}
                    ${whereQueries ? `WHERE ${whereQueries}` : ""}
                    GROUP BY posts."postID"
                    ${sortQuery}
                )
                SELECT post_json.*,
                COUNT(*) OVER() AS "postCount"
                FROM post_json
                WHERE post_json."uploader" = $1
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
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
            text: `SELECT * FROM users WHERE users."role" = 'admin'`
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
}