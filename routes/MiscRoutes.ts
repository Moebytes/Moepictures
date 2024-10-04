import {Express, NextFunction, Request, Response} from "express"
import axios from "axios"
import FormData from "form-data"
import path from "path"
import Pixiv from "pixiv.ts"
import DeviantArt from "deviantart.ts"
import googleTranslate from "@vitalets/google-translate-api"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import functions from "../structures/Functions"
import serverFunctions, {keyGenerator, handler} from "../structures/ServerFunctions"
import rateLimit from "express-rate-limit"
import fs from "fs"
import svgCaptcha from "svg-captcha"
import child_process from "child_process"
import util from "util"
import sql from "../sql/SQLQuery"
import dotline from "../assets/misc/Dotline.ttf"

svgCaptcha.loadFont(dotline)

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
            res.status(200).send(captcha.data)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/misc/captcha", captchaLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {captchaResponse} = req.body
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

    app.post("/api/misc/saucenao", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body) return res.status(400).send("Image data must be provided")
            const form = new FormData()
            form.append("db", "999")
            form.append("api_key", process.env.SAUCENAO_KEY)
            form.append("output_type", 2)
            const inputType = functions.bufferFileType(req.body)?.[0]
            form.append("file", Buffer.from(req.body, "binary"), {
                filename: `file.${inputType.extension}`,
                contentType: inputType.mime
            })
            let result = await axios.post("https://saucenao.com/search.php", form, {headers: form.getHeaders()}).then((r) => r.data.results)
            result = result.sort((a: any, b: any) => b.header.similarity - a.header.similarity)
            result = result.filter((r: any) => Number(r.header.similarity) > 70)
            res.status(200).json(result)
        } catch {
            res.status(400).end()
        }
    })

    app.get("/api/misc/pixiv", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (!link) return res.status(400).send("No url")
        if (link.includes("pixiv.net") || link.includes("pximg.net")) {
            const pixiv = await Pixiv.refreshLogin(process.env.PIXIV_TOKEN!)
            let resolvable = link as string | number
            if (link.includes("pximg.net")) {
                const id = path.basename(link).match(/(\d+)(?=_)/)?.[0]
                resolvable = Number(id)
            }
            try {
                const illust = await pixiv.illust.get(resolvable) as any
                const html = await axios.get(`https://www.pixiv.net/en/users/${illust.user.id}`).then((r) => r.data)
                const twitter = html.match(/(?<=twitter\.com\/)(.*?)(?=")/)?.[0]
                illust.user.twitter = twitter
                res.status(200).json(illust)
            } catch (e) {
                res.status(400).end()
            }
        } else {
            res.status(400).end()
        }
    })

    app.get("/api/misc/deviantart", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (!link) return res.status(400).send("No url")
        if (link.includes("deviantart.com")) {
            try {
                const deviantart = await DeviantArt.login(process.env.DEVIANTART_CLIENT_ID!, process.env.DEVIANTART_CLIENT_SECRET!)
                const deviationRSS = await deviantart.rss.get(link)
                const deviation = await deviantart.extendRSSDeviations([deviationRSS]).then((r) => r[0])
                res.status(200).json(deviation)
            } catch (e) {
                res.status(400).end()
            }
        } else {
            res.status(400).end()
        }
    })

    app.get("/api/misc/proxy", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (!link) return res.status(400).send("No url")
        try {
            const response = await axios.get(link, {responseType: "arraybuffer", headers: {Referer: "https://www.pixiv.net/"}}).then((r) => r.data)
            res.status(200).send(response)
        } catch {
            res.status(400).end()
        }
    })

    app.get("/api/misc/redirect", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (!link) return res.status(400).send("No url")
        try {
            const response = await axios.head(link).then((r) => r.request.res.responseUrl)
            res.status(200).send(response)
        } catch {
            res.status(400).end()
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
        if (!words?.[0]) return res.status(400).send("No words")
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
        if (!words?.[0]) return res.status(400).send("No words")
        let romajinized = await Promise.all(words.map((w) => romajinize(w)))
        res.status(200).send(romajinized)
    })

    app.post("/api/misc/boorulinks", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const {pixivID} = req.body
        if (!pixivID) return res.status(400).send("No pixivID")
        const getDanbooruLink = async (pixivID: number) => {
            const req = await axios.get(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixivID}&z=5`).then((r) => r.data)
            if (!req[0]) return {danbooru: "", url: ""}
            return {danbooru: `https://danbooru.donmai.us/posts/${req[0].id}`, md5: req[0].md5}
        }
        const getGelbooruLink = async (md5: string) => {
            const req = await axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=md5%3a${md5}`).then((r) => r.data)
            return req.post?.[0] ? `https://gelbooru.com/index.php?page=post&s=view&id=${req.post[0].id}` : ""
        }
        const getSafebooruLink = async (md5: string) => {
            const req = await axios.get(`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=md5%3a${md5}`).then((r) => r.data)
            return req[0] ? `https://safebooru.org/index.php?page=post&s=view&id=${req[0].id}` : ""
        }
        const getYandereLink = async (md5: string) => {
            const req = await axios.get(`https://yande.re/post.json?tags=md5%3A${md5}`).then((r) => r.data)
            return req[0] ? `https://yande.re/post/show/${req[0].id}` : ""
        }
        const getKonachanLink = async (md5: string) => {
            const req = await axios.get(`https://konachan.net/post.json?tags=md5%3A${md5}`).then((r) => r.data)
            return req[0] ? `https://konachan.net/post/show/${req[0].id}` : ""
        }
        try {
            const {danbooru, md5} = await getDanbooruLink(Number(pixivID)).catch(() => ({danbooru: "", md5: ""}))
            const gelbooru = await getGelbooruLink(md5).catch(() => "")
            const safebooru = await getSafebooruLink(md5).catch(() => "")
            const yandere = await getYandereLink(md5).catch(() => "")
            const konachan = await getKonachanLink(md5).catch(() => "")
            let mirrors = [] as string[]
            if (danbooru) mirrors.push(danbooru)
            if (gelbooru) mirrors.push(gelbooru)
            if (safebooru) mirrors.push(safebooru)
            if (yandere) mirrors.push(yandere)
            if (konachan) mirrors.push(konachan)
            res.status(200).json(mirrors)
        } catch {
            res.status(400).end()
        }
    })

    app.post("/api/misc/contact", contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {email, subject, message, files} = req.body 
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!email || !subject || !message || !files) return res.status(400).send("Bad email, subejct, message, or files")
            const badEmail = functions.validateEmail(email)
            if (badEmail) return res.status(400).send("Bad email")
            const badMessage = functions.validateMessage(message)
            if (badMessage) return res.status(400).send("Bad message")
            const attachments = [] as any
            for (let i = 0; i < files.length; i++) {
                const attachment = {} as any 
                attachment.filename = files[i].name 
                attachment.content = Buffer.from(files[i].bytes)
                attachments.push(attachment)
            }
            await serverFunctions.contactEmail(email, subject, message, attachments)
            const admins = await sql.user.admins()
            for (const admin of admins) {
                const modifiedMessage = `You have a new message from ${email}!\n\n${message}`
                await serverFunctions.systemMessage(admin.username, subject, modifiedMessage)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/misc/wdtagger", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body) return res.status(400).send("Image data must be provided")
            const buffer = Buffer.from(req.body, "binary")
            const folder = path.join(__dirname, "./dump")
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

            const filename = `${Math.floor(Math.random() * 100000000)}.jpg`
            const imagePath = path.join(folder, filename)
            fs.writeFileSync(imagePath, buffer)
            const scriptPath = path.join(__dirname, "../structures/wdtagger.py")
            let command = `python3 "${scriptPath}" -i "${imagePath}" -m "${process.env.WDTAGGER_PATH}"`
            const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
            const result = str.split(", ")
            fs.unlinkSync(imagePath)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default MiscRoutes