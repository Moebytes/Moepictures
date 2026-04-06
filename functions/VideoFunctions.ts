/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import MP4Demuxer from "../structures/MP4Demuxer"
import {JsWebm} from "jswebm"
import functions from "./Functions"

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

    public static extractWebMFrames = async (videoBuffer: ArrayBuffer, vp9?: boolean) => {
        let frames = [] as ImageBitmap[]
        await new Promise<void>(async (resolve) => {
            let demuxer = new JsWebm()
            demuxer.queueData(videoBuffer)
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

    public static videoThumbnail = async (link: string) => {
        return new Promise<string>((resolve) => {
            const video = document.createElement("video")
            video.src = link
            video.addEventListener("loadedmetadata", (event) => {
                video.currentTime = video.duration / 2
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

    public static videoDimensions = async (videoLink: string) => {
        return new Promise<{width: number, height: number, size: number, duration: number}>(async (resolve) => {
            const video = document.createElement("video")
            video.addEventListener("loadedmetadata", async () => {
                let width = video.videoWidth 
                let height = video.videoHeight
                let duration = video.duration
                try {
                    const r = await functions.http.getBuffer(videoLink)
                    const size = r.byteLength
                    resolve({width, height, size, duration})
                } catch {
                    resolve({width, height, size: 0, duration})
                }
            })
            video.src = videoLink
        })
    }

    public static rateOn = (effects: {speed: number, reverse: boolean}) => {
        let {speed, reverse} = effects
        if ((speed !== 1) || (reverse !== false)) return true 
        return false
    }
}