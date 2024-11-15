import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLGroup {
    /** Get group. */
    public static group = async (slug: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "group map"."order", json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    JOIN "group map" ON "group map"."postID" = posts."postID"
                    GROUP BY posts."postID", "group map"."order"
                )
                SELECT groups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "group map"
                JOIN groups ON groups."groupID" = "group map"."groupID"
                JOIN post_json ON post_json."postID" = "group map"."postID"
                WHERE groups."slug" = $1
                GROUP BY groups."groupID"
            `),
            values: [slug]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get post groups. */
    public static postGroups = async (postID: number) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "group map"."order", json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    JOIN "group map" ON "group map"."postID" = posts."postID"
                    GROUP BY posts."postID", "group map"."order"
                )
                SELECT groups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "group map"
                JOIN groups ON groups."groupID" = "group map"."groupID"
                JOIN post_json ON post_json."postID" = "group map"."postID"
                WHERE "group map"."groupID" = (
                    SELECT "group map"."groupID" FROM "group map" WHERE "group map"."postID" = $1
                )
                GROUP BY groups."groupID"
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get groups. */
    public static groups = async (groups: string[]) => {
        let whereQuery = groups?.[0] ? `WHERE groups."name" = ANY ($1)` : ""
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT groups.*
                    FROM groups
                    ${whereQuery}
                    GROUP BY groups."groupID"
            `)
        }
        if (groups?.[0]) query.values = [groups]
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Insert group. */
    public static insertGroup = async (creator: string, name: string, slug: string, restrict: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO groups ("name", "slug", "restrict", "creator", "createDate", "updater", "updatedDate")
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "groupID"
            `),
            rowMode: "array",
            values: [name, slug, restrict, creator, now, creator, now]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Update group name and description. */
    public static updateGroupName = async (groupID: string, updater: string, name: string, slug: string, description: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                UPDATE groups SET "name" = $1, "slug" = $2, "description" = $3, "updater" = $4, "updatedDate" = $5 WHERE "groupID" = $6
            `),
            values: [name, slug, description, updater, now, groupID]
        }
        return SQLQuery.run(query)
    }

    /** Update group. */
    public static updateGroup = async (groupID: string, column: string, value: string | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE groups SET "${column}" = $1 WHERE "groupID" = $2`,
            values: [value, groupID]
        }
        return SQLQuery.run(query)
    }

    /** Delete group. */
    public static deleteGroup = async (groupID: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM groups WHERE groups."groupID" = $1`,
            values: [groupID]
        }
        return SQLQuery.run(query)
    }

    /** Get group post. */
    public static groupPost = async (groupID: string, postID: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT * FROM "group map"
                WHERE "group map"."groupID" = $1 AND "group map"."postID" = $2
                GROUP BY "group map"."groupID", "group map"."postID"
            `),
            values: [groupID, postID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Insert group post. */
    public static insertGroupPost = async (groupID: string, postID: string, order: number) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO "group map" ("groupID", "postID", "order") VALUES ($1, $2, $3)
            `),
            values: [groupID, postID, order]
        }
        return SQLQuery.run(query)
    }

    /** Update group post. */
    public static updateGroupPost = async (groupID: string, postID: string, order: number) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                UPDATE "group map" SET "order" = $1 WHERE "groupID" = $2 AND "postID" = $3
            `),
            values: [order, groupID, postID]
        }
        return SQLQuery.run(query)
    }

    /** Delete group post. */
    public static deleteGroupPost = async (groupID: string, postID: string) => {
        const orderQuery: QueryArrayConfig = {
            text: /*sql*/`SELECT "group map"."order" FROM "group map" WHERE "group map"."groupID" = $1 AND "group map"."postID" = $2`,
            rowMode: "array",
            values: [groupID, postID]
        }
        const result = await SQLQuery.run(orderQuery)
        const deleteOrder = result[0]?.[0]
        if (!deleteOrder) return
        
        const deleteQuery: QueryConfig = {
            text: /*sql*/`DELETE FROM "group map" WHERE "group map"."groupID" = $1 AND "group map"."postID" = $2`,
            values: [groupID, postID]
        }
        await SQLQuery.run(deleteQuery)

        const decrementQuery: QueryConfig = {
            text: /*sql*/`UPDATE "group map" SET "order" = "order" - 1 WHERE "groupID" = $1 AND "order" > $2`,
            values: [groupID, deleteOrder]
        }
        return SQLQuery.run(decrementQuery)
    }

    /** Bulk insert group mappings. */
    public static bulkInsertGroupMappings = async (groupID: string, posts: any[]) => {
        if (!posts.length) return
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < posts.length; j++) {
            valueArray.push(`($${i}, $${i + 1}, $${i + 2})`)
            rawValues.push(groupID)
            rawValues.push(posts[j].postID)
            rawValues.push(posts[j].order)
            i += 3
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "group map" ("groupID", "postID", "order") ${valueQuery}`,
            values: [...rawValues]
        }
        return SQLQuery.run(query)
    }

    /** Bulk delete group mappings. */
    public static bulkDeleteGroupMappings = async (groupID: string, posts: any[]) => {
        if (!posts.length) return
        let valueArray = [] as any
        let rawValues = [groupID] as any
        let i = 2
        
        for (let j = 0; j < posts.length; j++) {
            valueArray.push(`$${i}`) 
            rawValues.push(posts[j].postID)
            i++
        }
        
        let valueQuery = valueArray.join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "group map" WHERE "groupID" = $1 AND "postID" IN (${valueQuery})`,
            values: [...rawValues]
        }
        return SQLQuery.run(query)
    }

    /** Search group. */
    public static searchGroup = async (groupID: string, limit?: string, offset?: string, type?: string, restrict?: string, style?: string, sort?: string, sessionUsername?: string) => {
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
        if (sort === "date") sortQuery = `ORDER BY posts."uploadDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY posts."uploadDate" ASC`
        if (sort === "posted") sortQuery = `ORDER BY posts.posted DESC NULLS LAST`
        if (sort === "reverse posted") sortQuery = `ORDER BY posts.posted ASC NULLS LAST`
        if (sort === "cuteness") sortQuery = `ORDER BY "cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY "cuteness" ASC`
        if (sort === "popularity") sortQuery = `ORDER BY "favoriteCount" DESC`
        if (sort === "reverse popularity") sortQuery = `ORDER BY "favoriteCount" ASC`
        if (sort === "variations") sortQuery = `ORDER BY "imageCount" DESC`
        if (sort === "reverse variations") sortQuery = `ORDER BY "imageCount" ASC`
        if (sort === "children") sortQuery = `ORDER BY "hasChildren" DESC`
        if (sort === "reverse children") sortQuery = `ORDER BY "hasChildren" ASC`
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
                    ${sortQuery}
                )
                SELECT "group map".*, 
                COUNT(*) OVER() AS "postCount",
                post_json.* AS post
                FROM "group map"
                JOIN post_json ON post_json."postID" = "group map"."postID"
                WHERE "group map"."groupID" = $1
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [groupID]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result
    }
}