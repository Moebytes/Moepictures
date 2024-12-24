import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {Cuteness} from "../types/Types"

export default class SQLCuteness {
    /** Update cuteness. */
    public static updateCuteness = async (postID: string, username: string, cuteness: number) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO "cuteness" ("postID", "username", "cuteness", "cutenessDate")
                VALUES ($1, $2, $3, $4)
                ON CONFLICT ("postID", "username") DO UPDATE
                SET "cuteness" = EXCLUDED."cuteness", "cutenessDate" = EXCLUDED."cutenessDate"
            `),
            values: [postID, username, cuteness, new Date().toISOString()]
        }
        await SQLQuery.run(query)
    }

    /** Get cuteness. */
    public static cuteness = async (postID: string, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT cuteness.*,
                to_json((array_agg(post_json.*))[1]) AS post
                FROM cuteness
                JOIN post_json ON post_json."postID" = cuteness."postID"
                WHERE cuteness."postID" = $1 AND cuteness."username" = $2
                GROUP BY cuteness."postID", cuteness."username"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Cuteness>
    }

    /** Delete cuteness. */
    public static deleteCuteness = async (postID: string, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM cuteness WHERE cuteness."postID" = $1 AND cuteness."username" = $2`),
        values: [postID, username]
        }
        await SQLQuery.run(query)
    }
}