import audioEncoder from "audio-encoder"
import * as mm from "music-metadata"
import functions from "./Functions"

export default class AudioFunctions {
    public static logSlider = (position: number) => {
        const minPos = 0
        const maxPos = 1
        const minValue = Math.log(0.01)
        const maxValue = Math.log(1)
        const scale = (maxValue - minValue) / (maxPos - minPos)
        const value = Math.exp(minValue + scale * (position - minPos))
        return value
    }

    public static logSlider2 = (position: number, min: number, max: number) => {
        const minPos = 0
        const maxPos = 100
        const minValue = Math.log(min)
        const maxValue = Math.log(max)
        const scale = (maxValue - minValue) / (maxPos - minPos)
        return Math.exp(minValue + scale * (position - minPos))
    }

    public static linearToDecibels = (value: number) => {
        if (value === 0) return -Infinity
        return 20 * Math.log10(value)
    }

    public static noteFactor = (scaleFactor: number) => {
        if (scaleFactor === 1) return 0
        if (scaleFactor < 1) {
            return Math.round(-1 * ((1 / scaleFactor) * 600))
        } else {
            return Math.round(scaleFactor * 600)
        }
    }

    public static semitonesToScale = (semitones: number) => {
        var scaleFactor = Math.pow(2, semitones / 12)
        scaleFactor = Math.max(0.25, scaleFactor)
        scaleFactor = Math.min(4, scaleFactor)
        return scaleFactor
    }

    public static videoToWAV = async (videoFile: string, speed?: number, preservePitch?: boolean) => {
        const audioContext = new AudioContext()
        const reader = new FileReader()

        return new Promise<string>(async (resolve) => {
            reader.onload = async () => {
                if (!speed) speed = 1
                const arrayBuffer = reader.result as ArrayBuffer
                const decoded = await audioContext.decodeAudioData(arrayBuffer)
                const duration = decoded.duration
                const offlineAudioContext = new OfflineAudioContext(2, 44100 * (duration / speed), 44100)
                const source = offlineAudioContext.createBufferSource()
                source.buffer = decoded 
                if (speed !== 1) {
                    source.playbackRate.value = speed
                    if (preservePitch) {
                        source.detune.value = - this.noteFactor(speed)
                    }
                }
                source.connect(offlineAudioContext.destination)
                source.start()
                const audioBuffer = await offlineAudioContext.startRendering()
                audioEncoder(audioBuffer, null, null, async (blob: Blob) => {
                    resolve(URL.createObjectURL(blob))
                })
                
            }
            const blob = await fetch(videoFile).then((r) => r.blob())
            reader.readAsArrayBuffer(blob)
        })
    }
    
    public static audioDimensions = async (audio: string) => {
        const buffer = await fetch(audio).then((r) => r.arrayBuffer())
        const tagInfo = await mm.parseBuffer(new Uint8Array(buffer))
        const duration = tagInfo.format.duration || 0
        const size = buffer.byteLength
        const coverArt = await this.songCover(audio)
        const {width, height} = await functions.image.imageDimensions(coverArt)
        return {width, height, size, duration}
    }

    public static songCover = async (audio: string) => {
        let buffer = await fetch(audio).then((r) => r.arrayBuffer())
        const tagInfo = await mm.parseBuffer(new Uint8Array(buffer))
        const picture = tagInfo.common.picture
        if (picture) {
            let buffer = new Uint8Array()
            for (let i = 0; i < picture.length; i++) {
                buffer = new Uint8Array(Buffer.concat([buffer, new Uint8Array(picture[i].data)]))
            }
            return `data:${picture[0].format};base64,${Buffer.from(buffer).toString("base64")}`
        } else {
            return ""
        }
    }

    public static formatBitrate = (bitrate: number) => {
        if (bitrate < 1000) return bitrate + "Hz"
        if (bitrate < 1000000) return parseFloat((bitrate / 1000).toFixed(2)) + "kHz"
        if (bitrate < 1000000000) return parseFloat((bitrate / 1000000).toFixed(2)) + "MHz"
        return parseFloat((bitrate / 1000000000).toFixed(2)) + "GHz"
    }
}