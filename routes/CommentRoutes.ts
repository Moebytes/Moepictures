import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"

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
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!comment || !postID) return res.status(400).send("Bad comment or post ID")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const badComment = functions.validateComment(comment)
            if (badComment) return res.status(400).send("Bad comment")
            await sql.insertComment(Number(postID), req.session.username, comment)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/comment/delete", commentLimiter, async (req: Request, res: Response) => {
        try {
            const commentID = req.query.commentID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRD token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
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
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!comment || !commentID) return res.status(400).send("Bad comment or comment ID")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const badComment = functions.validateComment(comment as string)
            if (badComment) return res.status(400).send("Bad comment")
            const com = await sql.comment(Number(commentID))
            if (com?.username !== req.session.username) return res.status(400).send("You can only edit your own comment")
            await sql.updateComment(Number(commentID), comment as string)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/comment/report", commentLimiter, async (req: Request, res: Response) => {
        try {
            const {commentID, reason} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!commentID) return res.status(400).send("Bad commentID")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const exists = await sql.comment(commentID)
            if (!exists) return res.status(400).send("Comment doesn't exist")
            await sql.inserCommentReport(req.session.username, commentID, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/comment/report/list", commentLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.reportedComments(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/comment/report/request/fulfill", commentLimiter, async (req: Request, res: Response) => {
        try {
            const {username, commentID} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!username || !commentID) return res.status(400).send("Bad username or comment ID")
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