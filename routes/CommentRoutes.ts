import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fs from "fs"
import path from "path"

const CommentRoutes = (app: Express) => {
    app.post("/api/comment/create", async (req: Request, res: Response) => {
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

    app.delete("/api/comment/delete", async (req: Request, res: Response) => {
        try {
            const commentID = req.query.commentID
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const comment = await sql.comment(Number(commentID))
            if (comment?.username !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            }
            await sql.deleteComment(Number(commentID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/comment/edit", async (req: Request, res: Response) => {
        try {
            const {comment, commentID} = req.body
            if (!req.session.username || !comment || !commentID) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const badComment = functions.validateComment(comment as string) 
            if (badComment) return res.status(400).send("Bad request")
            const com = await sql.comment(Number(commentID))
            if (com?.username !== req.session.username) return res.status(400).send("Bad request")
            await sql.updateComment(Number(commentID), comment as string)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })
}

export default CommentRoutes