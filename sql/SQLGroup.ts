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
    public static insertGroup = async (creator: string, name: string, slug: string, rating: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO groups ("name", "slug", "rating", "creator", "createDate", "updater", "updatedDate")
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "groupID"
            `),
            rowMode: "array",
            values: [name, slug, rating, creator, now, creator, now]
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
    public static searchGroup = async (groupID: string, limit?: string, offset?: string, type?: string, rating?: string, style?: string, sort?: string, sessionUsername?: string) => {
        const {postJSON, values, limitValue, offsetValue} = 
        SQLQuery.search.boilerplate({i: 2, type, rating, style, sort, offset, limit, username: sessionUsername})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT "group map".*, 
                COUNT(*) OVER() AS "postCount",
                post_json.* AS post
                FROM "group map"
                JOIN post_json ON post_json."postID" = "group map"."postID"
                WHERE "group map"."groupID" = $1
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${offsetValue}` : ""}
            `),
            values: [groupID]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result
    }
}