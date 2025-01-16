import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import path from "path"
import commonPasswords from "../assets/json/common-passwords.json"
import bannedUsernames from "../assets/json/banned-usernames.json"
import badWords from "../assets/json/bad-words.json"
import axios from "axios"
import {hexToRgb} from "./Color"
import MP4Demuxer from "./MP4Demuxer"
import audioEncoder from "audio-encoder"
import fileType from "magic-bytes.js"
import gibberish from "./Gibberish"
import gifFrames from "gif-frames"
import {JsWebm} from "jswebm"
import cryptoFunctions from "./CryptoFunctions"
import permissions from "./Permissions"
import localforage from "localforage"
import mm from "music-metadata"
import * as THREE from "three"
import * as PIXI from "pixi.js"
import WebPXMux from "webpxmux"
import ImageTracer from "imagetracerjs"
import {optimize} from "svgo"
import avifJS from "../assets/misc/avif_enc"
import jxlJS from "../assets/misc/jxl_enc"
import crypto from "crypto"
import JSZip from "jszip"
import enLocale from "../assets/locales/en.json"
import tempMails from "../assets/json/temp-email.json"
import {GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"
import {GetEndpoint, PostEndpoint, PutEndpoint, DeleteEndpoint, PostType, PostRating, PostStyle, PostSort, UploadImage,
CategorySort, MiniTag, TagSort, GroupSort, TagType, CommentSort, UserRole, TagCount, Post, PostChanges, PostFull, TagHistory,
PostOrdered, GroupPosts, GroupChanges, TagChanges, Tag, Note, Session, GIFFrame, UploadTag, PostSearch, UnverifiedPost,
PostHistory, PostSearchParams, SplatterOptions, PixelateOptions, CanvasDrawable} from "../types/Types"

let newScrollY = 0
let lastScrollTop = 0
let element = null as any
let inertia = false
let mouseDown = false

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"]
const videoExtensions = [".mp4", ".webm", ".mov", ".mkv"]
const audioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".aac"]
const modelExtensions = [".glb", ".gltf", ".obj", ".fbx"]
const live2dExtensions = [".zip"]

let cachedImages = new Map<string, string>()
let cachedResponses = new Map<string, {data: any, expires: number}>()
let cacheDuration = 60000

let privateKey = ""
let clientKeyLock = false
let serverPublicKey = ""
let serverKeyLock = false

export default class Functions {
    public static getImageCache = (cacheKey: string) => {
        return cachedImages.get(cacheKey) || ""
    }

    public static clearImageCache = () => {
        cachedImages.clear()
    }

    public static responseCached = <T extends string>(endpoint: T, params: GetEndpoint<T>["params"]) => {
        let cacheKey = `${endpoint}_${JSON.stringify(params)}`
        if ((params as PostSearchParams)?.sort !== "random") {
            const cachedResponse = cachedResponses.get(cacheKey)
            if (cachedResponse && Date.now() < cachedResponse.expires) {
                return true
            }
        }
        return false
    }

    public static clearResponseCache = () => {
        cachedResponses.clear()
    }

    public static clearResponseCacheKey = (endpoint: string) => {
        cachedResponses.forEach((value, key) => {
            if (key.startsWith(endpoint)) {
                cachedResponses.delete(key)
            }
        })
    }

    public static fetch = async (link: string, headers?: any) => {
        return axios.get(link, {headers}).then((r) => r.data) as Promise<any>
    }

    public static getBuffer = async (link: string, headers?: any) => {
        return axios.get(link, {responseType: "arraybuffer", withCredentials: true, headers}).then((r) => r.data) as Promise<Buffer>
    }

    public static noCacheURL = (image: string) => {
        const url = new URL(image)
        const roundedTime = Math.floor(Date.now() / 30000) * 30000
        url.searchParams.set("update", roundedTime.toString())
        return url.toString()
    }

    public static removeQueryParams = (image: string) => {
        const url = new URL(image)
        url.search = ""
        return url.toString()
    }

    public static updateClientKeys = async (session: Session, setSessionFlag?: (value: boolean) => void) => {
        if (privateKey) return
        if (clientKeyLock) await Functions.timeout(1000 + Math.random() * 1000)
        if (!privateKey) {
            clientKeyLock = true
            const savedPublicKey = await localforage.getItem("publicKey") as string
            const savedPrivateKey = await localforage.getItem("privateKey") as string
            if (savedPublicKey && savedPrivateKey) {
                await Functions.post("/api/client-key", {publicKey: savedPublicKey}, session, setSessionFlag)
                privateKey = savedPrivateKey
            } else {
                const keys = cryptoFunctions.generateKeys()
                await Functions.post("/api/client-key", {publicKey: keys.publicKey}, session, setSessionFlag)
                await localforage.setItem("publicKey", keys.publicKey)
                await localforage.setItem("privateKey", keys.privateKey)
                privateKey = keys.privateKey
            }
        }
    }

    public static updateServerPublicKey = async (session: Session, setSessionFlag?: (value: boolean) => void) => {
        if (serverPublicKey) return
        if (serverKeyLock) await Functions.timeout(1000 + Math.random() * 1000)
        if (!serverPublicKey) {
            serverKeyLock = true
            const response = await Functions.post("/api/server-key", null, session, setSessionFlag)
            serverPublicKey = response.publicKey
        }
    }

    public static arrayBufferToJSON = (arrayBuffer: ArrayBuffer) => {
        if (!arrayBuffer.byteLength) return undefined
        const text = new TextDecoder("utf-8").decode(arrayBuffer)
        try {
            const json = JSON.parse(text)
            return json
        } catch {
            return null
        }
    }

    public static get = async <T extends string>(endpoint: T, params: GetEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        if (!privateKey) await Functions.updateClientKeys(session)
        if (!serverPublicKey) await Functions.updateServerPublicKey(session)
        const headers = {"x-csrf-token": session.csrfToken}


        let cacheKey = `${endpoint}_${JSON.stringify(params)}`
        if ((params as PostSearchParams)?.sort !== "random") {
            let cachedResponse = cachedResponses.get(cacheKey)
            if (cachedResponse) {
                await Functions.timeout(30)
                cachedResponse = cachedResponses.get(cacheKey)
            }
            if (cachedResponse && Date.now() < cachedResponse.expires) {
                return cachedResponse.data as GetEndpoint<T>["response"]
            }
        }

        try {
            const response = await axios.get(endpoint, {params: params, headers, withCredentials: true, responseType: "arraybuffer"}).then((r) => r.data)
            const json = Functions.arrayBufferToJSON(response)
            if (json !== null) {
                cachedResponses.set(cacheKey, {data: json, expires: Date.now() + cacheDuration})
                return json as GetEndpoint<T>["response"]
            }
            let decrypted = cryptoFunctions.decryptAPI(response, privateKey, serverPublicKey, session)?.toString()
            try {
                decrypted = JSON.parse(decrypted!)
            } catch {}
            cachedResponses.set(cacheKey, {data: decrypted, expires: Date.now() + cacheDuration})
            return decrypted as GetEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static post = async <T extends string>(endpoint: T, data: PostEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"x-csrf-token": session.csrfToken}
        try {
            const response = await axios.post(endpoint, data as any, {headers, withCredentials: true}).then((r) => r.data)
            return response as PostEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static put = async <T extends string>(endpoint: T, data: PutEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"x-csrf-token": session.csrfToken}
        try {
            const response = await axios.put(endpoint, data as any, {headers, withCredentials: true}).then((r) => r.data)
            return response as PutEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static delete = async <T extends string>(endpoint: T, params: DeleteEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"x-csrf-token": session.csrfToken}
        try {
            const response = await axios.delete(endpoint, {params, headers, withCredentials: true}).then((r) => r.data)
            return response as DeleteEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }
    
    public static isSafari = () => {
        // @ts-ignore
        return /constructor/i.test(window.HTMLElement) || (function (p) {return p.toString() === "[object SafariRemoteNotification]" })(!window["safari"] || (typeof safari !== "undefined" && safari.pushNotification))
    }

    public static decodeEntities = (encodedString: string) => {
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
        return Functions.decodeEntities(str).replace(/<\/?[a-z][^>]*>/gi, "").replace(/\r?\n|\r/g, "")
    }
    
    public static proxyImage = async (link: string, session: Session, setSessionFlag: (value: boolean) => void) => {
        try {
            const images = await Functions.post(`/api/misc/proxy`, {url: encodeURIComponent(link)}, session, setSessionFlag)
            let files = [] as File[]
            for (let i = 0; i < images.length; i++) {
                const blob = new Blob([new Uint8Array(images[i].data)])
                const file = new File([blob], path.basename(link) + ".png")
                files.push(file)
            }
            return files
        } catch {
            const response = await fetch(link, {headers: {Referer: "https://www.pixiv.net/"}}).then((r) => r.arrayBuffer())
            const blob = new Blob([new Uint8Array(response)])
            const file = new File([blob], path.basename(link) + ".png")
            return [file]
        }
    }

    public static removeDuplicates = <T>(array: T[]) => {
        const set = new Set<string>()
        return array.filter(item => {
            const serialized = JSON.stringify(item)
            if (set.has(serialized)) {
                return false
            } else {
                set.add(serialized)
                return true
            }
        })
    }

    public static removeItem = <T>(array: T[], value: T) => {
        return array.filter((item) => JSON.stringify(item) !== JSON.stringify(value))
    }

    public static formatSeconds = (duration: number) => {
        let seconds = Math.floor(duration % 60)
        let minutes = Math.floor((duration / 60) % 60)
        let hours = Math.floor((duration / (60 * 60)) % 24)
        if (Number.isNaN(seconds) || seconds < 0) seconds = 0
        if (Number.isNaN(minutes) || minutes < 0) minutes = 0
        if (Number.isNaN(hours) || hours < 0) hours = 0

        const hoursStr = (hours === 0) ? "" : ((hours < 10) ? "0" + hours + ":" : hours + ":")
        const minutesStr = hours && (minutes < 10) ? "0" + minutes : minutes
        const secondsStr = (seconds < 10) ? "0" + seconds : seconds
        return `${hoursStr}${minutesStr}:${secondsStr}`
    }
    
    public static arrayIncludes = (str: string | undefined, arr: string[]) => {
        for (let i = 0; i < arr.length; i++) {
            if (str?.includes(arr[i])) return true
        }
        return false
    }

    public static isImage = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, imageExtensions)
        }
        if (file.startsWith("data:image")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return Functions.arrayIncludes(ext, imageExtensions)
    }

    public static isAudio = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, audioExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return Functions.arrayIncludes(ext, audioExtensions)
    }

    public static isModel = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, modelExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return Functions.arrayIncludes(ext, modelExtensions)
    }

