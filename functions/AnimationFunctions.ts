import functions from "./Functions"
import WebPXMux from "webpxmux"
import gifFrames from "gif-frames"
import JSZip from "jszip"
import GifEncoder from "gif-encoder"
import parseAPNG from "apng-js"
import pixels from "image-pixels"
import {GIFFrame} from "../types/Types"

export default class AnimationFunctions {
    public static extractAnimatedWebpFramesNative = async (data: ArrayBuffer) => {
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/webp", preferAnimation: true})
        let result = [] as GIFFrame[]
        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas")
                canvas.width = decoded.image.codedWidth
                canvas.height = decoded.image.codedHeight
                const canvasContext = canvas.getContext("2d")!
                const image = await createImageBitmap(decoded.image)
                canvasContext.drawImage(image, 0, 0)
                const duration = decoded.image.duration || 0
                result.push({frame: canvas, delay: duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractAnimatedWebpFrames = async (webpBuffer: ArrayBuffer, nativeOnly?: boolean) => {
        if ("ImageDecoder" in window) {
            return this.extractAnimatedWebpFramesNative(webpBuffer)
        } else {
            if (nativeOnly) return []
            const xMux = WebPXMux("webpxmux.wasm")
            await xMux.waitRuntime()
            const data = await xMux.decodeFrames(new Uint8Array(webpBuffer))
            const webpData = [] as GIFFrame[]
            await new Promise<void>((resolve) => {
                for (let i = 0; i < data.frames.length; i++) {
                    const frame = data.frames[i]
                    const canvas = document.createElement("canvas")
                    canvas.width = data.width
                    canvas.height = data.height
                    const ctx = canvas.getContext("2d")!
                    const imageData = ctx.createImageData(canvas.width, canvas.height)
                    for (let i = 0; i < frame.rgba.length; i++) {
                        const rgba = frame.rgba[i]
                        imageData.data[i * 4 + 0] = (rgba >> 24) & 0xFF
                        imageData.data[i * 4 + 1] = (rgba >> 16) & 0xFF
                        imageData.data[i * 4 + 2] = (rgba >> 8) & 0xFF
                        imageData.data[i * 4 + 3] = rgba & 0xFF
                    }
                    ctx.putImageData(imageData, 0, 0)
                    webpData.push({delay: frame.duration, frame: canvas})
                }
                resolve()
            })
            return webpData
        }
    }

    public static extractAnimatedPngFramesNative = async (data: ArrayBuffer) => {
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/png", preferAnimation: true})
        let result = [] as GIFFrame[]
        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas")
                canvas.width = decoded.image.codedWidth
                canvas.height = decoded.image.codedHeight
                const canvasContext = canvas.getContext("2d")!
                const image = await createImageBitmap(decoded.image)
                canvasContext.drawImage(image, 0, 0)
                const duration = decoded.image.duration || 0
                result.push({frame: canvas, delay: duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractAnimatedPngFrames = async (pngBuffer: ArrayBuffer, nativeOnly?: boolean) => {
        if ("ImageDecoder" in window) {
            return this.extractAnimatedPngFramesNative(pngBuffer)
        } else {
            if (nativeOnly) return []
            const apng = parseAPNG(pngBuffer)
            if (apng instanceof Error) return []
            let frames = [] as GIFFrame[]
            await apng.createImages()
            const canvas = document.createElement("canvas")
            canvas.width = apng.width
            canvas.height = apng.height
            const ctx = canvas.getContext("2d")!

            let previousData: ImageData | null = null

            for (const frame of apng.frames) {
                if (frame.disposeOp === 2) {
                    previousData = ctx.getImageData(0, 0, apng.width, apng.height)
                }
                if (frame.blendOp === 0) {
                    ctx.clearRect(frame.left, frame.top, frame.width, frame.height)
                }

                ctx.drawImage(frame.imageElement!, frame.left, frame.top)

                const rendered = document.createElement("canvas")
                rendered.width = apng.width
                rendered.height = apng.height
                const renderCtx = rendered.getContext("2d")!
                renderCtx.drawImage(canvas, 0, 0)

                frames.push({delay: frame.delay, frame: rendered})

                if (frame.disposeOp === 1) {
                    ctx.clearRect(frame.left, frame.top, frame.width, frame.height)
                } else if (frame.disposeOp === 2 && previousData) {
                    ctx.putImageData(previousData, 0, 0)
                }
            }
            return frames
        }
    }

    public static extractGIFFramesNative = async (data: ArrayBuffer) => {
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/gif", preferAnimation: true})
        let result = [] as GIFFrame[]
        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas")
                canvas.width = decoded.image.codedWidth
                canvas.height = decoded.image.codedHeight
                const canvasContext = canvas.getContext("2d")!
                const image = await createImageBitmap(decoded.image)
                canvasContext.drawImage(image, 0, 0)
                const duration = decoded.image.duration || 0
                result.push({frame: canvas, delay: duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractGIFFrames = async (gifBuffer: ArrayBuffer, nativeOnly?: boolean) => {
        if ("ImageDecoder" in window) {
            return this.extractGIFFramesNative(gifBuffer)
        } else {
            if (nativeOnly) return []
            const blob = new Blob([new Uint8Array(gifBuffer)])
            const url = URL.createObjectURL(blob)
            const frames = await gifFrames({url, frames: "all", outputType: "canvas"})
            const newGIFData = [] as GIFFrame[]
            for (let i = 0; i < frames.length; i++) {
                newGIFData.push({
                    frame: frames[i].getImage(),
                    delay: frames[i].frameInfo.delay * 10
                })
            }
            URL.revokeObjectURL(url)
            return newGIFData
        }
    }

    public static gifSpeed = (data: GIFFrame[], speed: number) => {
        if (speed === 1) return data 
        const constraint = speed > 1 ? data.length / speed : data.length
        let step = Math.ceil(data.length / constraint)
        let newData = [] as GIFFrame[] 
        for (let i = 0; i < data.length; i += step) {
            const frame = data[i].frame 
            let delay = data[i].delay 
            if (speed < 1) delay = delay / speed 
            newData.push({frame, delay})
        }
        return newData
    }

    public static encodeGIF = async (frames: ArrayBuffer[], delays: number[], width: number, height: number, options?: {transparentColor?: string}) => {
        if (!options) options = {} as {transparentColor?: string}
        const gif = new GifEncoder(width, height, {highWaterMark: 5 * 1024 * 1024})
        gif.setQuality(10)
        gif.setRepeat(0)
        gif.writeHeader()
        if (options?.transparentColor) gif.setTransparent(functions.color.parseTransparentColor(options.transparentColor))
        let counter = 0

        const addToGif = async (frames: ArrayBuffer[]) => {
            if (!frames[counter]) {
                gif.finish()
            } else {
                const {data} = await pixels(frames[counter], {width, height})
                gif.setDelay(delays[counter])
                gif.addFrame(data)
                counter++
                addToGif(frames)
            }
        }
        await addToGif(frames)
        return functions.byte.streamToBuffer(gif as NodeJS.ReadableStream)
    }

    public static animationDuration = async (link: string) => {
        if (functions.file.isGIF(link)) {
            const arrayBuffer = await fetch(link).then((r) => r.arrayBuffer())
            const frames = await this.extractGIFFrames(arrayBuffer)
            return frames.map((f) => f.delay).reduce((p, c) => p + c) / 1000
        } else if (functions.file.isWebP(link)) {
            const arrayBuffer = await fetch(link).then((r) => r.arrayBuffer())
            if (functions.file.isAnimatedWebp(arrayBuffer)) {
                const frames = await this.extractAnimatedWebpFrames(arrayBuffer)
                return frames.map((f) => f.delay).reduce((p, c) => p + c) / 1000
            }
        } else if (functions.file.isPNG(link)) {
            const arrayBuffer = await fetch(link).then((r) => r.arrayBuffer())
            if (functions.file.isAnimatedPng(arrayBuffer)) {
                const frames = await this.extractAnimatedPngFrames(arrayBuffer)
                return frames.map((f) => f.delay).reduce((p, c) => p + c) / 1000
            }
        }
        return 0
    }

    public static extractUgoiraFrames = async (zipBuffer: ArrayBuffer, firstOnly?: boolean) => {
        const zip = await JSZip.loadAsync(zipBuffer)
        let frames = [] as GIFFrame[]
        let animations = [] as {file: string, delay: number}[]
        const animationFile = zip.file("animation.json")
        if (animationFile) {
            const jsonText = await animationFile.async("text")
            const json = JSON.parse(jsonText)
            animations = json.frames || json
        }
        for (const frameInfo of animations) {
            const {file, delay} = frameInfo
            const fileObject = zip.file(file)
            if (!fileObject) continue

            const blob = await fileObject.async("blob")
            const url = URL.createObjectURL(blob)
            const image = await functions.image.createImage(url)
            const canvas = document.createElement("canvas")
            canvas.width = image.width
            canvas.height = image.height
            const ctx = canvas.getContext("2d")!
            ctx.drawImage(image, 0, 0)
            URL.revokeObjectURL(url)
            frames.push({frame: canvas, delay})
            if (firstOnly) return frames
        }
        return frames
    }

    public static ugoiraThumbnail = async (link: string) => {
        const arrayBuffer = await functions.http.getBuffer(link)
        const frames = await this.extractUgoiraFrames(arrayBuffer, true)
        return frames[0].frame.toDataURL()
    }

    public static ugoiraDimensions = async (link: string) => {
        const arrayBuffer = await functions.http.getBuffer(link)
        const frames = await this.extractUgoiraFrames(arrayBuffer, true)
        let duration = frames.map((f) => f.delay).reduce((p, c) => p + c) / 1000
        return {width: frames[0].frame.width, height: frames[0].frame.height, 
                size: arrayBuffer.byteLength, duration}
    }
}