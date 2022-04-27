import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fs from "fs"
import path from "path"

const PostRoutes = (app: Express) => {
    app.get("/api/post", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            let result = await sql.post(Number(postID))
            if (result.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
    
    app.get("/api/post/comments", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const result = await sql.comments(Number(postID))
            res.status(200).json(result)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/post/delete", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const post = await sql.post(Number(postID))
            if (post?.uploader !== req.session.username) return res.status(400).send("Bad request")
            await sql.deletePost(Number(postID))
            for (let i = 0; i < post.images.length; i++) {
                const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].filename)
                await serverFunctions.deleteFile(file)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/post/thirdparty", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const posts = await sql.thirdParty(Number(postID))
            res.status(200).json(posts)
        } catch {
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/parent", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const post = await sql.parent(Number(postID))
            res.status(200).json(post)
        } catch {
            return res.status(400).send("Bad request")
        }
    })
}

export default PostRoutes