    public static isLive2D = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, live2dExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return Functions.arrayIncludes(ext, live2dExtensions)
    }

    public static isLive2DZip = async (buffer: ArrayBuffer) => {
        try {
            const reader = new JSZip()
            const content = await reader.loadAsync(buffer)
            for (const filename in content.files) {
                if (filename.includes(".moc3")) return true
                if (filename.includes(".model3.json")) return true
            }
            return false
        } catch {
            return false
        }
    }

    public static isGIF = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".gif"
        }
        if (file?.startsWith("data:image/gif")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".gif"
    }

    public static isWebP = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webp"
        }
        if (file?.startsWith("data:image/webp")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".webp"
    }

    public static isGLTF = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".glb"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".glb"
    }

    public static isOBJ = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".obj"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".obj"
    }

    public static isFBX = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".fbx"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".fbx"
    }

    public static isAnimatedWebp = (buffer: ArrayBuffer) => {
        let str = ""
        const byteArray = new Uint8Array(buffer)
        for (let i = 0; i < byteArray.length; i++) {
            str += String.fromCharCode(byteArray[i])
        }
        return str.indexOf("ANMF") !== -1
    }

    public static isVideo = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, videoExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return Functions.arrayIncludes(ext, videoExtensions)
    }

    public static isMP4 = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mp4"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".mp4"
    }

    public static isWebM = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webm"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".webm"
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

    public static isProfane = (text: string) => {
        const words = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        for (const word of words) {
            for (const badWord of badWords) {
                if (atob(badWord).length <= word.length 
                && atob(badWord).includes(word.toLowerCase())) return true
            }
        }
        return false
    }

    public static validateUsername = (username: string, i18n: typeof enLocale) => {
        if (!username) return i18n.errors.username.empty
        const alphaNumeric = Functions.alphaNumeric(username)
        if (!alphaNumeric || /[\n\r\s]+/g.test(username)) return i18n.errors.username.alphanumeric
        if (Functions.isProfane(username)) return i18n.errors.username.profane
        if (bannedUsernames.includes(username.toLowerCase())) return i18n.errors.username.disallowed
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

    public static validatePassword = (username: string, password: string, i18n: typeof enLocale) => {
        if (!password) return i18n.errors.password.empty
        if (password.toLowerCase().includes(username.toLowerCase())) return i18n.errors.password.username
        if (commonPasswords.includes(password)) return i18n.errors.password.common
        if (/ +/.test(password)) return i18n.errors.password.spaces
        if (password.length < 10) return i18n.errors.password.length
        const strength = Functions.passwordStrength(password)
        if (strength === "weak") return i18n.errors.password.weak
        return null
    }

    public static validateEmail = (email: string, i18n: typeof enLocale) => {
        if (!email) return i18n.errors.email.empty
        const regex = /^[a-zA-Z0-9.!#$%&"*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        if (!regex.test(email)) return i18n.errors.email.invalid
        const domain = email.split("@")[1] || ""
        if (Functions.arrayIncludes(domain, tempMails)) return i18n.errors.email.invalid
        return null
    }

    public static parsePieces = (text: string) => {
        let segments = [] as string[]
        const pieces = text.split(/\n/gm)
        let intermediate = [] as string[]
        let codeBlock = false
        for (let i = 0; i < pieces.length; i++) {
            let piece = pieces[i] + "\n"
            if (piece.includes("```")) {
                codeBlock = !codeBlock
                if (!codeBlock) {
                    intermediate.push(piece)
                    piece = ""
                }
            }
            if (codeBlock || piece.startsWith(">>>") || piece.startsWith(">")) {
                if (codeBlock && !piece.includes("```")) piece += "\n"
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

    public static validateComment = (comment: string, i18n: typeof enLocale) => {
        if (!comment) return i18n.errors.comment.empty
        if (comment.length > 1000) return i18n.errors.comment.length
        const pieces = Functions.parsePieces(comment)
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.includes(">")) {
                const username = piece.match(/(>>>)(.*?)(?=$|>)/gm)?.[0].replace(">>>", "") ?? ""
                const text = piece.replace(username, "").replaceAll(">", "")
                if (!text && !username) continue
                if (gibberish(Functions.stripLinks(text))) return i18n.errors.comment.gibberish
            } else {
                if (gibberish(Functions.stripLinks(piece))) return i18n.errors.comment.gibberish
            }
        }
        if (Functions.isProfane(comment)) return i18n.errors.comment.profane
        return null
    }

    public static validateReply = (reply: string, i18n: typeof enLocale) => {
        if (!reply) return i18n.errors.reply.empty
        if (Functions.isProfane(reply)) return i18n.errors.reply.profane
        return null
    }

    public static validateMessage = (message: string, i18n: typeof enLocale) => {
        if (!message) return i18n.errors.message.empty
        const words = message.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        if (Functions.isProfane(message)) return i18n.errors.message.profane
        return null
    }

    public static validateTitle = (title: string, i18n: typeof enLocale) => {
        if (!title) return i18n.errors.title.empty
        const words = title.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        if (Functions.isProfane(title)) return i18n.errors.title.profane
        return null
    }

    public static validateThread = (thread: string, i18n: typeof enLocale) => {
        if (!thread) return i18n.errors.thread.empty
        const words = thread.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        if (Functions.isProfane(thread)) return i18n.errors.thread.profane
        return null
    }

    public static validateReason = (reason: string | null | undefined, i18n: typeof enLocale) => {
        if (!reason) return i18n.errors.reason.empty
        if (gibberish(reason)) return i18n.errors.reason.gibberish
        return null
    }

    public static validateBio = (bio: string, i18n: typeof enLocale) => {
        if (!bio) return i18n.errors.bio.empty
        if (gibberish(Functions.stripLinks(bio))) return i18n.errors.bio.gibberish
        if (Functions.isProfane(bio)) return i18n.errors.bio.profane
        return null
    }

    public static changeFavicon = (url: string) => {
        if (typeof window === "undefined") return
        let link = document.querySelector(`link[rel~="icon"]`) as HTMLLinkElement
        if (!link) {
            link = document.createElement("link")
            link.type = "image/x-icon"
            link.rel = "icon"
            document.getElementsByTagName("head")[0].appendChild(link)
        }
        if (link.href !== url) link.href = url
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
            const timeDiff = (new Date().getTime() - time)
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

    public static scrolledToTop = () => {
        return window.scrollY <= 140
    }

    public static scrolledToBottom = () => {
        const scrollHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.body.offsetHeight
        )
        return window.innerHeight + window.scrollY >= scrollHeight - 30
    }

    public static trimCanvas = (canvas: HTMLCanvasElement) => {
        const context = canvas.getContext("2d")!

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
        if (sizeType === "tiny") return 4
        if (sizeType === "small") return 3
        if (sizeType === "medium") return 2
        if (sizeType === "large") return 1
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

    public static calcDistance(elementOne: HTMLElement, elementTwo: HTMLElement) {
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
                result.push({frame: canvas, delay: decoded.image.duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractAnimatedWebpFrames = async (webpBuffer: ArrayBuffer, nativeOnly?: boolean) => {
        if ("ImageDecoder" in window) {
            return Functions.extractAnimatedWebpFramesNative(webpBuffer)
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
                result.push({frame: canvas, delay: decoded.image.duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractGIFFrames = async (gifBuffer: ArrayBuffer, nativeOnly?: boolean) => {
        if ("ImageDecoder" in window) {
            return Functions.extractGIFFramesNative(gifBuffer)
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

    private static parseTransparentColor = (color: string) => {
        return Number(`0x${color.replace(/^#/, "")}`)
    }

    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks as any)))
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

    public static getImagePath = (folder: string, postID: string, order: number, filename: string) => {
        return `${folder}/${postID}-${order}-${filename}`
    }

    public static getUpscaledImagePath = (folder: string, postID: string, order: number, filename: string) => {
        return `${folder}-upscaled/${postID}-${order}-${filename}`
    }

    public static getImageHistoryPath = (postID: string, key: number, order: number, filename: string) => {
        return `history/post/${postID}/original/${key}/${postID}-${order}-${filename}`
    }

    public static getUpscaledImageHistoryPath = (postID: string, key: number, order: number, filename: string) => {
        return `history/post/${postID}/upscaled/${key}/${postID}-${order}-${filename}`
    }

    public static getHistoryImageLink = (historyFile: string) => {
        return `${window.location.protocol}//${window.location.host}/${historyFile}`
    }

    public static getImageLink = (folder: string, postID: string, order: number, filename: string) => {
        if (!filename) return ""
        if (!folder || filename.includes("history/")) return Functions.getRawImageLink(filename)
        return `${window.location.protocol}//${window.location.host}/${folder}/${postID}-${order}-${encodeURIComponent(filename)}`
    }

    public static getRawImageLink = (filename: string) => {
        if (!filename) return ""
        return `${window.location.protocol}//${window.location.host}/${filename}`
    }

    public static linkToBase64 = async (link: string) => {
        const arrayBuffer = await axios.get(link, {responseType: "arraybuffer"}).then((r) => r.data) as ArrayBuffer
        if (!arrayBuffer.byteLength) return ""
        const buffer = Buffer.from(arrayBuffer)
        let mime = Functions.bufferFileType(buffer)[0]?.mime || "image/jpeg"
        return `data:${mime};base64,${buffer.toString("base64")}`
    }

    public static getUnverifiedImageLink = (folder: string, postID: string, order: number, filename: string) => {
        if (!filename) return ""
        return `${window.location.protocol}//${window.location.host}/unverified/${folder}/${postID}-${order}-${encodeURIComponent(filename)}`
    }

    public static getThumbnailLink = (folder: string, postID: string, order: number, filename: string, sizeType: string, mobile?: boolean) => {
        if (!filename) return ""
        let size = 265
        if (sizeType === "tiny") size = 350
        if (sizeType === "small") size = 400
        if (sizeType === "medium") size = 600
        if (sizeType === "large") size = 800
        if (sizeType === "massive") size = 1000
        if (mobile) size = Math.floor(size / 2)
        if (folder !== "image" && folder !== "comic" && folder !== "animation") {
            if (!folder || filename.includes("history/")) return Functions.getRawThumbnailLink(filename, sizeType, mobile)
            return Functions.getImageLink(folder, postID, order, filename)
        }
        return `${window.location.protocol}//${window.location.host}/thumbnail/${size}/${folder}/${postID}-${order}-${encodeURIComponent(filename)}`
    }

    public static getRawThumbnailLink = (filename: string, sizeType: string, mobile?: boolean) => {
        if (filename.startsWith(window.location.protocol)) return filename
        if (!filename) return ""
        let size = 265
        if (sizeType === "tiny") size = 350
        if (sizeType === "small") size = 400
        if (sizeType === "medium") size = 600
        if (sizeType === "large") size = 800
        if (sizeType === "massive") size = 1000
        if (mobile) size = Math.floor(size / 2)
        return `${window.location.protocol}//${window.location.host}/${`thumbnail/${size}/${filename}`}`
    }

    public static getUnverifiedThumbnailLink = (folder: string, postID: string, order: number, filename: string, sizeType: string) => {
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
        let dest = "tag"
        if (folder === "artist") dest = "artist"
        if (folder === "character") dest = "character"
        if (folder === "series") dest = "series"
        if (folder === "pfp") dest = "pfp"
        return `${dest}/${filename}`
    }

    public static getTagHistoryPath = (tag: string, key: number, filename: string) => {
        return `history/tag/${tag}/${key}/${filename}`
    }

    public static getTagLink = (folder: string, filename: string | null, hash: string | null) => {
        if (!filename) return ""
        let dest = "tag"
        if (folder === "artist") dest = "artist"
        if (folder === "character") dest = "character"
        if (folder === "series") dest = "series"
        if (folder === "pfp") dest = "pfp"
        if (!folder || filename.includes("history/")) return `${window.location.protocol}//${window.location.host}/${filename}`
        const link = `${window.location.protocol}//${window.location.host}/${dest}/${encodeURIComponent(filename)}`
        return hash ? `${link}?hash=${hash}` : link
    }

    public static getUnverifiedTagLink = (folder: string, filename: string | null) => {
        if (!filename) return ""
        let dest = "tag"
        if (folder === "artist") dest = "artist"
        if (folder === "character") dest = "character"
        if (folder === "series") dest = "series"
        if (folder === "pfp") dest = "pfp"
        return `${window.location.protocol}//${window.location.host}/unverified/${dest}/${encodeURIComponent(filename)}`
    }

    public static formatDate(date: Date, yearFirst?: boolean) {
        if (!date) return ""
        let year = date.getFullYear()
        let month = (1 + date.getMonth()).toString()
        let day = date.getDate().toString()
        if (yearFirst) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        return `${month}-${day}-${year}`
    }

    public static prettyDate = (inputDate: Date | string | null, i18n: typeof enLocale, noDay?: boolean) => {
        const monthNames = [
            i18n.time.january, i18n.time.february, i18n.time.march,
            i18n.time.april, i18n.time.may, i18n.time.june, i18n.time.july,
            i18n.time.august, i18n.time.september, i18n.time.october,
            i18n.time.november, i18n.time.december
        ]
        const date = new Date(inputDate || "")
        const day = `${date.getDate()}` + i18n.time.dayAppend
        const month = `${monthNames[date.getMonth()]}`
        const year = `${date.getFullYear()}` + i18n.time.yearAppend

        if (noDay) {
            if (i18n.time.comma) {
                return `${month} ${year}`
            } else {
                return `${year}${month}`
            }
        }

        if (i18n.time.comma) {
            return `${month} ${day}, ${year}`
        } else {
            return `${year}${month}${day}`
        }
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
                const ctx = canvas.getContext("2d")!
                canvas.width = video.videoWidth 
                canvas.height = video.videoHeight
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL())
            })
            video.load()
        })
    }

    public static base64ToBuffer = (base64: string) => {
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (!matches) return Buffer.from("")
        return Buffer.from(matches[2], "base64")
    }

    public static base64toUint8Array = async (base64: string) => {
        return fetch(base64).then((r) => r.arrayBuffer()).then((a) => new Uint8Array(a))
    }

    public static validType = (type: PostType, all?: boolean) => {
        if (all) if (type === "all") return true
        if (type === "image" ||
            type === "animation" ||
            type === "video" ||
            type === "comic" ||
            type === "audio" ||
            type === "model" ||
            type === "live2d") return true 
        return false
    }
      
    public static validRating = (rating: PostRating, all?: boolean) => {
        if (all) if (rating === "all") return true
        if (rating === "cute" ||
            rating === "sexy" ||
            rating === "ecchi" ||
            rating === "hentai") return true 
        return false
    }

    public static isR18 = (ratingType: PostRating) => {
        return ratingType === "hentai"
    }

    public static r18 = () => {
        return "hentai" as PostRating
    }

    public static r17 = () => {
        return "ecchi" as PostRating
    }

    public static r15 = () => {
        return "sexy" as PostRating
    }

    public static r13 = () => {
        return "cute" as PostRating
    }

    public static isSketch = (styleType: PostStyle) => {
        return styleType === "sketch" || styleType === "lineart"
    }
      
    public static validStyle = (style: PostStyle, all?: boolean) => {
        if (all) if (style === "all" || style === "all+s") return true
        if (style === "2d" ||
            style === "3d" ||
            style === "pixel" ||
            style === "chibi" ||
            style === "daki" ||
            style === "sketch" ||
            style === "lineart" ||
            style === "promo") return true 
        return false
    }

    public static parseSort = <T>(sortType: T, sortReverse: boolean) => {
        if (sortType === "random") return "random"
        if (sortReverse) {
            return `reverse ${sortType}` as T
        } else {
            return sortType as T
        }
    }

    public static validSort = (sort: PostSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date" ||
            sort === "posted" ||
            sort === "reverse posted" || 
            sort === "bookmarks" || 
            sort === "reverse bookmarks" ||
            sort === "favorites" || 
            sort === "reverse favorites" ||
            sort === "cuteness" ||
            sort === "reverse cuteness" ||
            sort === "variations" || 
            sort === "reverse variations" ||
            sort === "parent" || 
            sort === "reverse parent" ||
            sort === "child" || 
            sort === "reverse child" ||
            sort === "groups" || 
            sort === "reverse groups" ||
            sort === "popularity" || 
            sort === "reverse popularity" ||
            sort === "tagcount" || 
            sort === "reverse tagcount" ||
            sort === "filesize" || 
            sort === "reverse filesize" ||
            sort === "aspectRatio" || 
            sort === "reverse aspectRatio" ||
            sort === "hidden" || 
            sort === "reverse hidden" ||
            sort === "locked" || 
            sort === "reverse locked" ||
            sort === "private" || 
            sort === "reverse private") return true 
        return false
    }

    public static validCategorySort = (sort: CategorySort) => {
        if (sort === "random" ||
            sort === "cuteness" ||
            sort === "reverse cuteness" ||
            sort === "posts" ||
            sort === "reverse posts" || 
            sort === "alphabetic" ||
            sort === "reverse alphabetic") return true 
        return false
    }

    public static validTagSort = (sort: TagSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date" ||
            sort === "image" ||
            sort === "reverse image" ||
            sort === "aliases" ||
            sort === "reverse aliases" ||
            sort === "posts" ||
            sort === "reverse posts" || 
            sort === "alphabetic" ||
            sort === "reverse alphabetic" ||
            sort === "length" ||
            sort === "reverse length") return true 
        return false
    }

    public static validTagType = (type: TagType, noAll?: boolean) => {
        if (type === "all" && !noAll) return true
        if (type === "tags" && !noAll) return true
        if (type === "artist" ||
            type === "character" ||
            type === "series" ||
            type === "meta" ||
            type === "appearance" ||
            type === "outfit" ||
            type === "accessory" ||
            type === "action" ||
            type === "scenery" ||
            type === "tag") return true 
        return false
    }

    public static validCommentSort = (sort: CommentSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date") return true 
        return false
    }

    public static validGroupSort = (sort: GroupSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date" ||
            sort === "posts" ||
            sort === "reverse posts") return true 
        return false
    }

    public static validThreadSort = (sort: CommentSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date") return true 
        return false
    }

    public static validRole = (role: UserRole) => {
        if (role === "admin" ||
            role === "mod" ||
            role === "premium-curator" ||
            role === "curator" ||
            role === "premium-contributor" ||
            role === "contributor" ||
            role === "premium" ||
            role === "user") return true 
        return false
    }

    public static isDemotion = (oldRole: UserRole, newRole: UserRole) => {
        if (oldRole === newRole) return false
        let hierarchy = {
            "admin": 5,
            "mod": 4,
            "curator": 3,
            "contributor": 2,
            "user": 1
        }
        let premiumHierarchy = {
            "admin": 5,
            "mod": 4,
            "premium-curator": 3,
            "premium-contributor": 2,
            "premium": 1
        }
        if (oldRole.includes("premium")) {
            if (!newRole.includes("premium")) return true
            if (premiumHierarchy[oldRole] && premiumHierarchy[newRole]) {
                return premiumHierarchy[newRole] < premiumHierarchy[oldRole]
            }
        }
        if (hierarchy[oldRole] && hierarchy[newRole]) {
            return hierarchy[newRole] < hierarchy[oldRole]
        }
        return false
    }

    public static multiTrim = (str: string) => {
        return str.replace(/^\s+/gm, "").replace(/\s+$/gm, "").replace(/newline/g, " ")
    }

    public static linkExists = async (link: string) => {
        const response = await fetch(link, {method: "HEAD"}).then((r) => r.status)
        return response !== 404
    }

    public static parseTagsSingle = async (post: PostSearch, session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!post.tags) return Functions.parseTags([post], session, setSessionFlag)
        let tagMap = await Functions.tagsCache(session, setSessionFlag)
        let result = [] as Tag[]
        for (let i = 0; i < post.tags.length; i++) {
            const tag = post.tags[i]
            if (tagMap[tag]) result.push(tagMap[tag])
        }
        return result
    }

    public static parseTags = async (posts: PostFull[] | PostSearch[] | PostOrdered[] | Post[], session: Session, 
        setSessionFlag: (value: boolean) => void) => {
        let cleanPosts = posts.filter((p) => !(p as PostSearch).fake)
        const postIDs = cleanPosts.map((post) => post.postID)
        let result = await Functions.get("/api/search/sidebartags", {postIDs}, session, setSessionFlag).catch(() => null)
        return result ? result : []
    }

    public static parseTagsUnverified = async (posts: UnverifiedPost[]) => {
        let result = [] as TagCount[]
        for (let i = 0; i < posts.length; i++) {
            for (let j = 0; j < posts[i].tags.length; j++) {
                result.push({tag: posts[i].tags[j], count: "1", type: "tag", image: "", imageHash: ""})
            }
        }
        return result
    }

    public static tagCategories = async (parsedTags: string[] | TagCount[] | Tag[] | undefined, session: Session, 
        setSessionFlag: (value: boolean) => void, cache?: boolean) => {
        let artists = [] as MiniTag[] 
        let characters = [] as MiniTag[] 
        let series = [] as MiniTag[] 
        let tags = [] as MiniTag[] 
        if (!parsedTags) return {artists, characters, series, tags}
        let tagMap = cache ? await Functions.tagsCache(session, setSessionFlag) : await Functions.get("/api/tag/map", 
        {tags: parsedTags.map((t: string | TagCount | Tag) => typeof t === "string" ? t : t.tag)}, session, setSessionFlag)
        for (let i = 0; i < parsedTags.length; i++) {
            let tag = parsedTags[i].hasOwnProperty("tag") ? (parsedTags[i] as TagCount).tag : parsedTags[i] as string
            let count = parsedTags[i].hasOwnProperty("count") ? (parsedTags[i] as TagCount).count : 0
            const foundTag = tagMap[tag]
            if (!foundTag) {
                const unverifiedTag = await Functions.get("/api/tag/unverified", {tag}, session, setSessionFlag)
                if (unverifiedTag) {
                    const obj = {} as MiniTag 
                    obj.tag = tag
                    obj.count = String(count)
                    obj.image = unverifiedTag.image
                    obj.imageHash = unverifiedTag.imageHash
                    obj.type = unverifiedTag.type
                    obj.description = unverifiedTag.description 
                    obj.social = unverifiedTag.social
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
            const obj = {} as MiniTag 
            obj.tag = tag
            obj.count = String(count)
            obj.type = foundTag.type
            obj.image = foundTag.image
            obj.imageHash = foundTag.imageHash
            obj.description = foundTag.description 
            obj.social = foundTag.social
            obj.twitter = foundTag.twitter
            obj.website = foundTag.website
            obj.fandom = foundTag.fandom
            if (foundTag.type === "artist") {
                artists.push(obj)
            } else if (foundTag.type === "character") {
                characters.push(obj)
            } else if (foundTag.type === "series") {
                series.push(obj)
            } else {
                tags.push(obj)
            }
        }
        return {artists, characters, series, tags}
    }

    public static tagsCache = async (session: Session, setSessionFlag: (value: boolean) => void) => {
        const cache = await localforage.getItem("tags") as string
        if (cache) {
            return JSON.parse(cache) as {[key: string]: Tag}
        } else {
            let tagMap = await Functions.get("/api/tag/map", {tags: []}, session, setSessionFlag)
            localforage.setItem("tags", JSON.stringify(tagMap))
            return tagMap
        }
    }

    public static emojisCache = async (session: Session, setSessionFlag: (value: boolean) => void) => {
        const cache = await localforage.getItem("emojis") as string
        if (cache) {
            return JSON.parse(cache) as {[key: string]: string}
        } else {
            let emojis = await Functions.get("/api/misc/emojis", null, session, setSessionFlag)
            localforage.setItem("emojis", JSON.stringify(emojis))
            return emojis
        }
    }

    public static clearCache = () => {
        localforage.removeItem("tags")
        localforage.removeItem("emojis")
    }

    public static readableFileSize = (bytes: number) => {
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Number((bytes / Math.pow(1024, i)).toFixed(2))} ${["B", "KB", "MB", "GB", "TB"][i]}`
    }

    public static toCanvas = async (image: string) => {
        const img = await Functions.createImage(image)
        const canvas = document.createElement("canvas") as HTMLCanvasElement
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas
    }

    public static imageDimensions = async (image: string, session: Session) => {
        return new Promise<{width: number, height: number, size: number}>(async (resolve) => {
            if (Functions.isVideo(image)) {
                const video = document.createElement("video")
                video.addEventListener("loadedmetadata", async () => {
                    let width = video.videoWidth 
                    let height = video.videoHeight
                    try {
                        const r = await fetch(image).then(((r) => r.arrayBuffer()))
                        const size = r.byteLength
                        resolve({width, height, size})
                    } catch {
                        resolve({width, height, size: 0})
                    }
                })
                video.src = image
            } else {
                let imageLink = await Functions.decryptThumb(image, session)
                const img = document.createElement("img")
                img.addEventListener("load", async () => {
                    let width = img.width
                    let height = img.height
                    try {
                        const r = await fetch(imageLink).then((r) => r.arrayBuffer())
                        const size = r.byteLength 
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
        if (!imageSize) imageSize = 500
        const width = imageSize
        const height = imageSize
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const light = new THREE.AmbientLight(0xffffff, 1)
        scene.add(light)
        
        const renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true, powerPreference: "low-power"})
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

        const zoomedDistance = size / 5
        camera.position.set(center.x + zoomedDistance, center.y + zoomedDistance / 2, center.z + zoomedDistance)
        camera.lookAt(center)

        await Functions.timeout(100)
        renderer.render(scene, camera)
        return renderer.domElement.toDataURL()
    }

    public static live2dDimensions = async (live2d: string) => {
        // @ts-expect-error
        const {Live2DModel} = await import("pixi-live2d-display/cubism4")
        const model = await Live2DModel.from(live2d)
        const width = Number(model.internalModel.width)
        const height = Number(model.internalModel.height)
        const r = await fetch(live2d).then((r) => r.arrayBuffer())
        const size = r.byteLength
        return {width, height, size}
    }

    public static live2dScreenshot = async (live2d: string, imageSize?: number) => {
        if (!imageSize) imageSize = 500
        // @ts-expect-error
        window.PIXI = PIXI
        const app = new PIXI.Application({
            view: document.createElement("canvas"),
            autoStart: true,
            width: imageSize,
            height: imageSize,
            backgroundAlpha: 0,
            powerPreference: "low-power",
            preserveDrawingBuffer: true
        })

        // @ts-expect-error
        const {Live2DModel, ZipLoader} = await import("pixi-live2d-display/cubism4")

        ZipLoader.zipReader = (data: Blob, url: string) => JSZip.loadAsync(data)
        ZipLoader.readText = (jsZip: JSZip, path: string) => {
            const file = jsZip.file(path)
            if (!file) throw new Error("Cannot find file: " + path)
            return file.async("text")
        }
        ZipLoader.getFilePaths = (jsZip: JSZip) => {
            const paths: string[] = []
            jsZip.forEach(relativePath => paths.push(relativePath))
            return Promise.resolve(paths)
        }
        ZipLoader.getFiles = (jsZip: JSZip, paths: string[]) =>
            Promise.all(paths.map(
                async path => {
                    const fileName = path.slice(path.lastIndexOf("/") + 1)
                    const blob = await jsZip.file(path)!.async("blob")
                    return new File([blob], fileName)
        }))

        const model = await Live2DModel.from(live2d)
        app.stage.addChild(model)

        const initialScale = Math.min(app.screen.width / model.internalModel.width, app.screen.height / model.internalModel.height)
        model.transform.scale.set(initialScale)
        model.transform.position.set(app.screen.width / 2, app.screen.height / 2)
        model.anchor.set(0.5)

        await Functions.timeout(100)

        return new Promise<string>(async (resolve) => {
            app.ticker.add(() => {
                resolve(app.view.toDataURL?.()!)
                app.destroy(true)
            })
        })
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
            let buffer = new Uint8Array()
            for (let i = 0; i < picture.length; i++) {
                buffer = new Uint8Array(Buffer.concat([buffer, new Uint8Array(picture[i].data)]))
            }
            return `data:${picture[0].format};base64,${Buffer.from(buffer).toString("base64")}`
        } else {
            return ""
        }
    }

    public static imageSearch = async (file: File, session: Session, setSessionFlag: (value: boolean) => void) => {
        const fileReader = new FileReader()
        return new Promise<Post[]>((resolve) => {
            fileReader.onloadend = async (f: ProgressEvent<FileReader>) => {
                let bytes = new Uint8Array(f.target?.result as ArrayBuffer)
                const result = Functions.bufferFileType(bytes)?.[0] || {}
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const webp = result?.mime === "image/webp"
                const avif = result?.mime === "image/avif"
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
                if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj) {
                    if (mp4 || webm) {
                        const url = URL.createObjectURL(file)
                        const thumbnail = await Functions.videoThumbnail(url)
                        bytes = await Functions.base64toUint8Array(thumbnail)
                    }
                    const similar = await Functions.post("/api/search/similar", {bytes: Object.values(bytes), useMD5: false}, session, setSessionFlag)
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

    public static crop = async <T extends boolean | undefined>(url: string, aspectRatio: number, buffer?: T, jpeg?: boolean) => {
        type CropReturn = T extends true ? Buffer : string
        return new Promise<CropReturn>((resolve) => {
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
                outputImage.width = 300
                outputImage.height = 300
    
                const ctx = outputImage.getContext("2d")!
                ctx.drawImage(inputImage, outputX, outputY, outputImage.width, outputImage.height)
                if (buffer) {
                    const img = ctx.getImageData(0, 0, outputImage.width, outputImage.height)
                    resolve(img.data.buffer as CropReturn)
                } else {
                    resolve(outputImage.toDataURL(jpeg ? "image/jpeg" : "image/png") as CropReturn)
                }
            }
            inputImage.src = url
        })
    }

    public static arrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => {
        const mime = Functions.bufferFileType(Buffer.from(arrayBuffer))[0]?.mime || "image/png"
        return `data:${mime};base64,${Buffer.from(arrayBuffer).toString("base64")}`
    }

    public static timeAgo = (input: string, i18n: typeof enLocale) => {
        if (!input) return "?"
        const date = new Date(input.replace(/ +/g, "T"))
        const seconds = Math.floor(((new Date().getTime() / 1000) - (date.getTime() / 1000)))
    
    
        const parseTime = (value: number, unit: string) => {
            return i18n.time.plural ? `${value} ${unit}${value === 1 ? "" : i18n.time.plural} ${i18n.time.ago}` : `${value}${unit}${i18n.time.ago}`
        }
    
        const years = seconds / 31536000
        if (years >= 1) return parseTime(Math.floor(years), i18n.time.year)
    
        const months = seconds / 2592000
        if (months >= 1) return parseTime(Math.floor(months), i18n.time.month)
    
        const days = seconds / 86400
        if (days >= 1) return parseTime(Math.floor(days), i18n.time.day)
    
        const hours = seconds / 3600
        if (hours >= 1) return parseTime(Math.floor(hours), i18n.time.hour)
    
        const minutes = seconds / 60
        if (minutes >= 1) return parseTime(Math.floor(minutes), i18n.time.minute)
    
        return parseTime(seconds, i18n.time.second)
    }    

    public static timeUntil = (input: string | null, i18n: typeof enLocale) => {
        if (!input) return "?"
        const date = new Date(input.replace(/ +/g, "T"))
        const now = new Date().getTime()
        const seconds = Math.floor((date.getTime() - now) / 1000)
    
        const parseTime = (value: number, unit: string) => {
            return i18n.time.plural ? `${value} ${unit}${value === 1 ? "" : i18n.time.plural}` : `${value}${unit}`
        }
    
        const years = seconds / 31536000
        if (years >= 1) return parseTime(Math.floor(years), i18n.time.year)
    
        const months = seconds / 2592000
        if (months >= 1) return parseTime(Math.floor(months), i18n.time.month)
    
        const days = seconds / 86400
        if (days >= 1) return parseTime(Math.floor(days), i18n.time.day)
    
        const hours = seconds / 3600
        if (hours >= 1) return parseTime(Math.floor(hours), i18n.time.hour)
    
        const minutes = seconds / 60
        if (minutes >= 1) return parseTime(Math.floor(minutes), i18n.time.minute)
    
        return parseTime(seconds, i18n.time.second)
    }

    public static fileExtension = (uint8Array: Uint8Array | number[]) => {
        const result = Functions.bufferFileType(uint8Array)?.[0]
        return result?.extension || ""
    }

    public static permutations(query: string) {
        const sliced = query.split(/ +/g)
        
        function* iterRecur(sliced: string[]) {
            if (sliced.length == 1) return yield sliced
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

    public static parseSpaceEnabledSearch = async (query: string, session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!query) return query
        if (query.split(/ +/g).length > 10) return query
        let savedTags = await Functions.tagsCache(session, setSessionFlag)
        let permutations = Functions.permutations(query)
        let matchesArray = new Array(permutations.length).fill(0)
        let specialFlagsArray = new Array(permutations.length).fill("")
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < permutations[i].length; j++) {
                if (permutations[i][j]?.startsWith("+-")) {
                    specialFlagsArray[j] = "+-"
                    permutations[i][j] = permutations[i][j].replace("+-", "")
                }
                if (permutations[i][j]?.startsWith("+")) {
                    specialFlagsArray[j] = "+"
                    permutations[i][j] = permutations[i][j].replace("+", "")
                }
                if (permutations[i][j]?.startsWith("-")) {
                    specialFlagsArray[j] = "-"
                    permutations[i][j] = permutations[i][j].replace("-", "")
                }
                if (permutations[i][j]?.startsWith("*")) {
                    specialFlagsArray[j] = "*"
                    permutations[i][j] = permutations[i][j].replace("*", "")
                }
                const exists = savedTags[permutations[i][j]]
                if (exists) matchesArray[i]++
            }
        }
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < permutations[i].length; j++) {
                for (let savedTag of Object.values(savedTags)) {
                    const exists = savedTag.aliases.find((a) => a?.alias === permutations[i][j])
                    if (exists) matchesArray[i]++
                }
            }
        }
        const index = Functions.indexOfMax(matchesArray)
        if (index !== -1 && matchesArray[index] !== 0) {
            let queries = [] as string[] 
            for (let j = 0; j < permutations[index].length; j++) {
                queries.push(`${specialFlagsArray[j]}${permutations[index][j]}`)
            }
            return queries.join(" ")
        }
        return query
    }

    public static trimSpecialCharacters = (query: string) => {
        return query?.trim().split(/ +/g).map((item) => {
            if (item.startsWith("+-")) return item.replace("+-", "")
            if (item.startsWith("+")) return item.replace("+", "")
            if (item.startsWith("-")) return item.replace("-", "")
            if (item.startsWith("*")) return item.replace("*", "")
            return item
        }).join(" ") || ""
    }

    public static appendSpecialCharacters = (parts: string[], tag: string) => {
        const last = parts[parts.length - 1]
        if (last.startsWith("+-")) return `+-${tag}`
        if (last.startsWith("+")) return `+${tag}`
        if (last.startsWith("-")) return `-${tag}`
        if (last.startsWith("*")) return `*${tag}`
        return tag
    }

    public static insertNodeAtCaret(node: Node) {
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

    public static rangeRect = (range: Range) => {
        let rect = range.getBoundingClientRect()
        if (range.collapsed && rect.top === 0 && rect.left === 0) {
          let node = document.createTextNode("\ufeff")
          range.insertNode(node)
          rect = range.getBoundingClientRect()
          node.remove()
        }
        return rect
    }

    public static triggerTextboxButton = (textarea: HTMLTextAreaElement | null, setText: (text: string) => void, type: string) => {
        if (!textarea) return
        const insert = {
            highlight: "====",
            bold: "****",
            italic: "////",
            underline: "____",
            strikethrough: "~~~~",
            spoiler: "||||",
            link: "[]()",
            details: "<<|>>",
            color: "#ff17c1{}",
            code: "``````"
        }[type]
        if (!insert) return

        const current = textarea.value
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const isSelected = start !== end
        let updated = ""

        if (isSelected) {
            let before = current.slice(0, start)
            let selected = current.slice(start, end)
            let after = current.slice(end)
            let half = Math.floor(insert.length / 2)
            let first = insert.slice(0, half)
            let second = insert.slice(half)

            if (type === "link") {
                if (selected.startsWith("http")) {
                    first = "[]"
                    second = `(${selected})`
                } else {
                    first = `[${selected}]`
                    second = "()"
                }
                selected = ""
            }

            if (type === "color") {
                first = "#ff17c1{"
                second = "}"
            }
    
            updated = before + first + selected + second + after
            const cursor = start + first.length + selected.length + second.length
    
            setTimeout(() => textarea.setSelectionRange(cursor, cursor), 0)
        } else {
            const before = current.slice(0, start)
            const after = current.slice(start)
            updated = before + insert + after
            let shift = -2
            if (type === "link") shift = -3
            if (type === "details") shift = -3
            if (type === "color") shift = -1
            if (type === "code") shift = -3
            const cursor = start + insert.length + shift
    
            setTimeout(() => textarea.setSelectionRange(cursor, cursor), 0)
        }
        setText(updated)
        textarea.focus()
    }

    public static stripTags = <T extends Post[] | PostSearch[] | PostFull[] | PostHistory[]>(posts: T) => {
        for (let i = 0; i < posts.length; i++) {
            // @ts-ignore
            delete posts[i].tags
        }
        return posts as T
    }

    public static stripLinks = (text: string) => {
        return text.replace(/(https?:\/\/[^\s]+)/g, "").replace(/(:[^\s]+:)/g, "")
    }

    public static cleanTag = (tag: string) => {
        return tag.normalize("NFD").replace(/[^a-z0-9_\-()><&!#@]/gi, "").replaceAll("_", "-")
    }

    public static cleanTitle = (title?: string | null) => {
        if (!title) return ""
        return title.replace(/[\/\?<>\\:\*\|"%]/g, "")
    }

    public static render = (image: HTMLImageElement, brightness: number, contrast: number,
        hue: number, saturation: number, lightness: number, blur: number, sharpen: number, pixelate: number) => {
        const canvas = document.createElement("canvas") as HTMLCanvasElement
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext("2d")!
        let newContrast = contrast
        ctx.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        if (pixelate !== 1) {
            const pixelateCanvas = document.createElement("canvas")
            const pixelWidth = image.width / pixelate 
            const pixelHeight = image.height / pixelate
            pixelateCanvas.width = pixelWidth 
            pixelateCanvas.height = pixelHeight
            const pixelateCtx = pixelateCanvas.getContext("2d")!
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
            ctx.globalAlpha = Math.abs((lightness - 100) / 100)
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

    public static useLocalFiles = () => {
        return process.env.LOCAL_FILES === "yes"
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
            if (mirror.includes("zerochan")) json["zerochan"] = mirror
            if (mirror.includes("deviantart")) json["deviantart"] = mirror
            if (mirror.includes("artstation")) json["artstation"] = mirror
            if (mirror.includes("soundcloud")) json["soundcloud"] = mirror
            if (mirror.includes("youtube")) json["youtube"] = mirror
            if (mirror.includes("bandcamp")) json["bandcamp"] = mirror
            if (mirror.includes("sketchfab")) json["sketchfab"] = mirror
            if (mirror.includes("twitter") || mirror.includes("x.com")) json["twitter"] = mirror
        }
        return JSON.stringify(json)
    }

    public static shuffleArray = <T>(array: T[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    public static insertAtIndex = <T>(array: T[], index: number, item: T | null) => {
        return [...array.slice(0, index), item, ...array.slice(index + 1)].filter(Boolean) as T[]
    }

    public static serverPush = (route: string) => {
        window.location.href = route
    }

    public static rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255
        g /= 255
        b /= 255
        let cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0
        if (delta == 0) 
            h = 0
        // Red is max
        else if (cmax == r)
            h = ((g - b) / delta) % 6
        // Green is max
        else if (cmax == g)
            h = (b - r) / delta + 2
        // Blue is max
        else
            h = (r - g) / delta + 4
        h = Math.round(h * 60)
        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360
        l = (cmax + cmin) / 2
        // Calculate saturation
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
        // Multiply l and s by 100
        s = +(s * 100).toFixed(1)
        l = +(l * 100).toFixed(1)
        return [h, s, l]
    }

    public static hslToRgb(h: number, s: number, l: number) {
        // Must be fractions of 1
        s /= 100.0
        l /= 100.0
        let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60.0) % 2 - 1)),
        m = l - c/2.0,
        r = 0,
        g = 0,
        b = 0
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
        r = Math.round((r + m) * 255)
        g = Math.round((g + m) * 255)
        b = Math.round((b + m) * 255)
        return [r, g, b]
    } 

    public static rgbToHex(r: number, g: number, b: number) {
        let hexR = r.toString(16)
        let hexG = g.toString(16)
        let hexB = b.toString(16)
        if (hexR.length == 1)
            hexR = "0" + hexR
        if (hexG.length == 1)
            hexG = "0" + hexG
        if (hexB.length == 1)
            hexB = "0" + hexB
        return "#" + hexR + hexG + hexB
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
        let hsl = [] as number[]
        let a = 1
        if (color.trim().startsWith("#")) {
            const rgb = hexToRgb(color) as number[]
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

    public static fixTwitterTag = (tag: string) => {
        return tag.toLowerCase().replaceAll("_", "-").replace(/^[-]+/, "").replace(/[-]+$/, "")
    }

    public static semitonesToScale = (semitones: number) => {
        var scaleFactor = Math.pow(2, semitones / 12)
        scaleFactor = Math.max(0.25, scaleFactor)
        scaleFactor = Math.min(4, scaleFactor)
        return scaleFactor
    }

    public static bufferFileType = (buffer: Uint8Array | ArrayBuffer | Buffer | number[]) => {
        buffer = Buffer.from(new Uint8Array(buffer))

        const majorBrand = buffer.toString("utf8", 8, 12)
        if (majorBrand === "avif" || majorBrand === "avis") {
            return [{typename: "avif", mime: "image/avif", extension: "avif"}]
        }
        return fileType(new Uint8Array(buffer))
    }

    public static isEncrypted = (buffer: ArrayBuffer | Buffer) => {
        const result = Functions.bufferFileType(buffer)
        if (result.length) {
            if (result[0].typename === "pic") return true
            if (result[0].typename === "mpeg") return true
            return false
        }
        return true
    }

    public static numberArray = (max: number, spacing: number) => {
        const arr = [] as string[]
        for (let i = spacing; i <= max; i += spacing) {
            arr.push(i.toString())
        }
        return arr
    }

    public static getSiteName = (link: string, i18n: typeof enLocale) => {
        try {
            const domain = new URL(link).hostname.replace("www.", "").split(".")?.[0] || ""
            if (domain.toLowerCase() === "yande") return "Yandere"
            return Functions.toProperCase(domain)
        } catch {
            return i18n.labels.unknown || "Unknown"
        }
    }

    public static getDomain = () => {
        if (Functions.isLocalHost()) {
            return "http://localhost:8082"
        } else {
            return "https://moepictures.moe"
        }
    }

    public static convertToFormat = async (image: string, format: string) => {
        const img = await Functions.createImage(image)
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        if (format === "jpg") {
            return canvas.toDataURL("image/jpeg")
        } else if (format === "png") {
            return canvas.toDataURL("image/png")
        } else if (format === "webp") {
            return canvas.toDataURL("image/webp")
        } else if (format === "avif") {
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const avif = await avifJS({locateFile: (path: string) => path.endsWith(".wasm") ? "avif_enc.wasm" : path})
            const options = {quality: 80, qualityAlpha: -1, denoiseLevel: 0, tileColsLog2: 0, tileRowsLog2: 0, speed: 6, subsample: 1, 
            chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false}
            const output = await avif.encode(pixels.data, pixels.width, pixels.height, options)
            const blob = new Blob([output], {type: "image/avif"})
            return URL.createObjectURL(blob)
        } else if (format === "jxl") {
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const jxl = await jxlJS({locateFile: (path: string) => path.endsWith(".wasm") ? "jxl_enc.wasm" : path})
            const options = {effort: 7, quality: 95, progressive: true, epf: -1, lossyPalette: false, 
            decodingSpeedTier: 0, photonNoiseIso: 0, lossyModular: false}
            const output = await jxl.encode(pixels.data, pixels.width, pixels.height, options)
            const blob = new Blob([output], {type: "image/jxl"})
            return URL.createObjectURL(blob)
        } else if (format === "svg") {
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const result = ImageTracer.imagedataToSVG(pixels, {numberofcolors: 24, mincolorratio: 0})
            const optimized = optimize(result)
            const blob = new Blob([optimized.data])
            return URL.createObjectURL(blob)
        }
        return image
    }

    public static borderColor = (post: PostSearch) => {
        if (post.favorited) return "var(--favoriteBorder)"
        if (post.favgrouped) return "var(--favgroupBorder)"
        if (post.hidden) return "var(--takendownBorder)"
        if (post.locked) return "var(--lockedBorder)"
        if (post.hasChildren) return "var(--parentBorder)"
        if (post.parentID) return "var(--childBorder)"
        if (post.isGrouped) return "var(--groupBorder)"
        if (Number(post.variationCount) > 1) return "var(--variationBorder)"
        return "var(--imageBorder)"
    }

    public static updateLocalFavorite = (postID: string, favorited: boolean, posts: PostSearch[] | PostOrdered[] | Post[], 
        setPosts: (state: PostSearch[] | PostOrdered[] | Post[]) => void) => {
        if (!posts?.length) return
        const postIndex = posts.findIndex((p) => p.postID === postID)
        if (postIndex === -1) return
        posts = structuredClone(posts);
        (posts[postIndex] as PostSearch).favorited = favorited
        setPosts(posts)
        localStorage.setItem("savedPosts", JSON.stringify(posts))
    }

    public static jumpToTop = () => {
        setTimeout(() => {
            window.scrollTo(0, 0)
        }, 300)
    }

    public static imagesChanged = async (revertPost: PostSearch | PostHistory, currentPost: PostSearch | PostHistory, session: Session) => {
        if (!privateKey) await Functions.updateClientKeys(session)
        if (!serverPublicKey) await Functions.updateServerPublicKey(session)
        if (revertPost.images.length !== currentPost.images.length) return true
        for (let i = 0; i < revertPost.images.length; i++) {
            const revImage = revertPost.images[i]
            const currImage = currentPost.images[i]
            
            let imgLink = typeof revImage === "string" ? Functions.getRawImageLink(revImage) 
            : Functions.getImageLink(revImage.type, revertPost.postID, i+1, revImage.filename)

            let currentLink = typeof currImage === "string" ? Functions.getRawImageLink(currImage) 
            : Functions.getImageLink(currImage.type, currentPost.postID, i+1, currImage.filename)

            let upscaledImgLink = typeof revImage === "string" ? Functions.getRawImageLink(revImage) 
            : Functions.getImageLink(revImage.type, revertPost.postID, i+1, revImage.upscaledFilename || revImage.filename)

            let currentUpscaledLink = typeof currImage === "string" ? Functions.getRawImageLink(currImage) 
            : Functions.getImageLink(currImage.type, currentPost.postID, i+1, currImage.upscaledFilename || currImage.filename)

            
            let imgBuffer = await Functions.getBuffer(`${imgLink}?upscaled=false`, {"x-force-upscale": "false"})
            let currentBuffer = await Functions.getBuffer(`${currentLink}?upscaled=false`, {"x-force-upscale": "false"})
            let upscaledImgBuffer = await Functions.getBuffer(`${upscaledImgLink}?upscaled=true`, {"x-force-upscale": "true"})
            let upscaledCurrentBuffer = await Functions.getBuffer(`${currentUpscaledLink}?upscaled=true`, {"x-force-upscale": "true"})

            if (imgBuffer.byteLength && Functions.isImage(imgLink)) {
                const isAnimated = Functions.isAnimatedWebp(imgBuffer)
                if (!isAnimated) imgBuffer = cryptoFunctions.decrypt(imgBuffer, privateKey, serverPublicKey, session)
            }
            if (currentBuffer.byteLength && Functions.isImage(currentLink)) {
                const isAnimated = Functions.isAnimatedWebp(currentBuffer)
                if (!isAnimated) currentBuffer = cryptoFunctions.decrypt(currentBuffer, privateKey, serverPublicKey, session)
            }
            if (upscaledImgBuffer.byteLength && Functions.isImage(upscaledImgLink)) {
                const isAnimated = Functions.isAnimatedWebp(upscaledImgBuffer)
                if (!isAnimated) upscaledImgBuffer = cryptoFunctions.decrypt(upscaledImgBuffer, privateKey, serverPublicKey, session)
            }
            if (upscaledCurrentBuffer.byteLength && Functions.isImage(currentUpscaledLink)) {
                const isAnimated = Functions.isAnimatedWebp(upscaledCurrentBuffer)
                if (!isAnimated) upscaledCurrentBuffer = cryptoFunctions.decrypt(upscaledCurrentBuffer, privateKey, serverPublicKey, session)
            }

            if (imgBuffer.byteLength) {
                const imgMD5 = crypto.createHash("md5").update(Buffer.from(imgBuffer) as any).digest("hex")
                const currentMD5 = crypto.createHash("md5").update(Buffer.from(currentBuffer) as any).digest("hex")
                if (imgMD5 !== currentMD5) return true
            }
            if (upscaledImgBuffer.byteLength) {
                const imgMD5 = crypto.createHash("md5").update(Buffer.from(upscaledImgBuffer) as any).digest("hex")
                const currentMD5 = crypto.createHash("md5").update(Buffer.from(upscaledCurrentBuffer) as any).digest("hex")
                if (imgMD5 !== currentMD5) return true
            }
        }
        return false
    }

    public static tagsChanged = (revertPost: PostSearch | PostHistory, currentPost: PostSearch | PostHistory) => {
        if (JSON.stringify(revertPost.artists) !== JSON.stringify(currentPost.artists)) return true
        if (JSON.stringify(revertPost.characters) !== JSON.stringify(currentPost.characters)) return true
        if (JSON.stringify(revertPost.series) !== JSON.stringify(currentPost.series)) return true
        if (JSON.stringify(revertPost.tags) !== JSON.stringify(currentPost.tags)) return true
        return false
    }

    public static sourceChanged = (revertPost: PostSearch | PostHistory, currentPost: PostSearch | PostHistory) => {
        if (revertPost.title !== currentPost.title) return true
        if (revertPost.englishTitle !== currentPost.englishTitle) return true
        if (revertPost.posted !== currentPost.posted) return true
        if (revertPost.source !== currentPost.source) return true
        if (revertPost.artist !== currentPost.artist) return true
        if (revertPost.commentary !== currentPost.commentary) return true
        if (revertPost.englishCommentary !== currentPost.englishCommentary) return true
        return false
    }

    public static parseImages = async (post: PostSearch | PostHistory, session: Session) => {
        let images = [] as UploadImage[]
        let upscaledImages = [] as UploadImage[]
        for (let i = 0; i < post.images.length; i++) {
            const image = post.images[i]
            let imgLink = typeof image === "string" ? Functions.getRawImageLink(image) 
            : Functions.getImageLink(image.type, post.postID, i+1, image.filename)

            let upscaledImgLink = typeof image === "string" ? Functions.getRawImageLink(image) 
            : Functions.getImageLink(image.type, post.postID, i+1, image.upscaledFilename || image.filename)

            let buffer = await Functions.getBuffer(`${imgLink}?upscaled=false`, {"x-force-upscale": "false"})
            let upscaledBuffer = await Functions.getBuffer(`${upscaledImgLink}?upscaled=true`, {"x-force-upscale": "true"})
            if (buffer.byteLength) {
                let ext = path.extname(imgLink)
                let link = await Functions.decryptItem(imgLink, session)
                if (!link.includes(ext)) link += `#${ext}`
                let thumbnail = ""
                let width = 0
                let height = 0
                if (Functions.isLive2D(ext)) {
                    thumbnail = await Functions.live2dScreenshot(ext)
                    const dimensions = await Functions.live2dDimensions(ext)
                    width = dimensions.width
                    height = dimensions.height
                } else if (Functions.isVideo(ext)) {
                    thumbnail = await Functions.videoThumbnail(link)
                } else if (Functions.isModel(ext)) {
                    thumbnail = await Functions.modelImage(link)
                } else if (Functions.isAudio(ext)) {
                    thumbnail = await Functions.songCover(link)
                }
                let decrypted = await Functions.decryptBuffer(buffer, imgLink, session)
                images.push({link, ext: ext.replace(".", ""), size: decrypted.byteLength, thumbnail, width, height,
                originalLink: imgLink, bytes: Object.values(new Uint8Array(decrypted)), name: path.basename(imgLink)})
            }
            if (upscaledBuffer.byteLength) {
                let upscaledExt = path.extname(upscaledImgLink)
                let upscaledLink = await Functions.decryptItem(upscaledImgLink, session)
                if (!upscaledLink.includes(upscaledExt)) upscaledLink += `#${upscaledExt}`
                let thumbnail = ""
                let width = 0
                let height = 0
                if (Functions.isLive2D(upscaledExt)) {
                    thumbnail = await Functions.live2dScreenshot(upscaledLink)
                    const dimensions = await Functions.live2dDimensions(upscaledLink)
                    width = dimensions.width
                    height = dimensions.height
                } else if (Functions.isVideo(upscaledExt)) {
                    thumbnail = await Functions.videoThumbnail(upscaledLink)
                } else if (Functions.isModel(upscaledExt)) {
                    thumbnail = await Functions.modelImage(upscaledLink)
                } else if (Functions.isAudio(upscaledExt)) {
                    thumbnail = await Functions.songCover(upscaledLink)
                }
                let decrypted = await Functions.decryptBuffer(upscaledBuffer, upscaledImgLink, session)
                upscaledImages.push({link: upscaledLink, ext: upscaledExt.replace(".", ""), size: decrypted.byteLength, thumbnail,
                width, height, originalLink: upscaledImgLink, bytes: Object.values(new Uint8Array(decrypted)), name: path.basename(upscaledImgLink)})
            }
        }
        return {images, upscaledImages}
    }

    public static parseNewTags = async (post: PostSearch | PostHistory, session: Session, setSessionFlag: (value: boolean) => void) => {
        const tags = post.tags
        if (!tags?.[0]) return []
        const tagMap = await Functions.tagsCache(session, setSessionFlag)
        let notExists = [] as UploadTag[]
        for (let i = 0; i < tags.length; i++) {
            const exists = tagMap[tags[i]]
            if (!exists) notExists.push({tag: tags[i], description: `${Functions.toProperCase(tags[i]).replaceAll("-", " ")}.`})
        }
        return notExists
    }

    public static parsePostChanges = (oldPost: Post, newPost: Post) => {
        let json = {} as PostChanges
        if (oldPost.images.length !== newPost.images.length) {
            json.images = newPost.images
        }
        if (oldPost.type !== newPost.type) {
            json.type = newPost.type
        }
        if (oldPost.rating !== newPost.rating) {
            json.rating = oldPost.rating
        }
        if (oldPost.style !== newPost.style) {
            json.style = newPost.style
        }
        if (oldPost.parentID !== newPost.parentID) {
            json.parentID = newPost.parentID
        }
        if (oldPost.title !== newPost.title) {
            json.title = newPost.title
        }
        if (oldPost.englishTitle !== newPost.englishTitle) {
            json.englishTitle = newPost.englishTitle
        }
        if (oldPost.artist !== newPost.artist) {
            json.artist = newPost.artist
        }
        if (Functions.formatDate(new Date(oldPost.posted)) !== Functions.formatDate(new Date(newPost.posted))) {
            json.posted = newPost.posted
        }
        if (oldPost.source !== newPost.source) {
            json.source = newPost.source
        }
        if (JSON.stringify(oldPost.mirrors) !== JSON.stringify(newPost.mirrors)) {
            json.mirrors = newPost.mirrors
        }
        if (oldPost.bookmarks !== newPost.bookmarks) {
            json.bookmarks = newPost.bookmarks
        }
        if (oldPost.buyLink !== newPost.buyLink) {
            json.buyLink = newPost.buyLink
        }
        if (oldPost.commentary !== newPost.commentary) {
            json.commentary = newPost.commentary
        }
        if (oldPost.englishCommentary !== newPost.englishCommentary) {
            json.englishCommentary = newPost.englishCommentary
        }
        return json
    }

    public static parseTagChanges = (oldTag: Tag, newTag: Tag) => {
        let json = {} as TagChanges
        if (oldTag.tag !== newTag.tag) {
            json.tag = newTag.tag
        }
        if (oldTag.type !== newTag.type) {
            json.type = newTag.type
        }
        if (oldTag.description !== newTag.description) {
            json.description = newTag.description
        }
        let oldAliases = oldTag.aliases?.filter(Boolean).map((a) => a?.alias ? a.alias : a) || []
        let newAliases = newTag.aliases?.filter(Boolean).map((a) => a?.alias ? a.alias : a) || []
        if (JSON.stringify(oldAliases) !== JSON.stringify(newAliases)) {
            json.aliases = newTag.aliases
        }
        let oldImplications = oldTag.implications?.filter(Boolean).map((i) => i?.implication ? i.implication : i) || []
        let newImplications = newTag.implications?.filter(Boolean).map((i) => i?.implication ? i.implication : i) || []
        if (JSON.stringify(oldImplications) !== JSON.stringify(newImplications)) {
            json.implications = newTag.implications
        }
        if (JSON.stringify(oldTag.pixivTags?.filter(Boolean)) !== JSON.stringify(newTag.pixivTags?.filter(Boolean))) {
            json.pixivTags = newTag.pixivTags
        }
        if (oldTag.website !== newTag.website) {
            json.website = newTag.website
        }
        if (oldTag.social !== newTag.social) {
            json.social = newTag.social
        }
        if (oldTag.twitter !== newTag.twitter) {
            json.twitter = newTag.twitter
        }
        if (oldTag.fandom !== newTag.fandom) {
            json.fandom = newTag.fandom
        }
        if (oldTag.featuredPost?.postID !== newTag.featuredPost?.postID) {
            json.featuredPost = newTag.featuredPost?.postID
        }
        if (Boolean(oldTag.r18) !== Boolean(newTag.r18)) {
            json.r18 = newTag.r18
        }
        return json
    }

    public static parseGroupChanges = (oldGroup: GroupPosts, newGroup: GroupPosts) => {
        let json = {} as GroupChanges
        if (oldGroup.name !== newGroup.name) {
            json.name = newGroup.name
        }
        if (oldGroup.description !== newGroup.description) {
            json.description = newGroup.description
        }
        if (JSON.stringify(oldGroup.posts) !== JSON.stringify(newGroup.posts)) {
            json.posts = newGroup.posts.map((post: PostOrdered) => ({postID: post.postID, order: post.order}))
        }
        return json
    }

    public static parseNoteChanges = (oldNotes: Note[], newNotes:  Note[]) => {
        let styleChanged = false
        if (!oldNotes) oldNotes = [] as Note[]
        if (!newNotes) newNotes = [] as Note[]
        const itemKey = (item: Note) => item.character ? `Character -> ${item.characterTag}` : `${item.transcript} -> ${item.translation}`
        const prevMap = new Map(oldNotes.map((item) => [itemKey(item), item]))
        const newMap = new Map(newNotes.map((item) => [itemKey(item), item]))

        const addedEntries = newNotes
            .filter((item) => !prevMap.has(itemKey(item)))
            .map((item) => itemKey(item))

        const removedEntries = oldNotes
            .filter((item) => !newMap.has(itemKey(item)))
            .map((item) => itemKey(item))

        for (const note of oldNotes) {
            const match = newNotes.find((item) => item.noteID === note.noteID)
            if (!match) continue
            if (note.overlay !== match.overlay || 
                note.fontFamily !== match.fontFamily || 
                note.bold !== match.bold || 
                note.italic !== match.italic || 
                note.fontSize !== match.fontSize || 
                note.textColor !== match.textColor || 
                note.backgroundColor !== match.backgroundColor || 
                note.backgroundAlpha !== match.backgroundAlpha || 
                note.strokeColor !== match.strokeColor || 
                note.strokeWidth !== match.strokeWidth || 
                note.borderRadius !== match.borderRadius || 
                note.breakWord !== match.breakWord) {
                    styleChanged = true
                    break
                }
        }

        return {addedEntries, removedEntries, styleChanged}
    }

    public static replaceLocation = (location: string) => {
        window.location = `${Functions.getDomain()}${location}` as (string & Location)
    }

    public static decryptThumb = async (img: string, session: Session, cacheKey?: string, forceImage?: boolean) => {
        if (!privateKey) await Functions.updateClientKeys(session)
        if (!serverPublicKey) await Functions.updateServerPublicKey(session)
        if (!cacheKey) cacheKey = img
        const cached = cachedImages.get(cacheKey)
        if (cached) return cached
        if (Functions.isLive2D(img)) {
            const url = await Functions.live2dScreenshot(img)
            let cacheUrl = `${url}#${path.extname(img)}`
            cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (Functions.isModel(img)) {
            const url = await Functions.modelImage(img)
            let cacheUrl = `${url}#${path.extname(img)}`
            cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (Functions.isAudio(img)) {
            const url = await Functions.songCover(img)
            let cacheUrl = `${url}#${path.extname(img)}`
            cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (forceImage && Functions.isVideo(img)) {
            const url = await Functions.videoThumbnail(img)
            let cacheUrl = `${url}#${path.extname(img)}`
            cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (permissions.noEncryption(session)) return img
        let isAnimatedWebP = false
        let arrayBuffer = null as ArrayBuffer | null
        let decryptedImg = img
        if (Functions.isImage(img)) {
            if (Functions.isWebP(img)) {
                arrayBuffer = await fetch(img).then((r) => r.arrayBuffer()) as ArrayBuffer
                isAnimatedWebP = Functions.isAnimatedWebp(arrayBuffer)
            }
            if (!isAnimatedWebP) decryptedImg = await cryptoFunctions.decryptedLink(img, privateKey, serverPublicKey, session)
        }
        const base64 = await Functions.linkToBase64(decryptedImg)
        if (Functions.isVideo(img) || Functions.isGIF(img) || isAnimatedWebP) {
            if (!arrayBuffer) arrayBuffer = await fetch(decryptedImg).then((r) => r.arrayBuffer()) as ArrayBuffer
            const url = URL.createObjectURL(new Blob([arrayBuffer]))
            let cacheUrl = `${url}#${path.extname(img)}`
            cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        } else {
            if (base64) cachedImages.set(cacheKey, base64)
            return base64
        }
    }

    public static decryptItem = async (img: string, session: Session, cacheKey?: string) => {
        if (permissions.noEncryption(session)) return img
        if (!privateKey) await Functions.updateClientKeys(session)
        if (!serverPublicKey) await Functions.updateServerPublicKey(session)
        if (!cacheKey) cacheKey = img
        const cached = cachedImages.get(cacheKey)
        if (cached) return cached
        if (Functions.isModel(img) || Functions.isAudio(img) || 
            Functions.isVideo(img) || Functions.isLive2D(img)) {
            return img
        }
        let isAnimatedWebP = false
        let arrayBuffer = null as ArrayBuffer | null
        let decrypted = img
        if (Functions.isImage(img)) {
            if (Functions.isWebP(img)) {
                arrayBuffer = await fetch(img).then((r) => r.arrayBuffer()) as ArrayBuffer
                isAnimatedWebP = Functions.isAnimatedWebp(arrayBuffer)
            }
            if (!isAnimatedWebP) decrypted = await cryptoFunctions.decryptedLink(img, privateKey, serverPublicKey, session)
        }
        const base64 = await Functions.linkToBase64(decrypted)
        if (Functions.isGIF(img) || isAnimatedWebP) {
            if (!arrayBuffer) arrayBuffer = await fetch(decrypted).then((r) => r.arrayBuffer()) as ArrayBuffer
            const url = URL.createObjectURL(new Blob([arrayBuffer]))
            let cacheUrl = `${url}#${path.extname(img)}`
            cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        } else {
            if (base64) cachedImages.set(cacheKey, base64)
            return base64
        }
    }

    public static decryptBuffer = async (buffer: ArrayBuffer, imageLink: string, session: Session) => {
        if (permissions.noEncryption(session)) return buffer
        if (!privateKey) await Functions.updateClientKeys(session)
        if (!serverPublicKey) await Functions.updateServerPublicKey(session)
        if (Functions.isModel(imageLink) || Functions.isAudio(imageLink) || 
            Functions.isVideo(imageLink) || Functions.isLive2D(imageLink)) {
            return buffer
        }
        let isAnimatedWebP = false
        let decrypted = buffer
        if (Functions.isImage(imageLink)) {
            if (Functions.isWebP(imageLink)) {
                isAnimatedWebP = Functions.isAnimatedWebp(buffer)
            }
            if (!isAnimatedWebP) decrypted = cryptoFunctions.decrypt(buffer, privateKey, serverPublicKey, session)
        }
        return decrypted
    }

    public static generateSlug = (name: string) => {
        let slug = String(name).trim().toLowerCase().replace(/\s+/g, "-").replaceAll("/", "").replaceAll("\\", "")
        if (slug.startsWith("#")) slug = slug.replaceAll("#", "")
        if (slug.startsWith("?")) slug = slug.replaceAll("?", "")
        if (slug.startsWith("&")) slug = slug.replaceAll("&", "")
        return slug
    }

    public static postSlug = (title?: string | null, englishTitle?: string | null) => {
        if (!title) return "untitled"
        if (englishTitle) return Functions.generateSlug(englishTitle)
        return Functions.generateSlug(title)
    }

    public static pixelateEffect = (canvas: HTMLCanvasElement | null, image: CanvasDrawable | null, 
        pixelate: number, opt?: PixelateOptions) => {
        if (!opt) opt = {}
        if (!canvas || !image) return canvas
        if (opt.isAnimation || opt.isVideo) return canvas
        const ctx = canvas.getContext("2d")!
        const imageWidth = (image instanceof ImageBitmap ? image.width : image.clientWidth)
        const imageHeight = (image instanceof ImageBitmap ? image.height : image.clientHeight)
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        canvas.width = opt.directWidth ? pixelWidth : imageWidth
        canvas.height = opt.directWidth ? pixelHeight : imageHeight
        if (pixelate !== 1) {
            ctx.drawImage(image, 0, 0, pixelWidth, pixelHeight)
            if (landscape) {
                canvas.style.width = `${imageWidth * pixelate}px`
                canvas.style.height = "auto"
            } else {
                canvas.style.width = "auto"
                canvas.style.height = `${imageHeight * pixelate}px`
            }
            canvas.style.opacity = "1"
        } else {
            canvas.style.width = "none"
            canvas.style.height = "none"
            canvas.style.opacity = "0"
        }
        return canvas
    }

    public static splatterEffect = (canvas: HTMLCanvasElement | null, image: CanvasDrawable | null, 
        splatter: number, opt?: SplatterOptions) => {
        if (!opt) opt = {}
        if (!canvas || !image) return canvas
        if (opt.isAnimation || opt.isVideo) return canvas
        if (splatter !== 0) {
            canvas.style.opacity = "1"
            const imageWidth = (image instanceof ImageBitmap ? image.width : image.clientWidth)
            const imageHeight = (image instanceof ImageBitmap ? image.height : image.clientHeight)
            canvas.width = imageWidth
            canvas.height = imageHeight
            const ctx = canvas.getContext("2d")!

            ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

            const lineAmount = splatter * (opt.lineMultiplier || 30) * (opt.imageExpand ? 2 : 1)
            const minOpacity = opt.minOpacity || 0.1
            const maxOpacity = opt.maxOpacity || 0.2
            const minLineWidth = opt.minLineWidth || 1
            const maxLineWidth = opt.maxLineWidth || 7
            const minLineLength = opt.minLineLength || 50
            const maxLineLength = opt.maxLineLength || 70
            const maxAngle = opt.maxAngle || 180

            const lineCount = Math.floor(Math.random() * lineAmount) + lineAmount
            const blendModes = ["lighter"] as GlobalCompositeOperation[]
            for (let i = 0; i < lineCount; i++) {
                const startX = Math.random() * canvas.width
                const startY = Math.random() * canvas.height
                const length = Math.random() * (maxLineLength - minLineLength) + minLineLength

                const radians = (Math.PI / 180) * maxAngle
                let angle1 = Math.random() * radians - radians / 2
                let angle2 = Math.random() * radians - radians / 2

                const controlX1 = startX + length * Math.cos(angle1)
                const controlY1 = startY + length * Math.sin(angle1)
                const controlX2 = startX + length * Math.cos(angle2)
                const controlY2 = startY + length * Math.sin(angle2)
                const endX = startX + length * Math.cos((angle1 + angle2) / 2)
                const endY = startY + length * Math.sin((angle1 + angle2) / 2)

                const opacity = Math.random() * (maxOpacity - minOpacity) + minOpacity
                const lineWidth = Math.random() * (maxLineWidth - minLineWidth) + minLineWidth
                const blendMode = blendModes[Math.floor(Math.random() * blendModes.length)]

                ctx.globalAlpha = opacity
                ctx.globalCompositeOperation = blendMode
                ctx.strokeStyle = "#ffffff"
                ctx.lineWidth = lineWidth
                ctx.beginPath()
                ctx.moveTo(startX, startY)
                ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY)
                ctx.stroke()
            }
            ctx.globalAlpha = 1
            ctx.globalCompositeOperation = "source-over"
        } else {
            canvas.style.opacity = "0"
        }
        return canvas
    }

    public static parseUserAgent = (userAgent?: string) => {
        if (!userAgent) return "unknown"
        let os = "unknown"
        let browser = "unknown"
    
        const osPatterns = {
            "Windows": /Windows NT (\d+\.\d+)/,
            "macOS": /Macintosh; Intel Mac OS X (\d+[_\.]\d+)/,
            "Linux": /Linux/,
            "iPhone": /iPhone OS (\d+[_\.]\d+)/,
            "iPad": /iPad; CPU OS (\d+[_\.]\d+)/,
            "Android": /Android (\d+\.\d+)/
        }
    
        const browserPatterns = {
            "Chrome": /Chrome\/(\d+\.\d+)/,
            "Firefox": /Firefox\/(\d+\.\d+)/,
            "Safari": /Version\/(\d+\.\d+).*Safari\//,
            "Internet Explorer": /MSIE (\d+\.\d+)/,
            "Edge": /Edg\/(\d+\.\d+)/,
            "Opera": /Opera\/(\d+\.\d+)|OPR\/(\d+\.\d+)/,
            "Brave": /Brave\/(\d+\.\d+)/,
            "Vivaldi": /Vivaldi\/(\d+\.\d+)/
        }
    
        for (const [key, pattern] of Object.entries(osPatterns)) {
            const match = userAgent.match(pattern)
            if (match) {
                os = key
                break
            }
        }
    
        for (const [key, pattern] of Object.entries(browserPatterns)) {
            const match = userAgent.match(pattern)
            if (match) {
                browser = key
                break
            }
        }
      
        if (os === "unknown" && browser === "unknown") {
          return userAgent
        }

        return `${os} ${browser}`
    }

    public static isJapaneseText = (text: string) => {
        return /[\u3040-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]/.test(text)
    }

    public static bufferToPem = (buffer: ArrayBuffer, label: string) => {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        return `-----BEGIN ${label}-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`
    }

    public static pemToBuffer = (pem: string) => {
        const base64 = pem.replace(/-----BEGIN .*-----|-----END .*-----|\s+/g, "")
        const binary = atob(base64)
        const buffer = new ArrayBuffer(binary.length)
        const view = new Uint8Array(buffer)
        for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
        return buffer
    }

    public static getTagColor = (tag: Tag | TagHistory | MiniTag | TagCount) => {
        if ((tag as Tag).banned) return "strikethrough"
        if ((tag as Tag).r18) return "r18-tag-color"
        if (tag.type === "artist") return "artist-tag-color"
        if (tag.type === "character") return "character-tag-color"
        if (tag.type === "series") return "series-tag-color"
        if (tag.type === "meta") return "meta-tag-color"
        if (tag.type === "appearance") return "appearance-tag-color"
        if (tag.type === "outfit") return "outfit-tag-color"
        if (tag.type === "accessory") return "accessory-tag-color"
        if (tag.type === "action") return "action-tag-color"
        if (tag.type === "scenery") return "scenery-tag-color"
        return "tag-color"
    }

    public static filterNulls = <T>(arr?: (T | null | undefined)[] | null) => {
        if (!arr) return []
        return arr.filter((item) => item !== null && item !== undefined) as T[]
    }

    public static safeNumber = (text: string) => {
        if (Number.isNaN(Number(text))) return null
        return Number(text)
    }

    public static tagObject = (tags: string[]) => {
        return tags.map((tag) => ({tag})) as UploadTag[]
    }

    public static cleanArray = <T>(arr?: T[]) => {
        if (!arr) return []
        return arr.filter(item => item && (typeof item !== "object" || Object.keys(item).length > 0))
    }

    public static currentUploads = (pending: UnverifiedPost[] = []) => {
        return pending.reduce((count, p) => count + (p.deleted ? 0 : 1), 0)
    }

    public static invalidTags = (characters: UploadTag[] | string[], series: UploadTag[] | string[], tags: string[]) => {
        const characterArr = characters.map((c: UploadTag | string) => typeof c === "string" ? c : c.tag)
        const seriesArr = series.map((s: UploadTag | string) => typeof s === "string" ? s : s.tag)
        let rawTags = `${characterArr.join(" ")} ${seriesArr.join(" ")} ${tags.join(" ")}`
        if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
            return "Invalid characters in tags: , _ / \\"
        }
        return null
    }

    public static openPost = async (postResolvable: Post | PostHistory | string | null, event: React.MouseEvent, history: any, 
        session: Session, setSessionFlag: (value: boolean) => void, historyIndex = "") => {
        if (!postResolvable) return
        let post = postResolvable as Post | undefined
        if (typeof postResolvable === "string") post = await Functions.get("/api/post", {postID: postResolvable as string}, session, setSessionFlag)
        if (!post) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${post.postID}/${post.slug}${historyIndex}`, "_blank")
        } else {
            history.push(`/post/${post.postID}/${post.slug}${historyIndex}`)
        }
    }

    public static processRedirects = async (post: PostFull | PostSearch | PostHistory | null, postID: string, slug: string, history: any, 
        session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!post || postID !== post.postID) return
        slug = decodeURIComponent(slug).trim()
        if (slug !== post.slug) {
            if (!permissions.isMod(session)) {
                const redirects = await Functions.get("/api/post/redirects", {postID}, session, setSessionFlag)
                for (const redirect of redirects) {
                    if (redirect.oldSlug === slug) {
                        const searchParams = new URLSearchParams(window.location.search)
                        const newPath = location.pathname.replace(/(?<=\d+)\/[^/]+$/, "") + `/${post.slug}`
                        return history.replace(`${newPath}?${searchParams}`)
                    }
                }
                Functions.replaceLocation("/404")
            } else {
                const searchParams = new URLSearchParams(window.location.search)
                const newPath = location.pathname.replace(/(?<=\d+)\/[^/]+$/, "") + `/${post.slug}`
                history.replace(`${newPath}?${searchParams}`)
            }
        }
    }

    public static negateBlacklist = (blacklist: string) => {
        const blacklistArr = blacklist.split(/ +/g).slice(0, 10)
        let newBlacklist = [] as string[]
        for (const item of blacklistArr) {
            if (!item) continue
            if (item.startsWith("*")) continue
            if (item.startsWith("+-")) {
                newBlacklist.push(`+${item}`)
            } else if (item.startsWith("+")) {
                newBlacklist.push(`+-${item}`)
            } else if (item.startsWith("-")) {
                newBlacklist.push(item)
            } else {
                newBlacklist.push(`-${item}`)
            }
        }
        return newBlacklist
    }
}