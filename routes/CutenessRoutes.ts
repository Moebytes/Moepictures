import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import CSRF from "csrf"

const csrf = new CSRF()

const cutenessLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 2000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const CutenessRoutes = (app: Express) => {
    app.post("/api/cuteness/update", cutenessLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, cuteness} = req.body
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(postID)) || Number.isNaN(Number(cuteness))) return res.status(400).send("Bad request")
            if (!req.session.username) return res.status(400).send("Bad request")
            if (Number(cuteness) < 0 || Number(cuteness) > 1000) return res.status(400).send("Bad request")
            const cute = await sql.cuteness(Number(postID), req.session.username)
            if (cute) {
                await sql.updateCuteness(Number(postID), req.session.username, Number(cuteness))
            } else {
                await sql.insertCuteness(Number(postID), req.session.username, Number(cuteness))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/cuteness", cutenessLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const cuteness = await sql.cuteness(Number(postID), req.session.username)
            res.status(200).send(cuteness)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/cuteness/delete", cutenessLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const cuteness = await sql.cuteness(Number(postID), req.session.username)
            if (!cuteness) return res.status(400).send("Bad request")
            await sql.deleteCuteness(cuteness.cutenessID)
            res.status(200).send(cuteness)
        } catch {
            res.status(400).send("Bad request") 
        }
    })
}

export default CutenessRoutes