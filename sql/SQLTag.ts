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

    /** Bulk insert new tags. */
    public static bulkInsertTags = async (bulkTags: any[], creator: string, noImageUpdate?: boolean) => {
        let tagValues = new Set<string>()
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < bulkTags.length; j++) {
        if (tagValues.has(bulkTags[j].tag)) continue
        tagValues.add(bulkTags[j].tag)
        valueArray.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7})`)
        rawValues.push(bulkTags[j].tag)
        rawValues.push(bulkTags[j].type)
        rawValues.push(bulkTags[j].description)
        rawValues.push(bulkTags[j].image)
        rawValues.push(new Date().toISOString())
        rawValues.push(creator)
        rawValues.push(new Date().toISOString())
        rawValues.push(creator)
        i += 8
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tags" ("tag", "type", "description", "image", "createDate", "creator", "updatedDate", "updater") ${valueQuery} 
                ON CONFLICT ("tag") DO UPDATE SET "type" = EXCLUDED."type"${noImageUpdate ? "" : ", \"image\" = EXCLUDED.\"image\""}`,
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
        i += 4
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "unverified tags" ("tag", "type", "description", "image") ${valueQuery} 
                ON CONFLICT ("tag") DO UPDATE SET "type" = EXCLUDED."type"${noImageUpdate ? "" : ", \"image\" = EXCLUDED.\"image\""}`,
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

    /** Insert a new tag map (unverified). */
    public static insertUnverifiedTagMap = async (postID: number, tags: string[]) => {
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
                    SELECT "tag map".tag, "tags".type, "tags".image, COUNT(*) AS count
                    FROM "tag map"
                    LEFT JOIN tags ON tags."tag" = "tag map".tag
                    ${whereQuery}
                    GROUP BY "tag map".tag, "tags".type, "tags".image
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

    /** Insert a new alias. */
    public static insertAlias = async (tag: string, alias: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "aliases" ("tag", "alias") VALUES ($1, $2)`,
        values: [tag, alias]
        }
        try {
        await SQLQuery.flushDB()
        await SQLQuery.run(query)
        return false
        } catch {
        return true
        }
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
                    GROUP BY "aliases"."aliasID"
            `),
            values: [alias]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Purge aliases. */
    public static purgeAliases = async (tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "aliases" WHERE aliases."tag" = $1`,
        values: [tag]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Purge aliases (unverified). */
    public static purgeUnverifiedAliases = async (tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "unverified aliases" WHERE "unverified aliases"."tag" = $1`,
        values: [tag]
        }
        return SQLQuery.run(query)
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
                    GROUP BY "aliases"."aliasID"
            `)
        }
        if (search) query.values = [search.toLowerCase()]
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Insert a new implication. */
    public static insertImplication = async (tag: string, implication: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO implications ("tag", "implication") VALUES ($1, $2)`,
        values: [tag, implication]
        }
        try {
        await SQLQuery.flushDB()
        await SQLQuery.run(query)
        return false
        } catch {
        return true
        }
    }

    /** Get implications. */
    public static implications = async (tag: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT implications.*
                    FROM implications
                    WHERE implications.tag = $1
                    GROUP BY implications."implicationID"
            `),
            values: [tag]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Purge implications. */
    public static purgeImplications = async (tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM implications WHERE implications."tag" = $1`,
        values: [tag]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
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

    /** Purge tag map. */
    public static purgeTagMap = async (postID: number) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "tag map" WHERE "tag map"."postID" = $1`,
            values: [postID]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Purge tag map (unverified). */
    public static purgeUnverifiedTagMap = async (postID: number) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "unverified tag map" WHERE "unverified tag map"."postID" = $1`,
            values: [postID]
        }
        return SQLQuery.run(query)
    }
}