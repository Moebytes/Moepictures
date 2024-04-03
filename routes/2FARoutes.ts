import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import {generateSecret, verifyToken} from "node-2fa"

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
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad request")
            if (!req.session.username) return res.status(400).send("Bad request")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            const enabled = !Boolean(user.$2fa)
            if (enabled) {
                await sql.delete2faToken(req.session.username)
                const token = generateSecret({name: "Moebooru", account: functions.toProperCase(req.session.username)})
                await sql.insert2faToken(req.session.username, token.secret, token.qr)
                res.status(200).json({qr: token.qr})
            } else {
                await sql.updateUser(req.session.username, "$2fa", false)
                req.session.$2fa = false
                await sql.delete2faToken(req.session.username)
                res.status(200).send("Success")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa/qr", $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad request")
            if (!req.session.username) return res.status(400).send("Bad request")
            const $2FAToken = await sql.$2faToken(req.session.username)
            if (!$2FAToken) return res.status(400).send("Bad request")
            res.status(200).json($2FAToken.qrcode)
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa/enable", $2faLimiter, async (req: Request, res: Response) => {
        try {
            let {token} = req.body 
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad request")
            if (!req.session.username || !token) return res.status(400).send("Bad request")
            token = token.trim()
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            const $2FAToken = await sql.$2faToken(user.username)
            if (!$2FAToken) return res.status(400).send("Bad request")
            const validToken = verifyToken($2FAToken.token, token, 60)
            if (validToken) {
                await sql.updateUser(req.session.username, "$2fa", true)
                req.session.$2fa = true
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad request")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa", $2faLimiter, async (req: Request, res: Response) => {
        try {
            let {token} = req.body 
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad request")
            if (!req.session.$2fa || !req.session.email || !token) return res.status(400).send("Bad request")
            if (req.session.username) return res.status(400).send("Bad request")
            token = token.trim()
            const user = await sql.userByEmail(req.session.email)
            if (!user) return res.status(400).send("Bad request")
            const $2FAToken = await sql.$2faToken(user.username)
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
                const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                await sql.updateUser(user.username, "ip", ip as string)
                req.session.ip = ip as string
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad request")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/2fa/delete", $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (req.session.username) return res.status(400).send("Bad request")
            req.session.destroy((err) => {
                if (err) throw err
                res.status(200).send("Success")
            })
        } catch {
            res.status(400).send("Bad request")
        }
    })
}

export default $2FARoutes