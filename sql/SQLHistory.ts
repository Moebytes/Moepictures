import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLHistory {
    /** Insert tag history */
    public static insertTagHistory = async (options: {username: string, tag: string, key: string, type: string, image: string, imageHash: string, description: string, 
        aliases: string[], implications: string[], pixivTags: string[], website: string, social: string, twitter: string, fandom: string, r18: boolean, 
        imageChanged: boolean, changes: any, reason?: string}) => {
        const {username, tag, key, type, image, imageHash, description, aliases, implications, pixivTags, website, social, twitter, fandom, r18, imageChanged, 
        changes, reason} = options
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tag history" ("tag", "user", "date", "key", "type", "image", "imageHash", "description", "aliases", "implications", 
        "pixivTags", "website", "social", "twitter", "fandom", "r18", "imageChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        values: [tag, username, now, key, type, image, imageHash, description, aliases, implications, pixivTags, website, social, twitter, fandom, r18,
        imageChanged, changes, reason]
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

    /** Update tag history */
    public static updateTagHistory = async (historyID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "tag history" SET "${column}" = $1 WHERE "historyID" = $2`,
            values: [value, historyID]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Get tag history */
    public static tagHistory = async (tag?: string, offset?: string, search?: string) => {
        let i = 1
        let values = [] as any
        let searchValue = i
        let searchQuery = ""
        if (search) {
            values.push(search)
            searchQuery = "(" + `"tag history"."changes"::text ILIKE '%' || $${searchValue} || '%' 
            ${search.toLowerCase().includes("image updated") ? `OR "tag history"."imageChanged" = true` : ""}` + ")"
            i++
        }
        let tagValue = i
        let tagQuery = ""
        if (tag) {
            values.push(tag)
            tagQuery = `"tag history"."tag" = $${tagValue}`
            i++
        }
        if (offset) values.push(offset)
        const whereQueries = [searchQuery, tagQuery].filter(Boolean).join(" AND ")
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "tag history"
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
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
        updater?: string, uploadDate: string, updatedDate: string, type: string, restrict: string, style: string, child: string, 
        title: string, translatedTitle: string, posted: string, artist: string, link: string, hasUpscaled: boolean, hasOriginal: boolean,
        commentary: string, translatedCommentary: string, bookmarks: string, purchaseLink: string, mirrors: string, slug: string, artists: string[], characters: string[], 
        series: string[], tags: string[], addedTags: string[], removedTags: string[], imageChanged: boolean, changes: any, reason: string}) => {
        const {postID, username, images, uploader, updater, uploadDate, updatedDate, type, restrict, style, child, title, 
        translatedTitle, posted, artist, link, commentary, translatedCommentary, bookmarks, purchaseLink, mirrors, hasOriginal, hasUpscaled, 
        slug, artists, characters, series, tags, addedTags, removedTags, imageChanged, changes, reason} = options
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "post history" ("postID", "user", "date", "images", "uploader", "updater", "uploadDate", "updatedDate",
        "type", "restrict", "style", "child", "title", "translatedTitle", "posted", "artist", "link", "commentary", "translatedCommentary", 
        "bookmarks", "purchaseLink", "mirrors", "slug", "hasOriginal", "hasUpscaled", "artists", "characters", "series", "tags", "addedTags", "removedTags",
        "imageChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 
            $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)`,
            values: [postID, username, now, images, uploader, updater, uploadDate, updatedDate, type, restrict, style, child, title, translatedTitle, 
            posted, artist, link, commentary, translatedCommentary, bookmarks, purchaseLink, mirrors, slug, hasOriginal, hasUpscaled, artists, characters, series, 
            tags, addedTags, removedTags, imageChanged, changes, reason]
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

    /** Update post history */
    public static updatePostHistory = async (historyID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "post history" SET "${column}" = $1 WHERE "historyID" = $2`,
            values: [value, historyID]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Get post history */
    public static postHistory = async (postID?: string | number, offset?: string, search?: string) => {
        let i = 1
        let values = [] as any
        let searchValue = i
        let searchQuery = ""
        if (search) {
            values.push(search)
            searchQuery = "(" + `array_to_string("post history"."addedTags", ' ') ILIKE '%' || $${searchValue} || '%' 
            OR array_to_string("post history"."removedTags", ' ') ILIKE '%' || $${searchValue} || '%' OR
            "post history"."changes"::text ILIKE '%' || $${searchValue} || '%' 
            ${search.toLowerCase().includes("image updated") ? `OR "post history"."imageChanged" = true` : ""}` + ")"
            i++
        }
        let postValue = i
        let postQuery = ""
        if (postID) {
            values.push(postID)
            postQuery =`"post history"."postID" = $${postValue}`
            i++
        }
        if (offset) values.push(offset)
        const whereQueries = [searchQuery, postQuery].filter(Boolean).join(" AND ")
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "post history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "post history"
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
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
                SELECT "post history".*,
                COUNT(*) OVER() AS "historyCount"
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
    public static insertTranslationHistory = async (options: {postID: number, order: number, updater: string, data: any, addedEntries: any, removedEntries: any, reason?: string}) => {
        const {postID, order, updater, data, addedEntries, removedEntries, reason} = options
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "translation history" ("postID", "order", "updater", "updatedDate", "data", "addedEntries", "removedEntries", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        values: [postID, order, updater, now, data, addedEntries, removedEntries, reason]
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
    public static translationHistory = async (postID?: string, order?: string, offset?: string, search?: string) => {
        let i = 1
        let values = [] as any
        let searchValue = i
        let searchQuery = ""
        if (search) {
            values.push(search)
            searchQuery = "(" + `array_to_string("translation history"."addedEntries", ' ') ILIKE '%' || $${searchValue} || '%' 
            OR array_to_string("translation history"."removedEntries", ' ') ILIKE '%' || $${searchValue} || '%'` + ")"
            i++
        }
        let postValue = i
        let postQuery = ""
        if (postID) {
            values.push(postID)
            postQuery = `"translation history"."postID" = $${postValue}`
            i++
        }
        let orderValue = i
        let orderQuery = ""
        if (order) {
            values.push(order)
            orderQuery = `"translation history"."order" = $${orderValue}`
            i++
        }
        if (offset) values.push(offset)
        const whereQueries = [searchQuery, postQuery, orderQuery].filter(Boolean).join(" AND ")
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
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
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
    public static insertGroupHistory = async (options: {username: string, groupID: string, slug: string, name: string, date: string, restrict: string, 
        description: string, posts: any, addedPosts: string[], removedPosts: string[], orderChanged: boolean, changes: any, reason?: string}) => {
        const {username, groupID, slug, name, date, restrict, description, posts, addedPosts, removedPosts, orderChanged, changes, reason} = options
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "group history" ("groupID", "user", "date", "slug", "name", "restrict", "description", "posts", "addedPosts",
            "removedPosts", "orderChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            values: [groupID, username, date, slug, name, restrict, description, posts, addedPosts, removedPosts, orderChanged, changes, reason]
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
    public static groupHistory = async (groupID?: string, offset?: string, search?: string) => {
        let i = 1
        let values = [] as any
        let searchValue = i
        let searchQuery = ""
        if (search) {
            values.push(search)
            searchQuery = "(" + `array_to_string("group history"."addedPosts", ' ') ILIKE '%' || $${searchValue} || '%' 
            OR array_to_string("group history"."removedPosts", ' ') ILIKE '%' || $${searchValue} || '%' OR
            "group history"."changes"::text ILIKE '%' || $${searchValue} || '%' 
            ${search.toLowerCase().includes("order updated") ? `OR "group history"."orderChanged" = true` : ""}` + ")"
            i++
        }
        let groupValue = i
        let groupQuery = ""
        if (groupID) {
            values.push(groupID)
            groupQuery = `"group history"."groupID" = $${groupValue}`
            i++
        }
        if (offset) values.push(offset)
        const whereQueries = [searchQuery, groupQuery].filter(Boolean).join(" AND ")
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "group history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "group history"
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
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
    public static userSearchHistory = async (username: string, limit?: string, offset?: string, search?: string, type?: string, restrict?: string, style?: string, sort?: string, sessionUsername?: string) => {
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
        if (sort === "posted") sortQuery = `ORDER BY post_json.posted DESC NULLS LAST`
        if (sort === "reverse posted") sortQuery = `ORDER BY post_json.posted ASC NULLS LAST`
        if (sort === "cuteness") sortQuery = `ORDER BY post_json."cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY post_json."cuteness" ASC`
        if (sort === "popularity") sortQuery = `ORDER BY post_json."favoriteCount" DESC`
        if (sort === "reverse popularity") sortQuery = `ORDER BY post_json."favoriteCount" ASC`
        if (sort === "variations") sortQuery = `ORDER BY post_json."imageCount" DESC`
        if (sort === "reverse variations") sortQuery = `ORDER BY post_json."imageCount" ASC`
        if (sort === "children") sortQuery = `ORDER BY "hasChildren" DESC`
        if (sort === "reverse children") sortQuery = `ORDER BY "hasChildren" ASC`
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
        if (sort === "hidden") sortQuery = `ORDER BY posts.hidden DESC NULLS LAST`
        if (sort === "reverse hidden") sortQuery = `ORDER BY posts.hidden ASC NULLS LAST`
        if (sort === "locked") sortQuery = `ORDER BY posts.locked DESC NULLS LAST`
        if (sort === "reverse locked") sortQuery = `ORDER BY posts.locked ASC NULLS LAST`
        if (sort === "private") sortQuery = `ORDER BY posts.private DESC NULLS LAST`
        if (sort === "reverse private") sortQuery = `ORDER BY posts.private ASC NULLS LAST`
        let includeTags = sort === "tagcount" || sort === "reverse tagcount"
        let i = 2
        let values = [] as any
        let searchValue = i
        if (search) {
            values.push(search)
            i++
        }
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
                        WHEN COUNT("child posts"."childID") > 0 
                        THEN true ELSE false
                    END AS "hasChildren",
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
                    LEFT JOIN "child posts" ON posts."postID" = "child posts"."parentID"
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
                ${search ? `AND (post_json."title" ILIKE '%' || $${searchValue} || '%' OR post_json."translatedTitle" ILIKE '%' || $${searchValue} || '%' 
                OR post_json."artist" ILIKE '%' || $${searchValue} || '%' OR post_json."link" ILIKE '%' || $${searchValue} || '%' 
                OR post_json."mirrors"::text ILIKE '%' || $${searchValue} || '%')` : ""}
                GROUP BY "history"."username", "history"."postID", post_json."uploadDate", post_json.posted, post_json."child",
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