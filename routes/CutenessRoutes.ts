import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"

const cutenessLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const CutenessRoutes = (app: Express) => {
    app.post("/api/cuteness/update", csrfProtection, cutenessLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, cuteness} = req.body as {postID: string, cuteness: number}
            if (Number.isNaN(Number(postID)) || Number.isNaN(Number(cuteness))) return res.status(400).send("Bad postID or cuteness")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (Number(cuteness) < 0 || Number(cuteness) > 1000) return res.status(400).send("Cuteness range must be between 0 and 1000")
            await sql.cuteness.updateCuteness(postID, req.session.username, cuteness)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/cuteness", cutenessLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const cute = await sql.cuteness.cuteness(postID, req.session.username)
            serverFunctions.sendEncrypted(cute, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/cuteness/delete", csrfProtection, cutenessLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            await sql.cuteness.deleteCuteness(postID, req.session.username)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default CutenessRoutes