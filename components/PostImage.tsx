import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {ThemeContext, EnableDragContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, DownloadFlagContext, DownloadURLsContext, DisableZoomContext, SpeedContext,
ReverseContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import {createFFmpeg, fetchFile} from "@ffmpeg/ffmpeg"
import functions from "../structures/Functions"
import loading from "../assets/purple/loading.gif"
import loadingMagenta from "../assets/magenta/loading.gif"
import Slider from "react-slider"
import gifReverseIcon from "../assets/purple/gif-reverse.png"
import gifSpeedIcon from "../assets/purple/gif-speed.png"
import gifClearIcon from "../assets/purple/gif-clear.png"
import gifPlayIcon from "../assets/purple/gif-play.png"
import gifPauseIcon from "../assets/purple/gif-pause.png"
import gifRewindIcon from "../assets/purple/gif-rewind.png"
import gifFastforwardIcon from "../assets/purple/gif-fastforward.png"
import gifFullscreenIcon from "../assets/purple/gif-fullscreen.png"
import videoReverseIcon from "../assets/purple/video-reverse.png"
import videoSpeedIcon from "../assets/purple/video-speed.png"
import videoClearIcon from "../assets/purple/video-clear.png"
import videoPlayIcon from "../assets/purple/video-play.png"
import videoPauseIcon from "../assets/purple/video-pause.png"
import videoRewindIcon from "../assets/purple/video-rewind.png"
import videoFastforwardIcon from "../assets/purple/video-fastforward.png"
import videoPreservePitchIcon from "../assets/purple/video-preservepitch.png"
import videoPreservePitchOnIcon from "../assets/purple/video-preservepitch-on.png"
import videoFullscreenIcon from "../assets/purple/video-fullscreen.png"
import videoVolumeIcon from "../assets/purple/video-volume.png"
import videoVolumeLowIcon from "../assets/purple/video-volume-low.png"
import videoVolumeMuteIcon from "../assets/purple/video-volume-mute.png"
import imageZoomInIcon from "../assets/purple/image-zoom-in.png"
import imageZoomOutIcon from "../assets/purple/image-zoom-out.png"
import imageZoomOffIcon from "../assets/purple/image-zoom-off.png"
import imageZoomOffEnabledIcon from "../assets/purple/image-zoom-off-enabled.png"
import imageFullscreenIcon from "../assets/purple/image-fullscreen.png"
import gifFrames from "gif-frames"
import JSZip from "jszip"
import {TransformWrapper, TransformComponent} from "react-zoom-pan-pinch"
import path from "path"
import "./styles/postimage.less"
import mime from "mime-types"
const ffmpeg = createFFmpeg()

interface Props {
    img: string
    width?: number
    height?: number
    scale?: number
    noKeydown?: boolean
    comicPages?: any
}

const PostImage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {disableZoom, setDisableZoom} = useContext(DisableZoomContext)
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const lightnessRef = useRef<HTMLImageElement>(null)
    const gifOverlayRef = useRef<HTMLImageElement>(null)
    const gifLightnessRef = useRef<HTMLImageElement>(null)
    const videoOverlayRef = useRef<HTMLCanvasElement>(null)
    const videoLightnessRef = useRef<HTMLImageElement>(null)
    const ref = useRef<HTMLImageElement>(null)
    const gifRef = useRef<HTMLCanvasElement>(null)
    const gifControls = useRef<HTMLDivElement>(null)
    const gifSpeedRef = useRef(null) as any
    const gifSliderRef = useRef<any>(null)
    const gifSpeedSliderRef = useRef<any>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const backFrameRef = useRef<HTMLImageElement>(null)
    const videoCanvasRef = useRef<HTMLCanvasElement>(null)
    const videoControls = useRef<HTMLDivElement>(null)
    const videoSliderRef = useRef<any>(null)
    const videoSpeedRef = useRef(null) as any
    const videoVolumeRef = useRef(null) as any
    const videoSpeedSliderRef = useRef<any>(null)
    const videoVolumeSliderRef = useRef<any>(null)
    const imageControls = useRef<HTMLDivElement>(null)
    const zoomRef = useRef(null) as any
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [videoLoaded, setVideoLoaded] = useState(false)
    const [gifData, setGIFData] = useState(null) as any
    const [reverseVideo, setReverseVideo] = useState(null) as any
    const [videoData, setVideoData] = useState(null) as any
    const [backFrame, setBackFrame] = useState(null) as any
    const [secondsProgress, setSecondsProgress] = useState(0)
    const [progress, setProgress] = useState(0)
    const [dragProgress, setDragProgress] = useState(0) as any
    const {reverse, setReverse} = useContext(ReverseContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const [volume, setVolume] = useState(0)
    const [previousVolume, setPreviousVolume] = useState(0)
    const [paused, setPaused] = useState(false)
    const [preservePitch, setPreservePitch] = useState(true)
    const [duration, setDuration] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [dragging, setDragging] = useState(false)
    const [encodingOverlay, setEncodingOverlay] = useState(false)
    const [seekTo, setSeekTo] = useState(null) as any

    useEffect(() => {
        setVideoLoaded(false)
        setImageLoaded(false)
        setReverseVideo(null)
        setReverse(false)
        setGIFData(null)
        setVideoData(null)
        setBackFrame(null)
        setSecondsProgress(0)
        setProgress(0)
        setDragProgress(0)
        setDuration(0)
        setZoom(1)
        setDragging(false)
        setSeekTo(null)
        if (ref.current) ref.current.style.opacity = "1"
        if (videoRef.current) videoRef.current.style.opacity = "1"
    }, [props.img])

    useEffect(() => {
        if (gifSliderRef.current) gifSliderRef.current.resize()
        if (gifSpeedSliderRef.current) gifSpeedSliderRef.current.resize()
        if (videoSliderRef.current) videoSliderRef.current.resize()
        if (videoSpeedSliderRef.current) videoSpeedSliderRef.current.resize()
        if (videoVolumeSliderRef.current) videoVolumeSliderRef.current.resize()
    })

    const resizeImageCanvas = () => {
        if (!pixelateRef.current || !ref.current) return
        pixelateRef.current.width = ref.current.width
        pixelateRef.current.height = ref.current.height
    }

    const resizeGIFCanvas = () => {
        if (!gifRef.current || !ref.current) return
        if (ref.current.clientWidth === 0) return
        gifRef.current.width = ref.current.width
        gifRef.current.height = ref.current.height
    }

    const resizeVideoCanvas = () => {
        if (!videoCanvasRef.current || !videoRef.current || !videoOverlayRef.current) return
        if (videoRef.current.clientWidth === 0) return
        videoCanvasRef.current.width = videoRef.current.clientWidth
        videoCanvasRef.current.height = videoRef.current.clientHeight
        videoOverlayRef.current.width = videoRef.current.clientWidth
        videoOverlayRef.current.height = videoRef.current.clientHeight
    }

    const handleKeydown = (event: any) => {
        const key = event.keyCode
        const value = String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key).toLowerCase()
        if (value === "f") {
            if (!props.noKeydown) fullscreen()
        }
    }

    useEffect(() => {
        let observer = null as any
        if (functions.isImage(props.img)) {
            observer = new ResizeObserver(resizeImageCanvas)
            observer.observe(ref.current!)
        }
        if (functions.isGIF(props.img) || functions.isWebP(props.img)) {
            observer = new ResizeObserver(resizeGIFCanvas)
            observer.observe(ref.current!)
        }
        if (functions.isVideo(props.img)) {
            observer = new ResizeObserver(resizeVideoCanvas)
            observer.observe(videoRef.current!)
        }
        window.addEventListener("keydown", handleKeydown)
        return () => {
            observer?.disconnect()
            window.removeEventListener("keydown", handleKeydown)
        }
    }, [])

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

    useEffect(() => {
        const parseVideo = async () => {
            if (!videoRef.current) return
            let frames = null as any
            if (functions.isMP4(props.img)) {
                frames = await functions.extractMP4Frames(props.img, videoRef.current!.duration)
            } else if (functions.isWebM(props.img)) {
                frames = await functions.extractWebMFrames(props.img, videoRef.current!.duration)
                console.log(frames)
            }
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
            setBackFrame(canvasFrames[0].toDataURL())
            if (backFrameRef.current && videoRef.current) {
                backFrameRef.current.style.display = "flex"
                backFrameRef.current.style.position = "relative"
                videoRef.current.style.position = "absolute"
                videoRef.current.style.top = "0px"
                videoRef.current.style.bottom = "0px"
                videoRef.current.style.right = "0px"
                videoRef.current.style.left = "0px"
            }
        }
        
        const reverseAudioStream = async () => {
            if (!ffmpeg.isLoaded()) await ffmpeg.load()
            const name = path.basename(props.img, path.extname(props.img))
            const ext = path.extname(props.img)
            const input = `${name}${ext}`
            const output = `${name}-reversed${ext}`
            ffmpeg.FS("writeFile", input, await fetchFile(props.img))
            await ffmpeg.run("-i", input, "-map", "0", "-c:v", "copy", "-af", "areverse", output)
            const binary = ffmpeg.FS("readFile", output)
            if (binary) {
                const blob = new Blob([new DataView(binary.buffer)], {type: mime.lookup(path.extname(props.img)) || "video/mp4"})
                const url = URL.createObjectURL(blob)
                setReverseVideo(`${url}#${ext}`)
            }
            ffmpeg.FS("unlink", output)
            // ffmpeg.exit()
        }
        if (!videoData && videoLoaded && functions.isVideo(props.img)) {
            parseVideo()
            if (!reverseVideo) reverseAudioStream()
        }
        return () => {
            if (reverseVideo) URL.revokeObjectURL(reverseVideo)
        }
    }, [videoLoaded])

    useEffect(() => {
        let id = 0
        let timeout = null as any
        if (!ref.current || !gifRef.current) return
        if (gifData) {
            if (paused && !dragging) return clearTimeout(timeout)
            const adjustedData = functions.gifSpeed(gifData, speed)
            const gifCanvas = gifRef.current
            gifCanvas.style.opacity = "1"
            ref.current.style.opacity = "0"
            gifCanvas.width = ref.current.width
            gifCanvas.height = ref.current.height
            const ctx = gifCanvas.getContext("2d") as any
            const frames = adjustedData.length - 1
            const duration = adjustedData.map((d: any) => d.delay).reduce((p: any, c: any) => p + c) / 1000
            let interval = duration / frames
            let sp = seekTo !== null ? seekTo : secondsProgress
            if (dragging) sp = dragProgress
            let pos = Math.floor(sp / interval)
            if (!adjustedData[pos]) pos = 0
            let frame = adjustedData[pos].frame
            let delay = adjustedData[pos].delay
            setDuration(duration)

            const update = () => {
                if (reverse) {
                    pos--
                } else {
                    pos++
                }
                if (pos > adjustedData.length - 1) pos = 0
                if (pos < 0) pos = adjustedData.length - 1
                frame = adjustedData[pos].frame
                delay = adjustedData[pos].delay
                if (delay < 0) delay = 0
                const secondsProgress = (pos * interval)
                setSecondsProgress(secondsProgress)
                setProgress((secondsProgress / duration) * 100)
            }

            const draw = () => {
                const landscape = gifCanvas.width >= gifCanvas.height
                const pixelWidth = gifCanvas.width / pixelate 
                const pixelHeight = gifCanvas.height / pixelate
                if (pixelate !== 1) {
                    ctx.clearRect(0, 0, gifCanvas.width, gifCanvas.height)
                    ctx.drawImage(frame, 0, 0, pixelWidth, pixelHeight)
                    if (landscape) {
                        gifCanvas.style.width = `${gifCanvas.width * pixelate}px`
                        gifCanvas.style.height = "auto"
                    } else {
                        gifCanvas.style.width = "auto"
                        gifCanvas.style.height = `${gifCanvas.height * pixelate}px`
                    }
                    gifCanvas.style.imageRendering = "pixelated"
                    gifCanvas.style.opacity = "1"
                } else {
                    gifCanvas.style.width = `${gifCanvas.width}px`
                    gifCanvas.style.height = `${gifCanvas.height}px`
                    gifCanvas.style.imageRendering = "none"
                    gifCanvas.style.opacity = "1"
                    ctx.clearRect(0, 0, gifCanvas.width, gifCanvas.height)
                    ctx.drawImage(frame, 0, 0, gifCanvas.width, gifCanvas.height)
                }
            }

            const gifLoop = async () => {
                draw()
                if (paused) return clearTimeout(timeout)
                update()
                await new Promise<void>((resolve) => {
                    clearTimeout(timeout)
                    timeout = setTimeout(() => {
                        resolve()
                    }, delay)
                }).then(gifLoop)
            }
            gifLoop()
        } return () => {
            clearTimeout(timeout)
            window.cancelAnimationFrame(id)
        }
    }, [gifData, reverse, seekTo, pixelate, paused, speed, dragging, dragProgress])

    useEffect(() => {
        if (!dragging && dragProgress !== null) {
            setSecondsProgress(dragProgress)
            setProgress((dragProgress / duration) * 100)
            setDragProgress(null)
        }
    }, [dragging, dragProgress])

    useEffect(() => {
        let id = 0
        if (!videoRef.current || !videoCanvasRef.current || !videoOverlayRef.current) return
        if (videoLoaded && functions.isVideo(props.img)) {
            if (paused) {
                videoRef.current.pause()
                setSeekTo(null)
                if (!dragging && !videoData) return
            } else {
                if (videoRef.current?.paused) videoRef.current.play()
            }
            if (preservePitch) {
                // @ts-ignore
                videoRef.current.preservesPitch = true
                // @ts-ignore
                videoRef.current.mozPreservesPitch = true
                // @ts-ignore
                videoRef.current.webkitPreservesPitch = true
            } else {
                // @ts-ignore
                videoRef.current.preservesPitch = false 
                // @ts-ignore
                videoRef.current.mozPreservesPitch = false 
                // @ts-ignore
                videoRef.current.webkitPreservesPitch = false 
            }
            const adjustedData = videoData ? functions.videoSpeed(videoData, speed) : null
            videoRef.current.playbackRate = speed 
            const videoCanvas = videoCanvasRef.current
            const sharpenOverlay = videoOverlayRef.current
            videoCanvas.style.opacity = "1"
            videoRef.current.style.opacity = "1"
            const landscape = videoRef.current.videoWidth >= videoRef.current.videoHeight
            videoCanvas.width = videoRef.current.clientWidth
            videoCanvas.height = videoRef.current.clientHeight
            sharpenOverlay.width = videoRef.current.clientWidth
            sharpenOverlay.height = videoRef.current.clientHeight
            const ctx = videoCanvas.getContext("2d") as any
            const sharpenCtx = sharpenOverlay.getContext("2d") as any
            let frames = adjustedData ? adjustedData.length - 1 : 1
            let interval = duration / frames
            let sp = seekTo !== null ? seekTo : secondsProgress
            if (dragging) sp = dragProgress
            let pos = Math.floor(sp / interval)
            if (!adjustedData?.[pos]) pos = 0
            let seekValue = seekTo !== null ? seekTo * speed : null 
            seekValue = dragging ? dragProgress * speed : seekValue
            if (seekValue !== null) if (Number.isNaN(seekValue) || !Number.isFinite(seekValue)) seekValue = 0
            if (seekValue) videoRef.current.currentTime = seekValue
            setDuration(videoRef.current.duration / speed)
            if (reverse && adjustedData) pos = (adjustedData.length - 1) - pos
            let frame = adjustedData ? adjustedData[pos] : videoRef.current as any

            const update = () => {
                if (!videoRef.current) return
                if (reverse) {
                    pos--
                } else {
                    pos++
                }
                if (adjustedData) {
                    if (pos < 0) pos = adjustedData.length - 1
                    if (pos > adjustedData.length - 1) pos = 0
                }
                frame = adjustedData ? adjustedData[pos] : videoRef.current
                let secondsProgress = videoRef.current.currentTime / speed
                if (reverse) secondsProgress = (videoRef.current.duration / speed) - secondsProgress
                setSecondsProgress(secondsProgress)
                setProgress((secondsProgress / duration) * 100)
            }

            const draw = () => {
                if (!videoRef.current || !videoCanvasRef.current) return
                const pixelWidth = videoCanvas.width / pixelate 
                const pixelHeight = videoCanvas.height / pixelate
                if (sharpen !== 0) {
                    const sharpenOpacity = sharpen / 5
                    sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
                    sharpenOverlay.style.mixBlendMode = "overlay"
                    sharpenOverlay.style.opacity = `${sharpenOpacity}`
                    sharpenCtx.clearRect(0, 0, sharpenOverlay.width, sharpenOverlay.height)
                    sharpenCtx.drawImage(frame, 0, 0, sharpenOverlay.width, sharpenOverlay.height)
                } else {
                    sharpenOverlay.style.filter = "none"
                    sharpenOverlay.style.mixBlendMode = "normal"
                    sharpenOverlay.style.opacity = "0"
                }
                if (pixelate !== 1) {
                    ctx.clearRect(0, 0, videoCanvas.width, videoCanvas.height)
                    ctx.drawImage(frame, 0, 0, pixelWidth, pixelHeight)
                    if (landscape) {
                        videoCanvas.style.width = `${videoCanvas.width * pixelate}px`
                        videoCanvas.style.height = "auto"
                    } else {
                        videoCanvas.style.width = "auto"
                        videoCanvas.style.height = `${videoCanvas.height * pixelate}px`
                    }
                    videoCanvas.style.imageRendering = "pixelated"
                } else {
                    videoCanvas.style.width = `${videoCanvas.width}px`
                    videoCanvas.style.height = `${videoCanvas.height}px`
                    videoCanvas.style.imageRendering = "none"
                    ctx.clearRect(0, 0, videoCanvas.width, videoCanvas.height)
                    ctx.drawImage(frame, 0, 0, videoCanvas.width, videoCanvas.height)
                }
            }

            const videoLoop = async () => {
                draw()
                if (paused) {
                    // @ts-ignore
                    if (videoRef.current?.cancelVideoFrameCallback) {
                        // @ts-ignore
                        return videoRef.current?.cancelVideoFrameCallback(id)
                    } else {
                        return window.cancelAnimationFrame(id)
                    }
                }
                update()
                await new Promise<void>((resolve) => {
                    // @ts-ignore
                    if (videoRef.current?.requestVideoFrameCallback) {
                        // @ts-ignore
                        id = videoRef.current?.requestVideoFrameCallback(() => resolve())
                    } else {
                        id = window.requestAnimationFrame(() => resolve())
                    }
                }).then(videoLoop)
            }
            // @ts-ignore
            if (videoRef.current?.requestVideoFrameCallback) {
                // @ts-ignore
                id = videoRef.current?.requestVideoFrameCallback(videoLoop)
            } else {
                id = window.requestAnimationFrame(videoLoop)
            }
        } return () => {
            // @ts-ignore
            if (videoRef.current?.cancelVideoFrameCallback) {
                // @ts-ignore
                videoRef.current?.cancelVideoFrameCallback(id)
            } else {
                window.cancelAnimationFrame(id)
            }
        }
    }, [videoLoaded, reverse, seekTo, pixelate, paused, speed, preservePitch, dragging, dragProgress, sharpen])

    useEffect(() => {
        if (!functions.isVideo(props.img)) return
        if (!videoRef.current || !videoCanvasRef.current || !reverseVideo) return
        if (reverse) {
            if (videoRef.current.src !== reverseVideo) {
                videoRef.current.src = reverseVideo
                setTimeout(() => {
                    seek(100 - progress)
                }, 100)
            }
        } else {
            if (videoRef.current.src !== props.img) {
                videoRef.current.src = props.img
                setTimeout(() => {
                    seek(progress)
                }, 100)
            }
        }
    }, [reverse])

    const getLoading = () => {
        if (theme.includes("magenta")) return loadingMagenta
        return loading
    }

    const getPreversePitchIcon = () => {
        if (preservePitch) return videoPreservePitchIcon
        return videoPreservePitchOnIcon
    }

    const getZoomOffIcon = () => {
        if (disableZoom) return imageZoomOffEnabledIcon
        return imageZoomOffIcon
    }

    const getGIFSpeedMarginRight = () => {
        const controlRect = gifControls.current?.getBoundingClientRect()
        const rect = gifSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -5
        return `${raw + offset}px`
    }

    const getVideoSpeedMarginRight = () => {
        const controlRect = videoControls.current?.getBoundingClientRect()
        const rect = videoSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -2
        return `${raw + offset}px`
    }

    const getVideoVolumeMarginRight = () => {
        const controlRect = videoControls.current?.getBoundingClientRect()
        const rect = videoVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -7
        return `${raw + offset}px`
    }

    const updateProgressText = (value: number) => {
        let percent = value / 100
        if (reverse === true) {
            const secondsProgress = (1-percent) * duration
            setDragProgress(duration - secondsProgress)
        } else {
            const secondsProgress = percent * duration
            setDragProgress(secondsProgress)
        }
    }

    const seek = (position: number) => {
        let secondsProgress = (position / 100) * duration
        let progress = (duration / 100) * position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        if (functions.isVideo(props.img) && !videoData) return
        const val = value !== undefined ? value : !reverse 
        let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        if (gifData) secondsProgress = (duration / 100) * progress
        setReverse(val)
        setSeekTo(secondsProgress)
    }

    const changePreservesPitch = (value?: boolean) => {
        const secondsProgress = (progress / 100) * duration
        setPreservePitch((prev) => value !== undefined ? value : !prev)
        setSeekTo(secondsProgress)
    }

    const changeVolume = (value: number) => {
        if (!videoRef.current) return
        if (value < 0) value = 0
        if (value > 1) value = 1
        if (Number.isNaN(value)) value = 0
        if (value > 0) {
            videoRef.current.muted = false
        } else {
            videoRef.current.muted = true
        }
        videoRef.current.volume = functions.logSlider(value)
        setVolume(value)
        setPreviousVolume(value)
    }

    const mute = () => {
        if (!videoRef.current) return
        if (videoRef.current.volume > 0) {
            videoRef.current.muted = true
            videoRef.current.volume = 0
            setVolume(0)
        } else {
            const newVol = previousVolume ? previousVolume : 1
            videoRef.current.volume = functions.logSlider(newVol)
            videoRef.current.muted = false
            setVolume(newVol)
        }
        setShowVolumeSlider((prev) => !prev)
    }

    const rewind = (value?: number) => {
        if (!value) value = videoRef.current!.duration / 10
        let newTime = reverse ? videoRef.current!.currentTime + value : videoRef.current!.currentTime - value
        if (newTime < 0) newTime = 0
        if (newTime > videoRef.current!.duration) newTime = videoRef.current!.duration
        setSeekTo(newTime)
    }

    const fastforward = (value?: number) => {
        if (!value) value = videoRef.current!.duration / 10
        let newTime = reverse ? videoRef.current!.currentTime - value : videoRef.current!.currentTime + value
        if (newTime < 0) newTime = 0
        if (newTime > videoRef.current!.duration) newTime = videoRef.current!.duration
        setSeekTo(newTime)
    }

    useEffect(() => {
        if (!fullscreenRef.current) return
        const element = fullscreenRef.current
        let newContrast = contrast
        const image = functions.isVideo(props.img) ? videoRef.current : ref.current
        const sharpenOverlay = functions.isVideo(props.img) ? videoOverlayRef.current : (functions.isGIF(props.img) || gifData) ? gifOverlayRef.current : overlayRef.current
        const lightnessOverlay = functions.isVideo(props.img) ? videoLightnessRef.current : (functions.isGIF(props.img) || gifData) ? gifLightnessRef.current : lightnessRef.current
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

    useEffect(() => {
        if (gifData || functions.isGIF(props.img) || functions.isVideo(props.img)) return
        if (!pixelateRef.current || !containerRef.current || !ref.current) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d") as any
        const imageWidth = ref.current.width 
        const imageHeight = ref.current.height
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = ref.current.width
        pixelateCanvas.height = ref.current.height
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
    }, [pixelate])

    const onLoad = async (event: any) => {
        if (functions.isVideo(props.img)) {
            setImageWidth(event.target.clientWidth)
            setImageHeight(event.target.clientHeight)
            setNaturalWidth(event.target.videoWidth)
            setNaturalHeight(event.target.videoHeight)
            if (videoRef.current) videoRef.current.style.display = "flex"
            setVideoLoaded(true)
            setTimeout(() => {
                seek(0)
            }, 70)
        } else {
            setImageWidth(event.target.width)
            setImageHeight(event.target.height)
            setNaturalWidth(event.target.naturalWidth)
            setNaturalHeight(event.target.naturalHeight)
            if (ref.current) ref.current.style.display = "flex"
            setImageLoaded(true)
        }
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

    const rateOn = () => {
        if ((speed !== 1) || (reverse !== false)) return true 
        return false
    }

    const renderImage = async (image?: string) => {
        if ((filtersOn())) {
            if (image) {
                const img = await functions.createImage(image)
                return render(img)
            } else {
                return render(ref.current)
            }
        } else {
            if (image) {
                return image
            } else {
                return props.img
            }
        }
    }

    const renderGIF = async () => {
        if ((filtersOn() || rateOn()) && gifData) {
            if (encodingOverlay) return
            setEncodingOverlay(true)
            setPaused(true)
            await functions.timeout(50)
            const adjustedData = functions.gifSpeed(gifData, speed)
            let frames = [] as any
            let delays = [] as any
            for (let i = 0; i < adjustedData.length; i++) {
                frames.push(render(adjustedData[i].frame, true))
                delays.push(adjustedData[i].delay)
            }
            if (reverse) {
                frames = frames.reverse()
                delays = delays.reverse()
            }
            const buffer = await functions.encodeGIF(frames, delays, gifData[0].frame.width, gifData[0].frame.height, {transparentColor: "#000000"})
            const blob = new Blob([buffer])
            setEncodingOverlay(false)
            setPaused(false)
            return window.URL.createObjectURL(blob)
        } else {
            return props.img
        }
    }

    const encodeVideo = async (frames: string[], audio: string) => {
        if (!ffmpeg.isLoaded()) await ffmpeg.load()
        for (let i = 0; i < frames.length; i++) {
            const num = `00${i}`.slice(-3)
            ffmpeg.FS("writeFile", `${num}.png`, await fetchFile(frames[i]))
        }
        ffmpeg.FS("writeFile", "audio.wav", await fetchFile(audio))
        await ffmpeg.run("-framerate", "30", "-pattern_type", "glob", "-i", "*.png", "-i", "audio.wav", "-c:a", "aac", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "video.mp4")
        const binary = ffmpeg.FS("readFile", "video.mp4")
        let url = ""
        if (binary) {
            const blob = new Blob([new DataView(binary.buffer)], {type: "video/mp4"})
            url = URL.createObjectURL(blob)
        }
        try {
            for (let i = 0; i < frames.length; i++) {
                const num = `00${i}`.slice(-3)
                ffmpeg.FS("unlink", `${num}.png`)
            }
            ffmpeg.FS("unlink", "video.mp4")
            ffmpeg.FS("unlink", "audio.wav")
        } catch {
            // ignore
        }
        return url
    }

    const audioSpeed = async (audioFile: string) => {
        if (!ffmpeg.isLoaded()) await ffmpeg.load()
        ffmpeg.FS("writeFile", "input.wav", await fetchFile(audioFile))
        let audioSpeed = preservePitch ? `atempo=${speed}` : `asetrate=44100*${speed},aresample=44100`
        let filter = ["-filter_complex", `[0:a]${audioSpeed}${reverse ? ",areverse" : ""}[a]`, "-map", "[a]"]
        await ffmpeg.run("-i", "input.wav", ...filter, "audio.wav")
        const binary = ffmpeg.FS("readFile", "audio.wav")
        let url = ""
        if (binary) {
            const blob = new Blob([new DataView(binary.buffer)], {type: "audio/x-wav"})
            url = URL.createObjectURL(blob)
        }
        try {
            ffmpeg.FS("unlink", "input.wav")
            ffmpeg.FS("unlink", "audio.wav")
        } catch {
            // ignore
        }
        return url
    }

    const renderVideo = async () => {
        if ((filtersOn() || rateOn()) && videoData) {
            if (encodingOverlay) return
            setEncodingOverlay(true)
            setPaused(true)
            let audio = await functions.videoToWAV(props.img).then((a) => audioSpeed(a))
            const adjustedData = functions.videoSpeed(videoData, speed)
            let frames = adjustedData.map((a: any) => render(a))
            if (reverse) frames = frames.reverse()
            const url = await encodeVideo(frames, audio)
            setEncodingOverlay(false)
            setPaused(false)
            return url
        } else {
            return props.img
        }
    }

    const multiRender = async () => {
        if (functions.isVideo(props.img)) {
            const video = await renderVideo()
            if (!video) return
            functions.download(path.basename(props.img), video)
            window.URL.revokeObjectURL(video)
        } else if (functions.isGIF(props.img) || gifData) {
            const gif = await renderGIF()
            if (!gif) return
            functions.download(path.basename(props.img), gif)
            window.URL.revokeObjectURL(gif)
        } else {
            if (props.comicPages) {
                const zip = new JSZip()
                for (let i = 0; i < props.comicPages.length; i++) {
                    const page = props.comicPages[i]
                    const image = await renderImage(page)
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
                const image = await renderImage()
                functions.download(path.basename(props.img), image)
                window.URL.revokeObjectURL(image)
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

    const controlMouseEnter = () => {
        if (imageControls.current) imageControls.current.style.opacity = "1"
        if (gifControls.current) gifControls.current.style.opacity = "1"
        if (videoControls.current) videoControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedDropdown(false)
        setShowVolumeSlider(false)
        if (imageControls.current) imageControls.current.style.opacity = "0"
        if (gifControls.current) gifControls.current.style.opacity = "0"
        if (videoControls.current) videoControls.current.style.opacity = "0"
    }

    const getGIFPlayIcon = () => {
        if (paused) return gifPlayIcon
        return gifPauseIcon
    }

    const getVideoPlayIcon = () => {
        if (paused) return videoPlayIcon
        return videoPauseIcon
    }

    const getVideoVolumeIcon = () => {
        if (volume > 0.5) {
            return videoVolumeIcon
        } else if (volume > 0) {
            return videoVolumeLowIcon
        } else {
            return videoVolumeMuteIcon
        }
    }

    const reset = () => {
        changeReverse(false)
        setSpeed(1)
        setPaused(false)
        setShowSpeedDropdown(false)
        setPreservePitch(true)
        setTimeout(() => {
            seek(0)
        }, 300)
    }

    const fullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen()
            if (videoRef.current) {
                videoRef.current.style.maxWidth = "calc(100vw - 230px - 70px)"
                videoRef.current.style.maxHeight = "calc(100vh - 35px - 77px)"
                if (backFrame && backFrameRef.current) {
                    videoRef.current.style.position = "absolute"
                    backFrameRef.current.style.display = "flex"
                }
                videoCanvasRef.current!.style.marginTop = "0px"
                videoCanvasRef.current!.style.marginBottom = "0px"
            }
            if (ref.current) {
                ref.current.style.maxWidth = "calc(100vw - 230px - 70px)"
                ref.current.style.maxHeight = "calc(100vh - 35px - 77px)"
                if (functions.isGIF(props.img) || gifData) {
                    gifRef.current!.style.marginTop = "0px"
                    gifRef.current!.style.marginBottom = "0px"
                }
            }
            setTimeout(() => {
                if (functions.isImage(props.img)) {
                    resizeImageCanvas()
                } else if (functions.isGIF(props.img) || gifData) {
                    resizeGIFCanvas()
                } else if (functions.isVideo(props.img)) {
                    resizeVideoCanvas()
                }
            }, 100)
        } else {
            fullscreenRef.current?.requestFullscreen()
            if (videoRef.current) {
                videoRef.current.style.maxWidth = "100vw"
                videoRef.current.style.maxHeight = "100vh"
                if (backFrame && backFrameRef.current) {
                    videoRef.current.style.position = "relative"
                    backFrameRef.current.style.display = "none"
                }
                videoCanvasRef.current!.style.marginTop = "auto"
                videoCanvasRef.current!.style.marginBottom = "auto"
            }
            if (ref.current) {
                ref.current.style.maxWidth = "100vw"
                ref.current.style.maxHeight = "100vh"
                if (functions.isGIF(props.img) || gifData) {
                    gifRef.current!.style.marginTop = "auto"
                    gifRef.current!.style.marginBottom = "auto"
                }
            }
            setTimeout(() => {
                if (functions.isImage(props.img)) {
                    resizeImageCanvas()
                } else if (functions.isGIF(props.img) || gifData) {
                    resizeGIFCanvas()
                } else if (functions.isVideo(props.img)) {
                    resizeVideoCanvas()
                }
            }, 100)
        }
    }

    const zoomIn = () => {
        if (disableZoom || !zoomRef.current) return
        zoomRef.current.zoomIn(0.25, 0)
    }

    const zoomOut = () => {
        if (disableZoom || !zoomRef.current) return
        zoomRef.current.zoomOut(0.25, 0)
    }

    const dragImgDown = (event: any) => {
        if (!functions.isImage(props.img)) return
        if (zoom !== 1 && !disableZoom) {
            if (enableDrag !== false) setEnableDrag(false)
        } else {
            if (enableDrag !== true) setEnableDrag(true)
        }
    }

    const dragImg = (event: any) => {
        if (!functions.isImage(props.img)) return
    }

    const dragImgUp = () => {
        if (!functions.isImage(props.img)) return
        setEnableDrag(true)
    }

    return (
        <div className="post-image-container" style={{zoom: props.scale ? props.scale : 1}}>
            <div className="post-image-box" ref={containerRef}>
                <div className="post-image-filters" ref={fullscreenRef}>
                    <div className="encoding-overlay" style={{display: encodingOverlay ? "flex" : "none"}}>
                        <span className="encoding-overlay-text">{functions.isVideo(props.img) ? "Rendering Video..." : "Rendering GIF..."}</span>
                    </div>
                    {functions.isVideo(props.img) ? <>
                        <div className="video-controls" ref={videoControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                        <div className="video-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <p className="video-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                            <Slider ref={videoSliderRef} className="video-slider" trackClassName="video-slider-track" thumbClassName="video-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(reverse ? 100 - value : value)}/>
                            <p className="video-control-text">{functions.formatSeconds(duration)}</p>
                        </div>
                        <div className="video-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="video-control-row-container">
                                <img className="video-control-img" onClick={() => changeReverse()} src={videoReverseIcon}/>
                                <img className="video-control-img" ref={videoSpeedRef} src={videoSpeedIcon} onClick={() => setShowSpeedDropdown((prev) => !prev)}/>
                                <img className="video-control-img" onClick={() => changePreservesPitch()} src={getPreversePitchIcon()}/>
                            </div> 
                            <div className="video-ontrol-row-container">
                                <img className="video-control-img" src={videoRewindIcon} onClick={() => rewind()}/>
                                <img className="video-control-img" onClick={() => setPaused((prev) => !prev)} src={getVideoPlayIcon()}/>
                                <img className="video-control-img" src={videoFastforwardIcon} onClick={() => fastforward()}/>
                            </div>    
                            <div className="video-control-row-container">
                                <img className="video-control-img" src={videoClearIcon} onClick={reset}/>
                            </div>  
                            <div className="video-control-row-container">
                                <img className="video-control-img" src={videoFullscreenIcon} onClick={fullscreen}/>
                            </div> 
                            <div className="video-control-row-container" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                                <img className="video-control-img" ref={videoVolumeRef} src={getVideoVolumeIcon()} onClick={mute}/>
                            </div> 
                        </div>
                        <div className={`video-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getVideoSpeedMarginRight(), marginTop: "-240px"}}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            {/* <Slider ref={videoSpeedSliderRef} invert orientation="vertical" className="video-speed-slider" trackClassName="video-speed-slider-track" thumbClassName="video-speed-slider-thumb"
                            value={speed} min={0.5} max={4} step={0.5} onChange={(value) => setSpeed(value)}/> */}
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(4); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">4x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(2); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">2x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(1.75); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">1.75x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(1.5); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">1.5x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(1.25); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">1.25x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(1); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">1x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(0.75); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">0.75x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(0.5); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">0.5x</span>
                            </div>
                            <div className="video-speed-dropdown-item" onClick={() => {setSpeed(0.25); setShowSpeedDropdown(false)}}>
                                <span className="video-speed-dropdown-text">0.25x</span>
                            </div>
                        </div>
                        <div className={`video-volume-dropdown ${showVolumeSlider ? "" : "hide-volume-dropdown"}`} style={{marginRight: getVideoVolumeMarginRight(), marginTop: "-110px"}}
                        onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                            <Slider ref={videoVolumeSliderRef} invert orientation="vertical" className="volume-slider" trackClassName="volume-slider-track" thumbClassName="volume-slider-thumb"
                            value={volume} min={0} max={1} step={0.01} onChange={(value) => changeVolume(value)}/>
                        </div>
                    </div>
                    <img className="video-lightness-overlay" ref={videoLightnessRef} src={backFrame}/>
                    <canvas className="video-sharpen-overlay" ref={videoOverlayRef}></canvas>
                    <canvas className="post-video-canvas" ref={videoCanvasRef}></canvas>
                    <video loop muted disablePictureInPicture className="post-video" ref={videoRef} src={props.img} onLoadedData={(event) => onLoad(event)}></video>
                    <img ref={backFrameRef} src={backFrame} className="back-frame"/>
                    </> : <>
                    {functions.isGIF(props.img) || gifData ? 
                    <>
                    <div className="gif-controls" ref={gifControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                        <div className="gif-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <p className="gif-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                            <Slider ref={gifSliderRef} className="gif-slider" trackClassName="gif-slider-track" thumbClassName="gif-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(reverse ? 100 - value : value)}/>
                            <p className="gif-control-text">{functions.formatSeconds(duration)}</p>
                        </div>
                        <div className="gif-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="gif-control-row-container">
                                <img className="gif-control-img" onClick={() => changeReverse()} src={gifReverseIcon}/>
                                <img className="gif-control-img" ref={gifSpeedRef} src={gifSpeedIcon} onClick={() => setShowSpeedDropdown((prev) => !prev)}/>
                            </div> 
                            <div className="gif-control-row-container">
                                {/* <img className="control-img" src={gifRewindIcon}/> */}
                                <img className="gif-control-img" onClick={() => setPaused((prev) => !prev)} src={getGIFPlayIcon()}/>
                                {/* <img className="control-img" src={gifFastforwardIcon}/> */}
                            </div>    
                            <div className="gif-control-row-container">
                                <img className="gif-control-img" src={gifClearIcon} onClick={reset}/>
                            </div> 
                            <div className="gif-control-row-container">
                                <img className="gif-control-img" src={gifFullscreenIcon} onClick={fullscreen}/>
                            </div> 
                        </div>
                        <div className={`gif-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getGIFSpeedMarginRight(), marginTop: "-240px"}}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            {/* <Slider ref={gifSpeedSliderRef} invert orientation="vertical" className="gif-speed-slider" trackClassName="gif-speed-slider-track" thumbClassName="gif-speed-slider-thumb"
                            value={speed} min={0.5} max={4} step={0.5} onChange={(value) => setSpeed(value)}/> */}
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(4); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">4x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(2); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">2x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1.75); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">1.75x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1.5); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">1.5x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1.25); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">1.25x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(1); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">1x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(0.75); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">0.75x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(0.5); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">0.5x</span>
                            </div>
                            <div className="gif-speed-dropdown-item" onClick={() => {setSpeed(0.25); setShowSpeedDropdown(false)}}>
                                <span className="gif-speed-dropdown-text">0.25x</span>
                            </div>
                        </div>
                    </div>
                    <img className="post-lightness-overlay" ref={gifLightnessRef} src={props.img}/>
                    <img className="post-sharpen-overlay" ref={gifOverlayRef} src={props.img}/>
                    <canvas className="post-gif-canvas" ref={gifRef}></canvas> 
                    </>
                    : null}
                    <div className="relative-ref" onMouseMove={dragImgDown} onMouseLeave={dragImgUp}>
                        {functions.isImage(props.img) && !gifData ?
                        <>
                        <div className="image-controls" ref={imageControls} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                            <div className="image-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <div className="image-control-row-container">
                                    <img className="image-control-img" onClick={() => setDisableZoom((prev) => !prev)} src={getZoomOffIcon()}/>
                                    <img className="image-control-img" onClick={zoomOut} src={imageZoomOutIcon}/>
                                    <img className="image-control-img" onClick={zoomIn} src={imageZoomInIcon}/>
                                    <img className="image-control-img" onClick={fullscreen} src={imageFullscreenIcon}/>
                                </div> 
                            </div>
                        </div>
                        </>
                        : null}
                        <TransformWrapper disabled={disableZoom} ref={zoomRef} minScale={1} maxScale={4} onZoomStop={(ref) => setZoom(ref.state.scale)} wheel={{step: 0.1, touchPadDisabled: true}} pinch={{disabled: true}} zoomAnimation={{size: 0, disabled: true}} alignmentAnimation={{disabled: true}} doubleClick={{mode: "reset", animationTime: 0}} panning={{disabled: zoom === 1}}>
                        <TransformComponent>
                            <img className="post-lightness-overlay" ref={lightnessRef} src={props.img}/>
                            <img className="post-sharpen-overlay" ref={overlayRef} src={props.img}/>
                            <canvas className="post-pixelate-canvas" ref={pixelateRef}></canvas>
                            <img className="post-image" ref={ref} src={props.img} onLoad={(event) => onLoad(event)}/>
                        </TransformComponent>
                        </TransformWrapper>
                    </div>
                    </>}
                </div>
            </div>
        </div>
    )
}

export default PostImage