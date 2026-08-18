/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import sharp from "sharp"
import phash from "sharp-phash"
import crypto from "crypto"
import path from "path"
import fs from "fs"
import * as mm from "music-metadata"
import {Request} from "express"
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
    public static ip = (req: Request) => {
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
        ip = ip?.toString().replace("::ffff:", "") || ""
        return ip
    }

    public static ipRegion = async (ip: string) => {
        const ipInfo = await axios.get(`http://ip-api.com/json/${ip}`).then((r) => r.data).catch(() => null)
        let region = ipInfo?.regionName || "unknown"
        if (ip === "127.0.0.1" || ip.startsWith("192.168.68")) region = "localhost"
        return region
    }

    public static googleTranslate = async (text: string, to = "en") => {
        const TKK = [434217, 1534559001]

        const magicNum = (a: any, b: any) => {
            for (var c = 0; c < b.length - 2; c += 3) {
                var d = b.charAt(c + 2),
                    // @ts-ignore
                    d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d),
                    // @ts-ignore
                    d = "+" == b.charAt(c + 1) ? a >>> d : a << d
                a = "+" == b.charAt(c) ? (a + d) & 4294967295 : a ^ d
            }
            return a
        }

        const generateTK = (a: any, b: any, c: any) => {
            b = Number(b) || 0
            let e = [] as number[]
            let f = 0
            let g = 0
            for (; g < a.length; g++) {
                let l = a.charCodeAt(g)
                128 > l
                    ? (e[f++] = l)
                    : (2048 > l
                            ? (e[f++] = (l >> 6) | 192)
                            : (55296 == (l & 64512) &&
                            g + 1 < a.length &&
                            56320 == (a.charCodeAt(g + 1) & 64512)
                                ? ((l = 65536 + ((l & 1023) << 10) + (a.charCodeAt(++g) & 1023)),
                                    (e[f++] = (l >> 18) | 240),
                                    (e[f++] = ((l >> 12) & 63) | 128))
                                : (e[f++] = (l >> 12) | 224),
                            (e[f++] = ((l >> 6) & 63) | 128)),
                        (e[f++] = (l & 63) | 128));
            }
            a = b;
            for (f = 0; f < e.length; f++) {
                (a += e[f]), (a = magicNum(a, "+-a^+6"))
            }
            a = magicNum(a, "+-3^+b+-f")
            a ^= Number(c) || 0
            0 > a && (a = (a & 2147483647) + 2147483648)
            a %= 1e6
            return a.toString() + "." + (a ^ b)
        }
        let url = `https://translate.googleapis.com/translate_a/single?client=gtx&dj=1&dt=t&dt=at&dt=bd&dt=ex&dt=md&dt=rw&dt=ss&dt=rm`
        url += `&sl=auto&tl=${to}&tk=${generateTK(text, TKK[0], TKK[1])}&q=${encodeURIComponent(text)}`
        const response = await fetch(url).then((r) => r.json())

        let result = ""
        if (response.sentences) {
            for (let i = 0; i < response.sentences.length && response.sentences[i].trans; i++) {
                result += response.sentences[i].trans
            }
        }
        return result
    }

    public static translate = async (words: string[]) => {
        let translated = await Promise.all(words.map((w) => this.googleTranslate(w)))
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
        const metadata = await sharp(buffer, {limitInputPixels: false}).metadata()
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
        const pngBuffer = await this.pngBuffer(buffer)
        const rawBuffer = await sharp(pngBuffer, {limitInputPixels: false})
        .ensureAlpha().toColorspace("srgb").raw().toBuffer()
        return crypto.createHash("md5").update(rawBuffer).digest("hex")
    }

    public static imageBuffer = async (link: string, headers?: {[key: string]: string}) => {
        const response = await axios.get(link, {responseType: "arraybuffer", 
        headers: {Referer: "https://www.pixiv.net/", ...headers}}).then((r) => r.data)
        return Buffer.from(response)
    }

    public static pHash = async (buffer: Buffer) => {
        const pngBuffer = await this.pngBuffer(buffer)
        return phash(pngBuffer).then((hash: string) => functions.byte.binaryToHex(hash))
    }

    public static metadata = async (buffer: Buffer) => {
        try {
            const meta = await sharp(buffer, {limitInputPixels: false}).metadata()
            return meta
        } catch {
            const pngBuffer = await this.pngBuffer(buffer)
            return sharp(pngBuffer, {limitInputPixels: false}).metadata()
        }
    }

    public static processThumbnail = async (buffer: Buffer, ext: string, size = 750) => {
        if (ext === "jpg" || ext === "jpeg") {
            const thumbBuffer = await sharp(buffer, {animated: false, limitInputPixels: false})
            .resize(size, size, {fit: "inside"})
            .jpeg({optimiseScans: true, trellisQuantisation: true, quality: 95})
            .toBuffer()
            return {thumbBuffer, thumbnailExt: "jpg"}
        } else {
            const thumbBuffer = await sharp(buffer, {animated: false, limitInputPixels: false})
            .resize(size, size, {fit: "inside"})
            .webp({quality: 90}).toBuffer()
            return {thumbBuffer, thumbnailExt: "webp"}
        }
    }

    public static localImageBuffer = async (link: string) => {
        const img = await loadImage(link)
        const canvas = createCanvas(img.width, img.height)
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0)
        return canvas.toBuffer("image/png")
    }

    public static pngBuffer = async (buffer: Buffer) => {
        try {
            const pngBuffer = await sharp(buffer, {limitInputPixels: false}).png().toBuffer()
            return pngBuffer
        } catch {
            const jxlJS = await import("../assets/wasm/jxl_dec.js").then(r => r.default)
            const wasmBinary = fs.readFileSync(path.join(__dirname, "../../assets/wasm/jxl_dec.wasm"))
            const jxl = await jxlJS({wasmBinary})
            
            const {width, height, data} = await jxl.decode(buffer) as ImageData
            const channels = Math.floor(data.length / (width * height)) as 3 | 4
            return sharp(data, {limitInputPixels: false, raw: {width, height, channels}}).png().toBuffer()
        }
    }

    public static dumpImage = async (imageBuffer: Buffer) => {
        const folder = path.join(__dirname, "./dump")
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

        let filename = `${Math.floor(Math.random() * 100000000)}.png`
        let imagePath = path.join(folder, filename)

        const pngBuffer = await this.pngBuffer(imageBuffer)
        fs.writeFileSync(imagePath, pngBuffer)
        return imagePath
    }

    public static isAnime = async (bytes: number[] | Uint8Array) => {
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

    public static isAllowedReferer = async (referer: string) => {
        const ourDomains = ["moepictures.com", "moepictures.net", "moepictures.moe"]
        if (!referer) return true

        try {
            const host = new URL(referer).hostname.toLowerCase()
            if (ourDomains.includes(host)) return true

            if (/\.google\./.test(host)) return true
            if (/\.bing\./.test(host)) return true
            if (/\.yandex\./.test(host)) return true
            if (/\.duckduckgo\./.test(host)) return true
            if (/\.yahoo\./.test(host)) return true

            return false
        } catch {
            return false
        }
    }
}