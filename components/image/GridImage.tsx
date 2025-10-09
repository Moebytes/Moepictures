import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import loading from "../../assets/icons/loading.gif"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, useCacheActions,
useThemeSelector, useSearchSelector, useSessionSelector, useFlagSelector, useFlagActions, useSearchActions} from "../../store"
import JSZip from "jszip"
import path from "path"
import functions from "../../structures/Functions"
import privateIcon from "../../assets/icons/lock-opt.png"
import emptyVideo from "../../assets/images/empty.mp4"
import "./styles/gridimage.less"
import {PostSearch, GIFFrame, CanvasDrawable} from "../../types/Types"

let tooltipTimer = null as any
let id = 0
let timeout = null as any

interface Props {
    id: string
    img: string
    original: string
    live: string
    cached?: boolean
    comicPages?: string[] | null
    post: PostSearch,
    square?: boolean
    marginBottom?: number
    marginLeft?: number
    height?: number
    borderRadius?: number
    autoLoad?: boolean
    reupdate?: () => void
    onLoad?: () => void
}

interface Ref {
    shouldWait: () => Promise<boolean>
    load: () => Promise<void>
    update: () => Promise<void>
}

const GridImage = forwardRef<Ref, Props>((props, componentRef) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {secondsProgress, reverse, speed, seekTo} = usePlaybackSelector()
    const {setSecondsProgress, setReverse, setSeekTo} = usePlaybackActions()
    const {sizeType, square, scroll, format, selectionMode, selectionItems, selectionPosts} = useSearchSelector()
    const {setSelectionItems, setSelectionPosts} = useSearchActions()
    const {downloadFlag, downloadIDs} = useFlagSelector()
    const {setPostFlag, setDownloadFlag, setDownloadIDs} = useFlagActions()
    const {setScrollY, setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, setToolTipImg} = useInteractionActions()
    const {setPost} = useCacheActions()
    const [imageSize, setImageSize] = useState(240)
    const containerRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const effectRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const lightnessRef = useRef<HTMLImageElement>(null)
    const ref = useRef<HTMLImageElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const videoOverlayRef = useRef<HTMLCanvasElement>(null)
    const privateIconRef = useRef<HTMLImageElement>(null)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [backFrame, setBackFrame] = useState("")
    const [drag, setDrag] = useState(false)
    const [gifData, setGIFData] = useState(null as GIFFrame[] | null)
    const [videoData, setVideoData] = useState(null as ImageBitmap[] | null)
    const [visible, setVisible] = useState(true)
    const [img, setImg] = useState(props.cached ? props.img : "")
    const [staticImg, setStaticImg] = useState("")
    const [liveImg, setLiveImg] = useState("")
    const [loadingFrames, setLoadingFrames] = useState(false)
    const [pageBuffering, setPageBuffering] = useState(true)
    const [selected, setSelected] = useState(false)
    const [hover, setHover] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useImperativeHandle(componentRef, () => ({
        shouldWait: async () => {
            let isAnimatedWebP = false
            if (functions.isWebP(props.original)) {
                const arraybuffer = await fetch(props.img).then((r) => r.arrayBuffer())
                isAnimatedWebP = functions.isAnimatedWebp(arraybuffer)
            }
            if (functions.isVideo(props.original) || functions.isGIF(props.original) || isAnimatedWebP) {
                return true
            } else {
                return false
            }
        },
        load: async () => {
            loadImage()
        },
        update: async () => {
            if (!shouldUpdate()) return
            if (!gifData) {
                if (functions.isGIF(props.original)) return parseGIF()
                if (functions.isWebP(props.original)) return parseAnimatedWebP()
            }
            if (!videoData) {
                if (functions.isVideo(props.original)) return getVideoData()
            }
        }
    }))

    const loadImage = async () => {
        const decryptedImg = await functions.decryptThumb(props.img, session, `${props.img}-${sizeType}`)
        const liveImg = await functions.decryptThumb(props.live, session, `${props.live}-${sizeType}`)
        const bufferTest = await fetch(decryptedImg).then((r => r.arrayBuffer()))
        const result = functions.bufferFileType(bufferTest)
        setLiveImg(liveImg)
        if (result[0].mime !== "application/json") {
            setImg(decryptedImg)
            setStaticImg(decryptedImg)
        } else {
            setImg(liveImg)
            setStaticImg(liveImg)
        }
    }

    const toggleLive = async () => {
        if (session.liveAnimationPreview) return
        if (hover) {
            setImg(liveImg)
        } else {
            setImg(staticImg)
        }
    }

    useEffect(() => {
        toggleLive()
    }, [hover, liveImg, staticImg, session, mobile])

    const shouldUpdate = () => {
        if (functions.isVideo(props.original)) {
            if (reverse !== false) return true
        }
        if (functions.isGIF(props.original) || functions.isWebP(props.original)) {
            if (reverse !== false || speed !== 1 || pixelate !== 1) return true
        }
        return false
    }

    useEffect(() => {
        if (shouldUpdate()) props.reupdate?.()
    }, [imageLoaded, reverse, speed, pixelate])

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0]
        if (entry.intersectionRatio > 0) {
          setVisible(true)
        } else {
          if (scroll) setVisible(false)
        }
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!scroll) {
            if (!visible) setVisible(true)
            return
        } else {
            const observer = new IntersectionObserver(handleIntersection, {root: null, rootMargin: "2000px 0px 2000px 0px", threshold: 0.01})
            const element = containerRef.current
            if (element) observer.observe(element)
            return () => {
                observer.disconnect()
            }
        }
    }, [scroll])

    const cancelAnimation = () => {
        clearTimeout(timeout)
        window.cancelAnimationFrame(id)
        if (videoRef.current?.cancelVideoFrameCallback) {
            videoRef.current?.cancelVideoFrameCallback(id)
        }
    }

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setGIFData(null)
        setVideoData(null)
        setBackFrame("")
        setSecondsProgress(0)
        setSeekTo(null)
        cancelAnimation()
        if (props.autoLoad) loadImage()
    }, [props.img])

    const resizePixelateCanvas = () => {
        if (!pixelateRef.current || !effectRef.current || !ref.current) return
        pixelateRef.current.width = ref.current.clientWidth
        pixelateRef.current.height = ref.current.clientHeight
        effectRef.current.width = ref.current.clientWidth
        effectRef.current.height = ref.current.clientHeight
    }

    useEffect(() => {
        let observer = null as ResizeObserver | null
        if (functions.isImage(props.img) || functions.isGIF(props.original) || functions.isWebP(props.original)) {
            observer = new ResizeObserver(resizePixelateCanvas)
            observer.observe(ref.current!)
        }
        return () => {
            observer?.disconnect()
        }
    }, [])

    const parseGIF = async () => {
        const start = new Date()
        const arrayBuffer = await fetch(img).then((r) => r.arrayBuffer())
        const frames = await functions.extractGIFFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }
    const parseAnimatedWebP = async () => {
        const start = new Date()
        const arrayBuffer = await fetch(img).then((r) => r.arrayBuffer())
        const animated = functions.isAnimatedWebp(arrayBuffer)
        if (!animated) return 
        const frames = await functions.extractAnimatedWebpFrames(arrayBuffer)
        setGIFData(frames)
        const end = new Date()
        const seconds = (end.getTime() - start.getTime()) / 1000
        setSeekTo(seconds)
    }

    const getVideoData = async () => {
        if (!videoRef.current) return
        if (functions.isVideo(props.original) && !mobile) {
            let frames = [] as ImageBitmap[]
            if (functions.isMP4(props.img)) {
                frames = await functions.extractMP4Frames(props.img)
                if (!frames) return
            } else if (functions.isWebM(props.img)) {
                frames = await functions.extractWebMFrames(props.img)
                if (!frames) return
            }
            setVideoData(frames)
        }
    }

    useEffect(() => {
        const parseVideo = async () => {
            if (backFrame) return 
            const thumb = await functions.videoThumbnail(props.img)
            setBackFrame(thumb)
        }
        if (functions.isVideo(props.original)) parseVideo()
    }, [imageLoaded])

    useEffect(() => {
        if (!functions.isVideo(props.original) && !gifData) return
        const animationLoop = async () => {
            if (imageLoaded) {
                if (reverse && functions.isVideo(props.original) && !videoData) return
                const adjustedData = gifData ? functions.gifSpeed(gifData, speed) : 
                                    videoData ? functions.videoSpeed(videoData, speed) : null
                if (videoRef.current) videoRef.current.playbackRate = speed 
                const pixelateCanvas = pixelateRef.current
                if (gifData) {
                    if (pixelateCanvas && ref.current) {
                        pixelateCanvas.width = ref.current.clientWidth
                        pixelateCanvas.height = ref.current.clientHeight
                    }
                } else if (videoData) {
                    if (pixelateCanvas && videoRef.current) {
                        pixelateCanvas.width = videoRef.current.clientWidth
                        pixelateCanvas.height = videoRef.current.clientHeight
                    }
                }
                const pixelateCtx = pixelateCanvas?.getContext("2d")
                const sharpenOverlay = videoOverlayRef.current
                let sharpenCtx = sharpenOverlay?.getContext("2d")!
                if (sharpenOverlay && videoRef.current) {
                    sharpenOverlay.width = videoRef.current.clientWidth
                    sharpenOverlay.height = videoRef.current.clientHeight
                }
                let frame = videoRef.current ? videoRef.current! : ref.current! as CanvasDrawable
                let delay = 0
                let pos = 0
                if (adjustedData) {
                    const frames = adjustedData.length - 1
                    const duration = videoData ? videoRef.current!.duration :
                    adjustedData.map((d: GIFFrame | ImageBitmap) => (d as GIFFrame).delay).reduce((p, c) => p + c) / 1000
                    let interval = duration / frames
                    let sp = seekTo !== null ? seekTo : secondsProgress
                    pos = Math.floor(sp / interval)
                    // if (reverse && gifData) pos = (adjustedData.length - 1) - pos
                    if (!adjustedData[pos]) pos = 0
                    if (gifData) {
                        frame = (adjustedData[pos] as GIFFrame).frame
                        delay = (adjustedData[pos] as GIFFrame).delay
                    } else if (videoData) {
                        frame = adjustedData[pos] as ImageBitmap
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
                            frame = (adjustedData[pos] as GIFFrame).frame
                            delay = (adjustedData[pos] as GIFFrame).delay
                            if (delay < 0) delay = 0
                        } else if (videoData) {
                            frame = adjustedData[pos] as ImageBitmap
                        }
                        const frames = adjustedData.length - 1
                        const duration = videoData ? videoRef.current!.duration :
                        adjustedData.map((d: GIFFrame | ImageBitmap) => (d as GIFFrame).delay).reduce((p, c) => p + c) / 1000
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
                            sharpenOverlay.style.opacity = "1"
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
                            pixelateCanvas.style.opacity = "1"
                        } else {
                            pixelateCanvas.style.width = `${pixelateCanvas.width}px`
                            pixelateCanvas.style.height = `${pixelateCanvas.height}px`
                            pixelateCanvas.style.imageRendering = "none"
                            pixelateCtx?.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
                            pixelateCtx?.drawImage(frame, 0, 0, pixelateCanvas.width, pixelateCanvas.height)
                            pixelateCanvas.style.opacity = "0"
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
    }, [imageLoaded, gifData, videoData, sharpen, pixelate, square, imageSize, reverse, speed, hover, session])

    const resizeOverlay = () => {
        if (functions.isVideo(props.original) && !mobile) {
            if (!videoRef.current || !videoOverlayRef.current || !pixelateRef.current || !effectRef.current) return
            if (videoRef.current.clientWidth === 0) return
            videoOverlayRef.current.width = videoRef.current.clientWidth
            videoOverlayRef.current.height = videoRef.current.clientHeight
            pixelateRef.current.width = videoRef.current.clientWidth
            pixelateRef.current.height = videoRef.current.clientHeight
            effectRef.current.width = videoRef.current.clientWidth
            effectRef.current.height = videoRef.current.clientHeight
        } else {
            if (!ref.current || !pixelateRef.current || !effectRef.current) return 
            pixelateRef.current.width = ref.current.width
            pixelateRef.current.height = ref.current.height
            effectRef.current.width = ref.current.width
            effectRef.current.height = ref.current.height
        }
    }

    useEffect(() => {
        const element = functions.isVideo(props.original) && !mobile ? videoRef.current! : ref.current!
        new ResizeObserver(resizeOverlay).observe(element)
        setTimeout(() => {
            setPageBuffering(false)
        }, 500)
    }, [])

    const getSquareOffset = () => {
        if (mobile) {
            if (sizeType === "tiny") return 20
            if (sizeType === "small") return 25
            if (sizeType === "medium") return 30
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
        const currentRef = functions.isVideo(props.original) && !mobile ? videoRef.current! : ref.current!
        const refWidth = functions.isVideo(props.original) && !mobile ? videoRef.current!.clientWidth : ref.current!.width
        const refHeight = functions.isVideo(props.original) && !mobile ? videoRef.current!.clientHeight : ref.current!.height
        if (square || props.square) {
            const sidebarWidth = document.querySelector(".sidebar")?.clientWidth || 0
            const width = window.innerWidth - sidebarWidth
            const containerWidth = Math.floor(width / (mobile ? functions.getImagesPerRowMobile(sizeType) : functions.getImagesPerRow(sizeType))) - getSquareOffset()
            containerRef.current.style.width = props.height ? `${props.height}px` : `${containerWidth}px`
            containerRef.current.style.height = props.height ? `${props.height}px` : `${containerWidth}px`
            containerRef.current.style.marginBottom = props.marginBottom ? `${props.marginBottom}px` : "3px"
            containerRef.current.style.marginLeft = props.marginLeft ? `${props.marginLeft}px` : "0px"
            const landscape = refWidth <= refHeight
            if (landscape) {
                currentRef.style.width = props.height ? `${props.height}px` : `${containerWidth}px`
                currentRef.style.height = "auto"
            } else {
                currentRef.style.width = "auto"
                currentRef.style.height = props.height ? `${props.height}px` : `${containerWidth}px`
            }
        } else {
            containerRef.current.style.width = "max-content"
            containerRef.current.style.height = "max-content"
            currentRef.style.width = "auto"
            currentRef.style.height = props.height ? `${props.height}px` : `${imageSize}px`
            containerRef.current.style.marginBottom = props.marginBottom ? `${props.marginBottom}px` : "10px"
            containerRef.current.style.marginLeft = props.marginLeft ? `${props.marginLeft}px` : "0px"
        }
    }

    useEffect(() => {
        updateSquare()
    }, [square, sizeType, imageSize, imageWidth, imageHeight])

    useEffect(() => {
        if (!containerRef.current) return
        containerRef.current.style.boxShadow = getBorder()
    }, [imageLoaded, sizeType, selected, session, props.post])

    useEffect(() => {
        if (mobile) {
            if (sizeType === "tiny") {
                setImageSize(100)
            } else if (sizeType === "small") {
                setImageSize(150)
            } else if (sizeType === "medium") {
                setImageSize(230)
            } else if (sizeType === "large") {
                setImageSize(350)
            } else if (sizeType === "massive") {
                setImageSize(510)
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
        let image = props.img
        if (functions.isVideo(props.original) && mobile && backFrame) image = backFrame
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!image || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${image})`
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

    useEffect(() => {
        setTimeout(() => {
            functions.pixelateEffect(pixelateRef.current, ref.current, pixelate, 
            {isAnimation: Number(gifData?.length) > 0, isVideo: functions.isVideo(props.original)})
            functions.splatterEffect(effectRef.current, ref.current, splatter, {lineMultiplier: 4, 
            maxLineWidth: 3, isAnimation: Number(gifData?.length) > 0, isVideo: functions.isVideo(props.original)})
        }, 50)
    }, [imageLoaded, hover])

    useEffect(() => {
        functions.pixelateEffect(pixelateRef.current, ref.current, pixelate, 
        {isAnimation: Number(gifData?.length) > 0, isVideo: functions.isVideo(props.original)})
    }, [pixelate, square, imageSize])

    useEffect(() => {
        functions.splatterEffect(effectRef.current, ref.current, splatter, {lineMultiplier: 4, 
        maxLineWidth: 3, isAnimation: Number(gifData?.length) > 0, isVideo: functions.isVideo(props.original)})
    }, [splatter])

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !effectRef.current) return
        const currentRef = functions.isVideo(props.original) && !mobile ? videoRef.current! : ref.current!
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
        effectRef.current.style.transformOrigin = "top left"
        effectRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
    }

    const cancelImageAnimation = () => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !effectRef.current) return
        const currentRef = functions.isVideo(props.original) && !mobile ? videoRef.current! : ref.current!
        currentRef.style.transform = "scale(1)"
        overlayRef.current.style.transform = "scale(1)"
        lightnessRef.current.style.transform = "scale(1)"
        pixelateRef.current.style.transformOrigin = "none"
        pixelateRef.current.style.transform = "scale(1)"
        effectRef.current.style.transformOrigin = "none"
        effectRef.current.style.transform = "scale(1)"
    }

    const onLoad = (event: React.SyntheticEvent) => {
        if (functions.isVideo(props.original) && !mobile) {
            const element = event.target as HTMLVideoElement
            setImageWidth(element.clientWidth)
            setImageHeight(element.clientHeight)
            setNaturalWidth(element.videoWidth)
            setNaturalHeight(element.videoHeight)
        } else {
            const element = event.target as HTMLImageElement
            setImageWidth(element.width)
            setImageHeight(element.height)
            setNaturalWidth(element.naturalWidth)
            setNaturalHeight(element.naturalHeight)
        }
        setImageLoaded(true)
        props.onLoad?.()
    }

    const render = <T extends boolean>(frame: HTMLImageElement | HTMLCanvasElement | ImageBitmap, buffer?: T) => {
        const canvas = document.createElement("canvas")!
        canvas.width = naturalWidth
        canvas.height = naturalHeight
        const ctx = canvas.getContext("2d")!
        let newContrast = contrast
        ctx.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
        if (pixelate !== 1) {
            let pixelateCanvas = document.createElement("canvas")
            functions.pixelateEffect(pixelateCanvas, frame, pixelate, {directWidth: true})
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(pixelateCanvas, 0, 0, canvas.width, canvas.height)
            ctx.imageSmoothingEnabled = true
        }
        if (splatter !== 0) {
            const splatterCanvas = document.createElement("canvas")
            functions.splatterEffect(splatterCanvas, frame, splatter)
            ctx.drawImage(splatterCanvas, 0, 0, canvas.width, canvas.height)
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
            ctx.globalAlpha = Math.abs((lightness - 100) / 100)
            ctx.drawImage(lightnessCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (buffer) {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            return img.data.buffer as T extends true ? ArrayBuffer : string
        }
        return canvas.toDataURL("image/png") as T extends true ? ArrayBuffer : string
    }

    const filtersOn = () => {
        if ((brightness !== 100) ||
            (contrast !== 100) ||
            (hue !== 180) ||
            (saturation !== 100) ||
            (lightness !== 100) ||
            (blur !== 0) ||
            (sharpen !== 0) ||
            (pixelate !== 1)) {
                return true 
            } else {
                return false
            }
    }

    const renderImage = async (image?: string) => {
        if (filtersOn()) {
            if (image) {
                const decrypted = await functions.decryptItem(image, session)
                const img = await functions.createImage(decrypted)
                return render(img, false)
            } else {
                return render(ref.current!, false)
            }
        } else {
            if (image) {
                return functions.decryptItem(image, session)
            } else {
                return functions.decryptItem(props.original, session)
            }

        }
    }

    const multiRender = async () => {
        let filename = path.basename(props.original).replace(/\?.*$/, "")
        if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
            filename = props.post.source.match(/\d+/g)?.[0] + path.extname(props.original).replace(/\?.*$/, "")
        }
        if (gifData || functions.isGIF(props.original) || functions.isVideo(props.original)) {
            functions.download(filename, props.original)
        } else {
            if (props.comicPages && props.comicPages.length > 1) {
                const zip = new JSZip()
                for (let i = 0; i < props.comicPages.length; i++) {
                    const page = props.comicPages[i]
                    let pageName = path.basename(page).replace(/\?.*$/, "")
                    if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
                        pageName = `${props.post.source.match(/\d+/g)?.[0]}_p${i}${path.extname(page)}`
                    }
                    const decryptedPage = await functions.decryptItem(page, session)
                    let image = await renderImage(decryptedPage)
                    if (filtersOn() || path.extname(pageName) !== `.${format}`) {
                        image = await functions.convertToFormat(image, format)
                    }
                    pageName = path.basename(pageName, path.extname(pageName)) + `.${format}`
                    let data = new ArrayBuffer(0)
                    if (functions.isBase64(image)) {
                        data = await fetch(image).then((r) => r.arrayBuffer())
                    } else {
                        data = await functions.getBuffer(functions.appendURLParams(image, {upscaled: session.upscaledImages}), {"x-force-upscale": String(session.upscaledImages)})
                    }
                    zip.file(decodeURIComponent(pageName), data, {binary: true})
                }
                const decoded = decodeURIComponent(filename)
                const id = decoded.split("-")[0]
                const basename = path.basename(decoded.split("-")[2] ?? "", path.extname(decoded.split("-")[2] ?? ""))
                const downloadName = basename ? `${id}-${basename}.zip` : `${path.basename(filename, path.extname(filename))}.zip`
                const blob = await zip.generateAsync({type: "blob"})
                const url = window.URL.createObjectURL(blob)
                functions.download(downloadName , url)
                window.URL.revokeObjectURL(url)
            } else {
                let image = await renderImage()
                if (filtersOn() || path.extname(filename) !== `.${format}`) {
                    image = await functions.convertToFormat(image, format)
                }
                filename = path.basename(filename, path.extname(filename)) + `.${format}`
                functions.download(filename, image)
                window.URL.revokeObjectURL(image)
            }
        }
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadIDs.includes(props.post.postID)) {
                multiRender()
                setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post.postID))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag, session, format])

    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        //if (activeDropdown !== "none") return
        if (event.metaKey || event.ctrlKey || event.button === 1) {
            if (!location.pathname.includes("/post/")) setPost(null)
            event.preventDefault()
            const newWindow = window.open(`/post/${props.id}/${props.post.slug}`, "_blank")
            newWindow?.blur()
            window.focus()
        }
    }

    const mouseDown = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(false)
    }

    const mouseMove = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(true)
    }

    const mouseUp = async (event: React.MouseEvent<HTMLElement>) => {
        //if (activeDropdown !== "none") return
        setScrollY(window.scrollY)
        if (selectionMode) {
            if (event.metaKey || event.ctrlKey || event.button == 1 || event.button == 2) {
                return
            } else {
                const isSelected = !selected
                if (isSelected) {
                    selectionItems.add(props.post.postID)
                    selectionPosts.set(props.post.postID, props.post)
                } else {
                    selectionItems.delete(props.post.postID)
                    selectionPosts.delete(props.post.postID)
                }
                setSelected(isSelected)
                setSelectionItems(selectionItems)
                setSelectionPosts(selectionPosts)
            }
        } else {
            if (!drag) {
                if (event.metaKey || event.ctrlKey || event.button == 1 || event.button == 2) {
                    return
                } else {
                    if (location.pathname.includes("/post/")) {
                        navigate(`/post/${props.id}/${props.post.slug}`, {replace: true})
                        setPostFlag(props.id)
                        window.scrollTo(0, 0)
                    } else {
                        setPost(null)
                        navigate(`/post/${props.id}/${props.post.slug}`)
                        window.scrollTo(0, 0)
                    }
                }
            }
        }
    }

    const mouseEnter = () => {
        setHover(true)
        if (pageBuffering) return
        tooltipTimer = setTimeout(() => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const toolTipWidth = 325
            const toolTipHeight = 175
            const midpoint = (rect.left + rect.right) / 2
            setToolTipX(Math.floor(midpoint - (toolTipWidth / 2)))
            setToolTipY(Math.floor(rect.y - (toolTipHeight / 1.05)))
            setToolTipPost(props.post)
            setToolTipImg(props.img)
            setToolTipEnabled(true)
        }, 700)
    }

    const mouseLeave = () => {
        setHover(false)
        if (pageBuffering) return
        if (tooltipTimer) clearTimeout(tooltipTimer)
        setToolTipEnabled(false)
    }

    const getBorder = () => {
        if (sizeType === "tiny" || sizeType === "small" || session.captchaNeeded) {
            if (selected) {
                return "0px 0px 0px 2px var(--selectBorder)"
            } else {
                return `0px 0px 0px 1px ${functions.borderColor(props.post)}`
            }
        } else {
            if (selected) {
                return "0px 0px 0px 4px var(--selectBorder)"
            } else {
                return `0px 0px 0px 2px ${functions.borderColor(props.post)}`
            }
        }
    }

    useEffect(() => {
        if (!selectionMode) {
            setSelected(false)
            selectionItems.delete(props.post.postID)
            selectionPosts.delete(props.post.postID)
        }
    }, [selectionMode])

    const getDisplay = (invert?: boolean) => {
        let condition = hover && functions.isVideo(props.original) && !mobile
        if (session.liveAnimationPreview && functions.isVideo(props.original) && !mobile) condition = true
        if (invert) condition = !condition
        return condition ? {opacity: "0", zIndex: 100, position: "absolute", width: "100%", height: "100%"} as React.CSSProperties : {opacity: "1"}
    }

    const dynamicSrc = () => {
        return functions.isVideo(props.original) && !mobile ? staticImg : img
    }
    
    const refWidth = ref.current?.width

    return (
        <div style={{opacity: visible && refWidth ? "1" : "0", transition: "opacity 0.1s", borderRadius: `${props.borderRadius || 0}px`}} className="image-box" id={String(props.id)} ref={containerRef} 
        onClick={onClick} onAuxClick={onClick} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseMove={mouseMove} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            <div className="image-filters" ref={imageFiltersRef} onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                {props.post.private ? <img style={{opacity: hover ? "1" : "0", transition: "opacity 0.3s", filter: getFilter()}} className="song-icon" src={privateIcon} 
                ref={privateIconRef} onMouseDown={(event) => {event.stopPropagation()}} onMouseUp={(event) => {event.stopPropagation()}}/> : null}
                {functions.isVideo(props.original) && !mobile ? <video draggable={false} autoPlay loop muted disablePictureInPicture playsInline className="dummy-video" ref={videoRef} src={liveImg}></video> : null}

                <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={dynamicSrc()}/>
                <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={dynamicSrc()}/>
                {functions.isVideo(props.original) && !mobile ? <canvas draggable={false} className="sharpen-overlay" ref={videoOverlayRef}></canvas> : null}

                <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
                <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

                <video draggable={false} autoPlay loop muted disablePictureInPicture playsInline className="video" ref={videoRef} 
                src={functions.isVideo(props.original) ? liveImg : emptyVideo} onLoadedData={(event) => onLoad(event)} style={{...getDisplay(true)}}></video>
                <img draggable={false} className="image" ref={ref} src={dynamicSrc()} 
                onLoad={(event) => onLoad(event)} style={{...getDisplay()}}/>
            </div>
        </div>
    )
})

export default GridImage