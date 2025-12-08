import fileType from "magic-bytes.js"
import {UploadImage, ImageChunk, Session} from "../types/Types"
import functions from "./Functions"

export default class ByteFunctions {
    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks as any)))
        })
        return buffer
    }

    public static binaryToHex = (bin: string) => {
        return bin.match(/.{4}/g)?.reduce(function(acc, i) {
            return acc + parseInt(i, 2).toString(16).toUpperCase()
        }, "") || ""
    }

    public static hexToBinary = (hex: string) => {
        return hex.split("").reduce(function(acc, i) {
            return acc + ("000" + parseInt(i, 16).toString(2)).substr(-4, 4)
        }, "")
    }

    public static base64ToBuffer = (base64: string) => {
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (!matches) return Buffer.from("")
        return Buffer.from(matches[2], "base64")
    }

    public static isBase64 = (unknown: string) => {
        return /^data:([A-Za-z-+\/]+);base64,(.+)$/.test(unknown)
    }

    public static base64toUint8Array = async (base64: string) => {
        return fetch(base64).then((r) => r.arrayBuffer()).then((a) => new Uint8Array(a))
    }

    public static arrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => {
        let mime = this.bufferFileType(Buffer.from(arrayBuffer))[0]?.mime || "image/png"
        return `data:${mime};base64,${Buffer.from(arrayBuffer).toString("base64")}`
    }

    public static bufferFileType = (buffer: Uint8Array | ArrayBuffer | Buffer | number[]) => {
        buffer = Buffer.from(new Uint8Array(buffer))

        const majorBrand = buffer.toString("utf8", 8, 12)
        if (majorBrand === "avif" || majorBrand === "avis") {
            return [{typename: "avif", mime: "image/avif", extension: "avif"}]
        }
        return fileType(new Uint8Array(buffer))
    }

    public static fileExtension = (uint8Array: Uint8Array | number[]) => {
        const result = this.bufferFileType(uint8Array)?.[0]
        return result?.extension || ""
    }

    public static chunkImages = (images: UploadImage[], upscaledImages: UploadImage[]) => {
        let imageChunks = [] as ImageChunk[]
        let upscaledChunks = [] as ImageChunk[]

        const chunkSize = 45 * 1024 * 1024

        for (let i = 0; i < images.length; i++) {
            let randKey = Math.random().toString(36).slice(2) + Date.now().toString(36)
            let img = images[i]
            let bytes = img.bytes

            for (let start = 0, i = 0; start < bytes.length; start += chunkSize, i++) {
                let chunk = {...img} as ImageChunk
                chunk.fileID = randKey
                chunk.index = i + 1
                chunk.bytes = bytes.slice(start, start + chunkSize)
                imageChunks.push(chunk)
            }
        }

        for (let i = 0; i < upscaledImages.length; i++) {
            let randKey = Math.random().toString(36).slice(2) + Date.now().toString(36)
            let img = upscaledImages[i]
            let bytes = img.bytes

            for (let start = 0, i = 0; start < bytes.length; start += chunkSize, i++) {
                let chunk = {...img} as ImageChunk
                chunk.fileID = randKey
                chunk.index = i + 1
                chunk.bytes = bytes.slice(start, start + chunkSize)
                upscaledChunks.push(chunk)
            }
        }

        return {imageChunks, upscaledChunks}
    }

    public static uploadChunks = async (originalChunks: ImageChunk[], upscaledChunks: ImageChunk[], 
        session: Session, setSessionFlag?: (value: boolean) => void) => {
        for (const chunk of originalChunks) {
            await functions.http.post("/api/post/image-chunk", {chunk}, session, setSessionFlag)
            delete chunk.bytes
        }
        for (const chunk of upscaledChunks) {
            await functions.http.post("/api/post/image-chunk", {chunk}, session, setSessionFlag)
            delete chunk.bytes
        }
    }

    public static mergeChunks = (imageChunks: ImageChunk[], upscaledChunks: ImageChunk[]) => {
        const recoverImages = (imgChunks: ImageChunk[]) => {
            const fileMap = new Map<string, ImageChunk[]>()

            for (const chunk of imgChunks) {
                if (!fileMap.has(chunk.fileID)) fileMap.set(chunk.fileID, [])
                let item = fileMap.get(chunk.fileID)
                if (item) item.push(chunk)
            }

            let images = [] as UploadImage[]

            for (const [_, chunks] of fileMap) {
                chunks.sort((a, b) => a.index - b.index)

                let bytes = [] as number[]

                for (const section of chunks) {
                    if (section.bytes) bytes = bytes.concat(section.bytes)
                }

                const img = {...chunks[0]}
                // @ts-ignore
                delete img.fileID
                // @ts-ignore
                delete img.index
                images.push({...img, bytes})
            }

            return images
        }

        let images = recoverImages(imageChunks)
        let upscaledImages = recoverImages(upscaledChunks)

        return {images, upscaledImages}
    }
}