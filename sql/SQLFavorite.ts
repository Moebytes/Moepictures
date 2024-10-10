import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLFavorite {
    /** Insert favorite. */
    public static insertFavorite = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "favorites" ("postID", "username", "favoriteDate") VALUES ($1, $2, $3)`,
        values: [postID, username, new Date().toISOString()]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get favorite. */
    public static favorite = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
                )
                SELECT favorites.*, json_build_object(
                'type', post_json."type",
                'restrict', post_json."restrict",
                'style', post_json."style",
                'images', (array_agg(post_json."images"))[1]
                ) AS post
                FROM favorites
                JOIN post_json ON post_json."postID" = favorites."postID"
                WHERE favorites."postID" = $1 AND favorites."username" = $2
                GROUP BY favorites."favoriteID", post_json."type", post_json."restrict", post_json."style"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get favorites. */
    public static favorites = async (username: string, limit?: string, offset?: string) => {
        let i = 2
        let values = [] as any
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = "100"
            values.push(limit)
            i++
        }
        if (offset) values.push(offset)
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
                )
                SELECT favorites.*, 
                COUNT(*) OVER() AS "favoriteCount",
                json_build_object(
                'type', post_json."type",
                'restrict', post_json."restrict",
                'style', post_json."style",
                'images', (array_agg(post_json."images"))[1]
                ) AS post
                FROM favorites
                JOIN post_json ON post_json."postID" = favorites."postID"
                WHERE favorites."username" = $1
                GROUP BY favorites."favoriteID", post_json."type", post_json."restrict", post_json."style"
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete favorite. */
    public static deleteFavorite = async (favoriteID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM favorites WHERE favorites."favoriteID" = $1`),
        values: [favoriteID]
        }
        const result = await SQLQuery.run(query)
        return result
    }
}