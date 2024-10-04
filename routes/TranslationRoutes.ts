import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions, {authenticate} from "../structures/ServerFunctions"

const translationLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const TranslationRoutes = (app: Express) => {
    app.post("/api/translation/save", authenticate, translationLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, reason} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!data) return res.status(400).send("Bad data")

            const translation = await sql.translation.translation(postID, order)
            if (!translation) {
                if (JSON.stringify(data) === "[]") return res.status(200).send("Success")
                await sql.translation.insertTranslation(postID, req.session.username, order, JSON.stringify(data))
            } else {
                if (JSON.stringify(data) === "[]") {
                    await sql.translation.deleteTranslation(translation.translationID)
                } else {
                    await sql.translation.updateTranslation(translation.translationID, req.session.username, JSON.stringify(data))
                }
            }
            await sql.history.insertTranslationHistory(postID, order, req.session.username, JSON.stringify(data), reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/translation/save", authenticate, translationLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!data) return res.status(400).send("Bad data")

            const translation = await sql.translation.translation(postID, order)
            if (!translation) {
                if (JSON.stringify(data) === "[]") return res.status(200).send("Success")
                await sql.translation.insertTranslation(postID, req.session.username, order, JSON.stringify(data))
            } else {
                if (JSON.stringify(data) === "[]") {
                    await sql.translation.deleteTranslation(translation.translationID)
                } else {
                    await sql.translation.updateTranslation(translation.translationID, req.session.username, JSON.stringify(data))
                }
            }
            await sql.history.insertTranslationHistory(postID, order, req.session.username, JSON.stringify(data), "")
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/translations", translationLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const translations = await sql.translation.translations(Number(postID))
            res.status(200).json(translations)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/translation/save/request", authenticate, translationLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, reason} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!data) return res.status(400).send("Bad data")

            const translation = await sql.translation.unverifiedTranslation(postID, order, req.session.username)
            if (!translation) {
                await sql.translation.insertUnverifiedTranslation(postID, req.session.username, order, JSON.stringify(data), reason)
            } else {
                await sql.translation.updateUnverifiedTranslation(translation.translationID, req.session.username, JSON.stringify(data), reason)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/translation/list/unverified", translationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.translation.unverifiedTranslations(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/translation/approve", authenticate, translationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {translationID, username, postID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            translationID = Number(req.body.translationID)
            if (Number.isNaN(translationID)) return res.status(400).send("Bad translationID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const unverified = await sql.translation.unverifiedTranslationID(Number(translationID))
            if (!unverified) return res.status(400).send("Bad translationID")
            await sql.translation.insertTranslation(unverified.postID, unverified.updater, unverified.order, JSON.stringify(unverified.data))
            await sql.translation.deleteUnverifiedTranslation(Number(translationID))

            let message = `Translations you added on ${functions.getDomain()}/post/${postID} have been approved. Thanks for the contribution!`
            await serverFunctions.systemMessage(username, "Notice: Translations have been approved", message)

            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/translation/reject", authenticate, translationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {translationID, username, postID} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            translationID = Number(req.body.translationID)
            if (Number.isNaN(translationID)) return res.status(400).send("Bad translationID")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const unverified = await sql.translation.unverifiedTranslationID(Number(translationID))
            if (!unverified) return res.status(400).send("Bad translationID")
            await sql.translation.deleteUnverifiedTranslation(Number(translationID))

            let message = `Translations you added on ${functions.getDomain()}/post/${postID} have been rejected. They might be incorrect.`
            // await serverFunctions.systemMessage(username, "Notice: Translations have been rejected", message)
            
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/translation/history", translationLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            const order = req.query.order as string
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const result = await sql.history.translationHistory(postID, order, offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/translation/history/delete", authenticate, translationLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            const order = req.query.order as string
            const historyID = req.query.historyID as string
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const translationHistory = await sql.history.translationHistory(postID, order)
            if (translationHistory[0]?.historyID === historyID) {
                return res.status(400).send("Bad historyID")
            } else {
                await sql.history.deleteTranslationHistory(Number(historyID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default TranslationRoutes