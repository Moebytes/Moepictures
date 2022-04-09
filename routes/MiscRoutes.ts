import {Express, NextFunction, Request, Response} from "express"
import axios from "axios"
import FormData from "form-data"
import fileType from "magic-bytes.js"
import path from "path"
import Pixiv from "pixiv.ts"
import googleTranslate from "@vitalets/google-translate-api"
import functions from "../structures/Functions"

const MiscRoutes = (app: Express) => {
    app.post("/api/saucenao", async (req: Request, res: Response, next: NextFunction) => {
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
        } catch (e) {
            console.log(e)
            res.status(404).end()
        }
    })

    app.get("/api/pixiv", async (req: Request, res: Response, next: NextFunction) => {
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

    app.get("/api/proxy", async (req: Request, res: Response, next: NextFunction) => {
        const link = req.query.url as string
        try {
            const response = await axios.get(link, {responseType: "arraybuffer", headers: {Referer: "https://www.pixiv.net/"}}).then((r) => r.data)
            res.status(200).send(response)
        } catch {
            res.status(404).end()
        }
    })

    app.post("/api/translate", async (req: Request, res: Response, next: NextFunction) => {
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
}

export default MiscRoutes