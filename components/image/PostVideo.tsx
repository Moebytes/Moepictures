import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from "react"
import {useNavigate} from "react-router-dom"
import withPostWrapper, {PostWrapperProps, PostWrapperRef} from "./withPostWrapper"
import {useSessionSelector, useLayoutSelector, useFilterSelector, usePlaybackSelector, usePlaybackActions, 
useSearchSelector, useInteractionActions} from "../../store"
import {FFmpeg} from "@ffmpeg/ffmpeg"
import Slider from "react-slider"
import videoReverseIcon from "../../assets/icons/video-reverse.png"
import videoSpeedIcon from "../../assets/icons/video-speed.png"
import videoClearIcon from "../../assets/icons/video-clear.png"
import videoPlayIcon from "../../assets/icons/video-play.png"
import videoPauseIcon from "../../assets/icons/video-pause.png"
import videoRewindIcon from "../../assets/icons/video-rewind.png"
import videoFastforwardIcon from "../../assets/icons/video-fastforward.png"
import videoPreservePitchIcon from "../../assets/icons/video-preservepitch.png"
import videoPreservePitchOnIcon from "../../assets/icons/video-preservepitch-on.png"
import videoFullscreenIcon from "../../assets/icons/video-fullscreen.png"
import videoVolumeIcon from "../../assets/icons/video-volume.png"
import videoVolumeLowIcon from "../../assets/icons/video-volume-low.png"
import videoVolumeMuteIcon from "../../assets/icons/video-volume-mute.png"
import path from "path"
import mime from "mime-types"
import functions from "../../functions/Functions"

let timer = null as any
let timeout = null as any
let id = 0

