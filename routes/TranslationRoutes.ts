import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import CSRF from "csrf"

const csrf = new CSRF()

const translationLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 2000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const TranslationRoutes = (app: Express) => {
    app.post("/api/translation/save", translationLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data} = req.body
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!data || !req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()

            const translation = await sql.translation(postID, order)
            if (!translation) {
                if (JSON.stringify(data) === "[]") return res.status(200).send("Success")
                await sql.insertTranslation(postID, req.session.username, order, JSON.stringify(data))
            } else {
                if (JSON.stringify(data) === "[]") {
                    await sql.deleteTranslation(translation.translationID)
                } else {
                    await sql.updateTranslation(translation.translationID, req.session.username, JSON.stringify(data))
                }
            }
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/translations", translationLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const translations = await sql.translations(Number(postID))
            res.status(200).json(translations)
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/translation/save/request", translationLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, order, data, reason} = req.body
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (Number.isNaN(Number(order)) || Number(order) < 1) return res.status(400).send("Invalid order")
            if (!data || !req.session.username) return res.status(400).send("Bad request")

            const translation = await sql.unverifiedTranslation(postID, order, req.session.username)
            if (!translation) {
                await sql.insertUnverifiedTranslation(postID, req.session.username, order, JSON.stringify(data), reason)
            } else {
                await sql.updateUnverifiedTranslation(translation.translationID, req.session.username, JSON.stringify(data), reason)
            }
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/translation/list/unverified", translationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.unverifiedTranslations(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/translation/approve", translationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
          const csrfToken = req.headers["x-csrf-token"] as string
          const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
          if (!valid) return res.status(400).send("Bad request")
          let translationID = Number(req.body.translationID)
          if (Number.isNaN(translationID)) return res.status(400).send("Bad request")
          if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
          const unverified = await sql.unverifiedTranslationID(Number(translationID))
          if (!unverified) return res.status(400).send("Bad request")
          await sql.insertTranslation(unverified.postID, unverified.updater, unverified.order, JSON.stringify(unverified.data))
          await sql.deleteUnverifiedTranslation(Number(translationID))
          res.status(200).send("Success")
        } catch (e) {
          console.log(e)
          res.status(400).send("Bad request")
        }
    })

    app.post("/api/translation/reject", translationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const csrfToken = req.headers["x-csrf-token"] as string
            const valid = csrf.verify(req.session.csrfSecret!, csrfToken)
            if (!valid) return res.status(400).send("Bad request")
            let translationID = Number(req.body.translationID)
            if (Number.isNaN(translationID)) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const unverified = await sql.unverifiedTranslationID(Number(translationID))
            if (!unverified) return res.status(400).send("Bad request")
            await sql.deleteUnverifiedTranslation(Number(translationID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default TranslationRoutes