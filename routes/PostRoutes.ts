import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fs from "fs"
import path from "path"

const PostRoutes = (app: Express) => {
    app.post("/api/comment", async (req: Request, res: Response) => {
        try {
            const {comment, postID} = req.body 
            if (!req.session.username || !comment || !postID) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const badComment = functions.validateComment(comment) 
            if (badComment) return res.status(400).send("Bad request")
            await sql.insertComment(Number(postID), req.session.username, comment)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/comments", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const result = await sql.comments(Number(postID))
            res.status(200).json(result)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/comment", async (req: Request, res: Response) => {
        try {
            const commentID = req.query.commentID
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const comment = await sql.comment(Number(commentID))
            if (comment?.username !== req.session.username) return res.status(400).send("Bad request")
            await sql.deleteComment(Number(commentID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/post", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const post = await sql.post(Number(postID))
            if (post?.uploader !== req.session.username) return res.status(400).send("Bad request")
            await sql.deletePost(Number(postID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/tag", async (req: Request, res: Response) => {
        try {
            const tag = req.query.tag as string
            if (!tag) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            await sql.deleteTag(tag.trim())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/favorite", async (req: Request, res: Response) => {
        try {
            const {postID, favorited} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!favorited || !req.session.username) return res.status(400).send("Bad request")
            if (favorited) {
                await sql.insertFavorite(Number(postID), req.session.username)
            } else {
                const favorite = await sql.favorite(Number(postID), req.session.username)
                if (favorite) await sql.deleteFavorite(favorite.favoriteID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default PostRoutes