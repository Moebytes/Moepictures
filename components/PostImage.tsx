import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, DownloadFlagContext, DownloadURLsContext, DisableZoomContext} from "../App"
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
import {TransformWrapper, TransformComponent} from "react-zoom-pan-pinch"
import path from "path"
import "./styles/post-image.less"
import mime from "mime-types"
const ffmpeg = createFFmpeg()

interface Props {
    img: string
    width?: number
    height?: number
    scale?: number
}

const PostImage: React.FunctionComponent<Props> = (props) => {
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
    const videoOverlayRef = useRef<HTMLImageElement>(null)
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
    const [reverse, setReverse] = useState(false)
    const [speed, setSpeed] = useState(1)
    const [volume, setVolume] = useState(0)
    const [previousVolume, setPreviousVolume] = useState(0)
    const [paused, setPaused] = useState(false)
    const [preservePitch, setPreservePitch] = useState(true)
    const [duration, setDuration] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [dragging, setDragging] = useState(false)
    const [imageDragging, setImageDragging] = useState(false)
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

    const memoryUsage = async () => {
        // @ts-ignore
        const result = await performance.measureUserAgentSpecificMemory()
        const usage = result.bytes / 1000000
        console.log(`${usage}MB`)
        // if (functions.isImage(props.img) && usage > 1000) window.location.reload()
    }

    useEffect(() => {
        if (gifSliderRef.current) gifSliderRef.current.resize()
        if (gifSpeedSliderRef.current) gifSpeedSliderRef.current.resize()
        if (videoSliderRef.current) videoSliderRef.current.resize()
        if (videoSpeedSliderRef.current) videoSpeedSliderRef.current.resize()
        if (videoVolumeSliderRef.current) videoVolumeSliderRef.current.resize()
        memoryUsage()
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
        if (!videoCanvasRef.current || !videoRef.current) return
        if (videoRef.current.clientWidth === 0) return
        videoCanvasRef.current.width = videoRef.current.clientWidth
        videoCanvasRef.current.height = videoRef.current.clientHeight
    }

    const handleKeydown = (event: any) => {
        const key = event.keyCode
        const value = String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key).toLowerCase()
        if (value === "f") {
            fullscreen()
        }
    }

    useEffect(() => {
        if (functions.isImage(props.img)) {
            // @ts-ignore
            new ResizeObserver(resizeImageCanvas).observe(ref.current!)
        }
        if (functions.isGIF(props.img)) {
            // @ts-ignore
            new ResizeObserver(resizeGIFCanvas).observe(ref.current!)
        }
        if (functions.isVideo(props.img)) {
            // @ts-ignore
            new ResizeObserver(resizeVideoCanvas).observe(videoRef.current!)
        }
        window.addEventListener("keydown", handleKeydown)
        return () => {
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
        if (imageLoaded && functions.isGIF(props.img)) {
            parseGIF()
        }
    }, [imageLoaded])

    useEffect(() => {
        const parseVideo = async () => {
            if (!videoRef.current) return
            if (functions.isMP4(props.img)) {
                const frames = await functions.extractMP4Frames(props.img, videoRef.current!.duration)
                setVideoData(frames)
                const canvas = document.createElement("canvas")
                const img = frames[0]
                canvas.width = img.width 
                canvas.height = img.height 
                const ctx = canvas.getContext("bitmaprenderer") as any
                ctx.transferFromImageBitmap(img)
                setBackFrame(canvas.toDataURL())
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
            ffmpeg.exit()
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
        if (gifData && functions.isGIF(props.img)) {
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

            const draw = async () => {
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
                } else {
                    gifCanvas.style.width = `${gifCanvas.width}px`
                    gifCanvas.style.height = `${gifCanvas.height}px`
                    gifCanvas.style.imageRendering = "none"
                    ctx.clearRect(0, 0, gifCanvas.width, gifCanvas.height)
                    ctx.drawImage(frame, 0, 0, gifCanvas.width, gifCanvas.height)
                }
            }

            const gifLoop = async () => {
                draw()
                if (paused) return clearTimeout(timeout)
                update()
                timeout = setTimeout(() => {
                    gifLoop()
                }, delay)
            }
            gifLoop()
        } return () => {
            clearTimeout(timeout)
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
        if (!videoRef.current || !videoCanvasRef.current) return
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
            } else {
                // @ts-ignore
                videoRef.current.preservesPitch = false 
            }
            const adjustedData = videoData ? functions.videoSpeed(videoData, speed) : null
            videoRef.current.playbackRate = speed 
            const videoCanvas = videoCanvasRef.current
            videoCanvas.style.opacity = "1"
            videoRef.current.style.opacity = "0"
            videoCanvas.width = videoRef.current.clientWidth
            videoCanvas.height = videoRef.current.clientHeight
            const landscape = videoCanvas.width >= videoCanvas.height
            const ctx = videoCanvas.getContext("2d") as any
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
            let frame = adjustedData ? adjustedData[pos] : videoRef.current as any
            setDuration(videoRef.current.duration / speed)

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

            const draw = async () => {
                if (!videoRef.current || !videoCanvasRef.current) return
                const pixelWidth = videoCanvas.width / pixelate 
                const pixelHeight = videoCanvas.height / pixelate
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

            const videoLoop = () => {
                draw()
                // @ts-ignore
                if (paused) return videoRef.current?.cancelVideoFrameCallback(id)
                update()
                // @ts-ignore
                id = videoRef.current?.requestVideoFrameCallback(videoLoop)
            }
            // @ts-ignore
            id = videoRef.current?.requestVideoFrameCallback(videoLoop)
        } return () => {
            // @ts-ignore
            videoRef.current?.cancelVideoFrameCallback(id)
        }
    }, [videoLoaded, reverse, seekTo, pixelate, paused, speed, preservePitch, dragging, dragProgress])

    useEffect(() => {
        if (!functions.isVideo(props.img)) return
        if (!videoRef.current || !videoCanvasRef.current || !reverseVideo) return
        if (reverse) {
            if (videoRef.current.src !== reverseVideo) {
                videoRef.current.src = reverseVideo
                setTimeout(() => {
                    seek(progress)
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
        let secondsProgress = reverse ? ((100 - position) / 100) * duration : (position / 100) * duration
        let progress = reverse ? (duration / 100) * (100 - position) : (duration / 100) * position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        if (functions.isVideo(props.img) && !videoData) return
        const val = value !== undefined ? value : !reverse 
        let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        if (functions.isGIF(props.img)) secondsProgress = (duration / 100) * progress
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
        if (!containerRef.current) return
        const element = containerRef.current.querySelector(".post-image-filters") as any
        if (!element) return
        let newContrast = contrast
        const image = functions.isVideo(props.img) ? element.querySelector(".post-video") : element.querySelector(".post-image") as any
        const sharpenOverlay = functions.isVideo(props.img) ? element.querySelector(".video-sharpen-overlay")  : element.querySelector(".post-sharpen-overlay") as any
        const lightnessOverlay = functions.isVideo(props.img) ? element.querySelector(".video-lightness-overlay") : element.querySelector(".post-lightness-overlay") as any
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
        if (functions.isGIF(props.img) || functions.isVideo(props.img)) return
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
            if (videoRef.current?.paused) await videoRef.current!.play()
            if (!videoLoaded) setVideoLoaded(true)
            setTimeout(() => {
                seek(0)
            }, 70)
        } else {
            setImageWidth(event.target.width)
            setImageHeight(event.target.height)
            setNaturalWidth(event.target.naturalWidth)
            setNaturalHeight(event.target.naturalHeight)
            // if (!functions.isGIF(props.img)) setImageLoaded(true)
            if (ref.current) ref.current.style.display = "flex"
            setImageLoaded(true)
        }
    }

    const render = () => {
        if (!ref.current || !pixelateRef.current || !lightnessRef.current || !overlayRef.current) return
        const canvas = document.createElement("canvas") as any
        canvas.width = naturalWidth
        canvas.height = naturalHeight
        const ctx = canvas.getContext("2d") as any
        let newContrast = contrast
        ctx.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        ctx.drawImage(ref.current, 0, 0, canvas.width, canvas.height)
        if (pixelate !== 1) {
            const pixelWidth = ref.current.width / pixelate 
            const pixelHeight = ref.current.height / pixelate
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(pixelateRef.current, 0, 0, pixelWidth, pixelHeight, 0, 0, canvas.width, canvas.height)
        }
        if (sharpen !== 0) {
            const sharpnessCanvas = document.createElement("canvas")
            sharpnessCanvas.width = naturalWidth
            sharpnessCanvas.height = naturalHeight
            const sharpnessCtx = sharpnessCanvas.getContext("2d")
            sharpnessCtx?.drawImage(overlayRef.current, 0, 0, sharpnessCanvas.width, sharpnessCanvas.height)
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
            lightnessCtx?.drawImage(lightnessRef.current, 0, 0, lightnessCanvas.width, lightnessCanvas.height)
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            ctx.filter = filter
            ctx.globalAlpha = `${Math.abs((lightness - 100) / 100)}`
            ctx.drawImage(lightnessCanvas, 0, 0, canvas.width, canvas.height)
        }
        return canvas.toDataURL("image/png")
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadURLs.includes(props.img)) {
                if (functions.isGIF(props.img)) {
                    functions.download(path.basename(props.img), props.img)
                } else {
                    functions.download(path.basename(props.img), render())
                }
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
            }
            if (ref.current) {
                ref.current.style.maxWidth = "calc(100vw - 230px - 70px)"
                ref.current.style.maxHeight = "calc(100vh - 35px - 77px)"
            }
        } else {
            fullscreenRef.current?.requestFullscreen()
            if (videoRef.current) {
                videoRef.current.style.maxWidth = "100vw"
                videoRef.current.style.maxHeight = "100vh"
                if (backFrame && backFrameRef.current) {
                    videoRef.current.style.position = "relative"
                    backFrameRef.current.style.display = "none"
                }
            }
            if (ref.current) {
                ref.current.style.maxWidth = "100vw"
                ref.current.style.maxHeight = "100vh"
            }
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
                    {functions.isVideo(props.img) ? <>
                        <div className="video-controls" ref={videoControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                        <div className="video-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <p className="video-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                            <Slider ref={videoSliderRef} className="video-slider" trackClassName="video-slider-track" thumbClassName="video-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
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
                    <img className="video-lightness-overlay" ref={videoLightnessRef} src={props.img}/>
                    <img className="video-sharpen-overlay" ref={videoOverlayRef} src={props.img}/>
                    <canvas className="post-video-canvas" ref={videoCanvasRef}></canvas>
                    <video loop muted disablePictureInPicture className="post-video" ref={videoRef} src={props.img} onLoadedData={(event) => onLoad(event)}></video>
                    <img ref={backFrameRef} src={backFrame} className="back-frame"/>
                    </> : <>
                    {functions.isGIF(props.img) ? 
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
                    <canvas className="post-gif-canvas" ref={gifRef}></canvas> 
                    </>
                    : null}
                    <div className="relative-ref" onMouseMove={dragImgDown} onMouseLeave={dragImgUp}>
                        {functions.isImage(props.img) ?
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
                    {!imageLoaded ? <img className="post-loading" src={getLoading()}/> : null}
                    </>}
                </div>
            </div>
        </div>
    )
}

export default PostImage