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
import * as hangul from "hangul-romanization"
import functions from "../functions/Functions"

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

    public static dumpImage = (imageBuffer: Buffer) => {
        const folder = path.join(__dirname, "./dump")
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

        const filename = `${Math.floor(Math.random() * 100000000)}.png`
        const imagePath = path.join(folder, filename)
        fs.writeFileSync(imagePath, imageBuffer)
        return imagePath
    }

    public static downloadSegmentator = async () => {
        const segmentatorPath = path.join(__dirname, "../../assets/python/segmentator")
        if (!fs.existsSync(segmentatorPath)) fs.mkdirSync(segmentatorPath, {recursive: true})
        const modelPath = path.join(segmentatorPath, "anime-segmentation.ckpt")
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading anime segmentator...")
            const data = await axios.get(`https://huggingface.co/skytnt/anime-seg/resolve/main/isnetis.ckpt`, {responseType: "arraybuffer"}).then((r) => r.data)
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
            const data = await axios.get(`https://huggingface.co/lllyasviel/Annotators/resolve/main/netG.pth`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }
}