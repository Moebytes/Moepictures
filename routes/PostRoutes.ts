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
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            if (!req.session.username) return res.status(400).send("Bad request")
            const post = await sql.post(Number(postID))
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

    app.get("/api/post/unverified", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            let result = await sql.unverifiedPost(Number(postID))
            if (result.images.length > 1) {
                result.images = result.images.sort((a: any, b: any) => a.order - b.order)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/list/unverified", async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.unverifiedPosts()
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post-edits/list/unverified", async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.unverifiedPostEdits()
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/thirdparty/unverified", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const posts = await sql.unverifiedThirdParty(Number(postID))
            res.status(200).json(posts)
        } catch {
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/post/parent/unverified", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const post = await sql.unverifiedParent(Number(postID))
            res.status(200).json(post)
        } catch {
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/post/delete/request", async (req: Request, res: Response) => {
        try {
            const {postID, reason} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const post = await sql.post(Number(postID))
            if (!post) return res.status(400).send("Bad request")
            await sql.insertPostDeleteRequest(req.session.username, Number(postID), reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/post/delete/request/list", async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.postDeleteRequests()
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/post/delete/request/fulfill", async (req: Request, res: Response) => {
        try {
            const {username, postID} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username || !username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.deletePostDeleteRequest(username, postID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default PostRoutes