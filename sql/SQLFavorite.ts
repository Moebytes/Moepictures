import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {Favorite, TagFavorite, TagCount, PostSearch, Favgroup, FavgroupSearch} from "../types/Types"

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
                )
                SELECT favorites.*, 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM favorites
                JOIN post_json ON post_json."postID" = favorites."postID"
                WHERE favorites."postID" = $1 AND favorites."username" = $2
                GROUP BY favorites."favoriteID"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Favorite | undefined>
    }

    /** Get favorites. */
    public static favorites = async (username: string, limit?: number, offset?: number, type?: string, rating?: string, 
        style?: string, sort?: string, showChildren?: boolean, sessionUsername?: string) => {
        let condition = `favorites."username" = $1`
        const {postJSON, countJSON, values, countValues} = 
        SQLQuery.search.boilerplate({i: 2, type, rating, style, sort, offset, condition,
        limit, showChildren, username: sessionUsername, intermLimit: true})

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
        const result = await SQLQuery.run(query, `favorites/${username}`) as PostSearch[]
        const count = await SQLQuery.search.count(countJSON, [username, ...countValues])
        result.forEach((r) => r.postCount = count)
        return result
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
        const query: QueryArrayConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO favgroups ("username", "slug", "name", "rating", "private", "createDate")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT ("username", "slug") DO UPDATE
                SET "private" = EXCLUDED."private"
                RETURNING "favgroupID"
            `),
            rowMode: "array",
            values: [username, slug, name, rating, isPrivate, new Date().toISOString()]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
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
    public static insertFavgroupPost = async (favgroupID: string, postID: string, order: number) => {
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "favgroup map" ("favgroupID", "postID", "order") VALUES ($1, $2, $3)`,
            values: [favgroupID, postID, order]
        }
        await SQLQuery.run(query)
    }

    /** Delete favgroup post. */
    public static deleteFavgroupPost = async (favgroupID: string, postID: string) => {
        const orderQuery: QueryArrayConfig = {
            text: /*sql*/`SELECT "favgroup map"."order" FROM "favgroup map" WHERE "favgroup map"."favgroupID" = $1 AND "favgroup map"."postID" = $2`,
            rowMode: "array",
            values: [favgroupID, postID]
        }
        const result = await SQLQuery.run(orderQuery)
        const deleteOrder = result[0]?.[0]
        if (!deleteOrder) return

        const deleteQuery: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                DELETE FROM "favgroup map" WHERE "favgroup map"."favgroupID" = $1 AND "favgroup map"."postID" = $2
            `),
            values: [favgroupID, postID]
        }
        await SQLQuery.run(deleteQuery)

        const decrementQuery: QueryConfig = {
            text: /*sql*/`UPDATE "favgroup map" SET "order" = "order" - 1 WHERE "favgroupID" = $1 AND "order" > $2`,
            values: [favgroupID, deleteOrder]
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
                JOIN favgroups ON favgroups."favgroupID" = "favgroup map"."favgroupID"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE "favgroup map"."postID" = $1 AND favgroups."username" = $2
                GROUP BY favgroups."favgroupID"
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
                JOIN favgroups ON favgroups."favgroupID" = "favgroup map"."favgroupID"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE favgroups."username" = $1 AND favgroups."slug" = $2 
                GROUP BY favgroups."favgroupID"
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
                JOIN favgroups ON favgroups."favgroupID" = "favgroup map"."favgroupID"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE favgroups."username" = $1
                GROUP BY favgroups."favgroupID"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<Favgroup[]>
    }
    
    /** Bulk insert favgroup mappings. */
    public static bulkInsertFavgroupMappings = async (favgroupID: string, posts: any[]) => {
        if (!posts.length) return
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < posts.length; j++) {
            valueArray.push(`($${i}, $${i + 1}, $${i + 2})`)
            rawValues.push(favgroupID)
            rawValues.push(posts[j].postID)
            rawValues.push(posts[j].order)
            i += 3
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "favgroup map" ("favgroupID", "postID", "order") ${valueQuery}`,
            values: [...rawValues]
        }
        await SQLQuery.run(query)
    }

    /** Bulk delete favgroup mappings. */
    public static bulkDeleteFavgroupMappings = async (favgroupID: string, posts: any[]) => {
        if (!posts.length) return
        let valueArray = [] as any
        let rawValues = [favgroupID] as any
        let i = 2
        
        for (let j = 0; j < posts.length; j++) {
            valueArray.push(`$${i}`) 
            rawValues.push(posts[j].postID)
            i++
        }
        
        let valueQuery = valueArray.join(", ")
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "favgroup map" WHERE "favgroupID" = $1 AND "postID" IN (${valueQuery})`,
            values: [...rawValues]
        }
        await SQLQuery.run(query)
    }

    /** Insert tag favorite. */
    public static insertTagFavorite = async (tag: string, username: string) => {
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "tag favorites" ("tag", "username", "favoriteDate") VALUES ($1, $2, $3)`,
            values: [tag, username, new Date().toISOString()]
        }
        await SQLQuery.run(query)
    }

    /** Delete tag favorite. */
    public static deleteTagFavorite = async (tag: string, username: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM "tag favorites" WHERE "tag favorites"."tag" = $1 AND "tag favorites"."username" = $2`),
            values: [tag, username]
        }
        await SQLQuery.run(query)
    }

    /** Delete tag favorites. */
    public static deleteTagFavorites = async (username: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`DELETE FROM "tag favorites" WHERE "tag favorites"."username" = $1`),
            values: [username]
        }
        await SQLQuery.run(query)
    }

    /** Get tag favorite. */
    public static tagFavorite = async (tag: string, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag favorites".*
                FROM "tag favorites"
                WHERE "tag favorites"."tag" = $1 AND "tag favorites"."username" = $2
                GROUP BY "tag favorites"."favoriteID"
            `),
            values: [tag, username]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<TagFavorite | undefined>
    }

    /** Get tag favorites. */
    public static tagFavorites = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH tag_json AS (
                    SELECT "tag map posts".tag, 
                    array_length("tag map posts"."posts", 1) AS count,
                    "tags".type, "tags".image, "tags"."imageHash"
                    FROM "tag map posts"
                    LEFT JOIN tags ON tags."tag" = "tag map posts".tag
                    GROUP BY "tag map posts".tag, "tags".type, "tags".image, "tags"."imageHash"
                    ORDER BY count DESC
                )
                SELECT tag_json.*
                FROM "tag favorites"
                JOIN tag_json ON tag_json."tag" = "tag favorites"."tag"
                WHERE "tag favorites"."username" = $1
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<TagCount[]>
    }
}