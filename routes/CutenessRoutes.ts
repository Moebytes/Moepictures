import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"

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
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (Number.isNaN(Number(postID)) || Number.isNaN(Number(cuteness))) return res.status(400).send("Bad postID or cuteness")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (Number(cuteness) < 0 || Number(cuteness) > 1000) return res.status(400).send("Cuteness range must be between 0 and 1000")
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
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const cuteness = await sql.cuteness(Number(postID), req.session.username)
            res.status(200).send(cuteness)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/cuteness/delete", cutenessLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const cuteness = await sql.cuteness(Number(postID), req.session.username)
            if (!cuteness) return res.status(400).send("Cuteness doesn't exist")
            await sql.deleteCuteness(cuteness.cutenessID)
            res.status(200).send(cuteness)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default CutenessRoutes