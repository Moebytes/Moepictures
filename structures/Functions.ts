import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import path from "path"
import commonPasswords from "../json/common-passwords.json"
import axios from "axios"
import MP4Demuxer from "./MP4Demuxer"
import audioEncoder from "audio-encoder"

let newScrollY = 0
let lastScrollTop = 0
let element = null as any
let inertia = false
let mouseDown = false

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"]
const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]

export default class Functions {
    public static proxyImage = async (link: string) => {
        try {
            const response = await fetch(`/api/proxy?url=${link}`).then((r) => r.arrayBuffer())
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
        return array.filter((a, b) => array.indexOf(a) === b)
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

    public static isImage = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, imageExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), imageExtensions)
    }

    public static isGIF = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".gif"
        }
        return path.extname(file) === ".gif"
    }

    public static isVideo = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, videoExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), videoExtensions)
    }

    public static isMP4 = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mp4"
        }
        return path.extname(file) === ".mp4"
    }

    public static timeout = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
    
    public static toProperCase = (str: string) => {
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

    public static passwordStrength = (password: string) => {
        let counter = 0
        if (/[a-z]/.test(password)) counter++
        if (/[A-Z]/.test(password)) counter++
        if (/[0-9]/.test(password)) counter++
        if (!/^[a-zA-Z0-9]+$/.test(password)) counter++
        if (password.length < 10 || counter < 4) return "weak"
        if (password.length < 15) return "decent"
        return "strong"
    }

    public static validatePassword = (username: string, password: string) => {
        if (password.toLowerCase().includes(username.toLowerCase())) return "Password should not contain username"
        if (commonPasswords.includes(password)) return "Password is too common"
        if (/ +/.test(password)) return "Password should not contain spaces"
        if (password.length < 10) return "Password must be at least 10 characters"
        const strength = Functions.passwordStrength(password)
        if (strength === "weak") {
            return "Password should satisfy at least 3 of these rules:\n" +
            "-Should contain lowercase letters\n" +
            "-Should contain uppercase letters\n" +
            "-Should contain numbers\n" +
            "-Should contain special characters"
        }
        return null
    }

    public static validateEmail = (email: string) => {
        const regex = /^[a-zA-Z0-9.!#$%&"*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        return regex.test(email)
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
            link.href = "/assets/purple/favicon.png"
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
        return (window.innerHeight + window.scrollY + 2 >= c[0])
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

    public static extractVideoFrames = async (video: HTMLVideoElement) => {
        // @ts-ignore
        const [track] = video.captureStream().getVideoTracks()
        // @ts-ignore
        const processor = new MediaStreamTrackProcessor({track})
        const reader = processor.readable.getReader()
        
        let frames = [] as any
        async function read() {
            const {value, done} = await reader.read()
            console.log(frames.length)
            if (done || !value) return
            const bitmap = await createImageBitmap(value)
            frames.push(bitmap)
            value.close()
            await read()
         }
        await read()
        return frames
    }

    public static extractMP4Frames = async (videoFile: string, duration: number) => {
        let minFrames = duration * 12
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
                        if (frames.length < minFrames) return 
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

    public static getImagePath = (folder: string, postID: number, filename: string) => {
        return path.join(__dirname, `../media/${folder}s/${postID}/${filename}`)
    }

    public static getImageLink = (folder: string, postID: number, filename: string) => {
        return `${window.location.protocol}//${window.location.host}/${folder}s/${postID}/${encodeURIComponent(filename)}`
    }

    public static getTagPath = (folder: string, filename: string) => {
        return path.join(__dirname, `../media/${folder}/${filename}`)
    }

    public static formatDate(date: Date) {
        let year = date.getFullYear()
        let month = (1 + date.getMonth()).toString().padStart(2, "0")
        let day = date.getDate().toString().padStart(2, "0")
        return `${year}-${month}-${day}`
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
            type === "comic") return true 
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
            sort === "reverse cuteness") return true 
        return false
    }

    public static multiTrim = (str: string) => {
        return str.replace(/^\s+/gm, "").replace(/\s+$/gm, "").replace(/newline/g, " ")
    }

    public static linkExists = async (link: string) => {
        const response = await fetch(link, {method: "HEAD"}).then((r) => r.status)
        return response !== 404
    }

    public static parseTags = async (posts: any) => {
        let uniqueTags = new Set()
        for (let i = 0; i < posts.length; i++) {
            for (let j = 0; j < posts[i].tags.length; j++) {
                uniqueTags.add(posts[i].tags[j])
            }
        }
        if (!uniqueTags.size) return []
        let result = await axios.get("/api/tags/count", {params: {tags: Array.from(uniqueTags)}}).then((r) => r.data)
        return result
    }
}