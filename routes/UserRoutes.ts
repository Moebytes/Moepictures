import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import bcrypt from "bcrypt"
import crypto from "crypto"
import functions from "../structures/Functions"
import jsxFunctions from "../structures/JSXFunctions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import permissions from "../structures/Permissions"
import path from "path"
import { String } from "aws-sdk/clients/batch"

const signupLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 5,
	message: "Too many accounts created, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const loginLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 10,
	message: "Too many login attempts, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const loginSpeedLimiter = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 1,
    delayMs: 200
})

const sessionLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 500,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const userLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const UserRoutes = (app: Express) => {
    app.get("/api/user", sessionLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const username = req.query.username as string
            if (!username) return res.status(200).json(null)
            let user = await sql.user.user(username.trim())
            if (!user) return res.status(200).json(null)
            delete user.ip
            delete user.$2fa
            delete user.email
            delete user.emailVerified
            delete user.password
            delete user.showRelated
            delete user.showTooltips
            delete user.downloadPixivID
            delete user.autosearchInterval
            delete user.showTagBanner
            delete user.upscaledImage
            delete user.savedSearches
            delete user.premiumExpiration
            delete user.showR18
            res.status(200).json(user)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
    
    app.post("/api/user/signup", csrfProtection, signupLimiter, async (req: Request, res: Response) => {
        try {
            let {username, email, password, captchaResponse} = req.body
            if (!username || !email || !password || !captchaResponse) return res.status(400).send("Bad username, email, password, or captchaResponse.")
            username = username.trim().toLowerCase()
            email = email.trim()
            password = password.trim()
            const badUsername = functions.validateUsername(username)
            const badEmail = functions.validateEmail(email)
            const badPassword = functions.validatePassword(username, password)
            if (badUsername || badEmail || badPassword) return res.status(400).send("Bad username, password, or email.")
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            let bannedIp = await sql.report.activeBannedIP(ip)
            if (bannedIp) return res.status(400).send("IP banned")
            try {
                await sql.user.insertUser(username, email)
                await sql.user.updateUser(username, "joinDate", new Date().toISOString())
                await sql.user.updateUser(username, "publicFavorites", true)
                await sql.user.updateUser(username, "showRelated", true)
                await sql.user.updateUser(username, "showTooltips", true)
                await sql.user.updateUser(username, "showTagBanner", true)
                await sql.user.updateUser(username, "downloadPixivID", false)
                await sql.user.updateUser(username, "autosearchInterval", 3000)
                await sql.user.updateUser(username, "upscaledImages", false)
                await sql.user.updateUser(username, "showR18", false)
                await sql.user.updateUser(username, "savedSearches", "{}")
                await sql.user.updateUser(username, "emailVerified", false)
                await sql.user.updateUser(username, "$2fa", false)
                await sql.user.updateUser(username, "bio", "This user has not written anything.")
                await sql.user.updateUser(username, "role", "user")
                await sql.user.updateUser(username, "ip", ip)
                const passwordHash = await bcrypt.hash(password, 13)
                await sql.user.updateUser(username, "password", passwordHash)

                const token = crypto.randomBytes(32).toString("hex")
                const hashToken = crypto.createHash("sha256").update(token).digest("hex")
                try {
                    await sql.token.insertEmailToken(email, hashToken)
                } catch {
                    await sql.token.updateEmailToken(email, hashToken)
                }
                const user = functions.toProperCase(username)
                const link = `${req.protocol}://${req.get("host")}/api/user/verifyemail?token=${token}`
                await serverFunctions.email(email, "Moepictures Email Address Verification", jsxFunctions.verifyEmailJSX(user, link))
                const device = functions.parseUserAgent(req.headers["user-agent"])
                await sql.user.insertLoginHistory(username, "account created", ip, device)
                return res.status(200).send("Success")
            } catch {
                return res.status(400).send("Username taken")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/login", csrfProtection, loginLimiter, loginSpeedLimiter, async (req: Request, res: Response) => {
        try {
            let {username, password, captchaResponse} = req.body
            if (!username || !password || !captchaResponse) return res.status(400).send("Bad username, password, or captchaResponse")
            username = username.trim().toLowerCase()
            password = password.trim()
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            const device = functions.parseUserAgent(req.headers["user-agent"])
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            const user = await sql.user.user(username)
            if (!user) return res.status(400).send("Bad request")
            const matches = await bcrypt.compare(password, user.password)
            if (matches) {
                req.session.$2fa = user.$2fa
                req.session.email = user.email
                if (user.$2fa) return res.status(200).send("2fa")
                req.session.emailVerified = user.emailVerified
                req.session.username = user.username
                req.session.joinDate = user.joinDate
                req.session.image = user.image
                req.session.imagePost = user.imagePost
                req.session.bio = user.bio
                req.session.publicFavorites = user.publicFavorites
                req.session.role = user.role
                req.session.banned = user.banned
                await sql.user.updateUser(username, "ip", ip)
                req.session.ip = ip
                const {secret, token} = serverFunctions.generateCSRF()
                req.session.csrfSecret = secret
                req.session.csrfToken = token
                req.session.showRelated = user.showRelated
                req.session.showTooltips = user.showTooltips
                req.session.showTagBanner = user.showTagBanner
                req.session.downloadPixivID = user.dowautosearchInterval
                req.session.autosearchInterval = user.autosearchInterval
                req.session.upscaledImages = user.upscaledImages
                req.session.savedSearches = user.savedSearches
                req.session.showR18 = user.showR18
                req.session.premiumExpiration = user.premiumExpiration
                req.session.banExpiration = user.banExpiration
                await sql.user.insertLoginHistory(user.username, "login", ip, device)
                return res.status(200).send("Success")
            } else {
                await sql.user.insertLoginHistory(user.username, "login failed", ip, device)
                return res.status(400).send("Bad request")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/logout", userLimiter, async (req: Request, res: Response) => {
        try {
            req.session.destroy((err) => {
                if (err) throw err
                res.status(200).send("Success")
            })
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/logout-sessions", userLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            await sql.user.destroyOtherSessions(req.session.username, req.sessionID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/session", sessionLimiter, async (req: Request, res: Response) => {
        try {
            if (req.session.username) {
                const user = await sql.user.user(req.session.username)
                req.session.$2fa = user.$2fa
                req.session.banned = user.banned
                req.session.email = user.email
                req.session.emailVerified = user.emailVerified
                req.session.image = user.image
                req.session.imagePost = user.imagePost
                req.session.bio = user.bio
                req.session.joinDate = user.joinDate
                req.session.publicFavorites = user.publicFavorites
                req.session.role = user.role
                req.session.showRelated = user.showRelated
                req.session.showTooltips = user.showTooltips
                req.session.showTagBanner = user.showTagBanner
                req.session.downloadPixivID = user.downloadPixivID
                req.session.autosearchInterval = user.autosearchInterval
                req.session.upscaledImages = user.upscaledImages
                req.session.savedSearches = user.savedSearches
                req.session.showR18 = user.showR18
                req.session.premiumExpiration = user.premiumExpiration
                req.session.banExpiration = user.banExpiration

                if (user.role.includes("premium") && user.premiumExpiration) {
                    if (new Date(user.premiumExpiration) < new Date()) {
                        if (user.role.includes("curator")) {
                            await sql.user.updateUser(req.session.username, "role", "curator")
                        } else if (user.role.includes("contributor")) {
                            await sql.user.updateUser(req.session.username, "role", "contributor")
                        } else {
                            await sql.user.updateUser(req.session.username, "role", "user")
                        }
                        const message = `Unfortunately, it seems like your premium membership has expired. Thank you for supporting us! We greatly appreciate your time spent as a premium member and we hope that you are interested in renewing it again.\n\n${functions.getDomain()}/premium#purchase`
                        await serverFunctions.systemMessage(req.session.username, "Notice: Your premium membership expired", message)
                    }
                }

                if (user.banned && user.banExpiration) {
                    if (new Date(user.banExpiration) < new Date()) {
                        const activeBan = await sql.report.activeBan(req.session.username)
                        await sql.report.updateBan(activeBan.banID, "active", false)
                        await sql.user.updateUser(req.session.username, "banned", false)
                        await sql.user.updateUser(req.session.username, "banExpiration", null)
                        const message = `Hello, the duration of your ban ended and it has been lifted. Please have good behavior from now on, as future bans may be permanent.`
                        await serverFunctions.systemMessage(req.session.username, "Notice: Your ban period has ended", message)
                    }
                }
            }
            const session = structuredClone(req.session)
            delete session.refreshToken
            delete session.captchaAnswer
            delete session.csrfSecret
            delete session.ip
            
            res.status(200).json(session)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/pfp", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const bytes = req.body.bytes
            const postID = req.body.postID
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const result = functions.bufferFileType(bytes)?.[0]
            const jpg = result?.mime === "image/jpeg"
            const png = result?.mime === "image/png"
            const webp = result?.mime === "image/webp"
            const avif = result?.mime === "image/avif"
            const gif = result?.mime === "image/gif"
            if (gif || webp || avif) {
                if (!permissions.isPremium(req.session)) return res.status(402).send("Premium only")
            }
            if (jpg || png || gif || webp || avif) {
                if (req.session.image) {
                    let oldImagePath = functions.getTagPath("pfp", req.session.image)
                    await serverFunctions.deleteFile(oldImagePath, false).catch(() => null)
                }
                if (jpg) result.extension = "jpg"
                const filename = `${req.session.username}.${result.extension}`
                let imagePath = functions.getTagPath("pfp", filename)
                const buffer = Buffer.from(Object.values(bytes) as any)
                await serverFunctions.uploadFile(imagePath, buffer, false)
                await sql.user.updateUser(req.session.username, "image", filename)
                if (postID) await sql.user.updateUser(req.session.username, "imagePost", postID)
                req.session.image = filename
                if (postID) req.session.imagePost = postID
                res.status(201).send("Success")
            } else {
                res.status(400).send("Bad request")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/user/pfp", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.image) {
                let oldImagePath = functions.getTagPath("pfp", req.session.image)
                await serverFunctions.deleteFile(oldImagePath, false).catch(() => null)
            }
            await sql.user.updateUser(req.session.username, "image", null)
            await sql.user.updateUser(req.session.username, "imagePost", null)
            req.session.image = null
            req.session.imagePost = null
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/favoritesprivacy", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const newPrivacy = !Boolean(user.publicFavorites)
            req.session.publicFavorites = newPrivacy 
            await sql.user.updateUser(req.session.username, "publicFavorites", newPrivacy)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/showrelated", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const newRelated = !Boolean(user.showRelated)
            req.session.showRelated = newRelated 
            await sql.user.updateUser(req.session.username, "showRelated", newRelated)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/showtooltips", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const newTooltips = !Boolean(user.showTooltips)
            req.session.showTooltips = newTooltips 
            await sql.user.updateUser(req.session.username, "showTooltips", newTooltips)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/showtagbanner", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const newTagBanner = !Boolean(user.showTagBanner)
            req.session.showTagBanner = newTagBanner 
            await sql.user.updateUser(req.session.username, "showTagBanner", newTagBanner)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/downloadpixivid", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const newDownloadPixivID = !Boolean(user.downloadPixivID)
            req.session.downloadPixivID = newDownloadPixivID 
            await sql.user.updateUser(req.session.username, "downloadPixivID", newDownloadPixivID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/autosearchinterval", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            const {interval} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (Number.isNaN(Number(interval))) return res.status(400).send("Bad interval")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            let newInterval = Math.floor(Number(interval) * 1000)
            if (newInterval < 1000) newInterval = 1000
            req.session.autosearchInterval = newInterval 
            await sql.user.updateUser(req.session.username, "autosearchInterval", newInterval)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/upscaledimages", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            const {reset} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            if (reset) {
                await sql.user.updateUser(req.session.username, "upscaledImages", false)
                return res.status(200).send("Success")
            }
            if (!permissions.isPremium(req.session)) return res.status(402).send("Premium only")
            const newUpscaledImages = !Boolean(user.upscaledImages)
            req.session.upscaledImages = newUpscaledImages 
            await sql.user.updateUser(req.session.username, "upscaledImages", newUpscaledImages)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/savesearch", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            const {name, tags} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            let savedSearches = user.savedSearches || {}
            savedSearches[name] = tags
            req.session.savedSearches = savedSearches 
            await sql.user.updateUser(req.session.username, "savedSearches", JSON.stringify(savedSearches))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.put("/api/user/savesearch", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            const {name, key, tags} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            let savedSearches = user.savedSearches || {}
            delete savedSearches[name]
            savedSearches[key] = tags
            req.session.savedSearches = savedSearches 
            await sql.user.updateUser(req.session.username, "savedSearches", JSON.stringify(savedSearches))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/user/savesearch/delete", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            const {name, all} = req.query
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            if (all) {
                await sql.user.updateUser(req.session.username, "savedSearches", null)
                return res.status(200).send("Success")
            }
            let savedSearches = user.savedSearches || {}
            delete savedSearches[name as string]
            req.session.savedSearches = savedSearches 
            await sql.user.updateUser(req.session.username, "savedSearches", JSON.stringify(savedSearches))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/r18", csrfProtection, sessionLimiter, async (req: Request, res: Response) => {
        try {
            const {r18} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            if (!permissions.isAdmin(req.session)) return res.status(403).end()
            const newR18 = r18 !== undefined ? r18 : !Boolean(user.showR18)
            req.session.showR18 = newR18
            await sql.user.updateUser(req.session.username, "showR18", newR18)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changeusername", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            let {newUsername, captchaResponse} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            if (!permissions.isPremium(req.session)) return res.status(402).send("Premium only")
            newUsername = newUsername.trim().toLowerCase()
            const badUsername = functions.validateUsername(newUsername)
            if (badUsername) return res.status(400).send("Bad username")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            await sql.user.updateUser(req.session.username, "username", newUsername)
            req.session.username = newUsername
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            const device = functions.parseUserAgent(req.headers["user-agent"])
            await sql.user.insertLoginHistory(user.username, "username change", ip, device)
            if (user.image) {
                const newFilename = `${req.session.username}${path.extname(user.image)}`
                let oldImagePath = functions.getTagPath("pfp", user.image)
                let newImagePath = functions.getTagPath("pfp", newFilename)
                await serverFunctions.renameFile(oldImagePath, newImagePath, false, false)
                await sql.user.updateUser(newUsername, "image", newFilename)
                req.session.image = newFilename
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changepassword", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            let {oldPassword, newPassword} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!oldPassword || !newPassword) return res.status(400).send("Bad oldPassword or newPassword")
            oldPassword = oldPassword.trim()
            newPassword = newPassword.trim()
            const badPassword = functions.validatePassword(req.session.username, newPassword)
            if (badPassword) return res.status(400).send("Bad newPassword")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const matches = await bcrypt.compare(oldPassword, user.password)
            if (matches) {
                const newHash = await bcrypt.hash(newPassword, 13)
                await sql.user.updateUser(req.session.username, "password", newHash)
                let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                ip = ip?.toString().replace("::ffff:", "") || ""
                const device = functions.parseUserAgent(req.headers["user-agent"])
                await sql.user.insertLoginHistory(user.username, "password change", ip, device)
                return res.status(200).send("Success")
            } else {
                return res.status(400).send("Bad oldPassword")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/changeemail", userLimiter, async (req: Request, res: Response) => {
        try {
            let token = req.query.token as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!token) return res.status(400).send("Bad token")
            const hashToken = crypto.createHash("sha256").update(token.trim()).digest("hex")
            const tokenData = await sql.token.emailToken(hashToken)
            if (!tokenData) return res.status(400).send("Bad token")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                await sql.user.updateUser(req.session.username, "email", tokenData.email)
                req.session.email = tokenData.email
                await sql.token.deleteEmailToken(tokenData.email)
                let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                ip = ip?.toString().replace("::ffff:", "") || ""
                const device = functions.parseUserAgent(req.headers["user-agent"])
                await sql.user.insertLoginHistory(req.session.username, "email change", ip, device)
                res.status(200).redirect("/change-email-success")
            } else {
                await sql.token.deleteEmailToken(tokenData.email)
                res.status(400).send("Token expired")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changeemail", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            let {newEmail, captchaResponse} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            const badEmail = functions.validateEmail(newEmail)
            if (badEmail) return res.status(400).send("Bad newEmail")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken = crypto.createHash("sha256").update(token).digest("hex")
            try {
                await sql.token.insertEmailToken(newEmail, hashToken)
            } catch {
                await sql.token.updateEmailToken(newEmail, hashToken)
            }
            const username = functions.toProperCase(req.session.username)
            const link = `${req.protocol}://${req.get("host")}/api/user/changeemail?token=${token}`
            await serverFunctions.email(newEmail, "Moepictures Email Address Change", jsxFunctions.changeEmailJSX(username, link))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/verifyemail", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            let {email, captchaResponse} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            const badEmail = functions.validateEmail(email)
            if (badEmail) return res.status(400).send("Bad email")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken = crypto.createHash("sha256").update(token).digest("hex")
            try {
                await sql.token.insertEmailToken(email, hashToken)
            } catch {
                await sql.token.updateEmailToken(email, hashToken)
            }
            const username = functions.toProperCase(req.session.username)
            const link = `${req.protocol}://${req.get("host")}/api/user/verifyemail?token=${token}`
            await serverFunctions.email(email, "Moepictures Email Address Verification", jsxFunctions.verifyEmailJSX(username, link))
            await sql.user.updateUser(req.session.username, "email", email)
            req.session.email = email
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/verifyemail", userLimiter, async (req: Request, res: Response) => {
        try {
            let token = req.query.token as string
            if (!token) return res.status(400).send("Bad token")
            const hashToken = crypto.createHash("sha256").update(token.trim()).digest("hex")
            const tokenData = await sql.token.emailToken(hashToken)
            if (!tokenData) return res.status(400).send("Bad token")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                const user = await sql.user.userByEmail(tokenData.email)
                await sql.user.updateUser(user.username, "email", tokenData.email)
                await sql.user.updateUser(user.username, "emailVerified", true)
                req.session.email = tokenData.email
                req.session.emailVerified = true
                await sql.token.deleteEmailToken(tokenData.email)
                let message = `Welcome to Moepictures ${user.username}!\n\nHope you enjoy your stay (ﾉ^_^)ﾉ*:･ﾟ✧`
                await serverFunctions.systemMessage(user.username, "Welcome to Moepictures!", message)
                let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                ip = ip?.toString().replace("::ffff:", "") || ""
                const device = functions.parseUserAgent(req.headers["user-agent"])
                await sql.user.insertLoginHistory(user.username, "email verified", ip, device)
                res.status(200).redirect("/verify-email-success")
            } else {
                await sql.token.deleteEmailToken(tokenData.email)
                res.status(400).send("Bad request")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changebio", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            let {bio} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!bio) return res.status(400).send("Bad bio")
            bio = bio.trim()
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            await sql.user.updateUser(req.session.username, "bio", bio)
            req.session.bio = bio
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/forgotpassword", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const {email, captchaResponse} = req.body
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            if (!email) {
                await functions.timeout(2000) 
                return res.status(200).send("Success")
            }
            const user = await sql.user.userByEmail(email.trim())
            if (!user) {
                await functions.timeout(2000) 
                return res.status(200).send("Success")
            }
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken =  await bcrypt.hash(token, 13)
            try {
                await sql.token.insertPasswordToken(user.username, hashToken)
            } catch {
                await sql.token.deletePasswordToken(user.username)
                await sql.token.insertPasswordToken(user.username, hashToken)
            }
            const username = functions.toProperCase(user.username)
            const link = `${req.protocol}://${req.get("host")}/reset-password?token=${token}&username=${user.username}`
            await serverFunctions.email(user.email, "Moepictures Password Reset", jsxFunctions.resetPasswordJSX(username, link))
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            const device = functions.parseUserAgent(req.headers["user-agent"])
            await sql.user.insertLoginHistory(user.username, "password reset request", ip, device)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(200).send("Success")
        }
    })

    app.post("/api/user/resetpassword", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const {username, password, token} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username || !token || !password) return res.status(400).send("Bad username, token, or password")
            const badPassword = functions.validatePassword(username, password)
            if (badPassword) return res.status(400).send("Bad password")
            const tokenData = await sql.token.passwordToken(username)
            if (!tokenData) return res.status(400).send("Bad token")
            const matches = await bcrypt.compare(token, tokenData.token)
            if (!matches) return res.status(400).send("Bad password")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                await sql.token.deletePasswordToken(username)
                const passwordHash = await bcrypt.hash(password, 13)
                await sql.user.updateUser(username, "password", passwordHash)
                let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                ip = ip?.toString().replace("::ffff:", "") || ""
                const device = functions.parseUserAgent(req.headers["user-agent"])
                await sql.user.insertLoginHistory(username, "password reset", ip, device)
                res.status(200).send("Success")
            } else {
                await sql.token.deletePasswordToken(username)
                res.status(400).send("Token expired")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/user/delete", csrfProtection, userLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const user = await sql.user.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            try {
                await sql.token.deleteEmailToken(user.email)
                await serverFunctions.deleteFile(functions.getTagLink("pfp", user.image), false)
            } catch (e) {
            console.log(e)
                // ignore
            }
            await sql.user.deleteUser(req.session.username)
            req.session.destroy((err) => {
                if (err) throw err
                res.status(200).send("Success")
            })
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/favorites", sessionLimiter, async (req: Request, res: Response) => {
        try {
            const username = req.query.username as string
            const restrict = req.query.restrict as string
            const offset = req.query.offset as string
            const limit = req.query.limit as string
            let favorites = [] as any
            if (username) {
                const user = await sql.user.user(username as string)
                if (!user || !user.publicFavorites) return res.status(200).send([])
                favorites = await sql.favorite.favorites(username, limit, offset, "all", restrict)
            } else {
                if (!req.session.username) return res.status(403).send("Unauthorized")
                favorites = await sql.favorite.favorites(req.session.username, limit, offset, "all", restrict)
            }
            if (!permissions.isMod(req.session)) {
                favorites = favorites.filter((p: any) => !p.hidden)
            }
            if (!req.session.showR18) {
                favorites = favorites.filter((p: any) => p.restrict !== "explicit")
            }
            for (let i = favorites.length - 1; i >= 0; i--) {
                const post = favorites[i]
                if (post.private) {
                    const categories = await serverFunctions.tagCategories(post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) favorites.splice(i, 1)
                }
            }
            favorites = functions.stripTags(favorites)
            res.status(200).send(favorites)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/user/uploads", sessionLimiter, async (req: Request, res: Response) => {
        try {
            const username = req.query.username as string
            const restrict = req.query.restrict as string
            const offset = req.query.offset as string
            const limit = req.query.limit as string
            let uploads = [] as any
            if (username) {
                uploads = await sql.user.uploads(username, limit, offset, "all", restrict)
            } else {
                if (!req.session.username) return res.status(403).send("Unauthorized")
                uploads = await sql.user.uploads(req.session.username, limit, offset, "all", restrict)
            }
            if (!permissions.isMod(req.session)) {
                uploads = uploads.filter((p: any) => !p.hidden)
            }
            if (!req.session.showR18) {
                uploads = uploads.filter((p: any) => p.restrict !== "explicit")
            }
            for (let i = uploads.length - 1; i >= 0; i--) {
                const post = uploads[i]
                if (post.private) {
                    const categories = await serverFunctions.tagCategories(post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) uploads.splice(i, 1)
                }
            }
            uploads = functions.stripTags(uploads)
            res.status(200).send(uploads)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/user/favgroups", sessionLimiter, async (req: Request, res: Response) => {
        try {
            const username = req.query.username as String
            if (username) {
                const user = await sql.user.user(username as string)
                if (!user) return res.status(200).send([])
                let favgroups = await sql.favorite.favgroups(username)
                favgroups = favgroups.filter((f: any) => !f.private)
                res.status(200).send(favgroups)
            } else {
                if (!req.session.username) return res.status(403).send("Unauthorized")
                let favgroups = await sql.favorite.favgroups(req.session.username)
                res.status(200).send(favgroups)
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/user/comments", sessionLimiter, async (req: Request, res: Response) => {
        try {
            const query = req.query.query as string
            const sort = req.query.sort as string
            const offset = req.query.offset as string
            const username = req.query.username as string
            let comments = [] as any
            if (username) {
                comments = await sql.comment.searchCommentsByUsername([username], query, sort, offset)
            } else {
                if (!req.session.username) return res.status(400).send("Bad request")
                comments = await sql.comment.searchCommentsByUsername([req.session.username], query, sort, offset)
            }
            for (let i = comments.length - 1; i >= 0; i--) {
                const comment = comments[i]
                if (!permissions.isMod(req.session)) {
                    if (comment.post.hidden) comments.splice(i, 1)
                }
                if (!req.session.showR18) {
                    if (comment.post.restrict === "explicit") comments.splice(i, 1)
                }
                if (comment.post.private) {
                    const categories = await serverFunctions.tagCategories(comment.post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) comments.splice(i, 1)
                }
            }
            res.status(200).send(comments)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/user/ban", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const {username, reason, deleteUnverifiedChanges, deleteHistoryChanges, deleteComments, deleteMessages, days} = req.body
            if (!username) return res.status(400).send("Bad username")
            if (days && Number.isNaN(Number(days))) return res.status(400).send("Bad days")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            if (req.session.username === username) return res.status(400).send("Cannot perform action on yourself")
            const user = await sql.user.user(username)
            if (!user) return res.status(400).send("Bad username")
            if (user.role === "admin" || user.role === "mod" || user.role === "system") return res.status(400).send("Cannot perform action on this user")
            if (deleteUnverifiedChanges) {
                // Delete unverified posts
                const unverifiedPosts = await sql.search.unverifiedUserPosts(username)
                for (const unverified of unverifiedPosts) {
                    await sql.post.deleteUnverifiedPost(unverified.postID)
                    for (let i = 0; i < unverified.images.length; i++) {
                        const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
                        await serverFunctions.deleteUnverifiedFile(file)
                    }
                }
                // Delete unverified post edits
                const unverifiedPostEdits = await sql.search.unverifiedUserPostEdits(username)
                for (const unverified of unverifiedPostEdits) {
                    await sql.post.deleteUnverifiedPost(unverified.postID)
                    for (let i = 0; i < unverified.images.length; i++) {
                        const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
                        await serverFunctions.deleteUnverifiedFile(file)
                    }
                }
                // Delete unverified post deletions
                const postDeleteRequests = await sql.request.userPostDeleteRequests(username)
                for (const postDeleteRequest of postDeleteRequests) {
                    await sql.request.deletePostDeleteRequest(username, postDeleteRequest.postID)
                }
                // Delete unverified tag aliasing
                const aliasRequests = await sql.request.userAliasRequests(username)
                for (const aliasRequest of aliasRequests) {
                    await sql.request.deleteAliasRequest(username, aliasRequest.tag)
                }
                // Delete unverified tag edits
                const tagEditRequests = await sql.request.userTagEditRequests(username)
                for (const tagEditRequest of tagEditRequests) {
                    await sql.request.deleteTagEditRequest(username, tagEditRequest.tag)
                }
                // Delete unverified tag deletions
                const tagDeleteRequests = await sql.request.userTagDeleteRequests(username)
                for (const tagDeleteRequest of tagDeleteRequests) {
                    await sql.request.deleteTagDeleteRequest(username, tagDeleteRequest.tag)
                }
                // Delete unverified groups
                const groupRequests = await sql.request.userGroupRequests(username)
                for (const groupRequest of groupRequests) {
                    await sql.request.deleteGroupRequest(username, groupRequest.slug, groupRequest.postID)
                }
                // Delete unverified group edits
                const groupEditRequests = await sql.request.userGroupEditRequests(username)
                for (const groupEditRequest of groupEditRequests) {
                    await sql.request.deleteGroupEditRequest(username, groupEditRequest.group)
                }
                // Delete unverified group deletions
                const groupDeleteRequests = await sql.request.userGroupDeleteRequests(username)
                for (const groupDeleteRequest of groupDeleteRequests) {
                    await sql.request.deleteGroupDeleteRequest(username, groupDeleteRequest.group)
                }
                // Delete unverified translations
                const unverifiedTranslations = await sql.translation.userUnverifiedTranslations(username)
                for (const unverifiedTranslation of unverifiedTranslations) {
                    await sql.translation.deleteUnverifiedTranslation(unverifiedTranslation.translationID)
                }
                // Delete reports
                const reports = await sql.report.userReports(username)
                for (const report of reports) {
                    if (report.type === "comment") {
                        await sql.report.deleteCommentReport(report.reportID)
                    } else if (report.type === "thread") {
                        await sql.report.deleteThreadReport(report.reportID)
                    } else if (report.type === "reply") {
                        await sql.report.deleteReplyReport(report.reportID)
                    }
                }
            }
            if (deleteComments) {
                // Delete comments
                const comments = await sql.comment.userComments(username)
                for (const comment of comments) {
                    await sql.comment.deleteComment(comment.commentID)
                }
                // Delete threads
                const threads = await sql.thread.userThreads(username)
                for (const thread of threads) {
                    await sql.thread.deleteThread(thread.threadID)
                }
                // Delete replies
                const replies = await sql.thread.userReplies(username)
                for (const reply of replies) {
                    await sql.thread.deleteReply(reply.replyID)
                }
            }
            if (deleteMessages) {
                // Delete messages
                const messages = await sql.message.userMessages(username)
                for (const message of messages) {
                    await sql.message.deleteMessage(message.messageID)
                }
                // Delete message replies
                const messageReplies = await sql.message.userMessageReplies(username)
                for (const messageReply of messageReplies) {
                    await sql.message.deleteMessageReply(messageReply.replyID)
                }
            }
            let revertPostIDs = new Set()
            let revertTagIDs = new Set()
            let revertGroupIDs = new Set()
            let revertTranslationIDs = new Set()
            if (deleteHistoryChanges) {
                // Revert post history
                const postHistory = await sql.history.userPostHistory(username)
                for (const history of postHistory) {
                    if (history.image?.startsWith("history/")) {
                        let r18 = history.restrict === "explicit"
                        await serverFunctions.deleteFile(history.image, r18)
                    }
                    await sql.history.deletePostHistory(history.historyID)
                    revertPostIDs.add(history.postID)
                }
                // Revert tag history
                const tagHistory = await sql.history.userTagHistory(username)
                for (const history of tagHistory) {
                    if (history.image?.startsWith("history/")) {
                        await serverFunctions.deleteFile(history.image, false)
                    }
                    await sql.history.deleteTagHistory(history.historyID)
                    revertTagIDs.add(history.tag)
                }
                // Revert group history
                const groupHistory = await sql.history.userGroupHistory(username)
                for (const history of groupHistory) {
                    await sql.history.deleteGroupHistory(history.historyID)
                    revertGroupIDs.add(history.slug)
                }
                // Revert translation history
                const translationHistory = await sql.history.userTranslationHistory(username)
                for (const history of translationHistory) {
                    await sql.history.deleteTranslationHistory(history.historyID)
                    revertTranslationIDs.add({postID: history.postID, order: history.order})
                }
            }
            await sql.report.insertBan(username, user.ip, req.session.username, reason)
            await sql.user.updateUser(username, "banned", true)
            let banDuration = ""
            if (days) {
                let expiration = new Date()
                expiration.setDate(expiration.getDate() + Number(days))
                banDuration = functions.timeUntil(expiration.toISOString())
                await sql.user.updateUser(username, "banExpiration", expiration.toISOString())
            }
            const message = `You have been banned for breaking the site rules. You can still view the site but you won't be able to interact with other users or edit content.${reason ? `\n\nHere is a provided reason: ${reason}` : ""}${banDuration ? `\n\nBan duration: ${banDuration}` : ""}`
            await serverFunctions.systemMessage(username, "Notice: You were banned", message)
            res.status(200).json({revertPostIDs: Array.from(revertPostIDs), revertTagIDs: Array.from(revertTagIDs), revertGroupIDs: Array.from(revertGroupIDs), revertTranslationIDs: Array.from(revertTranslationIDs)})
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/unban", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const {username} = req.body
            if (!username) return res.status(400).send("Bad username")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            if (req.session.username === username) return res.status(400).send("Cannot perform action on yourself")
            const user = await sql.user.user(username)
            if (!user) return res.status(400).send("Bad username")
            if (user.role === "admin" || user.role === "mod") return res.status(400).send("Cannot perform action on this user")
            const activeBan = await sql.report.activeBan(username)
            await sql.report.updateBan(activeBan.banID, "active", false)
            await sql.user.updateUser(username, "banned", false)
            await sql.user.updateUser(username, "banExpiration", null)
            const message = `You have been unbanned. You may interact on the site again, but don't repeat the behavior that got you banned because you likely won't get another chance.`
            await serverFunctions.systemMessage(username, "Notice: You were unbanned", message)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/ban", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const username = req.query.username as string
            if (!username) return res.status(400).send("Bad username")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.username !== username && !permissions.isMod(req.session)) return res.status(403).send("No permission to view ban")
            const ban = await sql.report.activeBan(username)
            res.status(200).json(ban)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/promote", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const {username, role} = req.body
            if (!username) return res.status(400).send("Bad username")
            if (!functions.validRole(role)) return res.status(400).send("Bad role")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return res.status(403).end()
            const user = await sql.user.user(username)
            if (!user) return res.status(400).send("Bad username")
            if (user.role === role) return res.status(200).send("Success")

            if (username === process.env.OWNER_NAME || username === "moepictures") {
                return res.status(403).end()
            }

            let curatorPromotion = false
            let contributorPromotion = false
            let premiumPromotion = false
            if ((!user.role.includes("premium") && role.includes("curator")) || (user.role.includes("premium") && role === "premium-curator")) curatorPromotion = true
            if ((!user.role.includes("premium") && role.includes("contributor")) || (user.role.includes("premium") && role === "premium-contributor")) contributorPromotion = true
            if (!user.role.includes("premium") && role.includes("premium")) premiumPromotion = true
            
            let premiumExpiration = user.premiumExpiration ? new Date(user.premiumExpiration) : new Date()
            if (premiumPromotion && premiumExpiration <= new Date()) {
                premiumExpiration.setFullYear(premiumExpiration.getFullYear() + 1)
                await sql.user.updateUser(username, "premiumExpiration", premiumExpiration.toISOString())
            }
            if (!role.includes("premium")) {
                await sql.user.updateUser(username, "premiumExpiration", null)
            }
            await sql.user.updateUser(username, "role", role)

            let isDemotion = functions.isDemotion(user.role, role)
            if (isDemotion) {
                const message = `You have been demoted to ${role}.`
                await serverFunctions.systemMessage(username, `Notice: Your account was demoted to ${role}`, message)
            } else {
                if (role === "admin") {
                    const message = `You have been promoted to the role of admin. You now have access to all special privileges, including deleting posts and promoting others. Thanks for being one of our highest trusted members!\n\nPlease enable 2FA if you don't have it already.`
                    await serverFunctions.systemMessage(username, "Notice: Your account was promoted to admin", message)
                }
                if (role === "mod") {
                    const message = `You have been promoted to the role of mod. You now have access to the mod queue where you approve posts and can take moderation actions such as banning users. Thanks for being a trusted member!\n\nPlease enable 2FA if you don't have it already.`
                    await serverFunctions.systemMessage(username, "Notice: Your account was promoted to mod", message)
                } 
                if (premiumPromotion) {
                    const message = `Your account has been upgraded to premium. You can now access all the premium features. Thank you for supporting us!\n\nYour membership will last until ${functions.prettyDate(premiumExpiration)}.`
                    await serverFunctions.systemMessage(username, "Notice: Your account was upgraded to premium", message)
                } 
                if (curatorPromotion) {
                    const message = `Your account has been upgraded to curator. You can now upload directly without passing through the mod queue. Thanks for your great contributions!`
                    await serverFunctions.systemMessage(username, "Notice: Your account was upgraded to curator", message)
                } 
                if (contributorPromotion) {
                    const message = `Your account has been upgraded to contributor. You can now edit posts and tags without passing through the mod queue. Thanks for your edits!`
                    await serverFunctions.systemMessage(username, "Notice: Your account was upgraded to contributor", message)
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/checkmail", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const unread = await sql.message.grabUnread(req.session.username)
            res.status(200).send(unread.length ? true : false)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/history", userLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isPremium(req.session)) return res.status(402).send("Premium only")
            const result = await sql.history.userSearchHistory(req.session.username, "100", offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/user/history/delete", csrfProtection, userLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, all} = req.query
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (all) {
                await sql.history.deleteAllSearchHistory(req.session.username)
                return res.status(200).send("Success")
            }
            if (Number.isNaN(Number(postID))) return res.status(400).send("Bad postID")
            await sql.history.deleteSearchHistory(Number(postID), req.session.username)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/login/history", userLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const result = await sql.user.loginHistory(req.session.username)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/edit/counts", userLimiter, async (req: Request, res: Response) => {
        try {
            let username = req.query.username as string
            if (!username) username = req.session.username!
            if (!username) return res.status(400).send("No username")
            const postHistory = await sql.history.userPostHistory(username)
            const tagHistory = await sql.history.userTagHistory(username)
            const translationHistory = await sql.history.userTranslationHistory(username)
            const groupHistory = await sql.history.userGroupHistory(username)
            const json = {
                postEdits: postHistory[0]?.historyCount || 0,
                tagEdits: tagHistory[0]?.historyCount || 0,
                translationEdits: translationHistory[0]?.historyCount || 0,
                groupEdits: groupHistory[0]?.historyCount || 0
            }
            res.status(200).json(json)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default UserRoutes