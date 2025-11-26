import axios from "axios"
import sharp from "sharp"
import phash from "sharp-phash"
import crypto from "crypto"
import path from "path"
import fs from "fs"
import * as mm from "music-metadata"
import {Translator} from "@vitalets/google-translate-api"
import {createCanvas, loadImage} from "@napi-rs/canvas"
import wanakana from "wanakana"
import pinyin from "pinyin"
import util from "util"
import dns from "dns/promises"
import child_process from "child_process"
import * as hangul from "hangul-romanization"
import functions from "../functions/Functions"

const exec = util.promisify(child_process.exec)

export default class ServerUtil {
    public static ipRegion = async (ip: string) => {
        const ipInfo = await axios.get(`http://ip-api.com/json/${ip}`).then((r) => r.data).catch(() => null)
        let region = ipInfo?.regionName || "unknown"
        if (ip === "127.0.0.1" || ip.startsWith("192.168.68")) region = "localhost"
        return region
    }

    public static translate = async (words: string[]) => {
        const translate = async (text: string) => {
            try {
                const translated = await new Translator(text, {from: "ja", to: "en"}).translate()
                return translated.text
            } catch {
                return text
            }
        }
        let translated = await Promise.all(words.map((w) => translate(w)))
        return translated
    }

    public static detectCJK = (text: string) => {
        const result = {
            chinese: false,
            japanese: false,
            korean: false,
            diacritics: false
        }
    
        const chineseRegex = /[\u4E00-\u9FFF]/
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\u4E00-\u9FFF]/
        const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF]/
        const diacriticsRegex = /[\u00C0-\u017F\u1E00-\u1EFF\u0300-\u036F]/
    
        if (chineseRegex.test(text)) result.chinese = true
        if (japaneseRegex.test(text)) result.japanese = true
        if (koreanRegex.test(text)) result.korean = true
        if (diacriticsRegex.test(text.normalize("NFD"))) result.diacritics = true
    
        return result
    }

    public static romanizeTag = (tag: string) => {
        let attributes = this.detectCJK(tag)
        let text = tag
        if (attributes.japanese) {
            text = wanakana.toRomaji(text)
        }
        if (attributes.chinese) {
            text = pinyin(text, {style: pinyin.STYLE_NORMAL}).flat().join("-")
        }
        if (attributes.korean) {
            text = hangul.convert(text)
        }
        text = functions.util.removeDiacritics(text)
        return functions.tag.cleanTag(text)
    }

    public static romajinize = async (words: string[]) => {
        let romajinized = await Promise.all(words.map((w) => this.romanizeTag(w)))
        return romajinized as string[]
    }

    public static squareCrop = async (buffer: Buffer, resize = -1) => {
        const metadata = await sharp(buffer).metadata()
        const size = Math.min(metadata.width!, metadata.height!)
        const resizeWidth = resize > 0 ? resize : size
        const centerPosition = Math.max(0, Math.floor((metadata.width! - size) / 2))
        return sharp(buffer).extract({width: size, height: size, left: centerPosition, top: 0}).resize(resizeWidth, resizeWidth).toBuffer()
    }
    
    public static isTransparent = async (bytes: number[]) => {
        const image = sharp(new Uint8Array(bytes))
        const metadata = await image.metadata()
        if (!metadata.hasAlpha) return false

        const {data, info} = await image.ensureAlpha().raw().toBuffer({resolveWithObject: true})

        let counter = 0
        for (let i = 3; i < data.length; i += info.channels) {
            if (data[i] === 0) counter++
        }
        return counter > 100000
    }

    public static resizeImage = async (buffer: Buffer, maxSize = 1000) => {
        return sharp(buffer).resize(maxSize, maxSize, {fit: "inside"}).toBuffer()
    }

    public static songCover = async (audio: Buffer) => {
        const tagInfo = await mm.parseBuffer(new Uint8Array(audio))
        const picture = tagInfo.common.picture
        if (picture) {
            let buffer = new Uint8Array()
            for (let i = 0; i < picture.length; i++) {
                buffer = new Uint8Array(Buffer.concat([buffer, new Uint8Array(picture[i].data)]))
            }
            return Buffer.from(buffer)
        } else {
            return Buffer.from("")
        }
    }

    public static md5 = (buffer: Buffer) => {
        return crypto.createHash("md5").update(new Uint8Array(buffer)).digest("hex")
    }

    public static pixelHash = async (buffer: Buffer) => {
        const rawBuffer = await sharp(buffer, {limitInputPixels: false})
        .ensureAlpha().toColorspace("srgb").raw().toBuffer()
        return crypto.createHash("md5").update(rawBuffer).digest("hex")
    }

    public static imageBuffer = async (link: string, headers?: {[key: string]: string}) => {
        const response = await axios.get(link, {responseType: "arraybuffer", 
        headers: {Referer: "https://www.pixiv.net/", ...headers}}).then((r) => r.data)
        return Buffer.from(response)
    }

    public static pHash = async (buffer: Buffer) => {
        return phash(buffer).then((hash: string) => functions.byte.binaryToHex(hash))
    }

    public static localImageBuffer = async (link: string) => {
        const img = await loadImage(link)
        const canvas = createCanvas(img.width, img.height)
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0)
        return canvas.toBuffer("image/png")
    }

    public static dumpImage = async (imageBuffer: Buffer) => {
        const folder = path.join(__dirname, "./dump")
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

        const filename = `${Math.floor(Math.random() * 100000000)}.png`
        const imagePath = path.join(folder, filename)
        let pngBuffer = await sharp(imageBuffer).png().toBuffer()
        fs.writeFileSync(imagePath, pngBuffer)
        return imagePath
    }

    public static isAnime = async (bytes: number[]) => {
        const buffer = Buffer.from(bytes)
        const imagePath = await this.dumpImage(buffer)

        const scriptPath = path.join(__dirname, "../../assets/python/animedetector.py")
        const modelPath = path.join(__dirname, "../../assets/python/animedetector")
        let command = `python3 "${scriptPath}" -i "${imagePath}" -m "${modelPath}"`
        const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
        
        fs.unlinkSync(imagePath)
        return str.trim() === "anime"
    }

    public static downloadTextDetector = async () => {
        const modelPath = path.join(__dirname, "../../assets/python/comictextdetector.pt")
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading ocr text detector...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/ocr/comictextdetector.pt`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }

    public static downloadAnimeDetector = async () => {
        const detectorPath = path.join(__dirname, "../../assets/python/animedetector")
        if (!fs.existsSync(detectorPath)) fs.mkdirSync(detectorPath, {recursive: true})
        const configPath = path.join(detectorPath, "meta.json")
        if (!fs.existsSync(configPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/animedetector/meta.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(configPath, JSON.stringify(data, null, 4))
        }
        const modelPath = path.join(detectorPath, "model.onnx")
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading anime detector...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/animedetector/model.onnx`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }

    public static downloadWDTagger = async () => {
        const wdTaggerPath = path.join(__dirname, "../../assets/python/wdtagger")
        if (!fs.existsSync(wdTaggerPath)) fs.mkdirSync(wdTaggerPath, {recursive: true})
        const configPath = path.join(wdTaggerPath, "config.json")
        const modelPath = path.join(wdTaggerPath, "model.safetensors")
        const csvPath = path.join(wdTaggerPath, "selected_tags.csv")
        if (!fs.existsSync(configPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/wdtagger/config.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(configPath, JSON.stringify(data, null, 4))
        }
        if (!fs.existsSync(csvPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/wdtagger/selected_tags.csv`, {responseType: "text"}).then((r) => r.data)
            fs.writeFileSync(csvPath, data)
        }
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading waifu diffusion tagger...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/wdtagger/model.safetensors`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }

    public static downloadImageRater = async () => {
        const raterPath = path.join(__dirname, "../../assets/python/imagerater")
        if (!fs.existsSync(raterPath)) fs.mkdirSync(raterPath, {recursive: true})
        const configPath = path.join(raterPath, "config.json")
        const modelPath = path.join(raterPath, "model.safetensors")
        const preprocessPath = path.join(raterPath, "preprocessor_config.json")
        if (!fs.existsSync(configPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/imagerater/config.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(configPath, JSON.stringify(data, null, 4))
        }
        if (!fs.existsSync(preprocessPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/imagerater/preprocessor_config.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(preprocessPath, JSON.stringify(data, null, 4))
        }
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading image rater...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/imagerater/model.safetensors`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }

    public static downloadSegmentator = async () => {
        const segmentatorPath = path.join(__dirname, "../../assets/python/segmentator")
        if (!fs.existsSync(segmentatorPath)) fs.mkdirSync(segmentatorPath, {recursive: true})
        const modelPath = path.join(segmentatorPath, "anime-segmentation.ckpt")
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading anime segmentator...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/segmentator/anime-segmentation.ckpt`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }

    public static downloadLineartExtractor = async () => {
        const lineartPath = path.join(__dirname, "../../assets/python/sketchextractor")
        if (!fs.existsSync(lineartPath)) fs.mkdirSync(lineartPath, {recursive: true})
        const modelPath = path.join(lineartPath, "anime2sketch.pth")
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading anime sketch extractor...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/sketchextractor/anime2sketch.pth`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }

    public static isAllowedBot = async (ip: string) => {
        try {
            const hostnames = await dns.reverse(ip).catch(() => [])
            if (!hostnames.length) return false

            const allowedDomains = [
                ".googlebot.com", ".google.com",
                ".search.msn.com",
                ".duckduckgo.com",
                ".crawl.yahoo.net",
                ".yandex.ru", ".yandex.net",
                ".baidu.com",
                ".twitter.com", ".twttr.com",
                ".x.com",
                ".reddit.com",
                ".discord.com", ".discordapp.com",
                ".facebook.com",
                ".apple.com",
                ".pinterest.com"
            ]

            const validHosts = hostnames.filter((h) => allowedDomains.some(d => h.endsWith(d)))
            if (validHosts.length === 0) return false

            for (const host of validHosts) {
                const forward = await dns.lookup(host, {all: true}).catch(() => [])
                if (forward.some(a => a.address === ip)) return true
            }
            return false
        } catch {
            return false
        }
    }
}