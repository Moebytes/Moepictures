import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLCuteness {
    /** Insert cuteness. */
    public static insertCuteness = async (postID: number, username: string, cuteness: number) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "cuteness" ("postID", "username", "cuteness", "cutenessDate") VALUES ($1, $2, $3, $4)`,
        values: [postID, username, cuteness, new Date().toISOString()]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get cuteness. */
    public static cuteness = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
                )
                SELECT cuteness.*, json_build_object(
                'type', post_json."type",
                'restrict', post_json."restrict",
                'style', post_json."style",
                'images', (array_agg(post_json."images"))[1]
                ) AS post
                FROM cuteness
                JOIN post_json ON post_json."postID" = cuteness."postID"
                WHERE cuteness."postID" = $1 AND cuteness."username" = $2
                GROUP BY cuteness."cutenessID", post_json."type", post_json."restrict", post_json."style"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Delete cuteness. */
    public static deleteCuteness = async (cutenessID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM cuteness WHERE cuteness."cutenessID" = $1`),
        values: [cutenessID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Update cuteness */
    public static updateCuteness = async (postID: number, username: string, cuteness: number) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "cuteness" SET "cuteness" = $1 WHERE "postID" = $2 AND "username" = $3`,
            values: [cuteness, postID, username]
        }
        return SQLQuery.run(query)
    }
}