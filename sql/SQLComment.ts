import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLComment {
    /** Insert comment. */
    public static insertComment = async (postID: number, username: string, comment: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "comments" ("postID", "username", "comment", "postDate", "editedDate") VALUES ($1, $2, $3, $4, $5)`,
        values: [postID, username, comment, now, now]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates a comment. */
    public static updateComment = async (commentID: number, comment: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "comments" SET "comment" = $1, "editedDate" = $2 WHERE "commentID" = $3`,
            values: [comment, now, commentID]
        }
        return SQLQuery.run(query)
    }

    /** Get post comments. */
    public static comments = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT comments.*, users."image", users."imagePost", users."role", users."banned"
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                WHERE comments."postID" = $1
                GROUP BY comments."commentID", users."image", users."imagePost", users."role", users."banned"
                ORDER BY comments."postDate" ASC
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user comments. */
    public static userComments = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT comments.*, users."image", users."imagePost", users."role", users."banned"
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                WHERE comments."username" = $1
                GROUP BY comments."commentID", users."image", users."imagePost", users."role", users."banned"
                ORDER BY comments."postDate" ASC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Search comments. */
    public static searchComments = async (search: string, sort: string, offset?: string) => {
        let whereQuery = ""
        let i = 1
        if (search) {
        whereQuery = `WHERE lower(comments."comment") LIKE '%' || $${i} || '%'`
        i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY comments."postDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY comments."postDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT comments.*,
                COUNT(*) OVER() AS "commentCount",
                users."image", users."imagePost", users."role", users."banned", 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                JOIN post_json ON post_json."postID" = "comments"."postID"
                ${whereQuery}
                GROUP BY comments."commentID", users."image", users."imagePost", users."role", users."banned"
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Comments by usernames. */
    public static searchCommentsByUsername = async (usernames: string[], search: string, sort: string, offset?: string) => {
        let i = 2
        let whereQuery = `WHERE comments."username" = ANY ($1)`
        if (search) {
        whereQuery += `AND lower(comments."comment") LIKE '%' || $${i} || '%'`
        i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY comments."postDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY comments."postDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT comments.*, 
                COUNT(*) OVER() AS "commentCount",
                users."image", users."imagePost", users."role", users."banned", 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                JOIN post_json ON post_json."postID" = "comments"."postID"
                ${whereQuery}
                GROUP BY comments."commentID", users."image", users."imagePost", users."role", users."banned"
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [usernames]
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get comment. */
    public static comment = async (commentID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT comments.*, users."image", users."imagePost", users."role", users."banned"
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                WHERE comments."commentID" = $1
                GROUP BY comments."commentID", users."image", users."imagePost", users."role", users."banned"
                ORDER BY comments."postDate" ASC
            `),
            values: [commentID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Delete comment. */
    public static deleteComment = async (commentID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM comments WHERE comments."commentID" = $1`),
        values: [commentID]
        }
        const result = await SQLQuery.run(query)
        return result
    }
}