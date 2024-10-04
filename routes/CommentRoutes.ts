import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions, {authenticate, keyGenerator, handler} from "../structures/ServerFunctions"

const commentLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const CommentRoutes = (app: Express) => {
    app.get("/api/comment", commentLimiter, async (req: Request, res: Response) => {
        try {
            const commentID = req.query.commentID as string
            if (!commentID) return res.status(400).send("Bad commentID")
            const result = await sql.comment.comment(Number(commentID))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/comment/create", authenticate, commentLimiter, async (req: Request, res: Response) => {
        try {
            const {comment, postID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!comment || !postID) return res.status(400).send("Bad comment or post ID")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const badComment = functions.validateComment(comment)
            if (badComment) return res.status(400).send("Bad comment")
            await sql.comment.insertComment(Number(postID), req.session.username, comment)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/comment/delete", authenticate, commentLimiter, async (req: Request, res: Response) => {
        try {
            const commentID = req.query.commentID
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const comment = await sql.comment.comment(Number(commentID))
            if (comment?.username !== req.session.username) {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            }
            await sql.comment.deleteComment(Number(commentID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/comment/edit", authenticate, commentLimiter, async (req: Request, res: Response) => {
        try {
            const {comment, commentID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!comment || !commentID) return res.status(400).send("Bad comment or comment ID")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const badComment = functions.validateComment(comment as string)
            if (badComment) return res.status(400).send("Bad comment")
            const com = await sql.comment.comment(Number(commentID))
            if (com?.username !== req.session.username) return res.status(400).send("You can only edit your own comment")
            await sql.comment.updateComment(Number(commentID), comment as string)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/comment/report", authenticate, commentLimiter, async (req: Request, res: Response) => {
        try {
            const {commentID, reason} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!commentID) return res.status(400).send("Bad commentID")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const exists = await sql.comment.comment(commentID)
            if (!exists) return res.status(400).send("Comment doesn't exist")
            await sql.report.insertCommentReport(req.session.username, commentID, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/comment/report/fulfill", authenticate, commentLimiter, async (req: Request, res: Response) => {
        try {
            const {reportID, reporter, username, id, accepted} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!reportID) return res.status(400).send("Bad reportID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()

            await sql.report.deleteCommentReport(Number(reportID))
            if (accepted) {
                let message = `Comment report on ${functions.getDomain()}/post/${id} was accepted. The comment made by ${username} has been removed.`
                await serverFunctions.systemMessage(reporter, "Report: Comment report has been accepted", message)

                let message2 = `A comment you posted on ${functions.getDomain()}/post/${id} was removed for breaking the rules.`
                await serverFunctions.systemMessage(username, "Notice: Comment has been removed", message2)
            } else {
                let message = `Comment report on ${functions.getDomain()}/post/${id} has been dismissed. The comment made by ${username} is ok.`
                // await serverFunctions.systemMessage(reporter, "Report: Comment report has been dismissed", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default CommentRoutes