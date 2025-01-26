import functions from "./Functions"
import permissions from "./Permissions"
import enLocale from "../assets/locales/en.json"
import {UploadImage, Session, Dimensions} from "../types/Types"
import JSZip from "jszip"
import path from "path"

export default class ImageFunctions {
    public static allowedFileType = (file: File | JSZip.JSZipObject, bytes: Uint8Array, inZip?: boolean) => {
        const result = functions.bufferFileType(bytes)?.[0] || {}
        const jpg = result?.mime === "image/jpeg"
        const png = result?.mime === "image/png"
        const gif = result?.mime === "image/gif"
        const webp = result?.mime === "image/webp"
        const avif = result?.mime === "image/avif"
        const mp4 = result?.mime === "video/mp4"
        const mp3 = result?.mime === "audio/mpeg"
        const wav = result?.mime === "audio/x-wav"
        const glb = functions.isGLTF(file.name)
        const fbx = functions.isFBX(file.name)
        const obj = functions.isOBJ(file.name)
        if (glb) result.typename = "glb"
        if (fbx) result.typename = "fbx"
        if (obj) result.typename = "obj"
        if (result?.typename === "mkv") result.typename = "webm"
        const webm = (path.extname(file.name) === ".webm" && result?.typename === "webm")
        const zip = result?.mime === "application/zip"
        let allowed = false
        if (inZip) {
            allowed = jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj
        } else {
            allowed = jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj || zip
        }
        const maxSize = functions.maxFileSize({jpg, png, avif, mp3, wav, gif, webp, glb, fbx, obj, mp4, webm, zip})
        return {allowed, maxSize, result}
    }

    public static readFileBytes = async (file: File) => {
        return new Promise<Uint8Array>((resolve, reject) => {
            const fileReader = new FileReader()
            fileReader.onloadend = () => {
                const bytes = new Uint8Array(fileReader.result as ArrayBuffer)
                resolve(bytes)
            }
            fileReader.onerror = reject
            fileReader.readAsArrayBuffer(file)
        })
    }

    public static dimensions = async (link: string) => {
        let dimensions = {width: 0, height: 0, size: 0} as Dimensions
        if (functions.isLive2D(link)) {
            dimensions = await functions.live2dDimensions(link)
        } else if (functions.isVideo(link)) {
            dimensions = await functions.imageDimensions(link)
        } else if (functions.isModel(link)) {
            dimensions = await functions.modelDimensions(link)
        } else if (functions.isAudio(link)) {
            dimensions = await functions.audioDimensions(link)
        } else {
            dimensions = await functions.imageDimensions(link)
        }
        return dimensions
    }

    public static thumbnail = async (link: string) => {
        let thumbnail = ""
        let thumbnailExt = "png"
        if (functions.isLive2D(link)) {
            thumbnail = await functions.live2dScreenshot(link)
        } else if (functions.isVideo(link)) {
            thumbnailExt = "jpg"
            thumbnail = await functions.videoThumbnail(link)
        } else if (functions.isModel(link)) {
            thumbnail = await functions.modelImage(link, path.extname(link))
        } else if (functions.isAudio(link)) {
            thumbnailExt = "jpg"
            thumbnail = await functions.songCover(link)
        } else {
            const bytes = await fetch(link).then((r) => r.arrayBuffer())
            const result = functions.bufferFileType(bytes)?.[0] || {}
            thumbnailExt = result.typename || "jpg"
            thumbnail = link
        }
        thumbnail = await ImageFunctions.resize(thumbnail, thumbnailExt)
        return {thumbnail, thumbnailExt}
    }

