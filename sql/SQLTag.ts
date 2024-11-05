import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLTag {
    /** Insert a new tag. */
    public static insertTag = async (tag: string, type?: string, creator?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tags" ("tag", "createDate"${type ? `, "type"` : ""}${creator ? `, "creator"` : ""}) 
                VALUES ($1, $2${type ? `, $3` : ""}${creator ? `, $4` : ""})`,
        values: [tag, now]
        }
        if (type) query.values?.push(type)
        if (creator) query.values?.push(creator)
        try {
            await SQLQuery.flushDB()
            await SQLQuery.run(query)
            return false
        } catch {
            return true
        }
    }

    /** Insert a new tag (all populated fields). */
    public static insertTagFromData = async (data: {tag: string, type: string, image: string, imageHash: string, description: string, creator: string, 
        createDate: string, updater: string, updatedDate: string, website: string, social: string, twitter: string, fandom: string,
        pixivTags: string[], banned: boolean, hidden: boolean, r18: boolean}) => {
        const {tag, type, image, imageHash, description, creator, createDate, updater, updatedDate, website, social, twitter, fandom, pixivTags, 
            banned, hidden, r18} = data
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "tags" ("tag", "type", "image", "imageHash", "description", "creator", "createDate", "updater", "updatedDate", 
                "website", "social", "twitter", "fandom", "pixivTags", "banned", "hidden", "r18") VALUES ($1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        values: [tag, type, image, imageHash, description, creator, createDate, updater, updatedDate, website, social, twitter, fandom, pixivTags, 
                banned, hidden, r18]
        }
        try {
            await SQLQuery.flushDB()
            await SQLQuery.run(query)
            return false
        } catch {
            return true
        }
    }

    /** Bulk insert new tags. */
    public static bulkInsertTags = async (bulkTags: any[], creator: string, noImageUpdate?: boolean) => {
        let tagValues = new Set<string>()
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < bulkTags.length; j++) {
            if (tagValues.has(bulkTags[j].tag)) continue
            tagValues.add(bulkTags[j].tag)
            valueArray.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7}, $${i + 8})`)
            rawValues.push(bulkTags[j].tag)
            rawValues.push(bulkTags[j].type)
            rawValues.push(bulkTags[j].description)
            rawValues.push(bulkTags[j].image)
            rawValues.push(bulkTags[j].imageHash)
            rawValues.push(new Date().toISOString())
            rawValues.push(creator)
            rawValues.push(new Date().toISOString())
            rawValues.push(creator)
            i += 8
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tags" ("tag", "type", "description", "image", "imageHash", "createDate", "creator", "updatedDate", "updater") ${valueQuery} 
                ON CONFLICT ("tag") DO UPDATE SET "type" = EXCLUDED."type"${noImageUpdate ? "" : ", \"image\" = EXCLUDED.\"image\", \"imageHash\" = EXCLUDED.\"imageHash\""}`,
        values: [...rawValues]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Insert a new tag (unverified). */
    public static insertUnverifiedTag = async (tag: string, type?: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "unverified tags" ("tag"${type ? `, "type"` : ""}) VALUES ($1${type ? `, $2` : ""})`,
        values: [tag]
        }
        if (type) query.values?.push(type)
        try {
        await SQLQuery.run(query)
        return false
        } catch {
        return true
        }
    }

    /** Bulk insert new tags (unverified). */
    public static bulkInsertUnverifiedTags = async (bulkTags: any[], noImageUpdate?: boolean) => {
        let tagValues = [] as any
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < bulkTags.length; j++) {
        if (tagValues.includes(bulkTags[j].tag)) continue
        tagValues.push(bulkTags[j].tag)
        valueArray.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`)
        rawValues.push(bulkTags[j].tag)
        rawValues.push(bulkTags[j].type)
        rawValues.push(bulkTags[j].description)
        rawValues.push(bulkTags[j].image)
        rawValues.push(bulkTags[j].imageHash)
        i += 4
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "unverified tags" ("tag", "type", "description", "image", "imageHash") ${valueQuery} 
                ON CONFLICT ("tag") DO UPDATE SET "type" = EXCLUDED."type"${noImageUpdate ? "" : ", \"image\" = EXCLUDED.\"image\", \"imageHash\" = EXCLUDED.\"imageHash\""}`,
        values: [...rawValues]
        }
        return SQLQuery.run(query)
    }

    /** Update a tag. */
    public static updateTag = async (tag: string, column: string, value: string | boolean) => {
        const query: QueryConfig = {
        text: /*sql*/`UPDATE "tags" SET "${column}" = $1 WHERE "tag" = $2`,
        values: [value, tag]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Update a tag (unverified). */
    public static updateUnverifiedTag = async (tag: string, column: string, value: string) => {
        const query: QueryConfig = {
        text: /*sql*/`UPDATE "unverified tags" SET "${column}" = $1 WHERE "tag" = $2`,
        values: [value, tag]
        }
        return SQLQuery.run(query)
    }

    /** Insert a new tag map. */
    public static insertTagMap = async (postID: number, tags: string[]) => {
        if (!tags.length) return
        let i = 2
        let valueArray = [] as any
        for (let j = 0; j < tags.length; j++) {
            valueArray.push(`($1, $${i})`)
            i++
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "tag map" ("postID", "tag") ${valueQuery}`,
            rowMode: "array",
            values: [postID, ...tags]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Delete tag map. */
    public static deleteTagMap = async (postID: number, tags: string[]) => {
        if (!tags.length) return
        const tagPlaceholders = tags.map((value, index) => `$${index + 2}`).join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "tag map" WHERE "postID" = $1 AND "tag" IN (${tagPlaceholders})`,
            values: [postID, ...tags]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Insert a new tag map (unverified). */
    public static insertUnverifiedTagMap = async (postID: number, tags: string[]) => {
        if (!tags.length) return
        let i = 2
        let valueArray = [] as any
        for (let j = 0; j < tags.length; j++) {
            valueArray.push(`($1, $${i})`)
            i++
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryArrayConfig = {
        text: /*sql*/`INSERT INTO "unverified tag map" ("postID", "tag") ${valueQuery}`,
        rowMode: "array",
        values: [postID, ...tags]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Delete tag map (unverified). */
    public static deleteUnverifiedTagMap = async (postID: number, tags: string[]) => {
        if (!tags.length) return
        const tagPlaceholders = tags.map((value, index) => `$${index + 2}`).join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "unverified tag map" WHERE "postID" = $1 AND "tag" IN (${tagPlaceholders})`,
            values: [postID, ...tags]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Get tags. */
    public static tags = async (tags: string[]) => {
        let whereQuery = tags?.[0] ? `WHERE "tags".tag = ANY ($1)` : ""
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT implications.*) AS implications
                    FROM tags
                    FULL JOIN aliases ON aliases."tag" = tags."tag"
                    FULL JOIN implications ON implications."tag" = tags."tag"
                    ${whereQuery}
                    GROUP BY "tags".tag
            `)
        }
        if (tags?.[0]) query.values = [tags]
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get unverified tags. */
    public static unverifiedTags = async (tags: string[]) => {
        let whereQuery = tags?.[0] ? `WHERE "unverified tags".tag = ANY ($1)` : ""
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT "unverified tags".*, json_agg(DISTINCT "unverified aliases".*) AS aliases, json_agg(DISTINCT implications.*) AS implications
                    FROM "unverified tags"
                    FULL JOIN "unverified aliases" ON "unverified aliases"."tag" = "unverified tags"."tag"
                    FULL JOIN implications ON implications."tag" = "unverified tags"."tag"
                    ${whereQuery}
                    GROUP BY "unverified tags".tag
            `)
        }
        if (tags?.[0]) query.values = [tags]
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get tag. */
    public static tag = async (tag: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT implications.*) AS implications
                    FROM tags
                    FULL JOIN aliases ON aliases."tag" = tags."tag"
                    FULL JOIN implications ON implications."tag" = tags."tag"
                    WHERE "tags".tag = $1
                    GROUP BY "tags".tag
            `),
            values: [tag]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Get tag counts. */
    public static tagCounts = async (tags: string[]) => {
        let whereQuery = tags?.[0] ? `WHERE "tag map".tag = ANY ($1)` : ""
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT "tag map".tag, "tags".type, "tags".image, "tags"."imageHash", COUNT(*) AS count
                    FROM "tag map"
                    LEFT JOIN tags ON tags."tag" = "tag map".tag
                    ${whereQuery}
                    GROUP BY "tag map".tag, "tags".type, "tags".image, "tags"."imageHash"
                    ORDER BY count DESC
            `)
        }
        if (tags?.[0]) query.values = [tags]
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get related tags. */
    public static relatedTags = async (tag: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT json_agg(DISTINCT implications.tag) AS related FROM implications
                WHERE implications.implication = $1
                GROUP BY implications."implication"
            `),
            values: [tag]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Delete tag. */
    public static deleteTag = async (tag: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM tags WHERE tags."tag" = $1`),
        values: [tag]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete tag (unverified). */
    public static deleteUnverifiedTag = async (tag: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified tags" WHERE "unverified tags"."tag" = $1`),
        values: [tag]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert aliases. */
    public static bulkInsertAliases = async (tag: string, aliases: string[]) => {
        if (!aliases?.length) return
        const placeholders = aliases.map((_, index) => `($1, $${index + 2})`).join(", ")
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "aliases" ("tag", "alias") VALUES ${placeholders}`,
            values: [tag, ...aliases]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Delete aliases. */
    public static bulkDeleteAliases = async (tag: string, aliases: string[]) => {
        if (!aliases?.length) return
        const placeholders = aliases.map((_, index) => `$${index + 2}`).join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "aliases" WHERE "tag" = $1 AND "alias" IN (${placeholders})`,
            values: [tag, ...aliases]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Insert a new alias (unverified). */
    public static insertUnverifiedAlias = async (tag: string, alias: string) => {
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "unverified aliases" ("tag", "alias") VALUES ($1, $2)`,
            values: [tag, alias]
        }
        try {
            await SQLQuery.run(query)
            return false
        } catch {
            return true
        }
    }

    /** Get alias. */
    public static alias = async (alias: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT aliases.*
                    FROM aliases
                    WHERE "aliases".alias = $1
            `),
            values: [alias]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Alias search. */
    public static aliasSearch = async (search: string) => {
        let whereQuery = ""
        if (search) whereQuery = `WHERE lower(aliases.alias) LIKE $1 || '%'`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT aliases.*
                    FROM aliases
                    ${whereQuery}
            `)
        }
        if (search) query.values = [search.toLowerCase()]
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Bulk insert implications. */
    public static bulkInsertImplications = async (tag: string, implications: string[]) => {
        if (!implications?.length) return
        const placeholders = implications.map((_, index) => `($1, $${index + 2})`).join(", ")
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO implications ("tag", "implication") VALUES ${placeholders}`,
            values: [tag, ...implications]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Bulk delete implications. */
    public static bulkDeleteImplications = async (tag: string, implications: string[]) => {
        if (!implications?.length) return
        const placeholders = implications.map((_, index) => `$${index + 2}`).join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM implications WHERE "tag" = $1 AND "implication" IN (${placeholders})`,
            values: [tag, ...implications]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Get implications. */
    public static implications = async (tag: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT implications.*
                    FROM implications
                    WHERE implications.tag = $1
            `),
            values: [tag]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Rename tag map. */
    public static renameTagMap = async (tag: string, newTag: string) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "tag map" SET "tag" = $1 WHERE "tag" = $2`,
            values: [newTag, tag]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Get tag posts. */
    public static tagPosts = async (tag: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    WITH post_json AS (
                        SELECT posts.*, json_agg(DISTINCT images.*) AS images, 
                        array_agg(DISTINCT "tag map".tag) AS tags
                        FROM posts
                        JOIN images ON posts."postID" = images."postID"
                        JOIN "tag map" ON posts."postID" = "tag map"."postID"
                        GROUP BY posts."postID"
                    )
                    SELECT "tag map"."postID",
                    to_json((array_agg(post_json.*))[1]) AS post
                    FROM "tag map"
                    JOIN post_json ON post_json."postID" = "tag map"."postID"
                    WHERE "tag map".tag = $1
                    GROUP BY "tag map"."postID"
            `),
            values: [tag]
        }
        const result = await SQLQuery.run(query)
        return result.map((r: any) => r.post)
    }

    /** Get tag from pixiv tag. */
    public static tagFromPixivTag = async (pixivTag: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT tags.*
                    FROM tags
                    WHERE "tags"."pixivTags" @> ARRAY[$1]
            `),
            values: [pixivTag]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Insert alias history */
    public static insertAliasHistory = async (username: string, source: string, target: string, type: string, 
        affectedPosts: any, sourceData: any, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "alias history" ("user", "date", "source", "target", "type", "affectedPosts", "sourceData", 
            "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            values: [username, now, source, target, type, affectedPosts, sourceData, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete alias history */
    public static deleteAliasHistory = async (historyID: number) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM "alias history" WHERE "alias history"."historyID" = $1`),
            values: [historyID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert implication history */
    public static insertImplicationHistory = async (username: string, source: string, target: string, type: string, 
        affectedPosts: any, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "implication history" ("user", "date", "source", "target", "type", "affectedPosts", 
            "reason") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            values: [username, now, source, target, type, affectedPosts, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete implication history */
    public static deleteImplicationHistory = async (historyID: number) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM "implication history" WHERE "implication history"."historyID" = $1`),
            values: [historyID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get alias history ID */
    public static aliasHistoryID = async (historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "alias history".*
                FROM "alias history"
                WHERE "alias history"."historyID" = $1
            `),
            values: [historyID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get implication history ID */
    public static implicationHistoryID = async (historyID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "implication history".*
                FROM "implication history"
                WHERE "implication history"."historyID" = $1
            `),
            values: [historyID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get alias/implication history */
    public static aliasImplicationHistory = async (offset?: string, search?: string) => {
        let i = 1
        let values = [] as any
        let searchValue = i
        let searchQuery = ""
        if (search) {
            values.push(search)
            searchQuery = "(" + `"history"."source" ILIKE '%' || $${searchValue} || '%' OR
            "history"."target" ILIKE '%' || $${searchValue} || '%' OR 
            "history"."type" ILIKE '%' || $${searchValue} || '%' ` + ")"
            i++
        }
        if (offset) values.push(offset)
        const whereQueries = [searchQuery].filter(Boolean).join(" AND ")
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "history".*, COUNT(*) OVER() AS "historyCount"
                FROM (
                    SELECT "historyID", "user", "date", "source", "target",
                    "type", "affectedPosts", "sourceData", "reason"
                    FROM "alias history"
                    UNION ALL
                    SELECT "historyID", "user", "date", "source", "target",
                    "type", "affectedPosts", NULL::jsonb AS "sourceData", "reason"
                    FROM "implication history"
                ) AS "history"
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
                ORDER BY "history"."date" DESC
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query, true)
        return result
    }
}