import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import path from "path"
import commonPasswords from "../assets/json/common-passwords.json"
import bannedUsernames from "../assets/json/banned-usernames.json"
import profaneWords from "../assets/json/profane-words.json"
import axios from "axios"
import {hexToRgb} from "./Color"
import MP4Demuxer from "./MP4Demuxer"
import audioEncoder from "audio-encoder"
import fileType from "magic-bytes.js"
import gibberish from "./Gibberish"
import gifFrames from "gif-frames"
import {JsWebm} from "jswebm"
import cryptoFunctions from "./CryptoFunctions"
import localforage from "localforage"
import mm from "music-metadata"
import * as THREE from "three"
import {GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"

// csrf token
let csrfToken = ""

// drag scroll
let newScrollY = 0
let lastScrollTop = 0
let element = null as any
let inertia = false
let mouseDown = false

// detect trackpad
let eventCount = 0
let eventCountStart = null as any

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"]
const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
const audioExtensions = [".mp3", ".wav"]
const modelExtensions = [".glb", ".gltf", ".obj", ".fbx"]

export default class Functions {
    public static updateCSRFToken = async () => {
        await Functions.timeout(500)
        csrfToken = await axios.get("/api/misc/csrf", {withCredentials: true}).then((r) => r.data)
    }

    public static getCSRFToken = () => {
        return csrfToken
    }
    
    public static isSafari = () => {
        // @ts-ignore
        return /constructor/i.test(window.HTMLElement) || (function (p) {return p.toString() === "[object SafariRemoteNotification]" })(!window["safari"] || (typeof safari !== "undefined" && safari.pushNotification))
    }

    public static decodeEntities(encodedString: string) {
        const regex = /&(nbsp|amp|quot|lt|gt);/g
        const translate = {
            nbsp: " ",
            amp : "&",
            quot: "\"",
            lt  : "<",
            gt  : ">"
        }
        return encodedString.replace(regex, function(match, entity) {
            return translate[entity]
        }).replace(/&#(\d+);/gi, function(match, numStr) {
            const num = parseInt(numStr, 10)
            return String.fromCharCode(num)
        })
    }

    public static cleanHTML = (str: string) => {
        return Functions.decodeEntities(str).replace(/<\/?[^>]+(>|$)/g, "")
    }
    
    public static proxyImage = async (link: string) => {
        try {
            const response = await axios.get(`/api/misc/proxy?url=${link}`, {withCredentials: true, responseType: "arraybuffer"}).then((r) => r.data)
            const blob = new Blob([new Uint8Array(response)])
            const file = new File([blob], path.basename(link))
            return file
        } catch {
            const response = await fetch(link).then((r) => r.arrayBuffer())
            const blob = new Blob([new Uint8Array(response)])
            const file = new File([blob], path.basename(link))
            return file
        }
    }

    public static twitterLink = () => {
        window.open("https://twitter.com/i/user/754445878501466112", "__blank")
    }

    public static removeDuplicates = <T>(array: T[]) => {
        const set = new Set<string>()
        return array.filter(item => {
            if (set.has(JSON.stringify(item))) {
                return false
            } else {
                set.add(JSON.stringify(item))
                return true
            }
        })
    }

    public static removeItem = <T>(array: T[], value: T) => {
        return array.filter((item) => JSON.stringify(item) !== JSON.stringify(value))
    }

    public static formatSeconds = (duration: number) => {
        let seconds = Math.floor(duration % 60) as any
        let minutes = Math.floor((duration / 60) % 60) as any
        let hours = Math.floor((duration / (60 * 60)) % 24) as any
        if (Number.isNaN(seconds) || seconds < 0) seconds = 0
        if (Number.isNaN(minutes) || minutes < 0) minutes = 0
        if (Number.isNaN(hours) || hours < 0) hours = 0

        hours = (hours === 0) ? "" : ((hours < 10) ? "0" + hours + ":" : hours + ":")
        minutes = hours && (minutes < 10) ? "0" + minutes : minutes
        seconds = (seconds < 10) ? "0" + seconds : seconds
        return `${hours}${minutes}:${seconds}`
    }
    
    public static arrayIncludes = (str: string, arr: string[]) => {
        for (let i = 0; i < arr.length; i++) {
            if (str.includes(arr[i])) return true
        }
        return false
    }

    public static isImage = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, imageExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), imageExtensions)
    }

    public static isAudio = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, audioExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), audioExtensions)
    }

    public static isModel = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, modelExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), modelExtensions)
    }

    public static isGIF = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".gif"
        }
        return path.extname(file) === ".gif"
    }

    public static isWebP = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webp"
        }
        return path.extname(file) === ".webp"
    }

    public static isGLTF = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".glb"
        }
        return path.extname(file) === ".glb"
    }

    public static isOBJ = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".obj"
        }
        return path.extname(file) === ".obj"
    }

    public static isFBX = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".fbx"
        }
        return path.extname(file) === ".fbx"
    }

    public static isAnimatedWebp = async (buffer: ArrayBuffer) => {
        let str: any
        if (typeof window === "undefined") {
            str = buffer
        } else {
            str = await new Blob([buffer]).text()
        }
        if (str.indexOf("ANMF") != -1) {
            return true
        } else {
            return false
        }
    }

    public static isVideo = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, videoExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), videoExtensions)
    }

    public static isMP4 = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mp4"
        }
        return path.extname(file) === ".mp4"
    }

    public static isWebM = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webm"
        }
        return path.extname(file) === ".webm"
    }

    public static timeout = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
    
    public static toProperCase = (str: string) => {
        if (!str) return ""
        return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            }
        )
    }

    public static alphaNumeric(str: string) {
        for (let i = 0; i < str.length; i++) {
          const code = str.charCodeAt(i)
          if (!(code > 47 && code < 58) && // 0-9
              !(code > 64 && code < 91) && // A-Z
              !(code > 96 && code < 123)) { // a-z
            return false
          }
        }
        return true
    }

    public static validateUsername = (username: string) => {
        if (!username) return "No username."
        const alphaNumeric = Functions.alphaNumeric(username)
        if (!alphaNumeric || /[\n\r\s]+/g.test(username)) return "Usernames cannot contain special characters or spaces."
        if (profaneWords.includes(username.toLowerCase())) return "Username is profane."
        //if (gibberish(username)) return "Username cannot be gibberish."
        if (bannedUsernames.includes(username.toLowerCase())) return "This username isn't allowed to be used."
        return null
    }

    public static passwordStrength = (password: string) => {
        let counter = 0
        if (/[a-z]/.test(password)) counter++
        if (/[A-Z]/.test(password)) counter++
        if (/[0-9]/.test(password)) counter++
        if (!/^[a-zA-Z0-9]+$/.test(password)) counter++
        if (password.length < 10 || counter < 3) return "weak"
        if (password.length < 15) return "decent"
        return "strong"
    }

    public static validatePassword = (username: string, password: string) => {
        if (!password) return "No password."
        if (password.toLowerCase().includes(username.toLowerCase())) return "Password should not contain username."
        if (commonPasswords.includes(password)) return "Password is too common."
        if (/ +/.test(password)) return "Password should not contain spaces."
        if (password.length < 10) return "Password must be at least 10 characters."
        const strength = Functions.passwordStrength(password)
        if (strength === "weak") return "Password is too weak."
        return null
    }

    public static validateEmail = (email: string) => {
        if (!email) return "No email."
        const regex = /^[a-zA-Z0-9.!#$%&"*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        if (!regex.test(email)) return "Email is not valid."
        if (!email.endsWith("@gmail.com") &&
            !email.endsWith("@icloud.com") && 
            !email.endsWith("@yahoo.com") &&
            !email.endsWith("@hotmail.com") &&
            !email.endsWith("@outlook.com") && 
            !email.endsWith("@protonmail.com") &&
            !email.endsWith("@proton.me") &&
            !email.endsWith("@aol.com") &&
            !email.endsWith("@zoho.com")) return "Email provider not accepted. Allowed providers: gmail.com, icloud.com, yahoo.com, hotmail.com, outlook.com, protonmail.com, proton.me, aol.com, zoho.com."
        return null
    }

    public static parseComment = (comment: string) => {
        let segments = [] as any
        const pieces = comment.split(/\n+/gm)
        let intermediate = [] as any
        for (let i = 0; i < pieces.length; i++) {
            let piece = pieces[i].trim()
            if (piece.startsWith(">>>") || piece.startsWith(">")) {
                intermediate.push(piece)
            } else {
                if (intermediate.length) {
                    segments.push(intermediate.join(""))
                    intermediate = []
                }
                segments.push(piece)
            }
        }
        if (intermediate.length) {
            segments.push(intermediate.join(""))
        }
        return segments.filter(Boolean)
    }

    public static validateComment = (comment: string) => {
        if (!comment) return "No comment."
        if (comment.length > 1000) return "Comment cannot exceed 1000 characters."
        if (!/[a-zA-Z\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(comment)) return "Comment cannot be gibberish."
        const pieces = Functions.parseComment(comment)
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.includes(">")) {
                const username = piece.match(/(>>>)(.*?)(?=$|>)/gm)?.[0].replace(">>>", "") ?? ""
                const text = piece.replace(username, "").replaceAll(">", "")
                if (!text && !username) continue
                if (gibberish(username)) return "Comment cannot be gibberish."
                if (gibberish(text)) return "Comment cannot be gibberish."
            } else {
                if (gibberish(piece)) return "Comment cannot be gibberish."
            }
        }
        const words = comment.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        for (let i = 0; i < words.length; i++) {
            if (profaneWords.includes(words[i])) return "Comment is profane."
        }
        return null
    }

    public static validateReply = (reply: string) => {
        if (!reply) return "No reply."
        if (!/[a-zA-Z\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(reply)) return "Reply cannot be gibberish."
        const words = reply.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        for (let i = 0; i < words.length; i++) {
            if (profaneWords.includes(words[i])) return "Reply is profane."
        }
        return null
    }

    public static validateMessage = (message: string) => {
        if (!message) return "No message."
        if (gibberish(message)) return "Message cannot be gibberish."
        return null
    }

    public static validateReason = (reason: string) => {
        if (!reason) return "Reason is required."
        if (gibberish(reason)) return "Reason cannot be gibberish."
        return null
    }

    public static validateDescription = (desc: string) => {
        if (!desc) return null
        if (gibberish(desc)) return "Description cannot be gibberish."
        return null
    }

    public static validateBio = (bio: string) => {
        if (!bio) return "No bio."
        if (gibberish(bio)) return "Bio cannot be gibberish."
        const bioArray = bio.split(/ +/g)
        for (let i = 0; i < bioArray.length; i++) {
            if (profaneWords.includes(bioArray[i].toLowerCase())) return "Bio is profane."
        }
        return null
    }

    public static changeFavicon = (theme: string) => {
        let link = document.querySelector(`link[rel~="icon"]`) as any
        if (!link) {
            link = document.createElement("link")
            link.rel = "icon";
            document.getElementsByTagName("head")[0].appendChild(link)
        }
        if (theme.includes("magenta")) {
            link.href = "/assets/magenta/favicon.png"
        } else {
            link.href = "/assets/icons/favicon.png"
        }
    }

    public static dragScroll = (enabled?: boolean) => {
        if (inertia || mouseDown) return
        element?.removeEventListener("mousedown", element?.mouseDownFunc, false)
        window.removeEventListener("mouseup", element?.mouseUpFunc, false)
        window.removeEventListener("mousemove", element?.mouseMoveFunc, false)
        window.removeEventListener("scroll", element?.scrollFunc, false)

        element = document.querySelector(".drag") as HTMLElement
        if (!element || !enabled) return
        let lastClientY = 0
        mouseDown = false
        let time = null as any
        let id = 0

        element.addEventListener("mousedown", element.mouseDownFunc = (event: MouseEvent) => {
                if (event.button === 2) return 
                event.preventDefault()
                Functions.clearSelection()
                // @ts-ignore
                document.activeElement.blur()
                mouseDown = true
                inertia = false
                time = new Date()
                lastClientY = event.clientY
                let scrollElement = element
                if (element == document.body) scrollElement = document.documentElement
                lastScrollTop = scrollElement.scrollTop
                cancelAnimationFrame(id)
        }, false)

        window.addEventListener("scroll", element.scrollFunc = () => {
            cancelAnimationFrame(id)
        }, false)

        window.addEventListener("mouseup", element.mouseUpFunc = (event) => {
            mouseDown = false
            const timeDiff = (new Date() as any - time)
            let scrollElement = element
            if (element == document.body) scrollElement = document.documentElement
            let speedY = (scrollElement.scrollTop - lastScrollTop) / timeDiff * 25
            let speedYAbsolute = Math.abs(speedY)

            const draw = () => {
                let scrollElement = element
                if (element == document.body) scrollElement = document.documentElement
                if (speedYAbsolute > 0) {
                    if (speedY > 0) {
                        scrollElement.scrollTop += speedYAbsolute--
                    } else {
                        scrollElement.scrollTop -= speedYAbsolute--
                    }
                } else {
                    inertia = false
                }
                id = requestAnimationFrame(draw)
            }
            inertia = true
            draw()
        }, false)

        window.addEventListener("mousemove", element.mouseMoveFunc = (event) => {
            if (!mouseDown) return
            let scrollElement = element
            if (element == document.body) scrollElement = document.documentElement
            newScrollY = event.clientY - lastClientY
            lastClientY = event.clientY
            scrollElement.scrollTop -= newScrollY
        }, false)
    }

    public static updateHeight = () => {
        const imageContainer = document.querySelector(".imagegrid") as HTMLElement
        if (imageContainer) {
            const height = imageContainer.clientHeight
            imageContainer.style.height = `${height}px`
        }
    }

    public static scrolledToBottom = () => {
        const c = [document.scrollingElement!.scrollHeight, document.body.scrollHeight, document.body.offsetHeight].sort(function(a,b){return b-a})
        return (window.innerHeight + window.scrollY + 30 >= c[0])
    }

    public static trimCanvas = (canvas: any) => {
        const context = canvas.getContext("2d");

        const topLeft = {
            x: canvas.width,
            y: canvas.height,
            update(x,y){
                this.x = Math.min(this.x,x);
                this.y = Math.min(this.y,y);
            }
        };

        const bottomRight = {
            x: 0,
            y: 0,
            update(x,y){
                this.x = Math.max(this.x,x);
                this.y = Math.max(this.y,y);
            }
        };

        const imageData = context.getImageData(0,0,canvas.width,canvas.height);

        for(let x = 0; x < canvas.width; x++){
            for(let y = 0; y < canvas.height; y++){
                const alpha = imageData.data[((y * (canvas.width * 4)) + (x * 4)) + 3];
                if(alpha !== 0){
                    topLeft.update(x,y);
                    bottomRight.update(x,y);
                }
            }
        }

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        const croppedCanvas = context.getImageData(topLeft.x,topLeft.y,width,height);
        canvas.width = width;
        canvas.height = height;
        context.putImageData(croppedCanvas,0,0);

        return canvas;
    }

    public static download = (filename: string, url: string) => {
            const a = document.createElement("a")
            a.setAttribute("href", url)
            a.setAttribute("download", decodeURIComponent(filename))
            a.style.display = "none"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
    }

    public static getImagesPerRow = (sizeType: string) => {
        if (sizeType === "tiny") return 9
        if (sizeType === "small") return 7
        if (sizeType === "medium") return 5
        if (sizeType === "large") return 4
        if (sizeType === "massive") return 3
        return 9
    }

    public static getImagesPerRowMobile = (sizeType: string) => {
        if (sizeType === "tiny") return 5
        if (sizeType === "small") return 4
        if (sizeType === "medium") return 3
        if (sizeType === "large") return 2
        if (sizeType === "massive") return 1
        return 5
    }

    public static round = (value: number, step?: number) => {
        if (!step) step = 1.0
        const inverse = 1.0 / step
        return Math.round(value * inverse) / inverse
    }

    public static getScrollPercent = () => {
            return (document.documentElement.scrollTop) / 
            (document.documentElement.scrollHeight - document.documentElement.clientHeight)
    }

    public static getScrollPercentAdjusted = (sizeType: string) => {
        if (sizeType === "tiny") return Functions.getScrollPercent() - 0.55
        if (sizeType === "small") return Functions.getScrollPercent() - 0.4
        if (sizeType === "medium") return Functions.getScrollPercent() - 0.2
        if (sizeType === "large") return Functions.getScrollPercent() - 0.15
        if (sizeType === "massive") return Functions.getScrollPercent() - 0.07
        return Functions.getScrollPercent()
    }

    public static preventDragging = () => {
        document.querySelectorAll("img").forEach((img) => {
          img.draggable = false
        })
    }

    public static clearSelection() {
        window.getSelection()?.removeAllRanges()
    }

    public static getImageOrFallback = async (path: string, fallback: string) => {
        return new Promise<string>(resolve => {
          const img = new Image()
          img.src = path
          img.onload = () => resolve(path)
          img.onerror = () => resolve(fallback)
        })
    }

    public static calcDistance(elementOne: any, elementTwo: any) {
        let distance = 0
        
        const x1 = elementOne.offsetTop
        const y1 = elementOne.offsetLeft
        const x2 = elementTwo.offsetTop
        const y2 = elementTwo.offsetLeft
        const xDistance = x1 - x2
        const yDistance = y1 - y2
        
        distance = Math.sqrt(
            (xDistance * xDistance) + (yDistance * yDistance)
        )
        return distance
    }

    public static extractMP4Frames = async (videoFile: string) => {
        let frames = [] as any
        await new Promise<void>(async (resolve) => {
            let demuxer = new MP4Demuxer(videoFile)
            let timeout: any 
            // @ts-ignore
            let decoder = new VideoDecoder({
                output : (frame: any) => {
                    clearTimeout(timeout)
                    const bitmap = createImageBitmap(frame)
                    frames.push(bitmap)
                    frame.close()
                    timeout = setTimeout(() => {
                        resolve()
                    }, 500)
                },
                error : (e: any) => console.error(e)
            })
            const config = await demuxer.getConfig()
            decoder.configure(config)
            demuxer.start((chunk: any) => decoder.decode(chunk))
        })
        return Promise.all(frames)
    }

    public static extractWebMFrames = async (videoFile: string, vp9?: boolean) => {
        let frames = [] as any
        await new Promise<void>(async (resolve) => {
            let demuxer = new JsWebm()
            const arrayBuffer = await fetch(videoFile).then((r) => r.arrayBuffer())
            demuxer.queueData(arrayBuffer)
            let timeout: any 
            // @ts-ignore
            let decoder = new VideoDecoder({
                output : (frame: any) => {
                    clearTimeout(timeout)
                    const bitmap = createImageBitmap(frame)
                    frames.push(bitmap)
                    frame.close()
                    timeout = setTimeout(() => {
                        resolve()
                    }, 500)
                },
                error : (e: any) => console.error(e)
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

    public static extractAnimatedWebpFrames = async (webp: string) => {
        const data = await fetch(webp).then((r) => r.arrayBuffer())
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/webp", preferAnimation: true})

        let result = [] as any

        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas") as any
                const canvasContext = canvas.getContext("2d")
                canvasContext.drawImage(decoded.image, 0, 0)
                result.push({frame: await createImageBitmap(decoded.image), delay: decoded.image.duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractGIFFramesNew = async (gif: string) => {
        const data = await fetch(gif).then((r) => r.arrayBuffer())
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/gif", preferAnimation: true})

        let result = [] as any

        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas") as any
                canvas.width = decoded.codedWidth 
                canvas.height = decoded.codedHeight
                const canvasContext = canvas.getContext("2d")
                canvasContext.drawImage(decoded.image, 0, 0)
                result.push({frame: await createImageBitmap(decoded.image), delay: decoded.image.duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractGIFFrames = async (gif: string) => {
        try {
            const data = await Functions.extractGIFFramesNew(gif)
            return data
        } catch {
            // fallback to this
        }
        const frames = await gifFrames({url: gif, frames: "all", outputType: "canvas"})
        const newGIFData = [] as any
        for (let i = 0; i < frames.length; i++) {
            newGIFData.push({
                frame: frames[i].getImage(),
                delay: frames[i].frameInfo.delay * 10
            })
        }
        return newGIFData
    }

    public static gifSpeed = (data: any[], speed: number) => {
        if (speed === 1) return data 
        const constraint = speed > 1 ? data.length / speed : data.length
        let step = Math.ceil(data.length / constraint)
        let newData = [] as any 
        for (let i = 0; i < data.length; i += step) {
            const frame = data[i].frame 
            let delay = data[i].delay 
            if (speed < 1) delay = delay / speed 
            newData.push({frame, delay})
        }
        return newData
    }

    public static videoSpeed = (data: any[], speed: number) => {
        if (speed === 1) return data 
        const constraint = speed > 1 ? data.length / speed : data.length
        let step = Math.ceil(data.length / constraint)
        let newData = [] as any 
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

    public static logSlider = (position: number) => {
        const minPos = 0
        const maxPos = 1
        const minValue = Math.log(0.01)
        const maxValue = Math.log(1)
        const scale = (maxValue - minValue) / (maxPos - minPos)
        const value = Math.exp(minValue + scale * (position - minPos))
        return value
      }

      public static linearToDecibels = (value: number) => {
        if (value === 0) return -Infinity
        return 20 * Math.log10(value)
      }

      public static renderCumulativeFrames = (frameData: any) => {
        if (frameData.length === 0) {
          return frameData
        }
        const previous = document.createElement("canvas") as any
        const previousContext = previous.getContext("2d") as any
        const current = document.createElement("canvas") as any
        const currentContext = current.getContext("2d") as any
      
        const firstFrameCanvas = frameData[0].getImage()
      
        previous.width = firstFrameCanvas.width
        previous.height = firstFrameCanvas.height
        current.width = firstFrameCanvas.width
        current.height = firstFrameCanvas.height
      
        for (const frame of frameData) {
          previousContext.clearRect(0, 0, previous.width, previous.height)
          previousContext.drawImage(current, 0, 0)
      
          const canvas = frame.getImage()
          const context = canvas.getContext("2d")
          currentContext.drawImage(canvas, 0, 0)
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(current, 0, 0)
      
          const {frameInfo} = frame
          const {disposal} = frameInfo
          if (disposal === 2) {
            currentContext.clearRect(frameInfo.x, frameInfo.y, frameInfo.width, frameInfo.height)
          } else if (disposal === 3) {
            currentContext.clearRect(0, 0, current.width, current.height)
            currentContext.drawImage(previous, 0, 0)
          }
          frame.getImage = () => canvas
        }
        return frameData
      }

    private static parseTransparentColor = (color: string) => {
        return Number(`0x${color.replace(/^#/, "")}`)
    }

    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks)))
        })
        return buffer
    }

    public static encodeGIF = async (frames: Buffer[], delays: number[], width: number, height: number, options?: {transparentColor?: string}) => {
        if (!options) options = {} as {transparentColor?: string}
        const gif = new GifEncoder(width, height, {highWaterMark: 5 * 1024 * 1024})
        gif.setQuality(10)
        gif.setRepeat(0)
        gif.writeHeader()
        if (options?.transparentColor) gif.setTransparent(Functions.parseTransparentColor(options.transparentColor))
        let counter = 0

        const addToGif = async (frames: Buffer[]) => {
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
        return Functions.streamToBuffer(gif as NodeJS.ReadableStream)
    }

    public static noteFactor = (scaleFactor: number) => {
        if (scaleFactor === 1) return 0
        if (scaleFactor < 1) {
            return Math.round(-1 * ((1 / scaleFactor) * 600))
        } else {
            return Math.round(scaleFactor * 600)
        }
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
                        source.detune.value = -Functions.noteFactor(speed)
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

    public static getImagePath = (folder: string, postID: number, order: number, filename: string) => {
        return `${folder}/${postID}-${order}-${filename}`
    }

    public static getImageHistoryPath = (postID: number, key: number, filename: string) => {
        return `history/post/${postID}/${key}/${filename}`
    }

    public static getImageLink = (folder: string, postID: number, order: number, filename: string) => {
        if (!filename) return ""
        if (!folder || filename.includes("history/")) return `${window.location.protocol}//${window.location.host}/${filename}`
        return `${window.location.protocol}//${window.location.host}/${folder}/${postID}-${order}-${encodeURIComponent(filename)}`
    }

    public static linkToBase64 = async (link: string) => {
        const arrayBuffer = await axios.get(link, {responseType: "arraybuffer"}).then((r) => r.data) as ArrayBuffer
        const buffer = Buffer.from(arrayBuffer)
        return `data:image/jpeg;base64,${buffer.toString("base64")}`
    }

    public static getUnverifiedImageLink = (folder: string, postID: number, order: number, filename: string) => {
        if (!filename) return ""
        return `${window.location.protocol}//${window.location.host}/unverified/${folder}/${postID}-${order}-${encodeURIComponent(filename)}`
    }

    public static getThumbnailLink = (folder: string, postID: number, order: number, filename: string, sizeType: string) => {
        if (!filename) return ""
        if (folder !== "image" && folder !== "comic") return Functions.getImageLink(folder, postID, order, filename)
        let size = 265
        if (sizeType === "tiny") size = 350
        if (sizeType === "small") size = 400
        if (sizeType === "medium") size = 600
        if (sizeType === "large") size = 800
        if (sizeType === "massive") size = 1000
        return `${window.location.protocol}//${window.location.host}/thumbnail/${size}/${folder}/${postID}-${order}-${encodeURIComponent(filename)}`
    }

    public static getUnverifiedThumbnailLink = (folder: string, postID: number, order: number, filename: string, sizeType: string) => {
        if (!filename) return ""
        if (folder !== "image" && folder !== "comic") return Functions.getUnverifiedImageLink(folder, postID, order, filename)
        let size = 265
        if (sizeType === "tiny") size = 350
        if (sizeType === "small") size = 400
        if (sizeType === "medium") size = 600
        if (sizeType === "large") size = 800
        if (sizeType === "massive") size = 1000
        return `${window.location.protocol}//${window.location.host}/thumbnail/${size}/unverified/${folder}/${postID}-${order}-${encodeURIComponent(filename)}`
    }

    public static getTagPath = (folder: string, filename: string) => {
        if (folder === "attribute") folder = "tag"
        return `${folder}/${filename}`
    }

    public static getTagHistoryPath = (tag: string, key: number, filename: string) => {
        return `history/tag/${tag}/${key}/${filename}`
    }

    public static getTagLink = (folder: string, filename: string) => {
        if (!filename) return ""
        if (folder === "attribute") folder = "tag"
        if (!folder || filename.includes("history/")) return `${window.location.protocol}//${window.location.host}/${filename}`
        return `${window.location.protocol}//${window.location.host}/${folder}/${encodeURIComponent(filename)}`
    }

    public static getUnverifiedTagLink = (folder: string, filename: string) => {
        if (!filename) return ""
        if (folder === "attribute") folder = "tag"
        return `${window.location.protocol}//${window.location.host}/unverified/${folder}/${encodeURIComponent(filename)}`
    }

    public static formatDate(date: Date, yearFirst?: boolean) {
        if (!date) return ""
        let year = date.getFullYear()
        let month = (1 + date.getMonth()).toString()
        let day = date.getDate().toString()
        if (yearFirst) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        return `${month}-${day}-${year}`
    }

    public static prettyDate = (inputDate: Date) => {
        const monthNames = [
          "January", "February", "March",
          "April", "May", "June", "July",
          "August", "September", "October",
          "November", "December"
        ]
        const date = new Date(inputDate)
        const day = date.getDate()
        const monthIndex = date.getMonth()
        const year = date.getFullYear()

        return `${monthNames[monthIndex]} ${day}, ${year}`
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

    public static videoThumbnail = (link: string) => {
        return new Promise<string>((resolve) => {
            const video = document.createElement("video")
            video.src = link 
            video.addEventListener("loadeddata", (event) => {
                video.currentTime = 0.001
            })
            video.addEventListener("seeked", () => {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d") as any
                canvas.width = video.videoWidth 
                canvas.height = video.videoHeight
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL())
            })
            video.load()
        })
    }

    public static base64ToBuffer = (base64: string) => {
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)!
        return Buffer.from(matches[2], "base64")
    }

    public static base64toUint8Array = async (base64: string) => {
        return fetch(base64).then((r) => r.arrayBuffer()).then((a) => new Uint8Array(a))
    }

    public static validType = (type: string, all?: boolean) => {
        if (all) if (type === "all") return true
        if (type === "image" ||
            type === "animation" ||
            type === "video" ||
            type === "comic" ||
            type === "audio" ||
            type === "model") return true 
        return false
    }
      
    public static validRestrict = (restrict: string, all?: boolean) => {
        if (all) if (restrict === "all") return true
        if (restrict === "safe" ||
            restrict === "questionable" ||
            restrict === "explicit") return true 
        return false
    }
      
    public static validStyle = (style: string, all?: boolean) => {
        if (all) if (style === "all") return true
        if (style === "2d" ||
            style === "3d" ||
            style === "pixel" ||
            style === "chibi") return true 
        return false
    }

    public static validSort = (sort: string) => {
        if (sort === "date" ||
            sort === "reverse date" ||
            sort === "drawn" ||
            sort === "reverse drawn" || 
            sort === "cuteness" ||
            sort === "reverse cuteness" ||
            sort === "favorites" || 
            sort === "reverse favorites" ||
            sort === "tagcount" || 
            sort === "reverse tagcount" ||
            sort === "filesize" || 
            sort === "reverse filesize" ||
            sort === "bookmarks" || 
            sort === "reverse bookmarks") return true 
        return false
    }

    public static validCategorySort = (sort: string) => {
        if (sort === "cuteness" ||
            sort === "reverse cuteness" ||
            sort === "posts" ||
            sort === "reverse posts" || 
            sort === "alphabetic" ||
            sort === "reverse alphabetic") return true 
        return false
    }

    public static validTagSort = (sort: string) => {
        if (sort === "image" ||
            sort === "reverse image" ||
            sort === "aliases" ||
            sort === "reverse aliases" ||
            sort === "posts" ||
            sort === "reverse posts" || 
            sort === "alphabetic" ||
            sort === "reverse alphabetic") return true 
        return false
    }

    public static validTagType = (type: string) => {
        if (type === "all" ||
            type === "artist" ||
            type === "character" ||
            type === "series" ||
            type === "meta" ||
            type === "tag") return true 
        return false
    }

    public static validCommentSort = (sort: string) => {
        if (sort === "date" ||
            sort === "reverse date") return true 
        return false
    }

    public static validThreadSort = (sort: string) => {
        if (sort === "date" ||
            sort === "reverse date") return true 
        return false
    }

    public static multiTrim = (str: string) => {
        return str.replace(/^\s+/gm, "").replace(/\s+$/gm, "").replace(/newline/g, " ")
    }

    public static linkExists = async (link: string) => {
        const response = await fetch(link, {method: "HEAD"}).then((r) => r.status)
        return response !== 404
    }

    public static parseTags = async (posts: any, noDefault?: boolean) => {
        let cleanPosts = posts.filter((p: any) => !p.fake)
        const postIDs = cleanPosts.map((post: any) => post.postID)
        let result = await axios.post("/api/search/sidebartags", {postIDs}, {withCredentials: true}).then((r) => r.data).catch(() => null)
        return result ? result : []
    }

    public static parseTagsUnverified = async (posts: any) => {
        let result = [] as any
        for (let i = 0; i < posts.length; i++) {
            for (let j = 0; j < posts[i].tags.length; j++) {
                result.push({tag: posts[i].tags[j], count: 1})
            }
        }
        return result
    }

    public static tagCategories = async (parsedTags: any[], cache?: boolean) => {
        let result = cache ? await Functions.tagsCache() : await axios.get("/api/tag/list", {params: {tags: parsedTags.map((t: any) => t.tag)}, withCredentials: true}).then((r) => r.data)
        let artists = [] as any 
        let characters = [] as any 
        let series = [] as any 
        let tags = [] as any
        for (let i = 0; i < parsedTags.length; i++) {
            const index = result.findIndex((r: any) => parsedTags[i].tag === r.tag)
            if (index === -1) {
                const unverifiedTag = await axios.get("/api/tag/unverified", {params: {tag: parsedTags[i].tag}, withCredentials: true}).then((r) => r.data)
                if (unverifiedTag) {
                    const obj = {} as any 
                    obj.tag = parsedTags[i].tag 
                    obj.count = parsedTags[i].count 
                    obj.image = unverifiedTag.image
                    obj.type = unverifiedTag.type
                    obj.description = unverifiedTag.description 
                    obj.pixiv = unverifiedTag.pixiv
                    obj.twitter = unverifiedTag.twitter
                    obj.website = unverifiedTag.website
                    obj.fandom = unverifiedTag.fandom
                    if (unverifiedTag.type === "artist") {
                        artists.push(obj)
                    } else if (unverifiedTag.type === "character") {
                        characters.push(obj)
                    } else if (unverifiedTag.type === "series") {
                        series.push(obj)
                    } else {
                        tags.push(obj)
                    }
                }
                continue
            }
            const obj = {} as any 
            obj.tag = parsedTags[i].tag 
            obj.count = parsedTags[i].count
            obj.type = result[index].type
            obj.image = result[index].image
            obj.description = result[index].description 
            obj.pixiv = result[index].pixiv
            obj.twitter = result[index].twitter
            obj.website = result[index].website
            obj.fandom = result[index].fandom
            if (result[index].type === "artist") {
                artists.push(obj)
            } else if (result[index].type === "character") {
                characters.push(obj)
            } else if (result[index].type === "series") {
                series.push(obj)
            } else {
                tags.push(obj)
            }
        }
        return {artists, characters, series, tags}
    }

    public static tagsCache = async () => {
        const cache = await localforage.getItem("tags")
        if (cache) {
            return JSON.parse(cache as any)
        } else {
            let tagList = await axios.get("/api/tag/list", {withCredentials: true}).then((r) => r.data)
            localforage.setItem("tags", JSON.stringify(tagList))
            return tagList
        }
    }

    public static clearCache = () => {
        localforage.removeItem("tags")
        localforage.removeItem("unverifiedTags")
    }

    public static readableFileSize = (bytes: number) => {
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Number((bytes / Math.pow(1024, i)).toFixed(2))} ${["B", "KB", "MB", "GB", "TB"][i]}`
    }

    public static imageDimensions = async (image: string) => {
        return new Promise<any>(async (resolve) => {
            if (Functions.isVideo(image)) {
                const video = document.createElement("video")
                video.addEventListener("loadedmetadata", async () => {
                    let width = video.videoWidth 
                    let height = video.videoHeight
                    try {
                        const r = await fetch(image).then(((r) => r.arrayBuffer()))
                        const size = r.byteLength // Number(r.headers.get("Content-Length"))
                        resolve({width, height, size})
                    } catch {
                        resolve({width, height, size: 0})
                    }
                })
                video.src = image
            } else {
                let imageLink = Functions.isImage(image) ? await cryptoFunctions.decryptedLink(image) : image
                const img = document.createElement("img")
                img.addEventListener("load", async () => {
                    let width = img.width
                    let height = img.height
                    try {
                        const r = await fetch(imageLink).then((r) => r.arrayBuffer())
                        const size = r.byteLength // Number(r.headers.get("Content-Length"))
                        resolve({width, height, size})
                    } catch {
                        resolve({width, height, size: 0})
                    }
                })
                img.src = imageLink
            }
        })
    }

    public static readablePolycount = (polycount: number) => {
        const i = polycount === 0 ? 0 : Math.floor(Math.log(polycount) / Math.log(1000))
        return `${Number((polycount / Math.pow(1000, i)).toFixed(2))} ${["P", "KP", "MP", "GP", "TP"][i]}`
    }

    public static modelDimensions = async (model: string) => {
        const scene = new THREE.Scene()
        const renderer = new THREE.WebGLRenderer()

        let object = null as unknown as THREE.Object3D
        if (Functions.isGLTF(model)) {
            const loader = new GLTFLoader()
            object = await loader.loadAsync(model).then((l) => l.scene)
        } else if (Functions.isOBJ(model)) {
            const loader = new OBJLoader()
            object = await loader.loadAsync(model)
        } else if (Functions.isFBX(model)) {
            const loader = new FBXLoader()
            object = await loader.loadAsync(model)
        }
        scene.add(object)
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        renderer.render(scene, camera)
        const polycount = renderer.info.render.triangles
        const r = await fetch(model).then((r) => r.arrayBuffer())
        const size = r.byteLength
        return {polycount, size}
    }

    public static modelImage = async (model: string, imageSize?: number) => {
        if (!imageSize) imageSize = 350
        const width = imageSize
        const height = imageSize
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const light = new THREE.AmbientLight(0xffffff, 1)
        scene.add(light)
        
        const renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true})
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)

        let object = null as unknown as THREE.Object3D
        if (Functions.isGLTF(model)) {
            const loader = new GLTFLoader()
            object = await loader.loadAsync(model).then((l) => l.scene)
        } else if (Functions.isOBJ(model)) {
            const loader = new OBJLoader()
            object = await loader.loadAsync(model)
        } else if (Functions.isFBX(model)) {
            const loader = new FBXLoader()
            object = await loader.loadAsync(model)
        }
        scene.add(object)

        const box = new THREE.Box3().setFromObject(object)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())

        object.position.x += (object.position.x - center.x)
        object.position.y += (object.position.y - center.y)
        object.position.z += (object.position.z - center.z)

        camera.near = size / 100
        camera.far = size * 100
        camera.updateProjectionMatrix()

        camera.position.copy(center)
        camera.position.x += size / 2.0
        camera.position.y += size / 3.0
        camera.position.z += size / 2.0
        camera.lookAt(center)

        renderer.render(scene, camera)

        const animate = async () => {
            let id = window.requestAnimationFrame(animate)
            await Functions.timeout(500)
            renderer.setClearColor(0x000000, 1)
            renderer.render(scene, camera)
            window.cancelAnimationFrame(id)
            return renderer.domElement.toDataURL()
        }

        return animate()
    }

    
    public static audioDimensions = async (audio: string) => {
        const buffer = await fetch(audio).then((r) => r.arrayBuffer())
        const tagInfo = await mm.parseBuffer(new Uint8Array(buffer))
        const duration = tagInfo.format.duration || 0
        const size = buffer.byteLength
        return {duration, size}
    }

    public static songCover = async (audio: string) => {
        const buffer = await fetch(audio).then((r) => r.arrayBuffer())
        const tagInfo = await mm.parseBuffer(new Uint8Array(buffer))
        const picture = tagInfo.common.picture
        if (picture) {
            let buffer = new Uint8Array() as Buffer
            for (let i = 0; i < picture.length; i++) {
                buffer = Buffer.concat([buffer, picture[i].data])
            }
            return `data:${picture[0].format};base64,${buffer.toString("base64")}`
        } else {
            return ""
        }
    }

    public static imageSearch = async (file: File) => {
        const fileReader = new FileReader()
        return new Promise<any>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0] || {}
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const webp = result?.mime === "image/webp"
                const gif = result?.mime === "image/gif"
                const mp4 = result?.mime === "video/mp4"
                const mp3 = result?.mime === "audio/mpeg"
                const wav = result?.mime === "audio/x-wav"
                const glb = Functions.isGLTF(file.name)
                const fbx = Functions.isFBX(file.name)
                const obj = Functions.isOBJ(file.name)
                if (glb) result.typename = "glb"
                if (fbx) result.typename = "fbx"
                if (obj) result.typename = "obj"
                const webm = (path.extname(file.name) === ".webm" && result?.typename === "mkv")
                if (jpg || png || webp || gif || mp4 || webm || mp3 || wav || glb || fbx || obj) {
                    if (mp4 || webm) {
                        const url = URL.createObjectURL(file)
                        const thumbnail = await Functions.videoThumbnail(url)
                        bytes = await Functions.base64toUint8Array(thumbnail)
                    }
                    const similar = await axios.post("/api/search/similar", {bytes: Object.values(bytes), type: result.typename}, {withCredentials: true}).then((r) => r.data)
                    resolve(similar)
                }
            }
            fileReader.readAsArrayBuffer(file)
        })
    }

    public static createImage = async (image: string) => {
        const img = new Image()
        img.src = image
        return new Promise<HTMLImageElement>((resolve) => {
            img.onload = () => resolve(img)
        })
    }

    public static crop = async (url: string, aspectRatio: number, buffer?: boolean) => {
        return new Promise<any>((resolve) => {
            const inputImage = new Image()
            inputImage.onload = () => {
                const inputWidth = inputImage.naturalWidth
                const inputHeight = inputImage.naturalHeight
                const inputImageAspectRatio = inputWidth / inputHeight
                let outputWidth = inputWidth
                let outputHeight = inputHeight
                if (inputImageAspectRatio > aspectRatio) {
                    outputWidth = inputHeight * aspectRatio
                } else if (inputImageAspectRatio < aspectRatio) {
                    outputHeight = inputWidth / aspectRatio
                }

                const outputX = (outputWidth - inputWidth) * 0.5
                const outputY = (outputHeight - inputHeight) * 0.5

                const outputImage = document.createElement("canvas")
                outputImage.width = 1000
                outputImage.height = 1000
    
                const ctx = outputImage.getContext("2d") as any
                ctx.drawImage(inputImage, outputX, outputY, outputImage.width, outputImage.height)
                if (buffer) {
                    const img = ctx.getImageData(0, 0, outputImage.width, outputImage.height)
                    resolve(img.data.buffer)
                } else {
                    resolve(outputImage.toDataURL("image/jpeg"))
                }
            }
            inputImage.src = url
        })
    }

    public static arrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => {
        return `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`
    }

    public static timeAgo = (input: string) => {
        const date = new Date(input.replace(/ +/g, "T"))
        const seconds = Math.floor(((new Date().getTime() / 1000) - (date.getTime() / 1000)))
        const years = seconds / 31536000
        if (years > 1) {
            const rounded = Math.floor(years)
            return `${rounded} year${rounded === 1 ? "" : "s"} ago`
        }
        const months = seconds / 2592000
        if (months > 1) {
            const rounded = Math.floor(months)
            return `${rounded} month${rounded === 1 ? "" : "s"} ago`
        }
        const days = seconds / 86400
        if (days > 1) {
            const rounded = Math.floor(days)
            return `${rounded} day${rounded === 1 ? "" : "s"} ago`
        }
        const hours = seconds / 3600
        if (hours > 1) {
            const rounded = Math.floor(hours)
            return `${rounded} hour${rounded === 1 ? "" : "s"} ago`
        }
        const minutes = seconds / 60
        if (minutes > 1) {
            const rounded = Math.floor(minutes)
            return `${rounded} minute${rounded === 1 ? "" : "s"} ago`
        }
        const rounded = Math.floor(seconds)
        return `${rounded} second${rounded === 1 ? "" : "s"} ago`
    }

    public static fileExtension = (uint8Array: Uint8Array) => {
        const result = fileType(uint8Array)?.[0]
        return result?.extension || ""
    }

    public static permutations(query: string) {
        const sliced = query.split(/ +/g)
        
        function* iterRecur(sliced: string[]) {
            if (sliced.length == 1) return yield sliced;
            for (const result of iterRecur(sliced.slice(1))) {
                yield [sliced[0] + "-" + result[0], ...result.slice(1)]
                yield [sliced[0], ...result]
            }
        }
        return [...iterRecur(sliced)]
    }

    public static indexOfMax = (arr: number[]) => {
        if (arr.length === 0) return -1
        let max = arr[0]
        let maxIndex = 0
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                maxIndex = i
                max = arr[i]
            }
        }
        return maxIndex
    }

    public static parseSpaceEnabledSearch = async (query: string) => {
        if (!query) return query
        if (query.split(/ +/g).length > 10) return query
        let savedTags = await Functions.tagsCache()
        let permutations = Functions.permutations(query)
        let matchesArray = new Array(permutations.length).fill(0)
        let specialFlagsArray = new Array(permutations.length).fill("")
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < permutations[i].length; j++) {
                if (permutations[i][j]?.startsWith("+")) {
                    specialFlagsArray[j] = "+"
                    permutations[i][j] = permutations[i][j].replace("+", "")
                }
                if (permutations[i][j]?.startsWith("-")) {
                    specialFlagsArray[j] = "-"
                    permutations[i][j] = permutations[i][j].replace("-", "")
                }
                const exists = savedTags.find((t: any) => t.tag === permutations[i][j])
                if (exists) matchesArray[i]++
            }
        }
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < permutations[i].length; j++) {
                for (let k = 0; k < savedTags.length; k++) {
                    const exists = savedTags[k].aliases.find((a: any) => a?.alias === permutations[i][j])
                    if (exists) matchesArray[i]++
                }
            }
        }
        const index = Functions.indexOfMax(matchesArray)
        if (index !== -1 && matchesArray[index] !== 0) {
            let queries = [] as any 
            for (let j = 0; j < permutations[index].length; j++) {
                queries.push(`${specialFlagsArray[j]}${permutations[index][j]}`)
            }
            return queries.join(" ")
        }
        return query
    }

    public static insertNodeAtCaret(node: any) {
        var selection = window.getSelection()!
        if (selection.rangeCount) {
            var range = selection.getRangeAt(0)
            range.collapse(false)
            range.insertNode(node)
            range = range.cloneRange()
            range.selectNodeContents(node)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
        }
    }

    public static rangeRect = (range: Range, ref: any) => {
        let rect = range.getBoundingClientRect()
        if (range.collapsed && rect.top === 0 && rect.left === 0) {
          let node = document.createTextNode("\ufeff")
          range.insertNode(node)
          rect = range.getBoundingClientRect()
          node.remove()
        }
        return rect
    }

    public static stripTags = (posts: any) => {
        for (let i = 0; i < posts.length; i++) {
            delete posts[i].tags
        }
        return posts
    }

    public static blockedTags = () => {
        return ["rating", "girl", "boy", "chibi", "pixel-art", "comic", "tress-ribbon", "no-hat", "ribbon-trimmed-sleeves",
        "hair-between-eyes", "solo", "looking-at-viewer", "eyebrows-visible-through-hair", "one-side-up", "tareme", "caustics",
        "kemonomimi-mode", "cowboy-shot", "underwear", "depth-of-field", "holding", "bangs", "short-sleeves", "hair-tubes",
        "v-shaped-eyebrows", "v-arms", "v-over-eye", "pixiv-id", "long-sleeves", "frills", "collarbone", "midriff", "argyle",
        "bangs", "ahoge", "two-side-up", "sleeves-past-wrists", "sleeves-past-fingers", "legwear", "serafuku", "copyright", 
        "hand-on-another", "^^^", "+ +", "2021", "1other", "vision-(genshin-impact)", "jumpy-dumpty", "pom-pom-(clothes)",
        "boo-tao-(genshin-impact)", "baron-bunny-(genshin-impact)", "lily-(flower)", "abyss-mage-(genshin-impact)",
        "crystalfly-(genshin-impact)"]
    }

    public static tagReplaceMap = () => {
        return {
            "-(symbol)": "",
            "-(sky)": "",
            "-(object)": "",
            "-(medium)": "",
            "-(machine)": "",
            "transparent-background": "transparent",
            "background": "bg",
            "headwear": "hat",
            "pantyhose": "leggings",
            "neckerchief": "necktie",
            "hand-on-own": "hand-on",
            "hand-in-own": "hand-on",
            "x-hair-ornament": "hair-ornament",
            "dodoco-(genshin-impact)": "dodoco",
            "gabriel-tenma-white": "gabriel-(gabriel-dropout)",
            "kanna-kamui": "kanna-kamui-(dragon-maid)",
            "tedeza-rize": "rize-tedeza-(is-the-order-a-rabbit)",
            "hakurei-reimu": "reimu-hakurei-(touhou)",
            "kirima-sharo": "sharo-kirima-(is-the-order-a-rabbit)",
            "kirima-syaro": "sharo-kirima-(is-the-order-a-rabbit)",
            "ujimatsu-chiya": "chiya-ujimatsu-(is-the-order-a-rabbit)",
            "flandre-scarlet": "flandre-scarlet-(touhou)",
            "llenn-(sao)": "llenn-(sword-art-online)",
            "slime-(genshin-impact)": "slime",
            "tippy-(gochiusa)": "tippy",
            "doma-umaru": "umaru-doma-(himouto-umaru-chan)",
            "firo-(tate-no-yuusha-no-nariagari)": "filo-(shield-hero)",
            "tate-no-yuusha-no-nariagari": "shield-hero",
            "raphtalia": "raphtalia-(shield-hero)",
            "satanichia-kurumizawa-mcdowell": "satania-(gabriel-dropout)",
            "tapris-chisaki-sugarbell": "tapris-(gabriel-dropout)",
            "platelet-(hataraku-saibou)": "platelet-(cells-at-work)",
            "megumin": "megumin-(konosuba)",
            "tohru-(maidragon)": "tohru-(dragon-maid)",
            "fhilippe124": "fhilippe",
            "setoman": "setmen",
            "aruka@2nichimehigashishi-20a": "aruka",
            "arlenetachibana": "arlene",
            "ratsuchi": "racchi",
            "sakuraani": "sakura-ani",
            "shibainu-niki": "shibainuniki",
            "kusakashi": "yukki",
            "捺": "natsu",
            "tsubasatsubasa": "tsubasa",
            "mitsumurazaja": "mimurazaja",
            "zaja": "mimurazaja",
            "nogitakayoshimi": "nogi-takayoshi",
            "kyūkon": "usanagi",
            "azumiichiju": "kazukiadumi",
            "2drr/diru@fanbox": "2drr",
            "fujichoko(fujiwara)": "fuzichoco",
            "naruyashin@skebboshūchū": "naruyashin",
            "nanamiyarin@oshigotoboshūchū": "bitter-crown"
        }
    }

    public static cleanTag = (tag: string) => {
        return tag.normalize("NFD").replace(/[^a-z0-9_\-()><&!#@]/gi, "").replaceAll("_", "-")
    }

    public static render = (image: HTMLImageElement, brightness: number, contrast: number,
        hue: number, saturation: number, lightness: number, blur: number, sharpen: number, pixelate: number) => {
        const canvas = document.createElement("canvas") as HTMLCanvasElement
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext("2d") as any
        let newContrast = contrast
        ctx.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        if (pixelate !== 1) {
            const pixelateCanvas = document.createElement("canvas")
            const pixelWidth = image.width / pixelate 
            const pixelHeight = image.height / pixelate
            pixelateCanvas.width = pixelWidth 
            pixelateCanvas.height = pixelHeight
            const pixelateCtx = pixelateCanvas.getContext("2d") as any
            pixelateCtx.imageSmoothingEnabled = false
            pixelateCtx.drawImage(image, 0, 0, pixelWidth, pixelHeight)
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(pixelateCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (sharpen !== 0) {
            const sharpnessCanvas = document.createElement("canvas")
            sharpnessCanvas.width = image.naturalWidth
            sharpnessCanvas.height = image.naturalHeight
            const sharpnessCtx = sharpnessCanvas.getContext("2d")
            sharpnessCtx?.drawImage(image, 0, 0, sharpnessCanvas.width, sharpnessCanvas.height)
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            const filter = `blur(4px) invert(1) contrast(75%)`
            ctx.filter = filter 
            ctx.globalAlpha = sharpenOpacity
            ctx.globalCompositeOperation = "overlay"
            ctx.drawImage(sharpnessCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (lightness !== 100) {
            const lightnessCanvas = document.createElement("canvas")
            lightnessCanvas.width = image.naturalWidth
            lightnessCanvas.height = image.naturalHeight
            const lightnessCtx = lightnessCanvas.getContext("2d")
            lightnessCtx?.drawImage(image, 0, 0, lightnessCanvas.width, lightnessCanvas.height)
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            ctx.filter = filter
            ctx.globalAlpha = `${Math.abs((lightness - 100) / 100)}`
            ctx.drawImage(lightnessCanvas, 0, 0, canvas.width, canvas.height)
        }
        return canvas
    }

    public static titlebarHeight = () => {
        const titlebar = document.querySelector(".titlebar")
        if (!titlebar) return 70
        return titlebar.clientHeight
    }

    public static navbarHeight = () => {
        const navbar = document.querySelector(".navbar")
        if (!navbar) {
            const mobileNavbar = document.querySelector(".mobile-navbar") as HTMLElement
            return mobileNavbar ? mobileNavbar.clientHeight : 32
        }
        return navbar.clientHeight
    }

    public static sortbarHeight = () => {
        const sortbar = document.querySelector(".sortbar")
        if (!sortbar) return 40
        return sortbar.clientHeight
    }

    public static sidebarWidth = () => {
        const sidebar = document.querySelector(".sidebar")
        if (!sidebar) {
            const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
            return mobileSidebar ? 0 : 230
        }
        return sidebar.clientWidth
    }

    public static tagbannerHeight = () => {
        const tagbanner = document.querySelector(".tagbanner")
        return tagbanner ? tagbanner.clientHeight : 40
    }

    public static getFile = async (filepath: string) => {
        const blob = await axios.get(filepath, {responseType: "blob"}).then((r) => r.data)
        const name = path.basename(filepath).replace(".mp3", "").replace(".wav", "").replace(".flac", "").replace(".ogg", "")
        // @ts-ignore
        blob.lastModifiedDate = new Date()
        // @ts-ignore
        blob.name = name
        return blob as File
    }

    public static isLocalHost = () => {
        if (typeof window === "undefined") return process.env.TESTING === "yes"
        return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    }

    public static mirrorsJSON = (sourceMirrors: string) => {
        if (!sourceMirrors) return ""
        const mirrorsArr = sourceMirrors.split("\n")
        let json = {}
        for (const mirror of mirrorsArr) {
            if (mirror.includes("danbooru")) json["danbooru"] = mirror
            if (mirror.includes("gelbooru")) json["gelbooru"] = mirror
            if (mirror.includes("safebooru")) json["safebooru"] = mirror
            if (mirror.includes("yande.re")) json["yandere"] = mirror
            if (mirror.includes("konachan")) json["konachan"] = mirror
            if (mirror.includes("deviantart")) json["deviantart"] = mirror
            if (mirror.includes("artstation")) json["artstation"] = mirror
            if (mirror.includes("twitter") || mirror.includes("x.com")) json["twitter"] = mirror
        }
        return JSON.stringify(json) as any
    }

    public static shuffleArray = <T>(array: T[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    public static insertAtIndex = <T>(array: T[], index: number, item: any) => {
        return [...array.slice(0, index), item, ...array.slice(index + 1)]
    }

    public static serverPush = (route: string) => {
        window.location.href = route
    }

    public static rgbToHsl = (r: any, g: any, b: any) => {
        r /= 255;
        g /= 255;
        b /= 255;
        let cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;
        if (delta == 0)
            h = 0;
        // Red is max
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        // Green is max
        else if (cmax == g)
            h = (b - r) / delta + 2;
        // Blue is max
        else
            h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360;
        l = (cmax + cmin) / 2;
        // Calculate saturation
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));   
        // Multiply l and s by 100
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);
        return [h, s, l]
    }

    public static hslToRgb(h: any, s: any, l: any) {
        // Must be fractions of 1
        s /= 100.0;
        l /= 100.0;
        let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60.0) % 2 - 1)),
        m = l - c/2.0,
        r = 0,
        g = 0,
        b = 0;
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;  
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return [r, g, b]
    } 

    public static rgbToHex(r: any, g: any, b: any) {
        r = r.toString(16)
        g = g.toString(16)
        b = b.toString(16)
        if (r.length == 1)
          r = "0" + r
        if (g.length == 1)
          g = "0" + g
        if (b.length == 1)
          b = "0" + b
        return "#" + r + g + b
    }

    public static wrap = (num: number, min: number, max: number) => {
        let newNum = num 
        if (newNum < min) newNum += max 
        if (newNum > max) newNum -= min
        return newNum
    }

    public static mod = (num: number, mod: number) => {
        if (num === mod) return num 
        return num % mod
    }

    public static rotateColor = (color: string, hue: number, saturation: number, lightness: number) => {
        let hsl = [] as any
        let a = 1
        if (color.trim().startsWith("#")) {
            const rgb = hexToRgb(color) as any
            hsl = Functions.rgbToHsl(rgb[0], rgb[1], rgb[2])
        } else {
            const matches = color.match(/\d+(\.\d+)?/g)!
            hsl = Functions.rgbToHsl(Number(matches[0]), Number(matches[1]), Number(matches[2]))
            if (matches[3]) a = Number(matches[3])
        }
        const newH = Functions.mod(Functions.wrap(hsl[0] - 180 + hue, 0, 360), 360)
        const newS = Functions.mod(Functions.wrap(hsl[1] - 100 + saturation, 0 , 100), 100)
        const newL = Functions.mod(Functions.wrap(hsl[2] - 50 + lightness, 0, 100), 100)
        const newRGB = Functions.hslToRgb(newH, newS, newL)
        if (a < 1) {
            return `rgba(${newRGB[0]}, ${newRGB[1]}, ${newRGB[2]}, ${a})`
        } else {
            return Functions.rgbToHex(newRGB[0], newRGB[1], newRGB[2])
        }
    }

    public static tagType = (tag: string) => {
        const metaTags = ["autotags", "upscaled", "needs-tags", "no-audio", "with-audio", "self-post", "text", "transparent", 
        "commentary", "translated", "partially-translated", "check-translation"]
        if (metaTags.includes(tag)) return "meta"
        return "tag"
    }
}
