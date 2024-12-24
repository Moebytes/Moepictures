import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {Comment, CommentSearch} from "../types/Types"

export default class SQLComment {
    /** Insert comment. */
    public static insertComment = async (postID: string, username: string, comment: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
        text: /*sql*/`INSERT INTO "comments" ("postID", "username", "comment", "postDate", "editedDate") 
        VALUES ($1, $2, $3, $4, $5) RETURNING "commentID"`,
        rowMode: "array",
        values: [postID, username, comment, now, now]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Updates a comment. */
    public static updateComment = async (commentID: string, comment: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "comments" SET "comment" = $1, "editedDate" = $2 WHERE "commentID" = $3`,
            values: [comment, now, commentID]
        }
        await SQLQuery.run(query)
    }

    /** Get post comments. */
    public static comments = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT comments.*, users."image", users."imageHash", users."imagePost", users."role", users."banned"
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                WHERE comments."postID" = $1
                GROUP BY comments."commentID", users."image", users."imageHash", users."imagePost", users."role", users."banned"
                ORDER BY comments."postDate" ASC
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<Comment[]>
    }

    /** Get user comments. */
    public static userComments = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT comments.*, users."image", users."imageHash", users."imagePost", users."role", users."banned"
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                WHERE comments."username" = $1
                GROUP BY comments."commentID", users."image", users."imageHash", users."imagePost", users."role", users."banned"
                ORDER BY comments."postDate" ASC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<Comment[]>
    }

    /** Search comments. */
    public static searchComments = async (search: string, sort: string, offset?: number) => {
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
                users."image", users."imageHash", users."imagePost", users."role", users."banned", 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                JOIN post_json ON post_json."postID" = "comments"."postID"
                ${whereQuery}
                GROUP BY comments."commentID", users."image", users."imageHash", users."imagePost", users."role", users."banned"
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result as Promise<CommentSearch[]>
    }

    /** Comments by usernames. */
    public static searchCommentsByUsername = async (usernames: string[], search: string, sort: string, offset?: number) => {
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
                users."image", users."imageHash", users."imagePost", users."role", users."banned", 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                JOIN post_json ON post_json."postID" = "comments"."postID"
                ${whereQuery}
                GROUP BY comments."commentID", users."image", users."imageHash", users."imagePost", users."role", users."banned"
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [usernames]
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result as Promise<CommentSearch[]>
    }

    /** Get comment. */
    public static comment = async (commentID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT comments.*, users."image", users."imageHash", users."imagePost", users."role", users."banned"
                FROM comments
                JOIN "users" ON "users"."username" = "comments"."username"
                WHERE comments."commentID" = $1
                GROUP BY comments."commentID", users."image", users."imageHash", users."imagePost", users."role", users."banned"
                ORDER BY comments."postDate" ASC
            `),
            values: [commentID]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Comment>
    }

    /** Delete comment. */
    public static deleteComment = async (commentID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM comments WHERE comments."commentID" = $1`),
        values: [commentID]
        }
        await SQLQuery.run(query)
    }
}