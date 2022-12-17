import {Express, NextFunction, Request, Response} from "express"
import axios from "axios"
import FormData from "form-data"
import fileType from "magic-bytes.js"
import path from "path"
import Pixiv from "pixiv.ts"
import DeviantArt from "deviantart.ts"
import googleTranslate from "@vitalets/google-translate-api"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import rateLimit from "express-rate-limit"

const miscLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const captchaLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 30,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const contactLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 10,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const MiscRoutes = (app: Express) => {
    app.post("/api/misc/saucenao", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const form = new FormData()
            form.append("db", "999")
            form.append("api_key", process.env.SAUCENAO_KEY)
            form.append("output_type", 2)
            const inputType = fileType(req.body)?.[0]
            form.append("file", Buffer.from(req.body, "binary"), {
                filename: `file.${inputType.extension}`,
                contentType: inputType.mime
            })
            let result = await axios.post("https://saucenao.com/search.php", form, {headers: form.getHeaders()}).then((r) => r.data.results)
            result = result.sort((a: any, b: any) => b.header.similarity - a.header.similarity)
            result = result.filter((r: any) => Number(r.header.similarity) > 70)
            res.status(200).json(result)
        } catch {
            res.status(404).end()
        }
    })

    app.get("/api/misc/pixiv", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (link.includes("pixiv.net") || link.includes("pximg.net")) {
            const pixiv = await Pixiv.refreshLogin(process.env.PIXIV_TOKEN!)
            let resolvable = link as string | number
            if (link.includes("pximg.net")) {
                const id = path.basename(link).match(/(\d+)(?=_)/)?.[0]
                resolvable = Number(id)
            }
            try {
                const illust = await pixiv.illust.get(resolvable)
                res.status(200).json(illust)
            } catch {
                res.status(404).end()
            }
        } else {
            res.status(404).end()
        }
    })

    app.get("/api/misc/deviantart", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (link.includes("deviantart.com")) {
            try {
                const deviantart = await DeviantArt.login(process.env.DEVIANTART_CLIENT_ID!, process.env.DEVIANTART_CLIENT_SECRET!)
                const deviationRSS = await deviantart.rss.get(link)
                const deviation = await deviantart.extendRSSDeviations([deviationRSS]).then((r) => r[0])
                res.status(200).json(deviation)
            } catch {
                res.status(404).end()
            }
        } else {
            res.status(404).end()
        }
    })

    app.get("/api/misc/proxy", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        try {
            const response = await axios.get(link, {responseType: "arraybuffer", headers: {Referer: "https://www.pixiv.net/"}}).then((r) => r.data)
            res.status(200).send(response)
        } catch {
            res.status(404).end()
        }
    })

    app.get("/api/misc/redirect", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        try {
            const response = await axios.head(link).then((r) => r.request.res.responseUrl)
            res.status(200).send(response)
        } catch {
            res.status(404).end()
        }
    })

    app.post("/api/misc/translate", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const translate = async (text: string) => {
            try {
                const translated = await googleTranslate(text, {from: "ja", to:"en"})
                return translated.text
            } catch {
                return text
            }
        }
        const words = req.body as string[]
        let translated = await Promise.all(words.map((w) => translate(w)))
        res.status(200).send(translated)
    })

    app.post("/api/misc/romajinize", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const kuroshiro = new Kuroshiro()
        await kuroshiro.init(new KuromojiAnalyzer())
        const romajinize = async (text: string) => {
            const result = await kuroshiro.convert(text, {mode: "spaced", to: "romaji"})
            return result.replace(/<\/?[^>]+(>|$)/g, "")
        }
        const words = req.body as string[]
        let romajinized = await Promise.all(words.map((w) => romajinize(w)))
        res.status(200).send(romajinized)
    })

    app.post("/api/misc/contact", contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {email, subject, message, files} = req.body 
            if (!email || !subject || !message || !files) return res.status(400).send("Bad request")
            const badEmail = functions.validateEmail(email)
            if (badEmail) return res.status(400).send("Bad request")
            const badMessage = functions.validateMessage(message)
            if (badMessage) return res.status(400).send("Bad request")
            const attachments = [] as any
            for (let i = 0; i < files.length; i++) {
                const attachment = {} as any 
                attachment.filename = files[i].name 
                attachment.content = Buffer.from(files[i].bytes)
                attachments.push(attachment)
            }
            await serverFunctions.contactEmail(email, subject, message, attachments)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/misc/captcha", captchaLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {siteKey, captchaResponse} = req.body 
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            const form = new FormData()
            form.append("response", captchaResponse)
            form.append("secret", process.env.CAPTCHA_SECRET)
            form.append("sitekey", siteKey)
            form.append("remoteip", ip)
            const response = await axios.post("https://hcaptcha.com/siteverify", form, {headers: form.getHeaders()}).then((r) => r.data)
            if (response.success) {
                const challengeTime = response.challenge_ts
                req.session.captchaAmount = 0
                res.status(200).send("Success")
            } else {
                res.status(400).send("Bad request") 
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default MiscRoutes