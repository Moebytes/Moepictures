import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import sql from "../sql/SQLQuery"
import functions from "../functions/Functions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import {generateSecret, verifyToken} from "node-2fa"

const $2faLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const $2FARoutes = (app: Express) => {
    app.post("/api/2fa/create", csrfProtection, $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return void res.status(400).send("Bad username")
            const enabled = !Boolean(user.$2fa)
            if (enabled) {
                await sql.token.delete2faToken(req.session.username)
                const token = await generateSecret({name: "Moepictures", account: functions.util.toProperCase(req.session.username)})
                await sql.token.insert2faToken(req.session.username, token.secret, token.qr)
                res.status(200).json(token.qr)
            } else {
                await sql.user.updateUser(req.session.username, "$2fa", false)
                req.session.$2fa = false
                await sql.token.delete2faToken(req.session.username)
                let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                ip = ip?.toString().replace("::ffff:", "") || ""
                const device = functions.util.parseUserAgent(req.headers["user-agent"])
                const region = await serverFunctions.ipRegion(ip)
                await sql.user.insertLoginHistory(user.username, "2fa disabled", ip, device, region)
                res.status(200).send("Success")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa/qr", csrfProtection, $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            const $2FAToken = await sql.token.$2faToken(req.session.username)
            if (!$2FAToken) return void res.status(400).send("User doesn't have 2FA token")
            res.status(200).json($2FAToken.qrcode)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa/enable", csrfProtection, $2faLimiter, async (req: Request, res: Response) => {
        try {
            let {token} = req.body as {token: string}
            if (!req.session.username) return void res.status(403).send("Unauthorized")
            if (!token) return void res.status(400).send("Bad token")
            token = token.trim()
            const user = await sql.user.user(req.session.username)
            if (!user) return void res.status(400).send("Bad username")
            const $2FAToken = await sql.token.$2faToken(user.username)
            if (!$2FAToken) return void res.status(400).send("User doesn't have 2FA token")
            const validToken = verifyToken($2FAToken.token, token, 60)
            if (validToken) {
                await sql.user.updateUser(req.session.username, "$2fa", true)
                req.session.$2fa = true
                let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                ip = ip?.toString().replace("::ffff:", "") || ""
                const device = functions.util.parseUserAgent(req.headers["user-agent"])
                const region = await serverFunctions.ipRegion(ip)
                await sql.user.insertLoginHistory(user.username, "2fa enabled", ip, device, region)
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad token")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/2fa", csrfProtection, $2faLimiter, async (req: Request, res: Response) => {
        try {
            let {token} = req.body as {token: string}
            if (!req.session.$2fa || !req.session.email || !token) return void res.status(400).send("2FA isn't enabled")
            if (req.session.username) return void res.status(400).send("Already authenticated")
            token = token.trim()
            const user = await sql.user.userByEmail(req.session.email)
            if (!user) return void res.status(400).send("Bad email")
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            const device = functions.util.parseUserAgent(req.headers["user-agent"])
            const region = await serverFunctions.ipRegion(ip)
            const $2FAToken = await sql.token.$2faToken(user.username)
            const validToken = verifyToken($2FAToken?.token || "", token, 60)
            if (validToken) {
                req.session.$2fa = user.$2fa
                req.session.email = user.email
                req.session.emailVerified = user.emailVerified
                req.session.cookieConsent = user.cookieConsent
                req.session.username = user.username
                req.session.joinDate = user.joinDate
                req.session.image = user.image 
                req.session.bio = user.bio
                req.session.publicFavorites = user.publicFavorites
                req.session.publicTagFavorites = user.publicTagFavorites
                req.session.image = user.image
                req.session.imageHash = user.imageHash
                req.session.imagePost = user.imagePost
                req.session.role = user.role
                req.session.banned = user.banned
                const {secret, token} = serverFunctions.generateCSRF()
                req.session.csrfSecret = secret
                req.session.csrfToken = token
                req.session.showRelated = user.showRelated
                req.session.showTooltips = user.showTooltips
                req.session.showTagTooltips = user.showTagTooltips
                req.session.showTagBanner = user.showTagBanner
                req.session.downloadPixivID = user.downloadPixivID
                req.session.autosearchInterval = user.autosearchInterval
                req.session.upscaledImages = user.upscaledImages
                req.session.forceNoteBubbles = user.forceNoteBubbles
                req.session.liveAnimationPreview = user.liveAnimationPreview
                req.session.liveModelPreview = user.liveModelPreview
                req.session.savedSearches = user.savedSearches
                req.session.blacklist = user.blacklist
                req.session.showR18 = user.showR18
                req.session.postCount = user.postCount
                req.session.deletedPosts = user.deletedPosts
                req.session.premiumExpiration = user.premiumExpiration
                req.session.banExpiration = user.banExpiration
                req.session.lastNameChange = user.lastNameChange
                const ips = functions.util.removeDuplicates([ip, ...(user.ips || [])].filter(Boolean))
                await sql.user.updateUser(user.username, "ips", ips)
                req.session.ips = ips
                await sql.user.updateUser(user.username, "lastLogin", new Date().toISOString())
                await sql.user.insertLoginHistory(user.username, "login", ip, device, region)
                res.status(200).send("Success")
            } else {
                await sql.user.insertLoginHistory(user.username, "login 2fa failed", ip, device, region)
                res.status(400).send("Bad token")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/2fa/delete", $2faLimiter, async (req: Request, res: Response) => {
        try {
            if (req.session.username) return void res.status(400).send("Bad request")
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