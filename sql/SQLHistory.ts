import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLHistory {
    /** Insert tag history */
    public static insertTagHistory = async (username: string, tag: string, key: string, type: string, image?: string, description?: string, 
        aliases?: string[], implications?: string[], pixivTags?: string[], website?: string, social?: string, twitter?: string, fandom?: string, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tag history" ("tag", "user", "date", "key", "type", "image", "description", "aliases", "implications", "pixivTags", "website", "social", "twitter", "fandom", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        values: [tag, username, now, key, type, image, description, aliases, implications, pixivTags, website, social, twitter, fandom, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete tag history */
    public static deleteTagHistory = async (historyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "tag history" WHERE "tag history"."historyID" = $1`),
        values: [historyID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get tag history */
    public static tagHistory = async (tag?: string, offset?: string) => {
        let i = 1
        let values = [] as any
        let tagValue = i
        if (tag) {
            values.push(tag)
            i++
        }
        if (offset) values.push(offset)
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "tag history"
                ${tag ? `WHERE "tag history"."tag" = $${tagValue}` : ""}
                GROUP BY "tag history"."historyID"
                ORDER BY "tag history"."date" DESC
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get tag history ID */
    public static tagHistoryID = async (tag: string, historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag history".*
                FROM "tag history"
                WHERE "tag history"."tag" = $1 AND "tag history"."historyID" = $2
            `),
            values: [tag, historyID]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Get user tag history */
    public static userTagHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "tag history"
                WHERE "tag history"."user" = $1
                GROUP BY "tag history"."historyID"
                ORDER BY "tag history"."date" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Insert post history */
    public static insertPostHistory = async (options: {username: string, postID: number, images: string[], uploader: string, 
        updater?: string, uploadDate: string, updatedDate: string, type: string, restrict: string, style: string, thirdParty: string, 
        title: string, translatedTitle: string, drawn: string, artist: string, link: string, hasUpscaled: boolean, hasOriginal: boolean,
        commentary: string, translatedCommentary: string, bookmarks: string, purchaseLink: string, mirrors: string, artists: string[], characters: string[], 
        series: string[], tags: string[], reason: string}) => {
        const {postID, username, images, uploader, updater, uploadDate, updatedDate, type, restrict, style, thirdParty, title, 
        translatedTitle, drawn, artist, link, commentary, translatedCommentary, bookmarks, purchaseLink, mirrors, hasOriginal, hasUpscaled, 
        artists, characters, series, tags, reason} = options
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "post history" ("postID", "user", "date", "images", "uploader", "updater", "uploadDate", "updatedDate",
        "type", "restrict", "style", "thirdParty", "title", "translatedTitle", "drawn", "artist", "link", "commentary",
        "translatedCommentary", "bookmarks", "purchaseLink", "mirrors", "hasOriginal", "hasUpscaled", "artists", "characters", "series", "tags", "reason") VALUES ($1, $2, 
            $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`,
            values: [postID, username, now, images, uploader, updater, uploadDate, updatedDate, type, restrict, style, thirdParty, 
            title, translatedTitle, drawn, artist, link, commentary, translatedCommentary, bookmarks, purchaseLink, mirrors, hasOriginal, hasUpscaled, 
            artists, characters, series, tags, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete post history */
    public static deletePostHistory = async (historyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "post history" WHERE "post history"."historyID" = $1`),
        values: [historyID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get post history */
    public static postHistory = async (postID?: string | number, offset?: string) => {
        let i = 1
        let values = [] as any
        let postValue = i
        if (postID) {
            values.push(postID)
            i++
        }
        if (offset) values.push(offset)
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "post history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "post history"
                ${postID ? `WHERE "post history"."postID" = $${postValue}` : ""}
                GROUP BY "post history"."historyID"
                ORDER BY "post history"."date" DESC
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get post history */
    public static postHistoryID = async (postID: string | number, historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "post history".*
                FROM "post history"
                WHERE "post history"."postID" = $1 AND "post history"."historyID" = $2
            `),
            values: [postID, historyID]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Get user post history */
    public static userPostHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "post history".*
                FROM "post history"
                WHERE "post history"."user" = $1
                GROUP BY "post history"."historyID"
                ORDER BY "post history"."date" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Insert translation history */
    public static insertTranslationHistory = async (postID: number, order: number, updater: string, data: any, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "translation history" ("postID", "order", "updater", "updatedDate", "data", "reason") VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [postID, order, updater, now, data, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete translation history */
    public static deleteTranslationHistory = async (historyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "translation history" WHERE "translation history"."historyID" = $1`),
        values: [historyID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get translation history */
    public static translationHistory = async (postID?: string, order?: string, offset?: string) => {
        let i = 1
        let values = [] as any
        let postValue = i
        if (postID) {
            values.push(postID)
            i++
        }
        let orderValue = i
        if (order) {
            values.push(order)
            i++
        }
        if (offset) values.push(offset)
        let whereArr = [] as string[]
        if (postID) whereArr.push(`"translation history"."postID" = $${postValue}`)
        if (order) whereArr.push(`"translation history"."order" = $${orderValue}`)
        const whereQueries = whereArr.length ? `WHERE ${whereArr.join(" AND ")}` : ""
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT "translation history".*, 
                COUNT(*) OVER() AS "historyCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "translation history"
                JOIN post_json ON post_json."postID" = "translation history"."postID"
                ${whereQueries}
                GROUP BY "translation history"."historyID"
                ORDER BY "translation history"."updatedDate" DESC
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
        `),
        values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get translation history id */
    public static translationHistoryID = async (postID?: string, historyID?: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    WITH post_json AS (
                        SELECT posts.*, json_agg(DISTINCT images.*) AS images
                        FROM posts
                        JOIN images ON images."postID" = posts."postID"
                        GROUP BY posts."postID"
                    )
                    SELECT "translation history".*, 
                    COUNT(*) OVER() AS "historyCount",
                    to_json((array_agg(post_json.*))[1]) AS post
                    FROM "translation history"
                    JOIN post_json ON post_json."postID" = "translation history"."postID"
                    WHERE "translation history"."postID" = $1 AND "translation history"."historyID" = $2
                    GROUP BY "translation history"."historyID"
            `),
            values: [postID, historyID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user translation history */
    public static userTranslationHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT "translation history".*, 
                COUNT(*) OVER() AS "historyCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "translation history"
                JOIN post_json ON post_json."postID" = "translation history"."postID"
                WHERE "translation history"."updater" = $1
                GROUP BY "translation history"."historyID"
                ORDER BY "translation history"."updatedDate" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert group history */
    public static insertGroupHistory = async (username: string, groupID: string, slug: string, name: string, restrict: string, 
        description: string, posts: any, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "group history" ("groupID", "user", "date", "slug", "name", "restrict", "description", "posts", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            values: [groupID, username, now, slug, name, restrict, description, posts, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete group history */
    public static deleteGroupHistory = async (historyID: number) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM "group history" WHERE "group history"."historyID" = $1`),
            values: [historyID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get group history */
    public static groupHistory = async (groupID?: string, offset?: string) => {
        let i = 1
        let values = [] as any
        let groupValue = i
        if (groupID) {
            values.push(groupID)
            i++
        }
        if (offset) values.push(offset)
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "group history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "group history"
                ${groupID ? `WHERE "group history"."groupID" = $${groupValue}` : ""}
                GROUP BY "group history"."historyID"
                ORDER BY "group history"."date" DESC
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get group history ID */
    public static groupHistoryID = async (groupID: string, historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "group history".*
                FROM "group history"
                WHERE "group history"."groupID" = $1 AND "group history"."historyID" = $2
            `),
            values: [groupID, historyID]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Get user group history */
    public static userGroupHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "group history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "group history"
                WHERE "group history"."user" = $1
                GROUP BY "group history"."historyID"
                ORDER BY "group history"."date" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Update search history view date */
    public static updateSearchHistory = async (username: string, postID: number) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`
                INSERT INTO "history" ("username", "postID", "viewDate") 
                VALUES ($1, $2, $3)
                ON CONFLICT ("username", "postID") 
                DO UPDATE SET "viewDate" = $3
            `,
            values: [username, postID, now]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete search history */
    public static deleteSearchHistory = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "history" WHERE "history"."postID" = $1 AND "history"."username" = $2`),
        values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete user search history */
    public static deleteAllSearchHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "history" WHERE "history"."username" = $1`),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user search history */
    public static userSearchHistory = async (username: string, limit?: string, offset?: string, type?: string, restrict?: string, style?: string, sort?: string, sessionUsername?: string) => {
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
        if (!sort || sort === "date") sortQuery = `ORDER BY "history"."viewDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY "history"."viewDate" ASC`
        if (sort === "drawn") sortQuery = `ORDER BY post_json.drawn DESC NULLS LAST`
        if (sort === "reverse drawn") sortQuery = `ORDER BY post_json.drawn ASC NULLS LAST`
        if (sort === "cuteness") sortQuery = `ORDER BY post_json."cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY post_json."cuteness" ASC`
        if (sort === "popularity") sortQuery = `ORDER BY post_json."favoriteCount" DESC`
        if (sort === "reverse popularity") sortQuery = `ORDER BY post_json."favoriteCount" ASC`
        if (sort === "variations") sortQuery = `ORDER BY post_json."imageCount" DESC`
        if (sort === "reverse variations") sortQuery = `ORDER BY post_json."imageCount" ASC`
        if (sort === "thirdparty") sortQuery = `ORDER BY "hasThirdParty" DESC`
        if (sort === "reverse thirdparty") sortQuery = `ORDER BY "hasThirdParty" ASC`
        if (sort === "groups") sortQuery = `ORDER BY "isGrouped" DESC`
        if (sort === "reverse groups") sortQuery = `ORDER BY "isGrouped" ASC`
        if (sort === "tagcount") sortQuery = `ORDER BY post_json."tagCount" DESC`
        if (sort === "reverse tagcount") sortQuery = `ORDER BY post_json."tagCount" ASC`
        if (sort === "filesize") sortQuery = `ORDER BY post_json."imageSize" DESC`
        if (sort === "reverse filesize") sortQuery = `ORDER BY post_json."imageSize" ASC`
        if (sort === "width") sortQuery = `ORDER BY post_json."imageWidth" DESC`
        if (sort === "reverse width") sortQuery = `ORDER BY post_json."imageWidth" ASC`
        if (sort === "height") sortQuery = `ORDER BY post_json."imageHeight" DESC`
        if (sort === "reverse height") sortQuery = `ORDER BY post_json."imageHeight" ASC`
        if (sort === "bookmarks") sortQuery = `ORDER BY post_json.bookmarks DESC NULLS LAST`
        if (sort === "reverse bookmarks") sortQuery = `ORDER BY post_json.bookmarks ASC NULLS LAST`
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
                )
                SELECT "history".*,
                COUNT(*) OVER() AS "historyCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "history"
                JOIN post_json ON post_json."postID" = "history"."postID"
                WHERE "history"."username" = $1
                GROUP BY "history"."username", "history"."postID", post_json."uploadDate", post_json.drawn, post_json."thirdParty",
                post_json.bookmarks, post_json."cuteness", post_json."favoriteCount", post_json."imageCount", post_json."imageSize", 
                post_json."imageWidth", post_json."imageHeight"${includeTags ? `, post_json."tagCount"` : ""}
                ${sortQuery}
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result
    }
}