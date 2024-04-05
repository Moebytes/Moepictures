import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import bcrypt from "bcrypt"
import crypto from "crypto"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fileType from "magic-bytes.js"
import fs from "fs"
import path from "path"

const signupLimiter = rateLimit({
	windowMs: 30 * 60 * 1000,
	max: 5,
	message: "Too many accounts created, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const loginLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 30,
	message: "Too many login attempts, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const loginSpeedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 1,
    delayMs: 200
})

const sessionLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const userLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 50,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const UserRoutes = (app: Express) => {
    app.get("/api/user", sessionLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const username = req.query.username as string
            if (!username) return res.status(200).json(null)
            let user = await sql.user(username.trim())
            if (!user) return res.status(200).json(null)
            delete user.ip
            delete user.$2fa
            delete user.email
            delete user.password
            res.status(200).json(user)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
    
    app.post("/api/user/signup", signupLimiter, async (req: Request, res: Response) => {
        try {
            let {username, email, password, captchaResponse} = req.body 
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
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
            try {
                await sql.insertUser(username, email)
                await sql.updateUser(username, "joinDate", new Date().toISOString())
                await sql.updateUser(username, "publicFavorites", true)
                await sql.updateUser(username, "emailVerified", false)
                await sql.updateUser(username, "$2fa", false)
                await sql.updateUser(username, "bio", "This user has not written anything.")
                await sql.updateUser(username, "role", "user")
                await sql.updateUser(username, "ip", ip)
                const passwordHash = await bcrypt.hash(password, 13)
                await sql.updateUser(username, "password", passwordHash)

                const token = crypto.randomBytes(32).toString("hex")
                const hashToken = crypto.createHash("sha256").update(token).digest("hex")
                try {
                    await sql.insertEmailToken(email, hashToken)
                } catch {
                    await sql.updateEmailToken(email, hashToken)
                }
                const user = functions.toProperCase(username)
                const link = `${req.protocol}://${req.get("host")}/api/user/verifyemail?token=${token}`
                await serverFunctions.email(email, "Moebooru Email Address Verification", {username: user, link}, "verifyemail.html")
                return res.status(200).send("Success")
            } catch {
                return res.status(400).send("Username taken")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/login", loginLimiter, loginSpeedLimiter, async (req: Request, res: Response) => {
        try {
            let {username, password, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!username || !password || !captchaResponse) return res.status(400).send("Bad username, password, or captchaResponse")
            username = username.trim().toLowerCase()
            password = password.trim()
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            const user = await sql.user(username)
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
                await sql.updateUser(username, "ip", ip)
                req.session.ip = ip
                return res.status(200).send("Success")
            } else {
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

    app.get("/api/user/session", sessionLimiter, async (req: Request, res: Response) => {
        try {
            const session = structuredClone(req.session)
            delete session.captchaCache
            delete session.captchaAnswer
            delete session.csrfSecret
            delete session.ip
            res.status(200).json(session)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/updatepfp", userLimiter, async (req: Request, res: Response) => {
        try {
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            const bytes = req.body.bytes
            const postID = req.body.postID
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const result = fileType(bytes)?.[0]
            const jpg = result?.mime === "image/jpeg"
            const png = result?.mime === "image/png"
            const webp = result?.mime === "image/webp"
            const gif = result?.mime === "image/gif"
            if (jpg || png || webp || gif) {
                if (req.session.image) {
                    let oldImagePath = functions.getTagPath("pfp", req.session.image)
                    await serverFunctions.deleteFile(oldImagePath).catch(() => null)
                }
                if (jpg) result.extension = "jpg"
                const filename = `${req.session.username}.${result.extension}`
                let imagePath = functions.getTagPath("pfp", filename)
                const buffer = Buffer.from(Object.values(bytes) as any)
                await serverFunctions.uploadFile(imagePath, buffer)
                await sql.updateUser(req.session.username, "image", filename)
                if (postID) await sql.updateUser(req.session.username, "imagePost", postID)
                req.session.image = filename
                if (postID) req.session.imagePost = postID
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad request")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/favoritesprivacy", sessionLimiter, async (req: Request, res: Response) => {
        try {
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const newPrivacy = !Boolean(user.publicFavorites)
            req.session.publicFavorites = newPrivacy 
            await sql.updateUser(req.session.username, "publicFavorites", newPrivacy)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changeusername", userLimiter, async (req: Request, res: Response) => {
        try {
            let {newUsername, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            newUsername = newUsername.trim().toLowerCase()
            const badUsername = functions.validateUsername(newUsername)
            if (badUsername) return res.status(400).send("Bad username")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            await sql.updateUser(req.session.username, "username", newUsername)
            req.session.username = newUsername
            if (user.image) {
                const newFilename = `${req.session.username}${path.extname(user.image)}`
                let oldImagePath = functions.getTagPath("pfp", user.image)
                let newImagePath = functions.getTagPath("pfp", newFilename)
                fs.renameSync(oldImagePath, newImagePath)
                await sql.updateUser(newUsername, "image", newFilename)
                req.session.image = newFilename
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changepassword", userLimiter, async (req: Request, res: Response) => {
        try {
            let {oldPassword, newPassword} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!oldPassword || !newPassword) return res.status(400).send("Bad oldPassword or newPassword")
            oldPassword = oldPassword.trim()
            newPassword = newPassword.trim()
            const badPassword = functions.validatePassword(req.session.username, newPassword)
            if (badPassword) return res.status(400).send("Bad newPassword")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const matches = await bcrypt.compare(oldPassword, user.password)
            if (matches) {
                const newHash = await bcrypt.hash(newPassword, 13)
                await sql.updateUser(req.session.username, "password", newHash)
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
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!token) return res.status(400).send("Bad token")
            const hashToken = crypto.createHash("sha256").update(token.trim()).digest("hex")
            const tokenData = await sql.emailToken(hashToken)
            if (!tokenData) return res.status(400).send("Bad token")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                await sql.updateUser(req.session.username, "email", tokenData.email)
                req.session.email = tokenData.email
                await sql.deleteEmailToken(tokenData.email)
                res.status(200).redirect("/change-email-success")
            } else {
                await sql.deleteEmailToken(tokenData.email)
                res.status(400).send("Token expired")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changeemail", userLimiter, async (req: Request, res: Response) => {
        try {
            let {newEmail, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            const badEmail = functions.validateEmail(newEmail)
            if (badEmail) return res.status(400).send("Bad newEmail")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken = crypto.createHash("sha256").update(token).digest("hex")
            try {
                await sql.insertEmailToken(newEmail, hashToken)
            } catch (e) {
                console.log(e)
                await sql.updateEmailToken(newEmail, hashToken)
            }
            const username = functions.toProperCase(req.session.username)
            const link = `${req.protocol}://${req.get("host")}/api/user/changeemail?token=${token}`
            await serverFunctions.email(newEmail, "Moebooru Email Address Change", {username, link}, "changeemail.html")
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/verifyemail", userLimiter, async (req: Request, res: Response) => {
        try {
            let {email, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            const badEmail = functions.validateEmail(email)
            if (badEmail) return res.status(400).send("Bad email")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken = crypto.createHash("sha256").update(token).digest("hex")
            try {
                await sql.insertEmailToken(email, hashToken)
            } catch (e) {
            console.log(e)
                await sql.updateEmailToken(email, hashToken)
            }
            const username = functions.toProperCase(req.session.username)
            const link = `${req.protocol}://${req.get("host")}/api/user/verifyemail?token=${token}`
            await serverFunctions.email(email, "Moebooru Email Address Verification", {username, link}, "verifyemail.html")
            await sql.updateUser(req.session.username, "email", email)
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
            const tokenData = await sql.emailToken(hashToken)
            if (!tokenData) return res.status(400).send("Bad token")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                const user = await sql.userByEmail(tokenData.email)
                await sql.updateUser(user.username, "email", tokenData.email)
                await sql.updateUser(user.username, "emailVerified", true)
                req.session.email = tokenData.email
                req.session.emailVerified = true
                await sql.deleteEmailToken(tokenData.email)
                res.status(200).redirect("/verify-email-success")
            } else {
                await sql.deleteEmailToken(tokenData.email)
                res.status(400).send("Bad request")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changebio", userLimiter, async (req: Request, res: Response) => {
        try {
            let {bio} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!bio) return res.status(400).send("Bad bio")
            bio = bio.trim()
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            await sql.updateUser(req.session.username, "bio", bio)
            req.session.bio = bio
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/forgotpassword", userLimiter, async (req: Request, res: Response) => {
        try {
            const {email, captchaResponse} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (req.session.captchaAnswer !== captchaResponse?.trim()) return res.status(400).send("Bad captchaResponse")
            if (!email) {
                await functions.timeout(2000) 
                return res.status(200).send("Success")
            }
            const user = await sql.userByEmail(email.trim())
            if (!user) {
                await functions.timeout(2000) 
                return res.status(200).send("Success")
            }
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken =  await bcrypt.hash(token, 13)
            await sql.insertPasswordToken(user.username, hashToken)
            const username = functions.toProperCase(user.username)
            const link = `${req.protocol}://${req.get("host")}/reset-password?token=${token}&username=${user.username}`
            await serverFunctions.email(user.email, "Moebooru Password Reset", {username, link}, "resetpassword.html")
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(200).send("Success")
        }
    })

    app.post("/api/user/resetpassword", userLimiter, async (req: Request, res: Response) => {
        try {
            const {username, password, token} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!username || !token || !password) return res.status(400).send("Bad username, token, or password")
            const badPassword = functions.validatePassword(username, password)
            if (badPassword) return res.status(400).send("Bad password")
            const tokenData = await sql.passwordToken(username)
            if (!tokenData) return res.status(400).send("Bad token")
            const matches = await bcrypt.compare(token, tokenData.token)
            if (!matches) return res.status(400).send("Bad password")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                await sql.deletePasswordToken(username)
                const passwordHash = await bcrypt.hash(password, 13)
                await sql.updateUser(username, "password", passwordHash)
                res.status(200).send("Success")
            } else {
                await sql.deletePasswordToken(username)
                res.status(400).send("Token expired")
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/user/delete", userLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad username")
            try {
                await sql.deleteEmailToken(user.email)
                await serverFunctions.deleteFile(functions.getTagLink("pfp", user.image))
            } catch (e) {
            console.log(e)
                // ignore
            }
            await sql.deleteUser(req.session.username)
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
            const username = req.query.username
            if (username) {
                const user = await sql.user(username as string)
                if (!user || !user.publicFavorites) return res.status(200).send([])
                let favorites = await sql.favorites(username as string)
                favorites = functions.stripTags(favorites)
                res.status(200).send(favorites)
            } else {
                if (!req.session.username) return res.status(401).send("Unauthorized")
                let favorites = await sql.favorites(req.session.username)
                favorites = functions.stripTags(favorites)
                res.status(200).send(favorites)
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/user/uploads", sessionLimiter, async (req: Request, res: Response) => {
        try {
            const username = req.query.username
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (username) {
                let uploads = await sql.uploads(username as string)
                uploads = functions.stripTags(uploads)
                res.status(200).send(uploads)
            } else {
                if (!req.session.username) return res.status(401).send("Unauthorized")
                let uploads = await sql.uploads(req.session.username)
                uploads = functions.stripTags(uploads)
                res.status(200).send(uploads)
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
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (username) {
                let comments = await sql.searchCommentsByUsername([username], query, sort, offset)
                res.status(200).send(comments)
            } else {
                if (!req.session.username) return res.status(400).send("Bad request")
                let comments = await sql.searchCommentsByUsername([req.session.username], query, sort, offset)
                res.status(200).send(comments)
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default UserRoutes