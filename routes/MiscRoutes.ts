import {Express, NextFunction, Request, Response} from "express"
import axios from "axios"
import FormData from "form-data"
import path from "path"
import Pixiv from "pixiv.ts"
import DeviantArt from "deviantart.ts"
import snoowrap from "snoowrap"
import googleTranslate from "@vitalets/google-translate-api"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import rateLimit from "express-rate-limit"
import fs from "fs"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import svgCaptcha from "svg-captcha"
import child_process from "child_process"
import crypto from "crypto"
import util from "util"
import sql from "../sql/SQLQuery"
import dotline from "../assets/misc/Dotline.ttf"
import {stripIndents} from "common-tags"

svgCaptcha.loadFont(dotline)

let processingQueue = new Set<string>()

const exec = util.promisify(child_process.exec)
const pixiv = await Pixiv.refreshLogin(process.env.PIXIV_TOKEN!)
const deviantart = await DeviantArt.login(process.env.DEVIANTART_CLIENT_ID!, process.env.DEVIANTART_CLIENT_SECRET!)
const reddit = new snoowrap({
    userAgent: "kisaragi bot v1.0",
    clientId: process.env.REDDIT_APP_ID,
    clientSecret: process.env.REDDIT_APP_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN
})

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

    app.post("/api/misc/revdanbooru", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body) return res.status(400).send("Image data must be provided")
            const html = await axios.get("https://danbooru.donmai.us/iqdb_queries")
            const csrfToken = html.data.match(/(?<=csrf-token" content=")(.*?)(?=")/)[0]
            const cookie = html.headers["set-cookie"]?.[0] || ""
            const oldBuffer = Buffer.from(req.body, "binary")
            const oldHash = await phash(oldBuffer).then((hash: any) => functions.binaryToHex(hash))
            const form = new FormData()
            form.append("authenticity_token", csrfToken)
            form.append("search[file]", oldBuffer, {filename: "image.png"})
            const result = await axios.post("https://danbooru.donmai.us/iqdb_queries.json", form, {headers: {cookie, ...form.getHeaders()}}).then((r) => r.data)
            if (result[0]?.score < 70) return res.status(200).send("")
            const original = result[0].post.file_url
            if (!original || path.extname(original) === ".zip" || path.extname(original) === ".mp4") return res.status(200).send("")
            const buffer = await fetch(original).then((r) => r.arrayBuffer())
            const hash = await phash(Buffer.from(buffer)).then((hash: any) => functions.binaryToHex(hash))
            if (dist(hash, oldHash) < 7) {
                res.status(200).send(`https://danbooru.donmai.us/posts/${result[0].post.id}.json`)
            } else {
                res.status(200).send("")
            }
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })

    app.get("/api/misc/pixiv", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        if (!link) return res.status(400).send("No url")
        if (link.includes("pixiv.net") || link.includes("pximg.net")) {
            let resolvable = link as string | number
            if (link.includes("pximg.net")) {
                const id = path.basename(link).match(/(\d+)(?=_)/)?.[0]
                resolvable = Number(id)
            }
            try {
                const illust = await pixiv.illust.get(resolvable) as any
                const html = await axios.get(`https://www.pixiv.net/en/users/${illust.user.id}`).then((r) => r.data)
                const twitter = html.match(/(?<=twitter\.com\/|x\.com\/)(.*?)(?=[\\"&])/)?.[0]
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
        const link = decodeURIComponent(req.query.url as string)
        if (!link) return res.status(400).send("No url")
        let headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0"}
        try {
            if (link.includes("pixiv.net") || link.includes("pximg.net")) {
                let resolvable = link as string | number
                if (link.includes("pximg.net")) {
                    if (link.includes("user-profile")) {
                        const response = await axios.get(link, {responseType: "arraybuffer", headers: {Referer: "https://www.pixiv.net/", ...headers}}).then((r) => r.data)
                        return res.status(200).send([response])
                    }
                    const id = path.basename(link).match(/(\d+)(?=_)/)?.[0]
                    resolvable = Number(id)
                }
                const illust = await pixiv.illust.get(resolvable)
                if (illust.meta_pages.length) {
                    let images = [] as any[]
                    for (let i = 0; i < illust.meta_pages.length; i++) {
                        const link = illust.meta_pages[i].image_urls.original
                        const response = await axios.get(link, {responseType: "arraybuffer", headers: {Referer: "https://www.pixiv.net/", ...headers}}).then((r) => r.data)
                        images.push(response)
                    }
                    return res.status(200).send(images)
                } else {
                    const link = illust.meta_single_page.original_image_url || illust.image_urls.large || illust.image_urls.medium
                    const response = await axios.get(link, {responseType: "arraybuffer", headers: {Referer: "https://www.pixiv.net/", ...headers}}).then((r) => r.data)
                    return res.status(200).send([response])
                }
            }
            if (link.includes("deviantart.com")) {
                const deviationRSS = await deviantart.rss.get(link)
                const response = await axios.get(deviationRSS.content[0].url, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("artstation.com")) {
                const id = link.match(/(?<=artwork\/)(.*?)(?=$|\/)/g)?.[0]
                const apiLink = `https://www.artstation.com/projects/${id}.json`
                const json = await axios.get(apiLink, {headers, responseType: "json"}).then((r) => r.data)
                let images = [] as any[]
                for (let i = 0; i < json.assets.length; i++) {
                    const asset = json.assets[i]
                    if (asset.asset_type === "image") {
                        const response = await axios.get(asset.image_url, {responseType: "arraybuffer", headers}).then((r) => r.data)
                        images.push(response)
                    } else if (asset.asset_type === "video_clip") {
                        const iframe = asset.player_embedded.match(/(?<=<iframe src=')(.*?)(?=')/g)?.[0]
                        const html = await axios.get(iframe, {headers}).then((r) => r.data)
                        const video = html.match(/(?<=src=")(.*?)(?=" type="video)/gm)?.[0]
                        const response = await axios.get(video, {responseType: "arraybuffer", headers}).then((r) => r.data)
                        images.push(response)
                    }
                }
                return res.status(200).send(images)
            }
            if (link.includes("reddit.com")) {
                const postID = link.match(/(?<=comments\/).*?(?=\/|$)/)?.[0]
                // @ts-ignore
                const post = await reddit.getSubmission(postID).fetch() as snoowrap.Submission
                const response = await axios.get(post.url, {responseType: "arraybuffer"}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("pinterest.com")) {
                const html = await axios.get(link, {headers}).then((r) => r.data)
                const image = html.match(/(?<=")https:\/\/i\.pinimg\.com\/originals.*?(?=")/gm)?.[0]
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("imgur.com")) {
                const html = await axios.get(link, {headers}).then((r) => r.data)
                const image = html.match(/(https?:\/\/i\.imgur\.com\/)(.*?)(?=\?fb)/gm)?.[0]
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("tumblr.com")) {
                const html = await axios.get(link, {headers}).then((r) => r.data)
                const part = html.match(/(?<=srcSet=").*?(?="\/><\/div><\/figure)/gm)?.[0]?.trim()
                const image = part.match(/(?<=,?\s)(https?:\/\/[^ ]+)(?=\s\d+w"?$)/gm)?.[0]
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("medibang.com")) {
                const html = await axios.get(link, {headers}).then((r) => r.data)
                const image = html.match(/(?<=pictureImageUrl = ')(.*?)(?=')/gm)?.[0]
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("newgrounds.com")) {
                const html = await axios.get(link, {headers}).then((r) => r.data)
                const image = html.match(/(?<=full_image_text":"<img src=\\")(.*?)(?=\\")/gm)?.[0]?.replaceAll("\\", "")
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("danbooru.donmai.us")) {
                const image = await axios.get(`${link}.json`).then((r) => r.data.file_url)
                const response = await axios.get(image, {responseType: "arraybuffer"}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("gelbooru.com")) {
                const apiLink = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&id=${link.match(/\d+/g)?.[0]}`
                const image = await axios.get(apiLink).then((r) => r.data.post[0]?.file_url)
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("safebooru.org")) {
                const apiLink = `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&id=${link.match(/\d+/g)?.[0]}`
                const image = await axios.get(apiLink).then((r) => r.data[0]?.file_url)
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("yande.re")) {
                const apiLink = `https://yande.re/post.json?tags=id:${link.match(/\d+/)?.[0]}`
                const image = await axios.get(apiLink).then((r) => r.data[0]?.jpeg_url)
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("konachan.com") || link.includes("konachan.net")) {
                const apiLink = `https://${new URL(link).hostname}/post.json?tags=id:${link.match(/\d+/)?.[0]}`
                const image = await axios.get(apiLink).then((r) => r.data[0]?.file_url)
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("zerochan.net")) {
                const image = await axios.get(`${link}?json`, {responseType: "json"}).then((r) => r.data.full)
                const response = await axios.get(image, {responseType: "arraybuffer"}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("e-shuushuu.net")) {
                const html = await axios.get(link, {headers}).then((r) => r.data)
                const imagePart = html.match(/(\/images\/).*?(?=")/gm)?.[0]
                const image = `https://e-shuushuu.net${imagePart}`
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            if (link.includes("anime-pictures.net")) {
                const html = await axios.get(link, {headers}).then((r) => r.data)
                const image = html.match(/(?<=download href=")(.*?)(?=")/gm)?.[0]
                const response = await axios.get(image, {responseType: "arraybuffer", headers}).then((r) => r.data)
                return res.status(200).send([response])
            }
            const response = await axios.get(link, {responseType: "arraybuffer"}).then((r) => r.data)
            res.status(200).send([response])
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

    app.post("/api/misc/contact", csrfProtection, contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {email, subject, message, files} = req.body 
            if (!email || !subject || !message) return res.status(400).send("Bad email, subejct, or message.")
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

    app.post("/api/misc/copyright", csrfProtection, contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {name, email, artistTag, socialMediaLinks, postLinks, removeAllRequest, proofLinks, files} = req.body 
            if (!name || !email || !artistTag || !socialMediaLinks || !postLinks) return res.status(400).send("Bad fields.")
            if (!files.length && !proofLinks) return res.status(400).send("Bad proof links.")
            const badEmail = functions.validateEmail(email)
            if (badEmail) return res.status(400).send("Bad email")
            const attachments = [] as any
            for (let i = 0; i < files.length; i++) {
                const attachment = {} as any 
                attachment.filename = files[i].name 
                attachment.content = Buffer.from(files[i].bytes)
                attachments.push(attachment)
            }
            let removalType = removeAllRequest ? "I would like all of my associated content to be removed." : "I would like all of the provided links to be removed." 
            let message = stripIndents`
                This is a copyright removal request from ${artistTag}.

                Name: ${name}
                Email: ${email}
                Artist Tag: ${artistTag}

                Social Media Links:
                ${socialMediaLinks}

                ${removeAllRequest ? "Artist Tag Link:" : "Post Links:"}
                ${postLinks}

                Proof Links:
                ${proofLinks ? proofLinks : "N/A"}

                ${removalType}

                I am the copyright owner of the content linked above or am authorized 
                to act on the behalf of the copyright owner.
            `
            await serverFunctions.contactEmail(email, `Copyright Removal Request from ${artistTag}`, message, attachments)
            const admins = await sql.user.admins()
            for (const admin of admins) {
                await serverFunctions.systemMessage(admin.username, `Copyright Removal Request from ${artistTag}`, message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.post("/api/misc/wdtagger", captchaLimiter, async (req: Request, res: Response, next: NextFunction) => {
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
        ip = ip?.toString().replace("::ffff:", "") || ""
        try {
            if (processingQueue.has(ip)) return res.status(429).send("Processing in progress")
            if (!req.body) return res.status(400).send("Image data must be provided")
            processingQueue.add(ip)
            const buffer = Buffer.from(req.body, "binary") as any
            const folder = path.join(__dirname, "./dump")
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

            const filename = `${Math.floor(Math.random() * 100000000)}.jpg`
            const imagePath = path.join(folder, filename)
            fs.writeFileSync(imagePath, buffer)
            const scriptPath = path.join(__dirname, "../structures/wdtagger.py")
            let command = `python3 "${scriptPath}" -i "${imagePath}" -m "${process.env.WDTAGGER_PATH}"`
            const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
            const json = JSON.parse(str)
            fs.unlinkSync(imagePath)
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
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (processingQueue.has(req.session.username)) return res.status(429).send("Processing in progress")
            if (!req.body) return res.status(400).send("Image data must be provided")
            processingQueue.add(req.session.username)
            const buffer = Buffer.from(req.body, "binary") as any
            const folder = path.join(__dirname, "./dump")
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

            const filename = `${Math.floor(Math.random() * 100000000)}.jpg`
            const imagePath = path.join(folder, filename)
            fs.writeFileSync(imagePath, buffer)
            const scriptPath = path.join(__dirname, "../structures/ocr.py")
            let command = `python3 "${scriptPath}" -i "${imagePath}"`
            const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
            const json = JSON.parse(str)
            fs.unlinkSync(imagePath)
            processingQueue.delete(req.session.username)
            res.status(200).json(json)
        } catch (e) {
            console.log(e)
            if (req.session.username) processingQueue.delete(req.session.username)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/misc/emojis", miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dir = path.join(__dirname, "../assets/emojis")
            let files = fs.readdirSync(dir)
            let fileData = {} as any
            for (const file of files) {
                if (file === ".DS_Store") continue
                const filePath = path.join(dir, file)
                const buffer = fs.readFileSync(filePath)
                const name = path.basename(file, path.extname(file))
                const data = `data:image/${path.extname(file).replace(".", "")};base64,${buffer.toString("base64")}`
                fileData[name] = data
            }
            res.status(200).json(fileData)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/premium/paymentlink", csrfProtection, miscLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const data = {
                local_price: {
                    amount: "15.00",
                    currency: "USD"
                },
                pricing_type: "fixed_price",
                name: "Moepictures Premium",
                description: "Moepictures premium account upgrade",
                redirect_url: `${functions.getDomain()}/premium-success`,
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

    app.post("/api/premium/payment",  async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {event} = req.body
            const signature = req.headers["x-cc-webhook-signature"]

            const computedSignature = crypto.createHmac("sha256", process.env.COINBASE_WEBHOOK_SECRET!)
            .update(JSON.stringify(req.body), "utf8").digest("hex")
            
            if (signature !== computedSignature) {
                return res.status(400).send("Invalid signature")
            }
        
            if (event.type === "charge:pending") {
                const id = event.data.id
                const metadata = event.data.metadata
                await sql.token.insertPayment(id, metadata.username, metadata.email)

                const user = await sql.user.user(metadata.username)
                if (!user) return res.status(400).send("Invalid username")

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

                const message = `Your account has been upgraded to premium. You can now access all the premium features. Thank you for supporting us!\n\nYour membership will last until ${functions.prettyDate(premiumExpiration)}.`
                await serverFunctions.systemMessage(metadata.username, "Notice: Your account was upgraded to premium", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default MiscRoutes