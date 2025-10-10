import functions from "./Functions"
import MP4Demuxer from "../structures/MP4Demuxer"
import WebPXMux from "webpxmux"
import {JsWebm} from "jswebm"
import gifFrames from "gif-frames"
import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import {GIFFrame} from "../types/Types"

export default class VideoFunctions {
    public static extractMP4Frames = async (videoFile: string) => {
        let frames = [] as ImageBitmap[]
        await new Promise<void>(async (resolve) => {
            let demuxer = new MP4Demuxer(videoFile)
            let timeout = null as any
            let decoder = new VideoDecoder({
                output: async (frame: VideoFrame) => {
                    clearTimeout(timeout)
                    const bitmap = await createImageBitmap(frame)
                    frames.push(bitmap)
                    frame.close()
                    timeout = setTimeout(() => {
                        resolve()
                    }, 500)
                },
                error: (e: any) => console.error(e)
            })
            const config = await demuxer.getConfig()
            decoder.configure(config)
            demuxer.start((chunk: EncodedVideoChunk) => decoder.decode(chunk))
        })
        return Promise.all(frames)
    }

    public static extractWebMFrames = async (videoFile: string, vp9?: boolean) => {
        let frames = [] as ImageBitmap[]
        await new Promise<void>(async (resolve) => {
            let demuxer = new JsWebm()
            const arrayBuffer = await fetch(videoFile).then((r) => r.arrayBuffer())
            demuxer.queueData(arrayBuffer)
            let timeout = null as any
            let decoder = new VideoDecoder({
                output: async (frame: VideoFrame) => {
                    clearTimeout(timeout)
                    const bitmap = await createImageBitmap(frame)
                    frames.push(bitmap)
                    frame.close()
                    timeout = setTimeout(() => {
                        resolve()
                    }, 500)
                },
                error: (e: any) => console.error(e)
            })
            while (!demuxer.eof) {
                demuxer.demux()
            }
            decoder.configure({
                codec: vp9 ? "vp09.00.10.08" : "vp8",
                codedWidth: demuxer.videoTrack.width,
                codedHeight: demuxer.videoTrack.height,
                displayAspectWidth: demuxer.videoTrack.width,
                displayAspectHeight: demuxer.videoTrack.height,
                colorSpace: {
                    primaries: "bt709",
                    transfer: "bt709",
                    matrix: "rgb"
                },
                hardwareAcceleration: "no-preference",
                optimizeForLatency: true
            })
            let foundKeyframe = false
            for (let i = 0; i < demuxer.videoPackets.length; i++) {
                const packet = demuxer.videoPackets[i]
                if (packet.isKeyframe) foundKeyframe = true 
                if (!foundKeyframe) continue
                // @ts-ignore
                const chunk = new EncodedVideoChunk({type: packet.isKeyframe ? "key" : "delta", data: packet.data, timestamp: packet.timestamp * demuxer.segmentInfo.timecodeScale / 1000})
                decoder.decode(chunk)
            }
        })
        return Promise.all(frames)
    }

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

    public static videoSpeed = (data: ImageBitmap[], speed: number) => {
        if (speed === 1) return data 
        const constraint = speed > 1 ? data.length / speed : data.length
        let step = Math.ceil(data.length / constraint)
        let newData = [] as ImageBitmap[] 
        for (let i = 0; i < data.length; i += step) {
            const frame = data[i]
            newData.push(frame)
            if (speed < 1) {
                const amount = (1 / speed) - 1 
                for (let i = 0; i < amount; i++) {
                    newData.push(frame)
                }
            }
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

    public static videoThumbnail = (link: string) => {
        return new Promise<string>((resolve) => {
            const video = document.createElement("video")
            video.src = link 
            video.addEventListener("loadedmetadata", (event) => {
                video.currentTime = 0.001
            })
            video.addEventListener("seeked", () => {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")!
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL())
            })
            video.load()
        })
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
        }
        return 0
    }
}