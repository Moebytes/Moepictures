import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import bcrypt from "bcrypt"
import crypto from "crypto"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fileType from "magic-bytes.js"
import {generateSecret, verifyToken} from "node-2fa"
import fs from "fs"
import path from "path"

const signupLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 5,
	message: "Too many accounts created from this IP, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const loginLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 10,
	message: "Too many login attempts, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const loginSpeedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 1,
    delayMs: 200
})

const UserRoutes = (app: Express) => {
    app.get("/api/user", async (req: Request, res: Response, next: NextFunction) => {
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
        } catch {
            return res.status(400).send("Bad request")
        }
    })
    
    app.post("/api/user/signup", signupLimiter, async (req: Request, res: Response) => {
        try {
            let {username, email, password} = req.body 
            if (!username || !email || !password) return res.status(400).send("Bad request.")
            username = username.trim().toLowerCase()
            email = email.trim()
            password = password.trim()
            const badUsername = functions.validateUsername(username)
            const badEmail = functions.validateEmail(email)
            const badPassword = functions.validatePassword(username, password)
            if (badUsername || badEmail || badPassword) return res.status(400).send("Bad username, password, or email.")
            try {
                await sql.insertUser(username, email)
                await sql.updateUser(username, "joinDate", new Date().toISOString())
                await sql.updateUser(username, "publicFavorites", true)
                await sql.updateUser(username, "emailVerified", false)
                await sql.updateUser(username, "$2fa", false)
                await sql.updateUser(username, "bio", "This user has not written anything.")
                const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                await sql.updateUser(username, "ip", ip as string)
                const passwordHash = await bcrypt.hash(password, 13)
                await sql.updateUser(username, "password", passwordHash)

                const token = crypto.randomBytes(32).toString("hex")
                const hashToken = crypto.createHash("sha256").update(token).digest("hex")
                await sql.insertEmailToken(hashToken, email)
                const user = functions.toProperCase(username)
                const link = `${req.protocol}://${req.get("host")}/api/verifyemail?token=${token}`
                await serverFunctions.email(email, "Moebooru Email Address Verification", {username: user, link}, "verifyemail.html")
                return res.status(200).send("Success")
            } catch {
                return res.status(400).send("Username taken")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/login", loginLimiter, loginSpeedLimiter, async (req: Request, res: Response) => {
        try {
            let {username, password} = req.body
            if (!username || !password) return res.status(400).send("Bad request")
            username = username.trim().toLowerCase()
            password = password.trim()
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
                req.session.bio = user.bio
                req.session.publicFavorites = user.publicFavorites
                req.session.image = user.image
                const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
                await sql.updateUser(username, "ip", ip as string)
                req.session.ip = ip as string
                return res.status(200).send("Success")
            } else {
                return res.status(400).send("Bad request")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/logout", async (req: Request, res: Response) => {
        try {
            req.session.destroy((err) => {
                if (err) throw err
                res.status(200).send("Success")
            })
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/session", async (req: Request, res: Response) => {
        try {
            res.status(200).json(req.session)
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/updatepfp", async (req: Request, res: Response) => {
        try {
            const bytes = req.body 
            if (req.session.username) {
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const webp = result?.mime === "image/webp"
                const gif = result?.mime === "image/gif"
                if (jpg || png || webp || gif) {
                    if (req.session.image) {
                        let oldImagePath = functions.getTagPath("pfp", req.session.image)
                        try {
                            await serverFunctions.deleteFile(oldImagePath)
                        } catch {
                            // ignore
                        }
                    }
                    const filename = `${req.session.username}.${result.extension}`
                    let imagePath = functions.getTagPath("pfp", filename)
                    const buffer = Buffer.from(Object.values(bytes))
                    await serverFunctions.uploadFile(imagePath, buffer)
                    await sql.updateUser(req.session.username, "image", filename)
                    req.session.image = filename
                    res.status(200).send("Success")
                } else {
                    res.status(400).send("Bad request")
                }
            } else {
                res.status(400).send("Bad request")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/favoritesprivacy", async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            const newPrivacy = !Boolean(user.publicFavorites)
            req.session.publicFavorites = newPrivacy 
            await sql.updateUser(req.session.username, "publicFavorites", newPrivacy)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changeusername", async (req: Request, res: Response) => {
        try {
            let {newUsername} = req.body
            if (!req.session.username) return res.status(400).send("Bad request")
            newUsername = newUsername.trim().toLowerCase()
            const badUsername = functions.validateUsername(newUsername)
            if (badUsername) return res.status(400).send("Bad request")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
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
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changepassword", async (req: Request, res: Response) => {
        try {
            let {oldPassword, newPassword} = req.body
            if (!oldPassword || !newPassword || !req.session.username) return res.status(400).send("Bad request")
            oldPassword = oldPassword.trim()
            newPassword = newPassword.trim()
            const badPassword = functions.validatePassword(req.session.username, newPassword)
            if (badPassword) return res.status(400).send("Bad request")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            const matches = await bcrypt.compare(oldPassword, user.password)
            if (matches) {
                const newHash = await bcrypt.hash(newPassword, 13)
                await sql.updateUser(req.session.username, "password", newHash)
                return res.status(200).send("Success")
            } else {
                return res.status(400).send("Bad request")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/changeemail", async (req: Request, res: Response) => {
        try {
            let token = req.query.token as string
            if (!token || !req.session.username) return res.status(400).send("Bad request")
            const hashToken = crypto.createHash("sha256").update(token.trim()).digest("hex")
            const tokenData = await sql.emailToken(hashToken)
            if (!tokenData) return res.status(400).send("Bad request")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                await sql.updateUser(req.session.username, "email", tokenData.email)
                req.session.email = tokenData.email
                await sql.deleteEmailToken(tokenData.email)
                res.status(200).redirect("/change-email-success")
            } else {
                await sql.deleteEmailToken(tokenData.email)
                res.status(400).send("Bad request")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/changeemail", async (req: Request, res: Response) => {
        try {
            let {newEmail} = req.body
            if (!req.session.username) return res.status(400).send("Bad request")
            const badEmail = functions.validateEmail(newEmail)
            if (badEmail) return res.status(400).send("Bad request")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken = crypto.createHash("sha256").update(token).digest("hex")
            await sql.insertEmailToken(hashToken, newEmail)
            const username = functions.toProperCase(req.session.username)
            const link = `${req.protocol}://${req.get("host")}/api/changeemail?token=${token}`
            await serverFunctions.email(newEmail, "Moebooru Email Address Change", {username, link}, "changeemail.html")
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/verifyemail", async (req: Request, res: Response) => {
        try {
            let {email} = req.body
            if (!req.session.username) return res.status(400).send("Bad request")
            const badEmail = functions.validateEmail(email)
            if (badEmail) return res.status(400).send("Bad request")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            const token = crypto.randomBytes(32).toString("hex")
            const hashToken = crypto.createHash("sha256").update(token).digest("hex")
            await sql.insertEmailToken(hashToken, email)
            const username = functions.toProperCase(req.session.username)
            const link = `${req.protocol}://${req.get("host")}/api/verifyemail?token=${token}`
            await serverFunctions.email(email, "Moebooru Email Address Verification", {username, link}, "verifyemail.html")
            await sql.updateUser(req.session.username, "email", email)
            req.session.email = email
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/verifyemail", async (req: Request, res: Response) => {
        try {
            let token = req.query.token as string
            if (!token || !req.session.username) return res.status(400).send("Bad request")
            const hashToken = crypto.createHash("sha256").update(token.trim()).digest("hex")
            const tokenData = await sql.emailToken(hashToken)
            if (!tokenData) return res.status(400).send("Bad request")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                await sql.updateUser(req.session.username, "email", tokenData.email)
                await sql.updateUser(req.session.username, "emailVerified", true)
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

    app.post("/api/user/changebio", async (req: Request, res: Response) => {
        try {
            let {bio} = req.body
            if (!req.session.username || !bio) return res.status(400).send("Bad request")
            bio = bio.trim()
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            await sql.updateUser(req.session.username, "bio", bio)
            req.session.bio = bio
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/user/forgotpassword", async (req: Request, res: Response) => {
        try {
            const {email} = req.body
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
        } catch {
            res.status(200).send("Success")
        }
    })

    app.post("/api/user/resetpassword", async (req: Request, res: Response) => {
        try {
            const {username, password, token} = req.body
            if (!username || !token || !password) return res.status(400).send("Bad request")
            const badPassword = functions.validatePassword(username, password)
            if (badPassword) return res.status(400).send("Bad request")
            const tokenData = await sql.passwordToken(username)
            if (!tokenData) return res.status(400).send("Bad request")
            const matches = await bcrypt.compare(token, tokenData.token)
            if (!matches) return res.status(400).send("Bad request")
            const expireDate = new Date(tokenData.expires)
            if (new Date() <= expireDate) {
                await sql.deletePasswordToken(username)
                const passwordHash = await bcrypt.hash(password, 13)
                await sql.updateUser(username, "password", passwordHash)
                res.status(200).send("Success")
            } else {
                await sql.deletePasswordToken(username)
                res.status(400).send("Bad request")
            }
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/user/delete", async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            const user = await sql.user(req.session.username)
            if (!user) return res.status(400).send("Bad request")
            await sql.deleteUser(req.session.username)
            await serverFunctions.deleteFile(functions.getTagLink("pfp", user.image))
            await sql.delete2faToken(req.session.username)
            await sql.deleteEmailToken(user.email)
            await sql.deletePasswordToken(req.session.username)
            req.session.destroy((err) => {
                if (err) throw err
                res.status(200).send("Success")
            })
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/user/favorites", async (req: Request, res: Response) => {
        try {
            const username = req.query.username
            if (username) {
                const user = await sql.user(username as string)
                if (!user || !user.publicFavorites) return res.status(200).send([])
                const favorites = await sql.favorites(username as string)
                res.status(200).send(favorites)
            } else {
                if (!req.session.username) return res.status(400).send("Bad request")
                const favorites = await sql.favorites(req.session.username)
                res.status(200).send(favorites)
            }
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/user/uploads", async (req: Request, res: Response) => {
        try {
            const username = req.query.username
            if (!req.session.username && !username) return res.status(400).send("Bad request")
            if (username) {
                const uploads = await sql.uploads(username as string)
                res.status(200).send(uploads)
            } else {
                if (!req.session.username) return res.status(400).send("Bad request")
                const uploads = await sql.uploads(req.session.username)
                res.status(200).send(uploads)
            }
        } catch {
            res.status(400).send("Bad request") 
        }
    })
}

export default UserRoutes