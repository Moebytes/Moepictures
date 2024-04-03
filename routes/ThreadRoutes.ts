import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"

const threadLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 500,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const ThreadRoutes = (app: Express) => {
    app.post("/api/thread/create", threadLimiter, async (req: Request, res: Response) => {
        try {
            const {title, content, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad request")
            if (!title || !content || !req.session.username) return res.status(400).send("Bad request")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad request")
            await sql.insertForumThread(req.session.username, title, content)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })
}

export default ThreadRoutes