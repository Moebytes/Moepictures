import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {TagHistory, PostHistory, NoteHistory, GroupHistory, SearchHistory} from "../types/Types"

export default class SQLHistory {
    /** Insert tag history */
    public static insertTagHistory = async (options: {username: string, tag: string, key: string, type: string, image: string | null, 
        imageHash: string | null, description: string, aliases: string[], implications: string[], pixivTags: string[], website: string | null, 
        social: string | null, twitter: string | null, fandom: string | null, r18: boolean | null, featured: string | null, imageChanged: boolean, 
        changes: any, reason?: string}) => {
        const {username, tag, key, type, image, imageHash, description, aliases, implications, pixivTags, website, social, 
        twitter, fandom, r18, featured, imageChanged, changes, reason} = options
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "tag history" ("tag", "user", "date", "key", "type", "image", "imageHash", "description", 
            "aliases", "implications", "pixivTags", "website", "social", "twitter", "fandom", "r18", "featured", "imageChanged", 
            "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
            RETURNING "historyID"`,
            rowMode: "array",
            values: [tag, username, now, key, type, image, imageHash, description, aliases, implications, pixivTags, website, social, 
            twitter, fandom, r18, featured, imageChanged, changes, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete tag history */
    public static deleteTagHistory = async (historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "tag history" WHERE "tag history"."historyID" = $1`),
        values: [historyID]
        }
        await SQLQuery.flushDB()
        await SQLQuery.run(query)
    }

    /** Update tag history */
    public static updateTagHistory = async (historyID: string, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "tag history" SET "${column}" = $1 WHERE "historyID" = $2`,
            values: [value, historyID]
        }
        await SQLQuery.flushDB()
        await SQLQuery.run(query)
    }

    /** Get tag history */
    public static tagHistory = async (tag?: string, offset?: number, search?: string) => {
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
        return result as Promise<TagHistory[]>
    }

    /** Get tag history ID */
    public static tagHistoryID = async (tag: string, historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "tag history"
                WHERE "tag history"."tag" = $1 AND "tag history"."historyID" = $2
            `),
            values: [tag, historyID]
        }
        const result = await SQLQuery.run(query, true)
        return result[0] as Promise<TagHistory | undefined>
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
        return result as Promise<TagHistory[]>
    }

    /** Insert post history */
    public static insertPostHistory = async (options: {username: string, postID: string, images: string[], uploader: string, 
        updater: string, uploadDate: string, updatedDate: string, type: string, rating: string, style: string, parentID: string | null, 
        title: string, englishTitle: string, posted: string, artist: string, source: string, hasUpscaled: boolean | null, hasOriginal: boolean | null, 
        commentary: string, englishCommentary: string, bookmarks: number, buyLink: string | null, mirrors: string, slug: string | null, artists: string[], 
        characters: string[], series: string[], tags: string[], addedTags: string[], removedTags: string[], imageChanged: boolean, 
        changes: any, reason?: string | null}) => {
        const {postID, username, images, uploader, updater, uploadDate, updatedDate, type, rating, style, parentID, title, 
        englishTitle, posted, artist, source, commentary, englishCommentary, bookmarks, buyLink, mirrors, hasOriginal, hasUpscaled, 
        slug, artists, characters, series, tags, addedTags, removedTags, imageChanged, changes, reason} = options
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "post history" ("postID", "user", "date", "images", "uploader", "updater", "uploadDate", "updatedDate",
            "type", "rating", "style", "parentID", "title", "englishTitle", "posted", "artist", "source", "commentary", "englishCommentary", 
            "bookmarks", "buyLink", "mirrors", "slug", "hasOriginal", "hasUpscaled", "artists", "characters", "series", "tags", "addedTags", 
            "removedTags", "imageChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34) RETURNING "historyID"`,
            rowMode: "array",
            values: [postID, username, now, images, uploader, updater, uploadDate, updatedDate, type, rating, style, parentID, title, 
            englishTitle, posted, artist, source, commentary, englishCommentary, bookmarks, buyLink, mirrors, slug, hasOriginal, hasUpscaled, 
            artists, characters, series, tags, addedTags, removedTags, imageChanged, changes, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete post history */
    public static deletePostHistory = async (historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "post history" WHERE "post history"."historyID" = $1`),
        values: [historyID]
        }
        await SQLQuery.flushDB()
        await SQLQuery.run(query)
    }

    /** Update post history */
    public static updatePostHistory = async (historyID: string, column: string, value: string | number | boolean | string[]) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "post history" SET "${column}" = $1 WHERE "historyID" = $2`,
            values: [value, historyID]
        }
        await SQLQuery.flushDB()
        await SQLQuery.run(query)
    }

    /** Get post history */
    public static postHistory = async (postID?: string | number, offset?: number, search?: string) => {
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
        return result as Promise<PostHistory[]>
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
        return result[0] as Promise<PostHistory | undefined>
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
        return result as Promise<PostHistory[]>
    }

    /** Insert note history */
    public static insertNoteHistory = async (options: {postID: string, order: number, updater: string, notes: any, addedEntries: any, 
        removedEntries: any, reason?: string}) => {
        const {postID, order, updater, notes, addedEntries, removedEntries, reason} = options
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "note history" ("postID", "order", "updater", "updatedDate", "notes", "addedEntries", 
            "removedEntries", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "historyID"`,
            rowMode: "array",
            values: [postID, order, updater, now, notes, addedEntries, removedEntries, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete note history */
    public static deleteNoteHistory = async (historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "note history" WHERE "note history"."historyID" = $1`),
        values: [historyID]
        }
        await SQLQuery.run(query)
    }

    /** Get note history */
    public static noteHistory = async (postID?: string, order?: number, offset?: number, search?: string) => {
        let i = 1
        let values = [] as any
        let searchValue = i
        let searchQuery = ""
        if (search) {
            values.push(search)
            searchQuery = "(" + `array_to_string("note history"."addedEntries", ' ') ILIKE '%' || $${searchValue} || '%' 
            OR array_to_string("note history"."removedEntries", ' ') ILIKE '%' || $${searchValue} || '%'` + ")"
            i++
        }
        let postValue = i
        let postQuery = ""
        if (postID) {
            values.push(postID)
            postQuery = `"note history"."postID" = $${postValue}`
            i++
        }
        let orderValue = i
        let orderQuery = ""
        if (order) {
            values.push(order)
            orderQuery = `"note history"."order" = $${orderValue}`
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
                SELECT "note history".*, 
                COUNT(*) OVER() AS "historyCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "note history"
                JOIN post_json ON post_json."postID" = "note history"."postID"
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
                GROUP BY "note history"."historyID"
                ORDER BY "note history"."updatedDate" DESC
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
        `),
        values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query)
        return result as Promise<NoteHistory[]>
    }

    /** Get note history id */
    public static noteHistoryID = async (postID?: string, historyID?: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    WITH post_json AS (
                        SELECT posts.*, json_agg(DISTINCT images.*) AS images
                        FROM posts
                        JOIN images ON images."postID" = posts."postID"
                        GROUP BY posts."postID"
                    )
                    SELECT "note history".*, 
                    COUNT(*) OVER() AS "historyCount",
                    to_json((array_agg(post_json.*))[1]) AS post
                    FROM "note history"
                    JOIN post_json ON post_json."postID" = "note history"."postID"
                    WHERE "note history"."postID" = $1 AND "note history"."historyID" = $2
                    GROUP BY "note history"."historyID"
            `),
            values: [postID, historyID]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<NoteHistory>
    }

    /** Get user note history */
    public static userNoteHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT "note history".*, 
                COUNT(*) OVER() AS "historyCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "note history"
                JOIN post_json ON post_json."postID" = "note history"."postID"
                WHERE "note history"."updater" = $1
                GROUP BY "note history"."historyID"
                ORDER BY "note history"."updatedDate" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<NoteHistory[]>
    }

    /** Insert group history */
    public static insertGroupHistory = async (options: {username: string, groupID: string, slug: string, name: string, date: string, 
        rating: string, description: string, posts: any, addedPosts: string[], removedPosts: string[], orderChanged: boolean, 
        changes: any, reason?: string}) => {
        const {username, groupID, slug, name, date, rating, description, posts, addedPosts, removedPosts, orderChanged, changes, 
        reason} = options
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "group history" ("groupID", "user", "date", "slug", "name", "rating", "description", "posts", 
            "addedPosts", "removedPosts", "orderChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
            $12, $13) RETURNING "historyID"`,
            rowMode: "array",
            values: [groupID, username, date, slug, name, rating, description, posts, addedPosts, removedPosts, orderChanged, 
            changes, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete group history */
    public static deleteGroupHistory = async (historyID: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM "group history" WHERE "group history"."historyID" = $1`),
            values: [historyID]
        }
        await SQLQuery.flushDB()
        await SQLQuery.run(query)
    }

    /** Get group history */
    public static groupHistory = async (groupID?: string, offset?: number, search?: string) => {
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
        return result as Promise<GroupHistory[]>
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
        return result[0] as Promise<GroupHistory | undefined>
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
        return result as Promise<GroupHistory[]>
    }

    /** Update search history view date */
    public static updateSearchHistory = async (username: string, postID: string) => {
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
        await SQLQuery.run(query)
    }

    /** Delete search history */
    public static deleteSearchHistory = async (postID: string, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "history" WHERE "history"."postID" = $1 AND "history"."username" = $2`),
        values: [postID, username]
        }
        await SQLQuery.run(query)
    }

    /** Delete user search history */
    public static deleteAllSearchHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "history" WHERE "history"."username" = $1`),
        values: [username]
        }
        await SQLQuery.run(query)
    }

    /** Get user search history */
    public static userSearchHistory = async (username: string, limit?: number, offset?: number, search?: string, type?: string, 
        rating?: string, style?: string, sort?: string, showChildren?: boolean, sessionUsername?: string) => {
        if (!sort || sort === "date") sort = "viewDate"
        if (sort === "reverse date") sort = "reverse viewDate"
        const {postJSON, values, searchValue, sortQuery, includeTags, limitValue, offsetValue} = 
        SQLQuery.search.boilerplate({i: 2, search, type, rating, style, sort, offset, limit, showChildren, username: sessionUsername, 
        outerSort: true})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT "history".*,
                COUNT(*) OVER() AS "historyCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "history"
                JOIN post_json ON post_json."postID" = "history"."postID"
                WHERE "history"."username" = $1 
                ${search ? `AND (post_json."title" ILIKE '%' || $${searchValue} || '%' OR post_json."englishTitle" ILIKE '%' || 
                $${searchValue} || '%' OR post_json."artist" ILIKE '%' || $${searchValue} || '%' OR post_json."source" ILIKE '%' 
                || $${searchValue} || '%' OR post_json."mirrors"::text ILIKE '%' || $${searchValue} || '%')` : ""}
                GROUP BY "history"."username", "history"."postID", post_json."uploadDate", post_json.posted, post_json."parentID",
                post_json.bookmarks, post_json."cuteness", post_json."favoriteCount", post_json."variationCount", post_json."fileSize", 
                post_json."aspectRatio"${includeTags ? `, post_json."tagCount"` : ""}
                ${sortQuery}
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${offsetValue}` : ""}
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result as Promise<SearchHistory[]>
    }
}