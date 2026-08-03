/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Express, NextFunction, Request, Response} from "express"
import path from "path"
import functions from "../functions/Functions"
import encryption from "../structures/Encryption"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../server/ServerFunctions"
import rateLimit from "express-rate-limit"
import fs from "fs"
import phash from "sharp-phash"
import svgCaptcha from "svg-captcha"
import child_process from "child_process"
import util from "util"
import sql from "../sql/SQLQuery"
import dotline from "../assets/fonts/Dotline.ttf"
import enLocale from "../assets/locales/en.json"
import source from "../sources/Source"
import {OCRResponse, PurchaseParams, SourceLookupParams, TagLookupParams} from "../types/Types"

svgCaptcha.loadFont(path.join(__dirname, dotline))

let processingQueue = new Set<string>()

const exec = util.promisify(child_process.exec)

const miscLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const notificationLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 1000,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const captchaLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const contactLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const MiscRoutes = (app: Express) => {
    app.get("/api/misc/captcha/create", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const color = req.query.color as string || "#ffffff"
            let captcha = svgCaptcha.create({
                size: 6,
                ignoreChars: "oli0I123456789",
                fontSize: 45,
                noise: 2,
                color: true,
                background: color,
                width: 230
            })
            req.session.captchaAnswer = captcha.text
            serverFunctions.sendEncrypted({captcha: captcha.data}, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/captcha", captchaLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {captchaResponse} = req.body as {captchaResponse: string}
            if (req.session.captchaAnswer === captchaResponse?.trim()) {
                req.session.captchaNeeded = false
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad captchaResponse") 
            }
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/saucenao", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body) return void res.status(400).send("Image data must be provided")
            let result = await serverFunctions.sources.saucenaoLookup(req.body)
            res.status(200).json(result)
        } catch {
            res.status(400).end()
        }
    })

    app.post("/api/misc/boorulinks", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {bytes} = req.body as {bytes: number[]}
            const mirrors = await serverFunctions.links.booruLinks(bytes)
            res.status(200).send(mirrors)
        } catch {
            res.status(400).end()
        }
    })

    app.post("/api/misc/revdanbooru", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body) return void res.status(400).send("Image data must be provided")
            const booruLinks = await serverFunctions.links.booruLinks(req.body)
            let result = booruLinks.find((link) => link.includes("danbooru.donmai.us"))
            if (result) result += ".json"
            res.status(200).send(result)
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })

    app.post("/api/misc/proxy-images", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const link = decodeURIComponent(req.body.url as string)
            if (!link) return void res.status(400).send("No url")
            let images = await source.extractImages(link)
            res.status(200).send(images)
        } catch {
            res.status(400).end()
        }
    })

    app.post("/api/misc/pixiv", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const link = decodeURIComponent(req.body.url as string)
            if (!link) return void res.status(400).send("No url")
            let result = await source.pixivIllust(link)
            res.status(200).json(result)
        } catch {
            res.status(400).end()
        }
    })

    app.get("/api/misc/redirect", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (!link) return void res.status(400).send("No url")
        try {
            const response = await functions.http.followRedirect(link)
            serverFunctions.sendEncrypted(response, req, res)
        } catch {
            res.status(400).end()
        }
    })

    app.post("/api/misc/translate", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const words = req.body as string[]
        if (!words?.[0]) return void res.status(400).send("No words")
        let translated = await serverFunctions.util.translate(words)
        res.status(200).send(translated)
    })

    app.post("/api/misc/romajinize", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const words = req.body as string[]
        if (!words?.[0]) return void res.status(400).send("No words")
        let romajinized = await serverFunctions.util.romajinize(words)
        res.status(200).send(romajinized)
    })

    app.post("/api/misc/wdtagger", csrfProtection, captchaLimiter, async (req: Request, res: Response, next: NextFunction) => {
        let ip = serverFunctions.util.ip(req)
        try {
            if (processingQueue.has(ip)) return void res.status(429).send("Processing in progress")
            if (!req.body) return void res.status(400).send("Image data must be provided")
            processingQueue.add(ip)
            const json = await serverFunctions.tags.wdtagger(req.body)
            processingQueue.delete(ip)
            res.status(200).json(json)
        } catch (e) {
            console.log(e)
            if (ip) processingQueue.delete(ip)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/ocr", csrfProtection, contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (processingQueue.has(req.session.username)) return void res.status(429).send("Processing in progress")
            if (!req.body) return void res.status(400).send("Image data must be provided")
            processingQueue.add(req.session.username)
            const buffer = Buffer.from(req.body, "binary")
            const imagePath = await serverFunctions.util.dumpImage(buffer)

            const scriptPath = path.join(__dirname, "../../assets/python/ocr.py")
            let command = `python3 "${scriptPath}" -i "${imagePath}"`
            const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
            const json = JSON.parse(str.match(/(?<=>>>JSON<<<)([\s\S]*?)(?=>>>ENDJSON<<<)/gm)?.[0]) as OCRResponse[]
            
            fs.unlinkSync(imagePath)
            processingQueue.delete(req.session.username)
            res.status(200).json(json)
        } catch (e) {
            console.log(e)
            if (req.session.username) processingQueue.delete(req.session.username)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/segmentate", csrfProtection, contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            if (processingQueue.has(req.session.username)) return void res.status(429).send("Processing in progress")
            if (!req.body) return void res.status(400).send("Image data must be provided")
            processingQueue.add(req.session.username)
            const buffer = Buffer.from(req.body, "binary")
            const imagePath = await serverFunctions.util.dumpImage(buffer)

            let outName = `${path.basename(imagePath, path.extname(imagePath))}_output${path.extname(imagePath)}`
            let outPath = path.join(path.dirname(imagePath), outName)

            const scriptPath = path.join(__dirname, "../../assets/python/segmentator.py")
            const modelPath = path.join(__dirname, "../../assets/python/segmentator/anime-segmentation.ckpt")
            let command = `python3 "${scriptPath}" -i "${imagePath}" -o "${outPath}" -m "${modelPath}"`
            const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
            console.log(str)
            const outputBuffer = fs.readFileSync(outPath)
            
            fs.unlinkSync(imagePath)
            fs.unlinkSync(outPath)
            processingQueue.delete(req.session.username)
            res.status(200).send(outputBuffer)
        } catch (e) {
            console.log(e)
            if (req.session.username) processingQueue.delete(req.session.username)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/lineart", csrfProtection, contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            if (processingQueue.has(req.session.username)) return void res.status(429).send("Processing in progress")
            if (!req.body) return void res.status(400).send("Image data must be provided")
            processingQueue.add(req.session.username)
            const buffer = Buffer.from(req.body, "binary")
            const imagePath = await serverFunctions.util.dumpImage(buffer)

            let outName = `${path.basename(imagePath, path.extname(imagePath))}_output${path.extname(imagePath)}`
            let outPath = path.join(path.dirname(imagePath), outName)

            const scriptPath = path.join(__dirname, "../../assets/python/sketchextractor.py")
            const modelPath = path.join(__dirname, "../../assets/python/sketchextractor/anime2sketch.pth")
            let command = `python3 "${scriptPath}" -i "${imagePath}" -o "${outPath}" -m "${modelPath}"`
            const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
            console.log(str)

            if (req.session.upscaledImages) {
                /* disabled - too slow
                const resizedBuffer = await sharp(outPath, {limitInputPixels: false}).resize(2000, 2000, {fit: "inside"}).toBuffer()
                fs.writeFileSync(outPath, resizedBuffer)
                await waifu2x.upscaleImage(outPath, outPath, {rename: "", upscaler: "real-cugan", scale: 4})*/
            }
            const outputBuffer = fs.readFileSync(outPath)
            
            fs.unlinkSync(imagePath)
            fs.unlinkSync(outPath)
            processingQueue.delete(req.session.username)
            res.status(200).send(outputBuffer)
        } catch (e) {
            console.log(e)
            if (req.session.username) processingQueue.delete(req.session.username)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/misc/emojis", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dir = path.join(__dirname, "../../assets/emojis")
            let files = fs.readdirSync(dir)
            let fileData = {} as {[key: string]: string}
            for (const file of files) {
                if (file === ".DS_Store") continue
                const name = path.basename(file, path.extname(file))
                fileData[name] = `${functions.config.getDomain()}/emojis/${encodeURIComponent(file)}`
            }
            serverFunctions.sendEncrypted(fileData, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/setbanner", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {text, link} = req.body as {text: string, link: string}
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            await sql.user.setBanner(text, link)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/misc/banner", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const banner = await sql.user.getBanner()
            serverFunctions.sendEncrypted(banner, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/imghash", csrfProtection, miscLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.body) return void res.status(400).send("Image data must be provided")
            const buffer = Buffer.from(req.body, "binary")
            const hash = await phash(buffer).then((hash: any) => functions.byte.binaryToHex(hash))
            res.status(200).send(hash)
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })

    app.post("/api/misc/api-key", csrfProtection, miscLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            const key = encryption.generateAPIKey()
            const hashedKey = encryption.hashAPIKey(key)
            await sql.token.insertAPIKey(req.session.username, hashedKey)
            res.status(200).send(key)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/misc/api-key/status", miscLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            const apiKey = await sql.token.apiKeyByUsername(req.session.username)
            serverFunctions.sendEncrypted(apiKey ? true : false, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/misc/api-key/delete", csrfProtection, miscLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (!permissions.isAdmin(req.session)) return void res.status(403).end()
            await sql.token.deleteAPIKey(req.session.username)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/client-key", miscLimiter, async (req: Request, res: Response) => {
        try {
            const {publicKey} = req.body as {publicKey: string}
            req.session.publicKey = publicKey
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/server-key", miscLimiter, async (req: Request, res: Response) => {
        try {
            const publicKey = encryption.serverPublicKey()
            res.status(200).json({publicKey})
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/sourcelookup", csrfProtection, captchaLimiter, async (req: Request, res: Response, next: NextFunction) => {
        let ip = serverFunctions.util.ip(req)
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const {current, rating} = req.body as SourceLookupParams
            if (processingQueue.has(ip)) return void res.status(429).send("Processing in progress")
            processingQueue.add(ip)
            const sourceLookup = await serverFunctions.sources.sourceLookup(current, rating)
            processingQueue.delete(ip)
            res.status(200).json(sourceLookup)
        } catch (e) {
            console.log(e)
            if (ip) processingQueue.delete(ip)
            res.status(400).end()
        }
    })

    app.post("/api/misc/taglookup", csrfProtection, captchaLimiter, async (req: Request, res: Response, next: NextFunction) => {
        let ip = serverFunctions.util.ip(req)
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const {current, type, rating, style, hasUpscaled} = req.body as TagLookupParams
            if (processingQueue.has(ip)) return void res.status(429).send("Processing in progress")
            processingQueue.add(ip)
            const tagLookup = await serverFunctions.tags.tagLookup(current, type, rating, style, hasUpscaled)
            processingQueue.delete(ip)
            res.status(200).json(tagLookup)
        } catch {
            if (ip) processingQueue.delete(ip)
            res.status(400).end()
        }
    })

    app.post("/api/misc/danboorutags", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {tags} = req.body as {tags: string}
            let danbooruTags = await serverFunctions.tags.convertToDanbooru(tags)
            res.status(200).json({tags: danbooruTags})
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })

    app.post("/api/misc/moepicstags", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {tags} = req.body as {tags: string}
            let moepicsTags = await serverFunctions.tags.convertFromDanbooru(tags)
            res.status(200).json({tags: moepicsTags})
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })

    app.post("/api/premium/verify-purchase", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {platform, purchaseToken} = req.body as PurchaseParams
            if (!req.session.username) return void res.status(200).send(false)

            if (platform === "ios") {
                const transaction = await serverFunctions.payment.verifyAppleTransaction(purchaseToken).catch(() => null)

                if (transaction) {
                    if (!transaction.appAccountToken) return void res.status(200).send(false)
                    if (transaction.productId !== "com.moebytes.moepictures.premium.yearly" &&
                        transaction.productId !== "com.moebytes.moepictures.premium.monthly") {
                        return void res.status(200).send(false)
                    }

                    const user = await sql.user.userByAccountToken(transaction.appAccountToken)
                    if (user?.username !== req.session.username) return void res.status(200).send(false)

                    if (transaction.revocationDate) {
                        let revocationDate = new Date(transaction.revocationDate!).toISOString()

                        await sql.user.updateUser(user.username, "premium", false)
                        await sql.user.updateUser(user.username, "premiumExpiration", revocationDate)

                        return void res.status(200).send(false)
                    }

                    if (transaction.expiresDate! > Date.now()) {
                        let premiumExpiration = new Date(transaction.expiresDate!).toISOString()

                        await sql.user.updateUser(user.username, "premium", true)
                        await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                        await sql.token.insertSubscription(user.username, transaction.appAccountToken,
                            transaction.originalTransactionId!, "ios",  transaction.productId, premiumExpiration)

                        return void res.status(200).send(true)
                    }
                }
            } else if (platform === "android") {
                const transaction = await serverFunctions.payment.verifyGoogleTransaction(purchaseToken).catch(() => null)
                if (transaction) {
                    if (!transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId) return void res.status(200).send(false)

                    const lineItem = transaction.lineItems?.[0]
                    if (lineItem?.productId !== "premium-yearly" &&
                        lineItem?.productId !== "premium-monthly") {
                        return void res.status(200).send(false)
                    }

                    const user = await sql.user.userByAccountToken(transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId)
                    if (user?.username !== req.session.username) return void res.status(200).send(false)

                    if (transaction.subscriptionState !== "SUBSCRIPTION_STATE_ACTIVE") {
                        let premiumExpiration = new Date(lineItem.expiryTime!).toISOString()

                        await sql.user.updateUser(user.username, "premium", false)
                        await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                        return void res.status(200).send(false)
                    }

                    if (Date.parse(lineItem.expiryTime!) > Date.now()) {
                        let premiumExpiration = new Date(lineItem.expiryTime!).toISOString()

                        await sql.user.updateUser(user.username, "premium", true)
                        await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                        await sql.token.insertSubscription(user.username, 
                            transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId,
                            purchaseToken, "android",  lineItem.productId, premiumExpiration)

                        return void res.status(200).send(true)
                    }
                }
            }

            res.status(200).send(false)
        } catch (e) {
            console.log(e)
            res.status(400).send(false)
        }
    })

    app.post("/api/apple/notifications", notificationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {signedPayload} = req.body as {signedPayload: string}

            const notification = await serverFunctions.payment.verifyAppleNotification(signedPayload).catch(() => null)
            if (!notification) return void res.status(400).end()

            const transaction = await serverFunctions.payment.verifyAppleTransaction(notification.data?.signedTransactionInfo!)
            if (!transaction.appAccountToken) return void res.status(400).end()

            if (transaction.productId !== "com.moebytes.moepictures.premium.yearly" &&
                transaction.productId !== "com.moebytes.moepictures.premium.monthly") {
                return void res.status(400).end()
            }

            const user = await sql.user.userByAccountToken(transaction.appAccountToken)
            if (!user) return void res.status(400).end()

            let premiumExpiration = new Date(transaction.expiresDate!).toISOString()
            let updateDB = false

            switch(notification.notificationType) {
                case "SUBSCRIBED":
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const message = `Your account has been upgraded to premium. You can now access all the premium features. Thank you for supporting us!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your account was upgraded to premium", message)
                    updateDB = true
                    break

                case "DID_RENEW":
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const renewMsg = `Your premium subscription was renewed. Thanks for your continued support!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium subscription was renewed", renewMsg)
                    updateDB = true
                    break

                case "EXPIRED":
                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const expireMsg = `Unfortunately, it seems like your premium membership has expired. We appreciate your time spent as a premium member and we hope that you are interested in renewing it again.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership expired", expireMsg)
                    updateDB = true
                    break

                case "REFUND":
                case "REVOKE":
                    let revocationDate = new Date(transaction.revocationDate!).toISOString()
                    premiumExpiration = revocationDate

                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", revocationDate)

                    const revokeMsg = `Unfortunately, it seems like your premium membership was revoked. This could be due to it being refunded.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership was revoked", revokeMsg)
                    updateDB = true
                    break
            }

            if (updateDB) {
                await sql.token.insertSubscription(user.username, transaction.appAccountToken,
                    transaction.originalTransactionId!, "ios",  transaction.productId, premiumExpiration)
            }

            res.status(200).end()
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })

    enum NotificationType {
        SUBSCRIPTION_RECOVERED = 1,
        SUBSCRIPTION_RENEWED = 2,
        SUBSCRIPTION_CANCELED = 3,
        SUBSCRIPTION_PURCHASED = 4,
        SUBSCRIPTION_ON_HOLD = 5,
        SUBSCRIPTION_IN_GRACE_PERIOD = 6,
        SUBSCRIPTION_RESTARTED = 7,
        SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8,
        SUBSCRIPTION_DEFERRED = 9,
        SUBSCRIPTION_PAUSED = 10,
        SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11,
        SUBSCRIPTION_REVOKED = 12,
        SUBSCRIPTION_EXPIRED = 13,
        SUBSCRIPTION_ITEMS_CHANGED = 17,
        SUBSCRIPTION_CANCELLATION_SCHEDULED = 18,
        SUBSCRIPTION_PRICE_CHANGE_UPDATED = 19,
        SUBSCRIPTION_PENDING_PURCHASE_CANCELED = 20,
        SUBSCRIPTION_PRICE_STEP_UP_CONSENT_UPDATED = 22
    }

    app.post("/api/google/notifications", notificationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {message} = req.body as {message: {data: string}}
            if (!message?.data) return void res.status(400).end()

            const notification = JSON.parse(Buffer.from(message.data, "base64").toString("utf8"))?.subscriptionNotification
            if (!notification) return void res.status(400).end()

            const purchaseToken = notification.purchaseToken
            if (!purchaseToken) return void res.status(400).end()

            const transaction = await serverFunctions.payment.verifyGoogleTransaction(purchaseToken)
            if (!transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId) return void res.status(400).end()

            const lineItem = transaction.lineItems?.[0]
            if (lineItem?.productId !== "premium-yearly" &&
                lineItem?.productId !== "premium-monthly") {
                return void res.status(400).end()
            }

            const user = await sql.user.userByAccountToken(transaction.externalAccountIdentifiers.obfuscatedExternalAccountId)
            if (!user) return void res.status(400).end()

            let premiumExpiration = new Date(lineItem.expiryTime!).toISOString()
            let updateDB = false

            switch (notification.notificationType) {
                case NotificationType.SUBSCRIPTION_PURCHASED:
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const message = `Your account has been upgraded to premium. You can now access all the premium features. Thank you for supporting us!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your account was upgraded to premium", message)
                    updateDB = true
                    break

                case NotificationType.SUBSCRIPTION_RECOVERED:
                case NotificationType.SUBSCRIPTION_RENEWED:
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const renewMsg = `Your premium subscription was renewed. Thanks for your continued support!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium subscription was renewed", renewMsg)
                    updateDB = true
                    break

                case NotificationType.SUBSCRIPTION_EXPIRED:
                case NotificationType.SUBSCRIPTION_PAUSED:
                case NotificationType.SUBSCRIPTION_ON_HOLD:
                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const expireMsg = `Unfortunately, it seems like your premium membership has expired. We appreciate your time spent as a premium member and we hope that you are interested in renewing it again.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership expired", expireMsg)
                    updateDB = true
                    break

                case NotificationType.SUBSCRIPTION_REVOKED:
                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const revokeMsg = `Unfortunately, it seems like your premium membership was revoked. This could be due to it being refunded.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership was revoked", revokeMsg)
                    updateDB = true
                    break
            }

            if (updateDB) {
                await sql.token.insertSubscription(user.username, 
                    transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId,
                    purchaseToken, "android",  lineItem.productId, premiumExpiration)
            }

            res.status(200).end()
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })
}

export default MiscRoutes