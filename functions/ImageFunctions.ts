import functions from "./Functions"
import permissions from "../structures/Permissions"
import enLocale from "../assets/locales/en.json"
import {isLive2DZip} from "live2d-renderer"
import ImageTracer from "imagetracerjs"
import {optimize} from "svgo"
import JSZip from "jszip"
import path from "path"
import {UploadImage, Session, Dimensions, Post, SplatterOptions, PixelateOptions, CanvasDrawable} from "../types/Types"

export default class ImageFunctions {
    public static allowedFileType = (file: File | JSZip.JSZipObject, bytes: Uint8Array, inZip?: boolean) => {
        const result = functions.byte.bufferFileType(bytes)?.[0] || {}
        const jpg = result?.mime === "image/jpeg"
        const png = result?.mime === "image/png"
        const gif = result?.mime === "image/gif"
        const webp = result?.mime === "image/webp"
        const avif = result?.mime === "image/avif"
        const mp4 = result?.mime === "video/mp4"
        const mp3 = result?.mime === "audio/mpeg"
        const wav = result?.mime === "audio/x-wav"
        const glb = functions.file.isGLTF(file.name)
        const fbx = functions.file.isFBX(file.name)
        const obj = functions.file.isOBJ(file.name)
        const vrm = functions.file.isVRM(file.name)
        if (glb) result.typename = "glb"
        if (fbx) result.typename = "fbx"
        if (obj) result.typename = "obj"
        if (vrm) result.typename = "vrm"
        if (result?.typename === "mkv") result.typename = "webm"
        const webm = (path.extname(file.name) === ".webm" && result?.typename === "webm")
        const zip = result?.mime === "application/zip"
        let allowed = false
        if (inZip) {
            allowed = jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj || vrm
        } else {
            allowed = jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj || vrm || zip
        }
        const maxSize = functions.validation.maxFileSize({jpg, png, avif, mp3, wav, gif, webp, glb, fbx, obj, vrm, mp4, webm, zip})
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
        if (functions.file.isLive2D(link)) {
            dimensions = await functions.model.live2dDimensions(link)
        } else if (functions.file.isVideo(link)) {
            dimensions = await this.imageDimensions(link)
        } else if (functions.file.isModel(link)) {
            dimensions = await functions.model.modelDimensions(link)
        } else if (functions.file.isAudio(link)) {
            dimensions = await functions.audio.audioDimensions(link)
        } else {
            dimensions = await this.imageDimensions(link)
        }
        return dimensions
    }