    public static validateImages = async (files: File[], links: string[] | undefined, session: Session, i18n: typeof enLocale) => {
        let images = [] as UploadImage[]
        let error = ""
    
        const handleZip = async (bytes: Uint8Array, originalLink: string) => {
            const zip = new JSZip()
            const zipFile = await zip.loadAsync(bytes)
            for (const filename in zipFile.files) {
                const file = zipFile.files[filename]
                if (file.dir || filename.startsWith("__MACOSX/")) continue
                const contents = await file.async("uint8array")
                const {allowed, result} = ImageFunctions.allowedFileType(file, contents, true)
                let url = URL.createObjectURL(new Blob([contents]))
                let ext = result.typename
                let link = `${url}#.${ext}`
                let {thumbnail, thumbnailExt} = await ImageFunctions.thumbnail(link)
                let {width, height, size, duration} = await ImageFunctions.dimensions(link)
                if (allowed) {
                    images.push({
                        link, originalLink, ext: result.typename, size,
                        thumbnail, thumbnailExt, width, height, duration,
                        bytes: Object.values(bytes), name: filename
                    })
                } else {
                    error = i18n.pages.upload.supportedFiletypesZip
                }
            }
        }
    
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const originalLink = links?.[i] || ""
            const bytes = await ImageFunctions.readFileBytes(file)
            const {allowed, maxSize, result} = ImageFunctions.allowedFileType(file, bytes)
            let url = URL.createObjectURL(file)
            let ext = result.typename
            let link = `${url}#.${ext}`
            let {thumbnail, thumbnailExt} = await ImageFunctions.thumbnail(link)
            let {width, height, size, duration} = await ImageFunctions.dimensions(link)
            let live2d = false
            if (allowed) {
                const MB = file.size / (1024 * 1024)
                if (MB <= maxSize || permissions.isMod(session)) {
                    if (result.mime === "application/zip") {
                        live2d = await functions.isLive2DZip(bytes)
                        if (live2d) {
                            images.push({
                                link, originalLink, ext: "zip", size,
                                thumbnail, thumbnailExt, width, height, duration,
                                bytes: Object.values(bytes), name: file.name
                            })
                        } else {
                            await handleZip(bytes, originalLink)
                        }
                    } else {
                        images.push({
                            link, originalLink, ext, size,
                            thumbnail, thumbnailExt, width, height, duration,
                            bytes: Object.values(bytes), name: file.name
                        })
                    }
                } else {
                    error = `${result.typename.toUpperCase()} ${i18n.pages.upload.maxFileSize}: ${maxSize}MB`
                }
            } else {
                error = i18n.pages.upload.supportedFiletypes
            }
        }
        return {error, images}
    }

    public static validateTagImage = async (file: File) => {
        let bytes = await ImageFunctions.readFileBytes(file)
        const result = functions.bufferFileType(bytes)?.[0]
        const jpg = result?.mime === "image/jpeg"
        const png = result?.mime === "image/png"
        const gif = result?.mime === "image/gif"
        const webp = result?.mime === "image/webp"
        const avif = result?.mime === "image/avif"
        if (jpg || png || gif || webp || avif) {
            const MB = bytes.byteLength / (1024*1024)
            const maxSize = functions.maxTagFileSize({jpg, png, gif, webp, avif})
            if (MB <= maxSize) {
                let url = URL.createObjectURL(file)
                let croppedURL = ""
                if (gif) {
                    const gifData = await functions.extractGIFFrames(bytes.buffer)
                    let frameArray = [] as Buffer[] 
                    let delayArray = [] as number[]
                    for (let i = 0; i < gifData.length; i++) {
                        const canvas = gifData[i].frame as HTMLCanvasElement
                        const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                        frameArray.push(cropped)
                        delayArray.push(gifData[i].delay)
                    }
                    const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1, false)
                    const {width, height} = await functions.imageDimensions(firstURL)
                    const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                    const blob = new Blob([buffer])
                    croppedURL = URL.createObjectURL(blob)
                } else {
                    croppedURL = await functions.crop(url, 1, false)
                }
                const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                bytes = new Uint8Array(arrayBuffer)
                const blob = new Blob([bytes])
                url = URL.createObjectURL(blob)
                let ext = result.typename
                let image = `${url}#.${ext}`
                return {image, ext, bytes: Object.values(bytes)}
            }
        }
        return null
    }

    public static resize = async (image: string, ext = "png", size = 1000) => {
        const img = new Image()
        img.src = image
        await new Promise(resolve => {
            img.onload = resolve
        })
        const scale = Math.min(size / img.width, size / img.height)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        if (ext === "jpg") ext = "jpeg"
        return canvas.toDataURL(`image/${ext}`)
    }
}