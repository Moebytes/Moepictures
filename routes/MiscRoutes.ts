import {Express, NextFunction, Request, Response} from "express"
import axios from "axios"
import path from "path"
import functions from "../functions/Functions"
import encryption from "../structures/Encryption"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../server functions/ServerFunctions"
import rateLimit from "express-rate-limit"
import fs from "fs"
import phash from "sharp-phash"
import svgCaptcha from "svg-captcha"
import child_process from "child_process"
import crypto from "crypto"
import util from "util"
import sql from "../sql/SQLQuery"
import dotline from "../assets/fonts/Dotline.ttf"
import enLocale from "../assets/locales/en.json"
import source from "../sources/Source"
import {OCRResponse, CoinbaseEvent, SourceLookupParams, TagLookupParams} from "../types/Types"

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
            const {bytes, pixivID} = req.body as {bytes: number[], pixivID: string}
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

    app.post("/api/premium/paymentlink", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!permissions.isPremiumEnabled()) return void res.status(400).send("Closed")
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const data = {
                local_price: {
                    amount: "15.00",
                    currency: "USD"
                },
                pricing_type: "fixed_price",
                name: "Moepictures Premium",
                description: "Moepictures premium account upgrade",
                redirect_url: `${functions.config.getDomain()}/premium-success`,
                metadata: {
                    username: req.session.username,
                    email: req.session.email
                },
            }
            const headers = {"X-CC-Api-Key": process.env.COINBASE_KEY!}
            const response = await axios.post("https://api.commerce.coinbase.com/charges", data, {headers, responseType: "json"}).then((r) => r.data)
            res.status(200).json(response.data)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/premium/payment", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!permissions.isPremiumEnabled()) return void res.status(400).send("Closed")
            const {event} = req.body as {event: CoinbaseEvent}
            const signature = req.headers["x-cc-webhook-signature"]

            const computedSignature = crypto.createHmac("sha256", process.env.COINBASE_WEBHOOK_SECRET!)
            .update(JSON.stringify(req.body), "utf8").digest("hex")
            
            if (signature !== computedSignature) {
                return void res.status(400).send("Invalid signature")
            }
        
            if (event.type === "charge:pending") {
                const id = event.data.id
                const metadata = event.data.metadata

                const user = await sql.user.user(metadata.username)
                if (!user) return void res.status(400).send("Invalid username")

                let premiumExpiration = user.premiumExpiration ? new Date(user.premiumExpiration) : new Date()
                premiumExpiration.setFullYear(premiumExpiration.getFullYear() + 1)

                if (user.role === "curator") {
                    await sql.user.updateUser(metadata.username, "role", "premium-curator")
                } else if (user.role === "contributor") {
                    await sql.user.updateUser(metadata.username, "role", "premium-contributor")
                } else if (user.role === "user") {
                    await sql.user.updateUser(metadata.username, "role", "premium")
                }

                await sql.user.updateUser(metadata.username, "premiumExpiration", premiumExpiration.toISOString())

                const message = `Your account has been upgraded to premium. You can now access all the premium features. Thank you for supporting us!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                await serverFunctions.systemMessage(metadata.username, "Notice: Your account was upgraded to premium", message)
            }
            res.status(200).send("Success")
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
}

export default MiscRoutes