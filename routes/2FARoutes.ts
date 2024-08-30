import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import {generateSecret, verifyToken} from "node-2fa"
import axios from "axios"

const $2faLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 30,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const $2FARoutes = (app: Express) => {
    app.post("/api/2fa/create", $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const enabled = !Boolean(user.$2fa)
            if (enabled) {
                await sql.token.delete2faToken(req.session.username)
                const token = generateSecret({name: "Moepictures", account: functions.toProperCase(req.session.username)})
                await sql.token.insert2faToken(req.session.username, token.secret, token.qr)
                const arrayBuffer = await axios.get(token.qr, {responseType: "arraybuffer"}).then((r) => r.data)
                const base64 = functions.arrayBufferToBase64(arrayBuffer)
                res.status(200).json(base64)
            } else {
                await sql.user.updateUser(req.session.username, "$2fa", false)
                req.session.$2fa = false
                await sql.token.delete2faToken(req.session.username)
                res.status(200).send("Success")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa/qr", $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const $2FAToken = await sql.token.$2faToken(req.session.username)
            if (!$2FAToken) return res.status(400).send("User doesn't have 2FA token")
            const arrayBuffer = await axios.get($2FAToken.qrcode, {responseType: "arraybuffer"}).then((r) => r.data)
            const base64 = functions.arrayBufferToBase64(arrayBuffer)
            res.status(200).json(base64)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa/enable", $2faLimiter, async (req: Request, res: Response) => {
        try {
            let {token} = req.body 
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!token) return res.status(400).send("Bad token")
            token = token.trim()
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const $2FAToken = await sql.token.$2faToken(user.username)
            if (!$2FAToken) return res.status(400).send("User doesn't have 2FA token")
            const validToken = verifyToken($2FAToken.token, token, 60)
            if (validToken) {
                await sql.user.updateUser(req.session.username, "$2fa", true)
                req.session.$2fa = true
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad token")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa", $2faLimiter, async (req: Request, res: Response) => {
        try {
            let {token} = req.body 
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.$2fa || !req.session.email || !token) return res.status(400).send("2FA isn't enabled")
            if (req.session.username) return res.status(400).send("Already authenticated")
            token = token.trim()
            const user = await sql.user.userByEmail(req.session.email)
            if (!user) return res.status(400).send("Bad email")
            const $2FAToken = await sql.token.$2faToken(user.username)
            const validToken = verifyToken($2FAToken.token, token, 60)
            if (validToken) {
                req.session.$2fa = user.$2fa
                req.session.email = user.email
                req.session.emailVerified = user.emailVerified
                req.session.username = user.username
                req.session.joinDate = user.joinDate
                req.session.image = user.image 
                req.session.bio = user.bio
                req.session.publicFavorites = user.publicFavorites
                req.session.image = user.image
                req.session.role = user.role
                req.session.banned = user.banned
                const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                await sql.user.updateUser(user.username, "ip", ip as string)
                req.session.ip = ip as string
                const {secret, token} = serverFunctions.generateCSRF()
                req.session.csrfSecret = secret
                req.session.csrfToken = token
                req.session.showRelated = user.showRelated
                req.session.showTooltips = user.showTooltips
                req.session.showTagBanner = user.showTagBanner
                req.session.downloadPixivID = user.downloadPixivID
                req.session.autosearchInterval = user.autosearchInterval
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad token")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/2fa/delete", $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (req.session.username) return res.status(401).send("Unauthorized")
            req.session.destroy((err) => {
                if (err) throw err
                res.status(200).send("Success")
            })
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default $2FARoutes