import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import loading from "../assets/purple/loading.gif"
import loadingMagenta from "../assets/magenta/loading.gif"
import {ThemeContext, SizeTypeContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext, MobileContext, ScrollYContext,
BlurContext, SharpenContext, SquareContext, PixelateContext, DownloadFlagContext, DownloadURLsContext, SpeedContext, ReverseContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import gifFrames from "gif-frames"
import JSZip from "jszip"
import path from "path"
import functions from "../structures/Functions"
import "./styles/gridimage.less"

interface Props {
    id: number
    img: string
    width?: number
    height?: number
    comicPages?: any
    post: any
}

const GridImage: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const [imageSize, setImageSize] = useState(270) as any
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {square, setSquare} = useContext(SquareContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {scrollY, setScrollY} = useContext(ScrollYContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const containerRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const lightnessRef = useRef<HTMLImageElement>(null)
    const ref = useRef<HTMLImageElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const videoOverlayRef = useRef<HTMLCanvasElement>(null)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [backFrame, setBackFrame] = useState("")
    const [drag, setDrag] = useState(false)
    const [gifData, setGIFData] = useState(null) as any
    const [videoData, setVideoData] = useState(null) as any
    const {speed, setSpeed} = useContext(SpeedContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [seekTo, setSeekTo] = useState(null) as any
    const [secondsProgress, setSecondsProgress] = useState(0)
    const history = useHistory()

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setGIFData(null)
        setVideoData(null)
        setBackFrame("")
        setSecondsProgress(0)
        setSeekTo(null)
        if (ref.current) ref.current.style.opacity = "1"
        if (videoRef.current) videoRef.current.style.opacity = "1"
    }, [props.img])

    useEffect(() => {
        const parseGIF = async () => {
            const start = new Date()
            const frames = await gifFrames({url: props.img, frames: "all", outputType: "canvas"})
            const newGIFData = [] as any
            for (let i = 0; i < frames.length; i++) {
                newGIFData.push({
                    frame: frames[i].getImage(),
                    delay: frames[i].frameInfo.delay * 10
                })
            }
            setGIFData(newGIFData)
            const end = new Date()
            const seconds = (end.getTime() - start.getTime()) / 1000
            setSeekTo(seconds)
        }
        const parseAnimatedWebP = async () => {
            const start = new Date()
            const arraybuffer = await fetch(props.img).then((r) => r.arrayBuffer())
            const animated = await functions.isAnimatedWebp(arraybuffer)
            if (!animated) return 
            const frames = await functions.extractAnimatedWebpFrames(props.img)
            setGIFData(frames)
            const end = new Date()
            const seconds = (end.getTime() - start.getTime()) / 1000
            setSeekTo(seconds)
        }
        if (imageLoaded && functions.isGIF(props.img)) {
            parseGIF()
        }
        if (imageLoaded && functions.isWebP(props.img)) {
            parseAnimatedWebP()
        }
    }, [imageLoaded])

    const getVideoData = async () => {
        if (!videoRef.current) return
        if (functions.isMP4(props.img)) {
            const frames = await functions.extractMP4Frames(props.img, videoRef.current!.duration)
            let canvasFrames = [] as any 
            for (let i = 0; i < frames.length; i++) {
                const canvas = document.createElement("canvas")
                const img = frames[i]
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext("bitmaprenderer") as any
                ctx.transferFromImageBitmap(img)
                canvasFrames.push(canvas)
            }
            setVideoData(canvasFrames)
        }
    }

    useEffect(() => {
        const parseVideo = async () => {
            if (backFrame) return 
            const thumb = await functions.videoThumbnail(props.img)
            setBackFrame(thumb)
        }
        if (functions.isVideo(props.img)) parseVideo()
    }, [imageLoaded])

    useEffect(() => {
        if (!functions.isVideo(props.img) && !gifData) return
        let id = 0
        let timeout = null as any
        const animationLoop = async () => {
            if (imageLoaded) {
                if (reverse && functions.isVideo(props.img) && !videoData) await getVideoData()
                const adjustedData = gifData ? functions.gifSpeed(gifData, speed) : 
                                    videoData ? functions.videoSpeed(videoData, speed) : null
                if (videoRef.current) videoRef.current.playbackRate = speed 
                const pixelateCanvas = pixelateRef.current
                if (gifData) {
                    if (pixelateCanvas) pixelateCanvas.style.opacity = "1"
                } else if (functions.isVideo(props.img)) {
                    if (pixelateCanvas) pixelateCanvas.style.opacity = "1"
                }
                const pixelateCtx = pixelateCanvas?.getContext("2d")
                const sharpenOverlay = videoOverlayRef.current
                let sharpenCtx = null as any
                if (sharpenOverlay && videoRef.current) {
                    sharpenOverlay.width = videoRef.current.clientWidth
                    sharpenOverlay.height = videoRef.current.clientHeight
                    sharpenCtx = sharpenOverlay.getContext("2d") as any
                }
                let frame = videoRef.current ? videoRef.current! : ref.current!
                let delay = 0
                let pos = 0
                if (adjustedData) {
                    const frames = adjustedData.length - 1
                    const duration = videoData ? videoRef.current!.duration :
                    adjustedData.map((d: any) => d.delay).reduce((p: any, c: any) => p + c) / 1000
                    let interval = duration / frames
                    let sp = seekTo !== null ? seekTo : secondsProgress
                    pos = Math.floor(sp / interval)
                    // if (reverse && gifData) pos = (adjustedData.length - 1) - pos
                    if (!adjustedData[pos]) pos = 0
                    if (gifData) {
                        frame = adjustedData[pos].frame
                        delay = adjustedData[pos].delay
                    } else if (videoData) {
                        frame = adjustedData[pos]
                    }
                }
    
                const update = () => {
                    if (adjustedData) {
                        if (reverse) {
                            pos--
                        } else {
                            pos++
                        }
                        if (pos > adjustedData.length - 1) pos = 0
                        if (pos < 0) pos = adjustedData.length - 1
                        if (gifData) {
                            frame = adjustedData[pos].frame
                            delay = adjustedData[pos].delay
                            if (delay < 0) delay = 0
                        } else if (videoData) {
                            frame = adjustedData[pos]
                        }
                        const frames = adjustedData.length - 1
                        const duration = videoData ? videoRef.current!.duration :
                        adjustedData.map((d: any) => d.delay).reduce((p: any, c: any) => p + c) / 1000
                        let interval = duration / frames
                        const secondsProgress = (pos * interval)
                        setSecondsProgress(secondsProgress)
                    }
                }
    
                const draw = () => {
                    if (sharpenOverlay) {
                        if (sharpen !== 0) {
                            const sharpenOpacity = sharpen / 5
                            sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
                            sharpenOverlay.style.mixBlendMode = "overlay"
                            sharpenOverlay.style.opacity = `${sharpenOpacity}`
                            sharpenCtx?.clearRect(0, 0, sharpenOverlay.width, sharpenOverlay.height)
                            sharpenCtx?.drawImage(frame, 0, 0, sharpenOverlay.width, sharpenOverlay.height)
                        } else {
                            sharpenOverlay.style.filter = "none"
                            sharpenOverlay.style.mixBlendMode = "normal"
                            sharpenOverlay.style.opacity = "0"
                        }
                    }
                    if (pixelateCanvas) {
                        if (pixelate !== 1) {
                            const pixelWidth = pixelateCanvas.width / pixelate
                            const pixelHeight = pixelateCanvas.height / pixelate
                            pixelateCtx?.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
                            pixelateCtx?.drawImage(frame, 0, 0, pixelWidth, pixelHeight)
                            const landscape = pixelateCanvas.width >= pixelateCanvas.height
                            if (landscape) {
                                pixelateCanvas.style.width = `${pixelateCanvas.width * pixelate}px`
                                pixelateCanvas.style.height = "auto"
                            } else {
                                pixelateCanvas.style.width = "auto"
                                pixelateCanvas.style.height = `${pixelateCanvas.height * pixelate}px`
                            }
                            pixelateCanvas.style.imageRendering = "pixelated"
                        } else {
                            pixelateCanvas.style.width = `${pixelateCanvas.width}px`
                            pixelateCanvas.style.height = `${pixelateCanvas.height}px`
                            pixelateCanvas.style.imageRendering = "none"
                            pixelateCtx?.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
                            pixelateCtx?.drawImage(frame, 0, 0, pixelateCanvas.width, pixelateCanvas.height)
                        }
                    }
                }
    
                const videoLoop = async () => {
                    draw()
                    update()
                    await new Promise<void>((resolve) => {
                        if (gifData) {
                            clearTimeout(timeout)
                            timeout = setTimeout(() => {
                                resolve()
                            }, delay)
                        } else {
                            // @ts-ignore
                            if (videoRef.current?.requestVideoFrameCallback) {
                                // @ts-ignore
                                id = videoRef.current?.requestVideoFrameCallback(() => resolve())
                            } else {
                                id = window.requestAnimationFrame(() => resolve())
                            }
                        }
                    }).then(videoLoop)
                    
                }
                videoLoop()
            }
        }
        animationLoop()
        return () => {
            clearTimeout(timeout)
            // @ts-ignore
            if (videoRef.current?.cancelVideoFrameCallback) {
                // @ts-ignore
                videoRef.current?.cancelVideoFrameCallback(id)
            } else {
                window.cancelAnimationFrame(id)
            }
        }
    }, [imageLoaded, gifData, videoData, sharpen, pixelate, square, imageSize, reverse, speed])

    const resizeOverlay = () => {
        if (functions.isVideo(props.img)) {
            if (!videoRef.current || !videoOverlayRef.current || !pixelateRef.current) return
            if (videoRef.current.clientWidth === 0) return
            videoOverlayRef.current.width = videoRef.current.clientWidth
            videoOverlayRef.current.height = videoRef.current.clientHeight
            pixelateRef.current.width = videoRef.current.clientWidth
            pixelateRef.current.height = videoRef.current.clientHeight
        } else {
            if (!ref.current || !pixelateRef.current) return 
            pixelateRef.current.width = ref.current.width
            pixelateRef.current.height = ref.current.height
        }
    }

    useEffect(() => {
        const element = functions.isVideo(props.img) ? videoRef.current! : ref.current!
        new ResizeObserver(resizeOverlay).observe(element)
    }, [])

    const getBorder = () => {
        if (sizeType === "tiny" || sizeType === "small") {
            return "2px solid var(--imageBorder)"
        } else {
            return "3px solid var(--imageBorder)"
        }
    }

    const getSquareOffset = () => {
        if (mobile) {
            if (sizeType === "tiny") return 20
            if (sizeType === "small") return 20
            if (sizeType === "medium") return 25
            if (sizeType === "large") return 30
            if (sizeType === "massive") return 30
        }
        if (sizeType === "tiny") return 10
        if (sizeType === "small") return 12
        if (sizeType === "medium") return 15
        if (sizeType === "large") return 20
        if (sizeType === "massive") return 30
        return 5
    }

    const updateSquare = () => {
        if (!containerRef.current) return
        const currentRef = functions.isVideo(props.img) ? videoRef.current! : ref.current!
        const refWidth = functions.isVideo(props.img) ? videoRef.current!.clientWidth : ref.current!.width
        const refHeight = functions.isVideo(props.img) ? videoRef.current!.clientHeight : ref.current!.height
        if (square) {
            const sidebarWidth = document.querySelector(".sidebar")?.clientWidth || 0
            const width = window.innerWidth - sidebarWidth
            const containerWidth = Math.floor(width / (mobile ? functions.getImagesPerRowMobile(sizeType) : functions.getImagesPerRow(sizeType))) - getSquareOffset()
            containerRef.current.style.width = `${containerWidth}px`
            containerRef.current.style.height = `${containerWidth}px`
            containerRef.current.style.marginBottom = "3px"
            const landscape = refWidth <=refHeight
            if (landscape) {
                currentRef.style.width = `${containerWidth}px`
                currentRef.style.height = "auto"
            } else {
                currentRef.style.width = "auto"
                currentRef.style.height = `${containerWidth}px`
            }
        } else {
            containerRef.current.style.width = "max-content"
            containerRef.current.style.height = "max-content"
            currentRef.style.width = "auto"
            currentRef.style.height = `${imageSize}px`
            containerRef.current.style.marginBottom = "10px"
        }
    }

    useEffect(() => {
        updateSquare()
    }, [square, sizeType, imageSize, imageWidth, imageHeight])


    useEffect(() => {
        if (!containerRef.current) return
        if (imageLoaded) {
            containerRef.current.style.border = getBorder()
        } else {
            containerRef.current.style.border = "none"
        }
    }, [imageLoaded, sizeType])

    useEffect(() => {
        if (mobile) {
            if (sizeType === "tiny") {
                setImageSize(80)
            } else if (sizeType === "small") {
                setImageSize(100)
            } else if (sizeType === "medium") {
                setImageSize(150)
            } else if (sizeType === "large") {
                setImageSize(230)
            } else if (sizeType === "massive") {
                setImageSize(500)
            }
        } else {
            if (sizeType === "tiny") {
                setImageSize(160)
            } else if (sizeType === "small") {
                setImageSize(200)
            } else if (sizeType === "medium") {
                setImageSize(270)
            } else if (sizeType === "large") {
                setImageSize(400)
            } else if (sizeType === "massive") {
                setImageSize(500)
            }
        }
    }, [sizeType])

    useEffect(() => {
        if (!imageFiltersRef.current) return
        const element = imageFiltersRef.current
        let newContrast = contrast
        const image = functions.isVideo(props.img) ? videoRef.current : ref.current
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!image || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${image.src})`
            sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
            sharpenOverlay.style.mixBlendMode = "overlay"
            sharpenOverlay.style.opacity = `${sharpenOpacity}`
        } else {
            sharpenOverlay.style.backgroundImage = "none"
            sharpenOverlay.style.filter = "none"
            sharpenOverlay.style.mixBlendMode = "normal"
            sharpenOverlay.style.opacity = "0"
        }
        if (lightness !== 100) {
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            lightnessOverlay.style.filter = filter
            lightnessOverlay.style.opacity = `${Math.abs((lightness - 100) / 100)}`
        } else {
            lightnessOverlay.style.filter = "none"
            lightnessOverlay.style.opacity = "0"
        }
        element.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen])

    const imagePixelate = () => {
        if (gifData || functions.isGIF(props.img) || functions.isVideo(props.img)) return
        if (!pixelateRef.current) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d") as any
        const imageWidth = functions.isVideo(props.img) ? videoRef.current!.clientWidth : ref.current!.width 
        const imageHeight = functions.isVideo(props.img) ? videoRef.current!.clientHeight : ref.current!.height
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imageWidth
        pixelateCanvas.height = imageHeight
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(ref.current, 0, 0, pixelWidth, pixelHeight)
            if (landscape) {
                pixelateCanvas.style.width = `${imageWidth * pixelate}px`
                pixelateCanvas.style.height = "auto"
            } else {
                pixelateCanvas.style.width = "auto"
                pixelateCanvas.style.height = `${imageHeight * pixelate}px`
            }
            pixelateCanvas.style.opacity = "1"
        } else {
            pixelateCanvas.style.width = "none"
            pixelateCanvas.style.height = "none"
            pixelateCanvas.style.opacity = "0"
        }
    }

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [])

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [pixelate, square, imageSize])

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current) return
        const currentRef = functions.isVideo(props.img) ? videoRef.current! : ref.current!
        const rect = currentRef.getBoundingClientRect()
        const width = rect?.width
        const height = rect?.height
        const x = event.clientX - rect.x
        const y = event.clientY - rect.y
        const translateX = ((x / width) - 0.5) * 3
        const translateY = ((y / height) - 0.5) * 3
        currentRef.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        overlayRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        lightnessRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        pixelateRef.current.style.transformOrigin = "top left"
        pixelateRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
    }

    const cancelImageAnimation = () => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current) return
        const currentRef = functions.isVideo(props.img) ? videoRef.current! : ref.current!
        currentRef.style.transform = "scale(1)"
        overlayRef.current.style.transform = "scale(1)"
        lightnessRef.current.style.transform = "scale(1)"
        pixelateRef.current.style.transformOrigin = "none"
        pixelateRef.current.style.transform = "scale(1)"
    }

    const getLoading = () => {
        if (theme.includes("magenta")) return loadingMagenta
        return loading
    }

    const onLoad = (event: any) => {
        if (functions.isVideo(props.img)) {
            setImageWidth(event.target.clientWidth)
            setImageHeight(event.target.clientHeight)
            setNaturalWidth(event.target.videoWidth)
            setNaturalHeight(event.target.videoHeight)
        } else {
            setImageWidth(event.target.width)
            setImageHeight(event.target.height)
            setNaturalWidth(event.target.naturalWidth)
            setNaturalHeight(event.target.naturalHeight)
        }
        setImageLoaded(true)
        event.target.style.opacity = "1"
    }

    const render = (frame: any, buffer?: boolean) => {
        const canvas = document.createElement("canvas") as any
        canvas.width = naturalWidth
        canvas.height = naturalHeight
        const ctx = canvas.getContext("2d") as any
        let newContrast = contrast
        ctx.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
        if (pixelate !== 1) {
            const pixelateCanvas = document.createElement("canvas")
            const pixelWidth = frame.width / pixelate 
            const pixelHeight = frame.height / pixelate
            pixelateCanvas.width = pixelWidth 
            pixelateCanvas.height = pixelHeight
            const pixelateCtx = pixelateCanvas.getContext("2d") as any
            pixelateCtx.imageSmoothingEnabled = false
            pixelateCtx.drawImage(frame, 0, 0, pixelWidth, pixelHeight)
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(pixelateCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (sharpen !== 0) {
            const sharpnessCanvas = document.createElement("canvas")
            sharpnessCanvas.width = naturalWidth
            sharpnessCanvas.height = naturalHeight
            const sharpnessCtx = sharpnessCanvas.getContext("2d")
            sharpnessCtx?.drawImage(frame, 0, 0, sharpnessCanvas.width, sharpnessCanvas.height)
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
            lightnessCanvas.width = naturalWidth
            lightnessCanvas.height = naturalHeight
            const lightnessCtx = lightnessCanvas.getContext("2d")
            lightnessCtx?.drawImage(frame, 0, 0, lightnessCanvas.width, lightnessCanvas.height)
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            ctx.filter = filter
            ctx.globalAlpha = `${Math.abs((lightness - 100) / 100)}`
            ctx.drawImage(lightnessCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (buffer) {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            return img.data.buffer
        }
        return canvas.toDataURL("image/png")
    }

    const multiRender = async () => {
        if (gifData || functions.isGIF(props.img) || functions.isVideo(props.img)) {
            functions.download(path.basename(props.img), props.img)
        } else {
            if (props.comicPages) {
                const zip = new JSZip()
                for (let i = 0; i < props.comicPages.length; i++) {
                    const page = props.comicPages[i]
                    const img = await functions.createImage(page)
                    const image = await render(img)
                    const data = await fetch(image).then((r) => r.arrayBuffer())
                    zip.file(path.basename(page), data, {binary: true})
                }
                const decoded = decodeURIComponent(props.img)
                const filename = `${path.basename(decoded, path.extname(decoded)).replace(/\d+$/, "")}.zip`
                const blob = await zip.generateAsync({type: "blob"})
                const url = window.URL.createObjectURL(blob)
                functions.download(filename , url)
                window.URL.revokeObjectURL(url)
            } else {
                functions.download(path.basename(props.img), render(ref.current))
            }
        }
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadURLs.includes(props.img)) {
                multiRender()
                setDownloadURLs(downloadURLs.filter((s: string) => s !== props.img))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag])

    const mouseDown = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(false)
    }

    const mouseMove = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(true)
    }

    const mouseUp = async (event: React.MouseEvent<HTMLElement>) => {
        setScrollY(window.scrollY)
        localStorage.setItem("savedPost", JSON.stringify(props.post))
        const tagCache = await functions.tagCategoriesCache(props.post.tags)
        localStorage.setItem("savedTags", JSON.stringify(tagCache))
        if (!drag) {
            if (event.metaKey || event.ctrlKey || event.button == 1) {
                event.preventDefault()
                const newWindow = window.open(`/post/${props.id}`, "_blank")
                newWindow?.blur()
                window.focus()
            } else {
                history.push(`/post/${props.id}`)
            }
            window.scrollTo(0, 0)
        }
    }


    return (
        <div className="image-box" id={String(props.id)} ref={containerRef} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseMove={mouseMove}>
            <div className="image-filters" ref={imageFiltersRef} onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                {functions.isVideo(props.img) ? <video autoPlay loop muted disablePictureInPicture playsInline className="dummy-video" ref={videoRef} src={props.img}></video> : null}   
                <img className="lightness-overlay" ref={lightnessRef} src={functions.isVideo(props.img) ? backFrame : props.img}/>
                <img className="sharpen-overlay" ref={overlayRef} src={props.img}/>
                {functions.isVideo(props.img) ? <canvas className="sharpen-overlay" ref={videoOverlayRef}></canvas> : null}
                <canvas className="pixelate-canvas" ref={pixelateRef}></canvas>
                {functions.isVideo(props.img) ? <>
                <video autoPlay loop muted disablePictureInPicture playsInline className="video" ref={videoRef} src={props.img} onLoadedData={(event) => onLoad(event)}></video></> :
                <img className="image" ref={ref} src={props.img} onLoad={(event) => onLoad(event)}/>}
                </div>
        </div>
    )
}

export default GridImage