import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import CSRF from "csrf"

const csrf = new CSRF()

const commentLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const CommentRoutes = (app: Express) => {
    app.post("/api/comment/create", commentLimiter, async (req: Request, res: Response) => {
        try {
            const {comment, postID} = req.body
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
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

    app.delete("/api/comment/delete", commentLimiter, async (req: Request, res: Response) => {
        try {
            const commentID = req.query.commentID
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
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

    app.put("/api/comment/edit", commentLimiter, async (req: Request, res: Response) => {
        try {
            const {comment, commentID} = req.body
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
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

    app.post("/api/comment/report", commentLimiter, async (req: Request, res: Response) => {
        try {
            const {commentID, reason} = req.body
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
            if (!req.session.username || !commentID) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const exists = await sql.comment(commentID)
            if (!exists) return res.status(400).send("Bad request")
            await sql.inserCommentReport(req.session.username, commentID, reason)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/comment/report/list", commentLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.reportedComments(offset)
            res.status(200).json(result)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/comment/report/request/fulfill", commentLimiter, async (req: Request, res: Response) => {
        try {
            const {username, commentID} = req.body
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
            if (!username || !commentID) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.deleteCommentReport(username, commentID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default CommentRoutes