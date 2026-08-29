/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import fileType from "magic-bytes.js"
import {UploadImage, ImageChunk, Session, Optional} from "../types/Types"
import functions from "./Functions"

export default class ByteFunctions {
    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks)))
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
        return functions.http.getBuffer(base64).then((a) => new Uint8Array(a))
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
        const chunkSize = 50 * 1024 * 1024

        const chunkBytes = (images: UploadImage[]) => {
            let chunks = [] as ImageChunk[]

            for (let i = 0; i < images.length; i++) {
                let fileID = Math.random().toString(36).slice(2) + Date.now().toString(36)
                let img = images[i]
                let bytes = img.bytes

                for (let start = 0, i = 0; start < bytes.length; start += chunkSize, i++) {
                    let chunk = {...img} as ImageChunk
                    chunk.fileID = fileID
                    chunk.index = i + 1
                    chunk.bytes = bytes.slice(start, start + chunkSize)
                    chunks.push(chunk)
                }
            }

            return chunks
        }

        let imageChunks = chunkBytes(images)
        let upscaledChunks = chunkBytes(upscaledImages)

        return {imageChunks, upscaledChunks}
    }

    public static uploadChunks = async (originalChunks: ImageChunk[], upscaledChunks: ImageChunk[], 
        session: Session, setSessionFlag?: (value: boolean) => void) => {
        const sendChunks = async (chunks: ImageChunk[]) => {
            for (const chunk of chunks) {
                const form = new FormData()
                form.append("bytes", new Blob([new Uint8Array(chunk.bytes!)]))
                delete chunk.bytes
                form.append("metadata", JSON.stringify({...chunk}))
                await functions.http.postForm("/api/post/image-chunk", form, session, setSessionFlag)
            }
        }
        await sendChunks(originalChunks)
        await sendChunks(upscaledChunks)
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

                let size = 0
                for (const chunk of chunks) {
                    size += chunk.bytes!.length
                }

                const bytes = new Uint8Array(size)

                let offset = 0
                for (const chunk of chunks) {
                    bytes.set(chunk.bytes!, offset)
                    offset += chunk.bytes!.length
                }

                const img = {...chunks[0]} as Optional<ImageChunk>
                delete img.bytes
                delete img.fileID
                delete img.index

                // The code works the same for Uint8Array and number[]. 
                // The files handled here may be too large to convert to 
                // number[], so it is kept as Uint8Array. 
                images.push({...img, bytes} as any)
            }

            return images
        }

        let images = recoverImages(imageChunks)
        let upscaledImages = recoverImages(upscaledChunks)

        return {images, upscaledImages}
    }
}