import axios from "axios"
import sharp from "sharp"
import crypto from "crypto"
import * as mm from "music-metadata"
import {Translator} from "@vitalets/google-translate-api"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"

export default class ServerUtil {
    public static ipRegion = async (ip: string) => {
        const ipInfo = await axios.get(`http://ip-api.com/json/${ip}`).then((r) => r.data).catch(() => null)
        let region = ipInfo?.regionName || "unknown"
        if (ip === "127.0.0.1" || ip.startsWith("192.168.68")) region = "localhost"
        return region
    }

    public static isPrivateIP = (ip: string) => {
        if (!ip) return true

        if (ip.includes(":")) {
            const lower = ip.toLowerCase()
            return (
                lower === "::1" ||
                lower.startsWith("fe80:") ||
                lower.startsWith("fc") ||
                lower.startsWith("fd") ||
                lower.startsWith("::ffff:10.") ||
                lower.startsWith("::ffff:172.") ||
                lower.startsWith("::ffff:192.")
            )
        }

        const parts = ip.split(".").map(Number)
        if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return true

        const [a, b] = parts

        return (
            a === 10 ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            a === 127 ||
            (a === 169 && b === 254) ||
            (a === 100 && b >= 64 && b <= 127) ||
            a >= 224
        )
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

    public static romajinize = async (words: string[]) => {
        const kuroshiro = new Kuroshiro()
        await kuroshiro.init(new KuromojiAnalyzer())
        const romajinize = async (text: string) => {
            const result = await kuroshiro.convert(text, {mode: "spaced", to: "romaji"})
            return result.replace(/<\/?[^>]+(>|$)/g, "")
        }
        let romajinized = await Promise.all(words.map((w) => romajinize(w)))
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
}