const PostVideo = forwardRef<PostWrapperRef, PostWrapperProps>((props, parentRef) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {secondsProgress, progress, dragProgress, reverse, speed, preservePitch, volume, previousVolume, 
    paused, duration, dragging, seekTo} = usePlaybackSelector()
    const {setSecondsProgress, setProgress, setDragProgress, setReverse, setSpeed, setPreservePitch, setVolume, 
    setPreviousVolume, setPaused, setDuration, setDragging, setSeekTo} = usePlaybackActions()
    const {setEnableDrag} = useInteractionActions()
    const {imageExpand, format} = useSearchSelector()
    const videoControls = useRef<HTMLDivElement>(null)
    const videoSliderRef = useRef<Slider>(null)
    const videoSpeedRef = useRef<HTMLImageElement>(null)
    const videoVolumeRef = useRef<HTMLImageElement>(null)
    const videoVolumeSliderRef = useRef<Slider>(null)
    const [video, setVideo] = useState("")
    const [encodingOverlay, setEncodingOverlay] = useState(false)
    const {toggleFullscreen, getCurrentBuffer, getCurrentLink, updateProgressText, seek, reset, changeReverse} = props
    const {naturalWidth, setNaturalWidth} = props
    const {naturalHeight, setNaturalHeight} = props
    const {imageLoaded, setImageLoaded} = props
    const {tempLink, setTempLink} = props
    const [reverseVideo, setReverseVideo] = useState("")
    const [videoData, setVideoData] = useState(null as ImageBitmap[] | null)
    const {backFrame, setBackFrame} = props
    const {fullscreen, setFullscreen} = props
    const {showSpeedDropdown, setShowSpeedDropdown} = props
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const {videoRef, lightnessRef, overlayRef, effectRef, pixelateRef, backFrameRef, onLoaded} = props
    const ffmpegRef = useRef(new FFmpeg())
    const navigate = useNavigate()

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const decryptVideo = async () => {
        const decryptedVideo = await functions.crypto.decryptItem(props.video!, session)
        setVideo(decryptedVideo)
    }

    const fetchVideo = async () => {
        if (!videoRef.current) return
        const blob = await fetch(props.video!).then((r) => r.blob())
        const url = URL.createObjectURL(blob)
        videoRef.current.src = url
    }

    const cancelAnimation = () => {
        clearTimeout(timeout)
        videoRef.current?.cancelVideoFrameCallback(id)
    }

    useEffect(() => {
        const savedReverseVideo = localStorage.getItem("reverseVideo")
        if (savedReverseVideo) {
            URL.revokeObjectURL(savedReverseVideo)
            localStorage.removeItem("reverseVideo")
        }
        setImageLoaded(false)
        setReverseVideo("")
        setReverse(false)
        setVideoData(null)
        setBackFrame("")
        setSecondsProgress(0)
        setProgress(0)
        setDragProgress(0)
        setDragging(false)
        setSeekTo(null)
        cancelAnimation()
        if (props.video) setTempLink(tempLink ? "" : localStorage.getItem("reverseSearchLink") || "")
        if (videoRef.current) videoRef.current.style.opacity = "1"
        if (mobile) fetchVideo()
        decryptVideo()
    }, [props.video])

    useEffect(() => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            decryptVideo()
        }, 200)
    }, [props.video, session])

    useEffect(() => {
        if (videoSliderRef.current) videoSliderRef.current.resize()
        if (videoVolumeSliderRef.current) videoVolumeSliderRef.current.resize()
    })

    useEffect(() => {
        const parseVideo = async () => {
            if (!videoRef.current) return
            let frames = [] as ImageBitmap[]
            if (functions.file.isMP4(props.video)) {
                const link = getCurrentLink(!session.upscaledImages)
                frames = await functions.video.extractMP4Frames(link)
            } else if (functions.file.isWebM(props.video)) {
                const arrayBuffer = await getCurrentBuffer(!session.upscaledImages)
                frames = await functions.video.extractWebMFrames(arrayBuffer)
            }
            setVideoData(frames)
        }
        
        const reverseAudioStream = async () => {
            const {fetchFile} = await import("@ffmpeg/util")
            const ffmpeg = ffmpegRef.current
            if (!ffmpeg.loaded) await ffmpeg.load()
            const name = path.basename(props.video!, path.extname(props.video!))
            const ext = path.extname(props.video!)
            const input = `${name}${ext}`
            const output = `${name}-reversed${ext}`
            ffmpeg.writeFile(input, await fetchFile(video))
            await ffmpeg.exec(["-i", input, "-map", "0", "-c:v", "copy", "-af", "areverse", output])
            const binary = await ffmpeg.readFile(output) as Uint8Array
            if (binary) {
                const blob = new Blob([new DataView(new Uint8Array(binary).buffer)], {type: mime.lookup(path.extname(props.video!)) || "video/mp4"})
                const url = URL.createObjectURL(blob)
                setReverseVideo(`${url}#${ext}`)
                localStorage.setItem("reverseVideo", `${url}#${ext}`)
            }
            ffmpeg.deleteFile(output)
        }

        const parseThumbnail = async () => {
            const thumbnail = await functions.video.videoThumbnail(props.video!)
            setBackFrame(thumbnail)
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

        const processFrames = async () => {
            if (reverse) {
                await parseVideo()
                if (functions.file.isMP4(props.video)) reverseAudioStream()
            }
        }
        
        if (!videoData && imageLoaded) {
            parseThumbnail()
            processFrames()
        }
    }, [imageLoaded, reverse, videoData])

    useEffect(() => {
        if (!videoRef.current || !pixelateRef.current || !overlayRef.current) return
        if (imageLoaded) {
            if (paused) {
                videoRef.current.pause()
                setSeekTo(null)
                if (!dragging && !videoData) return
            } else {
                if (videoRef.current?.paused) videoRef.current.play()
            }
            if (preservePitch) {
                videoRef.current.preservesPitch = true
            } else {
                videoRef.current.preservesPitch = false
            }
            const adjustedData = videoData ? functions.video.videoSpeed(videoData, speed) : null
            videoRef.current.playbackRate = speed 
            const pixelateCanvas = pixelateRef.current
            const sharpenOverlay = overlayRef.current
            pixelateCanvas.style.opacity = "1"
            videoRef.current.style.opacity = "1"
            const landscape = videoRef.current.videoWidth >= videoRef.current.videoHeight
            if (landscape) {
                const aspectRatioInv = naturalHeight / naturalWidth
                pixelateCanvas.width = videoRef.current.clientWidth
                pixelateCanvas.height = videoRef.current.clientWidth * aspectRatioInv
            } else {
                const aspectRatio = naturalWidth / naturalHeight
                pixelateCanvas.width = videoRef.current.clientHeight * aspectRatio
                pixelateCanvas.height = videoRef.current.clientHeight 
            }
            sharpenOverlay.width = videoRef.current.clientWidth
            sharpenOverlay.height = videoRef.current.clientHeight
            const ctx = pixelateCanvas.getContext("2d")!
            // const sharpenCtx = sharpenOverlay.getContext("2d")!
            let frames = adjustedData ? adjustedData.length - 1 : 1
            let duration = videoRef.current.duration / speed
            let interval = duration / frames
            let sp = seekTo !== null ? seekTo : secondsProgress
            if (dragging) sp = dragProgress || 0
            let pos = Math.floor(sp / interval)
            if (!adjustedData?.[pos]) pos = 0
            let seekValue = seekTo !== null ? seekTo * speed : null 
            seekValue = dragging ? (dragProgress || 0) * speed : seekValue
            if (seekValue !== null) if (Number.isNaN(seekValue) || !Number.isFinite(seekValue)) seekValue = 0
            if (seekValue) videoRef.current.currentTime = seekValue
            if (reverse && adjustedData) pos = (adjustedData.length - 1) - pos
            let frame = adjustedData ? adjustedData[pos] : videoRef.current
            setDuration(duration)

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
                if (!videoRef.current || !pixelateCanvas) return
                const pixelWidth = pixelateCanvas.width / pixelate 
                const pixelHeight = pixelateCanvas.height / pixelate
                if (sharpen !== 0) {
                    const sharpenOpacity = sharpen / 5
                    sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
                    sharpenOverlay.style.mixBlendMode = "overlay"
                    sharpenOverlay.style.opacity = `${sharpenOpacity}`
                    // sharpenCtx.clearRect(0, 0, sharpenOverlay.width, sharpenOverlay.height)
                    // sharpenCtx.drawImage(frame, 0, 0, sharpenOverlay.width, sharpenOverlay.height)
                } else {
                    sharpenOverlay.style.filter = "none"
                    sharpenOverlay.style.mixBlendMode = "normal"
                    sharpenOverlay.style.opacity = "0"
                }
                if (pixelate !== 1) {
                    ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
                    ctx.drawImage(frame, 0, 0, pixelWidth, pixelHeight)
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
                    ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
                    ctx.drawImage(frame, 0, 0, pixelateCanvas.width, pixelateCanvas.height)
                }
            }

            const videoLoop = async () => {
                draw()
                if (paused) return videoRef.current?.cancelVideoFrameCallback(id)
                update()
                id = videoRef.current?.requestVideoFrameCallback(videoLoop)!
            }
            id = videoRef.current.requestVideoFrameCallback(videoLoop)

        } return () => {
            videoRef.current?.cancelVideoFrameCallback(id)
        }
    }, [imageLoaded, videoData, reverse, seekTo, pixelate, paused, speed, preservePitch, dragging, dragProgress, sharpen, fullscreen])

    useEffect(() => {
        if (!videoRef.current || !reverseVideo) return
        if (reverse) {
            if (videoRef.current.src !== reverseVideo) {
                videoRef.current.src = reverseVideo
                setTimeout(() => {
                    seek(100 - progress)
                }, 100)
            }
        } else {
            if (videoRef.current.src !== video) {
                videoRef.current.src = video
                setTimeout(() => {
                    seek(progress)
                }, 100)
            }
        }
    }, [reverse])

    const encodeVideo = async (frames: string[], audio: string) => {
        const {fetchFile} = await import("@ffmpeg/util")
        const ffmpeg = ffmpegRef.current
        if (!ffmpeg.loaded) await ffmpeg.load()
        for (let i = 0; i < frames.length; i++) {
            const num = `00${i}`.slice(-3)
            ffmpeg.writeFile(`${num}.png`, await fetchFile(frames[i]))
        }
        ffmpeg.writeFile("audio.wav", await fetchFile(audio))
        await ffmpeg.exec(["-framerate", "30", "-pattern_type", "glob", "-i", "*.png", "-i", "audio.wav", 
            "-c:a", "aac", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "video.mp4"])
        const binary = await ffmpeg.readFile("video.mp4") as Uint8Array
        let url = ""
        if (binary) {
            const blob = new Blob([new DataView(new Uint8Array(binary).buffer)], {type: "video/mp4"})
            url = URL.createObjectURL(blob)
        }
        try {
            for (let i = 0; i < frames.length; i++) {
                const num = `00${i}`.slice(-3)
                ffmpeg.deleteFile(`${num}.png`)
            }
            ffmpeg.deleteFile("video.mp4")
            ffmpeg.deleteFile("audio.wav")
        } catch {
            // ignore
        }
        return url
    }

    const audioSpeed = async (audioFile: string) => {
        const {fetchFile} = await import("@ffmpeg/util")
        const ffmpeg = ffmpegRef.current
        if (!ffmpeg.loaded) await ffmpeg.load()
        ffmpeg.writeFile("input.wav", await fetchFile(audioFile))
        let audioSpeed = preservePitch ? `atempo=${speed}` : `asetrate=44100*${speed},aresample=44100`
        let filter = ["-filter_complex", `[0:a]${audioSpeed}${reverse ? ",areverse" : ""}[a]`, "-map", "[a]"]
        await ffmpeg.exec(["-i", "input.wav", ...filter, "audio.wav"])
        const binary = await ffmpeg.readFile("audio.wav") as Uint8Array
        let url = ""
        if (binary) {
            const blob = new Blob([new DataView(new Uint8Array(binary).buffer)], {type: "audio/x-wav"})
            url = URL.createObjectURL(blob)
        }
        try {
            ffmpeg.deleteFile("input.wav")
            ffmpeg.deleteFile("audio.wav")
        } catch {
            // ignore
        }
        return url
    }

    const renderVideo = async () => {
        let filters = {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter}
        if ((functions.image.filtersOn(filters) || functions.video.rateOn({speed, reverse})) && videoData) {
            if (encodingOverlay) return
            setEncodingOverlay(true)
            setPaused(true)
            let audio = await functions.audio.videoToWAV(video).then((a) => audioSpeed(a))
            const adjustedData = functions.video.videoSpeed(videoData, speed)
            let clientWidth = backFrameRef.current?.clientWidth!
            let clientHeight = backFrameRef.current?.clientHeight!
            let frames = adjustedData.map((frame) => functions.image.render(frame, filters, false, {clientWidth, clientHeight}))
            if (reverse) frames = frames.reverse()
            const url = await encodeVideo(frames, audio)
            setEncodingOverlay(false)
            setPaused(false)
            return url
        } else {
            return video
        }
    }

    const download = async () => {
        let filename = path.basename(props.video!).replace(/\?.*$/, "")
        if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
            filename = props.post.source.match(/\d+/g)?.[0] + path.extname(props.video!).replace(/\?.*$/, "")
        }
        const video = await renderVideo()
        console.log(video)
        if (!video) return
        functions.dom.download(filename, video)
        window.URL.revokeObjectURL(video)
    }

    const getPreversePitchIcon = () => {
        if (preservePitch) return videoPreservePitchIcon
        return videoPreservePitchOnIcon
    }

    const getSpeedMarginRight = () => {
        const controlRect = videoControls.current?.getBoundingClientRect()
        const rect = videoSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -2
        return `${raw + offset}px`
    }

    const getVolumeMarginRight = () => {
        const controlRect = videoControls.current?.getBoundingClientRect()
        const rect = videoVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -7
        return `${raw + offset}px`
    }

    const changePreservesPitch = (value?: boolean) => {
        const secondsProgress = (progress / 100) * duration
        setPreservePitch(value !== undefined ? value : !preservePitch)
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
        videoRef.current.volume = functions.audio.logSlider(value)
        setVolume(value)
        setPreviousVolume(value)
    }

    useEffect(() => {
        changeVolume(1)
    }, [])

    const mute = () => {
        if (!videoRef.current) return
        if (videoRef.current.volume > 0) {
            videoRef.current.muted = true
            videoRef.current.volume = 0
            setVolume(0)
        } else {
            const newVol = previousVolume ? previousVolume : 1
            videoRef.current.volume = functions.audio.logSlider(newVol)
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

    const controlMouseEnter = () => {
        if (videoControls.current) videoControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedDropdown(false)
        setShowVolumeSlider(false)
        if (videoControls.current) videoControls.current.style.opacity = "0"
    }

    return (
        <>
        <video draggable={false} loop muted disablePictureInPicture playsInline className="dummy-post-video" src={video}></video>
        <div className="encoding-overlay" style={{display: encodingOverlay ? "flex" : "none"}}>
            <span className="encoding-overlay-text">{`Rendering Video...`}</span>
        </div>
        <div className="video-controls" ref={videoControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
        {duration >= 1 ?
        <div className="video-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
            <p className="video-control-text">{dragging ? functions.date.formatSeconds(dragProgress || 0) : functions.date.formatSeconds(secondsProgress)}</p>
            <Slider ref={videoSliderRef} className="video-slider" trackClassName="video-slider-track" thumbClassName="video-slider-thumb" min={0} max={100} 
            value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(reverse ? 100 - value : value)}/>
            <p className="video-control-text">{functions.date.formatSeconds(duration)}</p>
        </div> : null}
        <div className="video-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
            <div className="video-control-row-container">
                <img draggable={false} className="video-control-img" onClick={() => changeReverse()} src={videoReverseIcon}/>
                <img draggable={false} className="video-control-img" ref={videoSpeedRef} src={videoSpeedIcon} onClick={() => setShowSpeedDropdown((prev) => !prev)}/>
                <img draggable={false} className="video-control-img" onClick={() => changePreservesPitch()} src={getPreversePitchIcon()}/>
            </div> 
            <div className="video-ontrol-row-container">
                <img draggable={false} className="video-control-img" src={videoRewindIcon} onClick={() => rewind()}/>
                <img draggable={false} className="video-control-img" onClick={() => setPaused(!paused)} src={getVideoPlayIcon()}/>
                <img draggable={false} className="video-control-img" src={videoFastforwardIcon} onClick={() => fastforward()}/>
            </div>    
            <div className="video-control-row-container">
                <img draggable={false} className="video-control-img" src={videoClearIcon} onClick={reset}/>
            </div>  
            <div className="video-control-row-container">
                <img draggable={false} className="video-control-img" src={videoFullscreenIcon} onClick={() => toggleFullscreen()}/>
            </div> 
            <div className="video-control-row-container" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                <img draggable={false} className="video-control-img" ref={videoVolumeRef} src={getVideoVolumeIcon()} onClick={mute}/>
            </div> 
        </div>
        <div className={`video-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getSpeedMarginRight(), marginTop: "-240px"}}
        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
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
        <div className={`video-volume-dropdown ${showVolumeSlider ? "" : "hide-volume-dropdown"}`} style={{marginRight: getVolumeMarginRight(), marginTop: "-110px"}}
        onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
            <Slider ref={videoVolumeSliderRef} invert orientation="vertical" className="volume-slider" trackClassName="volume-slider-track" thumbClassName="volume-slider-thumb"
            value={volume} min={0} max={1} step={0.01} onChange={(value) => changeVolume(value)}/>
        </div>
    </div>
    <img draggable={false} className="video-lightness-overlay" ref={lightnessRef} src={backFrame}/>
    <img draggable={false} className="video-sharpen-overlay" ref={overlayRef} src={backFrame}/>

    <canvas draggable={false} className="post-effect-canvas" ref={effectRef}></canvas>
    <canvas draggable={false} className="post-video-canvas" ref={pixelateRef}></canvas>

    <video draggable={false} autoPlay loop muted disablePictureInPicture playsInline src={video} 
    className={`${imageExpand? "post-video-expand" : "post-video"}`} ref={videoRef} onLoadedData={(event) => onLoaded(event)}></video>
    <img draggable={false} ref={backFrameRef} src={backFrame} className={`${imageExpand? "back-frame-expand" : "back-frame"}`}/>
    </>
    )
})

export default withPostWrapper(PostVideo)