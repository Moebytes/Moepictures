import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {Favorite, PostSearch, Favgroup, FavgroupSearch} from "../types/Types"

export default class SQLFavorite {
    /** Insert favorite. */
    public static insertFavorite = async (postID: string, username: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "favorites" ("postID", "username", "favoriteDate") VALUES ($1, $2, $3)`,
        values: [postID, username, new Date().toISOString()]
        }
        await SQLQuery.run(query)
    }

    /** Get favorite. */
    public static favorite = async (postID: string, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                    LIMIT 1
                )
                SELECT favorites.*, 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM favorites
                JOIN post_json ON post_json."postID" = favorites."postID"
                WHERE favorites."postID" = $1 AND favorites."username" = $2
                GROUP BY favorites."postID", favorites."username"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Favorite | undefined>
    }

    /** Get favorites. */
    public static favorites = async (username: string, limit?: number, offset?: number, type?: string, rating?: string, 
        style?: string, sort?: string, showChildren?: boolean, sessionUsername?: string) => {
        const {postJSON, values, limitValue, offsetValue} = 
        SQLQuery.search.boilerplate({i: 2, type, rating, style, sort, offset, limit, showChildren, username: sessionUsername})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT favorites.*, 
                COUNT(*) OVER() AS "postCount",
                post_json.* AS post
                FROM favorites
                JOIN post_json ON post_json."postID" = favorites."postID"
                WHERE favorites."username" = $1
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${offsetValue}` : ""}
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result as Promise<PostSearch[]>
    }

    /** Delete favorite. */
    public static deleteFavorite = async (postID: string, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM favorites WHERE favorites."postID" = $1 AND favorites."username" = $2`),
        values: [postID, username]
        }
        await SQLQuery.run(query)
    }

    /** Insert favgroup. */
    public static insertFavgroup = async (username: string, slug: string, name: string, isPrivate: boolean, rating: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO favgroups ("username", "slug", "name", "rating", "private", "createDate")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT ("username", "slug") DO UPDATE
                SET "private" = EXCLUDED."private"
            `),
            values: [username, slug, name, rating, isPrivate, new Date().toISOString()]
        }
        await SQLQuery.run(query)
    }

    /** Update favgroup. */
    public static updateFavGroup = async (username: string, slug: string, column: "name" | "slug" | "rating" | "private", 
        value: string | boolean) => {
        let whitelist = ["name", "slug", "rating", "private"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE favgroups SET "${column}" = $1 WHERE "username" = $2 AND "slug" = $3`,
            values: [value, username, slug]
        }
        await SQLQuery.run(query)
    }

    /** Delete favgroup. */
    public static deleteFavgroup = async (username: string, slug: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                DELETE FROM favgroups
                WHERE favgroups."username" = $1 AND favgroups."slug" = $2
            `),
            values: [username, slug]
        }
        await SQLQuery.run(query)
    }

    /** Insert favgroup post. */
    public static insertFavgroupPost = async (username: string, slug: string, postID: string, order: number) => {
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "favgroup map" ("username", "slug", "postID", "order") VALUES ($1, $2, $3, $4)`,
            values: [username, slug, postID, order]
        }
        await SQLQuery.run(query)
    }

    /** Delete favgroup post. */
    public static deleteFavgroupPost = async (postID: string, username: string, slug: string) => {
        const orderQuery: QueryArrayConfig = {
            text: /*sql*/`SELECT "favgroup map"."order" FROM "favgroup map" WHERE "favgroup map"."postID" = $1 AND "favgroup map"."username" = $2 AND "favgroup map"."slug" = $3`,
            rowMode: "array",
            values: [postID, username, slug]
        }
        const result = await SQLQuery.run(orderQuery)
        const deleteOrder = result[0]?.[0]
        if (!deleteOrder) return

        const deleteQuery: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                DELETE FROM "favgroup map" 
                WHERE "favgroup map"."postID" = $1 AND "favgroup map"."username" = $2 AND "favgroup map"."slug" = $3
            `),
            values: [postID, username, slug]
        }
        await SQLQuery.run(deleteQuery)

        const decrementQuery: QueryConfig = {
            text: /*sql*/`UPDATE "favgroup map" SET "order" = "order" - 1 WHERE "username" = $1 AND "slug" = $2 AND "order" > $3`,
            values: [username, slug, deleteOrder]
        }
        await SQLQuery.run(decrementQuery)
    }

    /** Get post favgroups. */
    public static postFavgroups = async (postID: string, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "favgroup map"."order", json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    JOIN "favgroup map" ON "favgroup map"."postID" = posts."postID"
                    GROUP BY posts."postID", "favgroup map"."order"
                )
                SELECT favgroups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "favgroup map"
                JOIN favgroups ON favgroups."slug" = "favgroup map"."slug"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE "favgroup map"."postID" = $1 AND "favgroup map"."username" = $2
                GROUP BY favgroups."username", favgroups."slug"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<Favgroup[]>
    }

    /** Get favgroup. */
    public static favgroup = async (username: string, slug: string, type = "", rating = "", style = "", 
        sort = "", showChildren = true, sessionUsername = "") => {
        if (!sessionUsername) sessionUsername = username
        const {postJSON, values} = 
        SQLQuery.search.boilerplate({i: 3, type, rating, style, sort, showChildren, username: sessionUsername, favgroupOrder: true})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT favgroups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "favgroup map"
                JOIN favgroups ON favgroups."slug" = "favgroup map"."slug"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE "favgroup map"."username" = $1 AND "favgroup map"."slug" = $2 
                GROUP BY favgroups."username", favgroups."slug"
            `),
            values: [username, slug]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result[0] as Promise<FavgroupSearch | undefined>
    }

    /** Get user favgroup. */
    public static favgroups = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "favgroup map"."order", json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    JOIN "favgroup map" ON "favgroup map"."postID" = posts."postID"
                    GROUP BY posts."postID", "favgroup map"."order"
                )
                SELECT favgroups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "favgroup map"
                JOIN favgroups ON favgroups."slug" = "favgroup map"."slug"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE "favgroup map"."username" = $1
                GROUP BY favgroups."username", favgroups."slug"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<Favgroup[]>
    }
    
    /** Bulk insert favgroup mappings. */
    public static bulkInsertFavgroupMappings = async (username: string, slug: string, posts: any[]) => {
        if (!posts.length) return
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < posts.length; j++) {
            valueArray.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`)
            rawValues.push(username)
            rawValues.push(slug)
            rawValues.push(posts[j].postID)
            rawValues.push(posts[j].order)
            i += 4
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "favgroup map" ("username", "slug", "postID", "order") ${valueQuery}`,
            values: [...rawValues]
        }
        await SQLQuery.run(query)
    }

    /** Bulk delete favgroup mappings. */
    public static bulkDeleteFavgroupMappings = async (username: string, slug: string, posts: any[]) => {
        if (!posts.length) return
        let valueArray = [] as any
        let rawValues = [username, slug] as any
        let i = 3
        
        for (let j = 0; j < posts.length; j++) {
            valueArray.push(`$${i}`) 
            rawValues.push(posts[j].postID)
            i++
        }
        
        let valueQuery = valueArray.join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "favgroup map" WHERE "username" = $1 AND "slug" = $2 AND "postID" IN (${valueQuery})`,
            values: [...rawValues]
        }
        await SQLQuery.run(query)
    }
}