    public static thumbnail = async (link: string) => {
        let thumbnail = ""
        let thumbnailExt = "png"
        if (functions.file.isLive2D(link)) {
            thumbnail = await functions.model.live2dScreenshot(link)
        } else if (functions.file.isVideo(link)) {
            thumbnailExt = "jpg"
            thumbnail = await functions.video.videoThumbnail(link)
        } else if (functions.file.isModel(link)) {
            thumbnail = await functions.model.modelImage(link, path.extname(link))
        } else if (functions.file.isAudio(link)) {
            thumbnailExt = "jpg"
            thumbnail = await functions.audio.songCover(link)
        } else {
            /* Disable thumbnails for images
            const bytes = await fetch(link).then((r) => r.arrayBuffer())
            const result = functions.bufferFileType(bytes)?.[0] || {}
            thumbnailExt = result.typename || "jpg"
            thumbnail = link*/
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
                let url = URL.createObjectURL(new Blob([new Uint8Array(contents)]))
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
                        live2d = await isLive2DZip(new Uint8Array(bytes).buffer)
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
        const result = functions.byte.bufferFileType(bytes)?.[0]
        const jpg = result?.mime === "image/jpeg"
        const png = result?.mime === "image/png"
        const gif = result?.mime === "image/gif"
        const webp = result?.mime === "image/webp"
        const avif = result?.mime === "image/avif"
        if (jpg || png || gif || webp || avif) {
            const MB = bytes.byteLength / (1024*1024)
            const maxSize = functions.validation.maxTagFileSize({jpg, png, gif, webp, avif})
            if (MB <= maxSize) {
                let url = URL.createObjectURL(file)
                let croppedURL = ""
                if (gif) {
                    const gifData = await functions.video.extractGIFFrames(new Uint8Array(bytes).buffer)
                    let frameArray = [] as ArrayBuffer[] 
                    let delayArray = [] as number[]
                    for (let i = 0; i < gifData.length; i++) {
                        const canvas = gifData[i].frame as HTMLCanvasElement
                        const cropped = await this.crop(canvas.toDataURL(), 1, true)
                        frameArray.push(cropped)
                        delayArray.push(gifData[i].delay)
                    }
                    const firstURL = await this.crop(gifData[0].frame.toDataURL(), 1, false)
                    const {width, height} = await this.imageDimensions(firstURL)
                    const buffer = await functions.video.encodeGIF(frameArray, delayArray, width, height)
                    const blob = new Blob([new Uint8Array(buffer)])
                    croppedURL = URL.createObjectURL(blob)
                } else {
                    croppedURL = await this.crop(url, 1, false)
                }
                const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                bytes = new Uint8Array(arrayBuffer)
                const blob = new Blob([new Uint8Array(bytes)])
                url = URL.createObjectURL(blob)
                let ext = result.typename
                let image = `${url}#.${ext}`
                return {image, ext, bytes: Object.values(bytes)}
            }
        }
        return null
    }

    public static resize = async (image: string, ext = "png", size = 1000) => {
        if (!image) return ""
        const img = new window.Image()
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = (err) => reject(err)
            img.src = image
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

    public static trimCanvas = (canvas: HTMLCanvasElement) => {
        const context = canvas.getContext("2d")!

        const topLeft = {
            x: canvas.width,
            y: canvas.height,
            update(x: number, y: number){
                this.x = Math.min(this.x,x)
                this.y = Math.min(this.y,y)
            }
        }

        const bottomRight = {
            x: 0,
            y: 0,
            update(x: number, y: number) {
                this.x = Math.max(this.x, x)
                this.y = Math.max(this.y, y)
            }
        }

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

        for(let x = 0; x < canvas.width; x++) {
            for(let y = 0; y < canvas.height; y++) {
                const alpha = imageData.data[((y * (canvas.width * 4)) + (x * 4)) + 3]
                if(alpha !== 0) {
                    topLeft.update(x, y)
                    bottomRight.update(x, y)
                }
            }
        }

        const width = bottomRight.x - topLeft.x
        const height = bottomRight.y - topLeft.y

        const croppedCanvas = context.getImageData(topLeft.x, topLeft.y, width, height)
        canvas.width = width
        canvas.height = height
        context.putImageData(croppedCanvas, 0, 0)

        return canvas
    }

    public static toCanvas = async (image: string) => {
        const img = await this.createImage(image)
        const canvas = document.createElement("canvas") as HTMLCanvasElement
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas
    }

    public static imageDimensions = async (image: string) => {
        return new Promise<{width: number, height: number, size: number, duration?: number}>(async (resolve) => {
            if (functions.file.isVideo(image)) {
                const video = document.createElement("video")
                video.addEventListener("loadedmetadata", async () => {
                    let width = video.videoWidth 
                    let height = video.videoHeight
                    let duration = video.duration
                    try {
                        const r = await fetch(image).then(((r) => r.arrayBuffer()))
                        const size = r.byteLength
                        resolve({width, height, size, duration})
                    } catch {
                        resolve({width, height, size: 0, duration})
                    }
                })
                video.src = image
            } else {
                const img = document.createElement("img")
                img.addEventListener("load", async () => {
                    let width = img.width
                    let height = img.height
                    try {
                        let duration = await functions.video.animationDuration(image)
                        const r = await fetch(image).then((r) => r.arrayBuffer())
                        const size = r.byteLength 
                        resolve({width, height, size, duration})
                    } catch {
                        resolve({width, height, size: 0, duration: 0})
                    }
                })
                img.src = image
            }
        })
    }

    public static imageSearch = async (file: File, session: Session, setSessionFlag: (value: boolean) => void) => {
        const fileReader = new FileReader()
        return new Promise<Post[]>((resolve) => {
            fileReader.onloadend = async (f: ProgressEvent<FileReader>) => {
                let bytes = new Uint8Array(f.target?.result as ArrayBuffer)
                const result = functions.byte.bufferFileType(bytes)?.[0] || {}
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const webp = result?.mime === "image/webp"
                const avif = result?.mime === "image/avif"
                const gif = result?.mime === "image/gif"
                const mp4 = result?.mime === "video/mp4"
                const mp3 = result?.mime === "audio/mpeg"
                const wav = result?.mime === "audio/x-wav"
                const glb = functions.file.isGLTF(file.name)
                const fbx = functions.file.isFBX(file.name)
                const obj = functions.file.isOBJ(file.name)
                const vrm = functions.file.isVRM(file.name)
                if (glb) result.typename = "glb"
                if (fbx) result.typename = "fbx"
                if (obj) result.typename = "obj"
                if (vrm) result.typename = "vrm"
                const webm = (path.extname(file.name) === ".webm" && result?.typename === "mkv")
                if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj || vrm) {
                    if (mp4 || webm) {
                        const url = URL.createObjectURL(file)
                        const thumbnail = await functions.video.videoThumbnail(url)
                        bytes = await functions.byte.base64toUint8Array(thumbnail)
                    }
                    const similar = await functions.http.post("/api/search/similar", {bytes: Object.values(bytes), useMD5: false}, session, setSessionFlag)
                    resolve(similar)
                }
            }
            fileReader.readAsArrayBuffer(file)
        })
    }

    public static createImage = async (image: string) => {
        const img = new window.Image()
        img.src = image
        return new Promise<HTMLImageElement>((resolve) => {
            img.onload = () => resolve(img)
        })
    }

    public static crop = async <T extends boolean | undefined>(url: string, aspectRatio: number, buffer?: T, jpeg?: boolean) => {
        type CropReturn = T extends true ? ArrayBuffer : string
        return new Promise<CropReturn>((resolve) => {
            const inputImage = new window.Image()
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

    public static pixelateEffect = async (canvas: HTMLCanvasElement | null, image: CanvasDrawable | null, 
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
        if (splatter !== 0) {
            canvas.style.opacity = "1"
            const imageWidth = (image instanceof ImageBitmap ? image.width : image.clientWidth)
            const imageHeight = (image instanceof ImageBitmap ? image.height : image.clientHeight)
            canvas.width = imageWidth
            canvas.height = imageHeight
            const ctx = canvas.getContext("2d")!

            if (!opt.isAnimation && !opt.isVideo) ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

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

    public static convertToFormat = async (image: string, format: string) => {
        const img = await this.createImage(image)
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
            const avifJS = await import("../assets/wasm/avif_enc").then((r) => r.default)
            const avif = await avifJS({})
            const options = {quality: 80, qualityAlpha: -1, denoiseLevel: 0, tileColsLog2: 0, tileRowsLog2: 0, speed: 6, subsample: 1, 
            chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false}
            const output = await avif.encode(pixels.data, pixels.width, pixels.height, options)
            const blob = new Blob([output], {type: "image/avif"})
            return URL.createObjectURL(blob)
        } else if (format === "jxl") {
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const jxlJS = await import("../assets/wasm/jxl_enc").then((r) => r.default)
            const jxl = await jxlJS()
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
}