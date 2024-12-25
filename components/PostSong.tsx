import React, {useEffect, useRef, useState, useReducer} from "react"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, 
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, useFlagSelector, useFlagActions,
useSessionActions} from "../store"
import functions from "../structures/Functions"
import Slider from "react-slider"
import audioReverseIcon from "../assets/icons/audio-reverse.png"
import audioSpeedIcon from "../assets/icons/audio-speed.png"
import audioClearIcon from "../assets/icons/audio-clear.png"
import audioPlayIcon from "../assets/icons/audio-play.png"
import audioPauseIcon from "../assets/icons/audio-pause.png"
import audioRewindIcon from "../assets/icons/audio-rewind.png"
import audioFastforwardIcon from "../assets/icons/audio-fastforward.png"
import audioPreservePitchIcon from "../assets/icons/audio-preservepitch.png"
import audioPreservePitchOnIcon from "../assets/icons/audio-preservepitch-on.png"
import audioFullscreenIcon from "../assets/icons/audio-fullscreen.png"
import audioVolumeIcon from "../assets/icons/audio-volume.png"
import audioVolumeLowIcon from "../assets/icons/audio-volume-low.png"
import audioVolumeMuteIcon from "../assets/icons/audio-volume-mute.png"
import noteToggleOn from "../assets/icons/note-toggle-on.png"
import reverseSearchIcon from "../assets/icons/reverse-search.png"
import google from "../assets/icons/google-purple.png"
import bing from "../assets/icons/bing-purple.png"
import yandex from "../assets/icons/yandex-purple.png"
import saucenao from "../assets/icons/saucenao-purple.png"
import ascii2d from "../assets/icons/ascii2d-purple.png"
import expand from "../assets/icons/expand.png"
import contract from "../assets/icons/contract.png"
import NoteEditor from "./NoteEditor"
import nextIcon from "../assets/icons/go-right.png"
import prevIcon from "../assets/icons/go-left.png"
import path from "path"
import {PostFull, PostHistory} from "../types/Types"
import "./styles/postsong.less"

interface Props {
    post?: PostFull | PostHistory
    audio: string
    coverImg?: string
    width?: number
    height?: number
    scale?: number
    noKeydown?: boolean
    comicPages?: string[]
    order?: number
    noNotes?: boolean
    unverified?: boolean
    previous?: () => void
    next?: () => void
    noteID?: string | null
}

const PostSong: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {audio, audioPost, rewindFlag, fastForwardFlag, playFlag, volumeFlag, muteFlag, resetFlag, secondsProgress, progress, 
    dragProgress, reverse, speed, pitch, volume, previousVolume, paused, duration, dragging, seekTo} = usePlaybackSelector()
    const {setAudio, setAudioPost, setRewindFlag, setFastForwardFlag, setPlayFlag, setVolumeFlag, setMuteFlag, setResetFlag, 
    setSecondsProgress, setProgress, setDragProgress, setReverse, setSpeed, setPitch, setVolume, setPreviousVolume, setPaused, 
    setDuration, setDragging, setSeekTo} = usePlaybackActions()
    const {noteMode, imageExpand} = useSearchSelector()
    const {setNoteMode, setNoteDrawingEnabled, setImageExpand} = useSearchActions()
    const {downloadFlag, downloadIDs} = useFlagSelector()
    const {setDownloadFlag, setDownloadIDs} = useFlagActions()
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showPitchDropdown, setShowPitchDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const dummyRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const lightnessRef = useRef<HTMLCanvasElement>(null)
    const ref = useRef<HTMLCanvasElement>(null)
    const audioControls = useRef<HTMLDivElement>(null)
    const audioSliderRef = useRef<any>(null)
    const audioSpeedRef = useRef(null) as any
    const audioPitchRef = useRef(null) as any
    const audioVolumeRef = useRef(null) as any
    const audioSpeedSliderRef = useRef<any>(null)
    const audioVolumeSliderRef = useRef<any>(null)
    const [init, setInit] = useState(false)
    const [buttonHover, setButtonHover] = useState(false)
    const [coverImg, setCoverImg] = useState("")
    const [previousButtonHover, setPreviousButtonHover] = useState(false)
    const [nextButtonHover, setNextButtonHover] = useState(false)
    const [showReverseIcons, setShowReverseIcons] = useState(false)
    const [tempLink, setTempLink] = useState("")

    useEffect(() => {
        const savedPaused = localStorage.getItem("paused")
        if (savedPaused) setPaused(savedPaused === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("paused", String(paused))
    }, [paused])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateSongCover = async () => {
        const songCover = await functions.songCover(props.audio)
        setCoverImg(songCover)
    }

    useEffect(() => {
        if (!functions.isAudio(props.audio)) return
        setAudio(props.audio)
        setAudioPost(props.post)
        if (ref.current) ref.current.style.opacity = "1"
        updateSongCover()
        if (props.audio) setTempLink(tempLink ? "" : localStorage.getItem("reverseSearchLink") || "")
    }, [props.audio])

    useEffect(() => {
        if (audioSliderRef.current) audioSliderRef.current.resize()
        if (audioSpeedSliderRef.current) audioSpeedSliderRef.current.resize()
        if (audioVolumeSliderRef.current) audioVolumeSliderRef.current.resize()
    })

    const resizeImageCanvas = () => {
        if (!pixelateRef.current || !ref.current) return
        pixelateRef.current.width = ref.current.clientWidth
        pixelateRef.current.height = ref.current.clientHeight
    }

    const exitFullScreen = async () => {
        // @ts-ignore
        if (!document.fullscreenElement && !document.webkitIsFullScreen) {
            await fullscreen(true)
            resizeImageCanvas()
            forceUpdate()
        }
    }

    const handleKeydown = (event: any) => {
        const key = event.key
        if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement) && !(event.target.classList.contains("dialog-textarea"))) {
            if (key === "f") {
                if (!props.noKeydown) fullscreen()
            }
            if (key === "t") {
                setNoteMode(!noteMode)
                setNoteDrawingEnabled(true)
            }
        }
    }

    useEffect(() => {
        let observer = null as any
        if (functions.isImage(coverImg)) {
            observer = new ResizeObserver(resizeImageCanvas)
            observer.observe(ref.current!)
        }
        window.addEventListener("keydown", handleKeydown)
        window.addEventListener("fullscreenchange", exitFullScreen)
        window.addEventListener("webkitfullscreenchange", exitFullScreen)
        return () => {
            observer?.disconnect()
            window.removeEventListener("keydown", handleKeydown)
            window.removeEventListener("fullscreenchange", exitFullScreen)
            window.removeEventListener("webkitfullscreenchange", exitFullScreen)
        }
    }, [])

    useEffect(() => {
        if (!dragging && dragProgress !== null) {
            setSecondsProgress(dragProgress)
            setProgress((dragProgress / duration) * 100)
            setDragProgress(null)
        }
    }, [dragging, dragProgress, duration])

    const getAudioSpeedMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -2
        return `${raw + offset}px`
    }

    const getAudioPitchMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioPitchRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -2
        return `${raw + offset}px`
    }

    const getAudioVolumeMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioVolumeRef.current?.getBoundingClientRect()
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
        setAudio(props.audio)
        setAudioPost(props.post)
        setPlayFlag("always")
        let secondsProgress = reverse ? ((100 - position) / 100) * duration : (position / 100) * duration
        let progress = reverse ? 100 - position : position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const updatePlay = () => {
        setAudio(props.audio)
        setAudioPost(props.post)
        setPlayFlag("toggle")
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !reverse
        setReverse(val)
    }

    const updateMute = () => {
        setMuteFlag(true)
        setShowVolumeSlider((prev) => !prev)
    }

    const updateVolume = (value: number) => {
        setVolumeFlag(value)
    }

    useEffect(() => {
        if (!fullscreenRef.current) return
        const element = fullscreenRef.current
        let newContrast = contrast
        const image = coverImg
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

    const imagePixelate = () => {
        if (!pixelateRef.current || !containerRef.current || !ref.current) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d") as any
        const imageWidth = ref.current.clientWidth 
        const imageHeight = ref.current.clientHeight
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
    }, [pixelate])

    useEffect(() => {
        if (!props.post) return
        if (downloadFlag) {
            if (downloadIDs.includes(props.post.postID)) {
                functions.download(path.basename(props.audio), props.audio)
                setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post?.postID))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag])

    const controlMouseEnter = () => {
        if (audioControls.current) audioControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedDropdown(false)
        setShowPitchDropdown(false)
        setShowVolumeSlider(false)
        if (audioControls.current) audioControls.current.style.opacity = "0"
    }

    useEffect(() => {
        if (showPitchDropdown) {
            setShowSpeedDropdown(false)
        }
        if (showSpeedDropdown) {
            setShowPitchDropdown(false)
        }
    }, [showPitchDropdown, showSpeedDropdown])

    const getAudioPlayIcon = () => {
        if (paused) return audioPlayIcon
        return audioPauseIcon
    }

    const getAudioVolumeIcon = () => {
        if (volume > 0.5) {
            return audioVolumeIcon
        } else if (volume > 0) {
            return audioVolumeLowIcon
        } else {
            return audioVolumeMuteIcon
        }
    }

    const fullscreen = async (exit?: boolean) => {
        // @ts-ignore
        if (document.fullscreenElement || document.webkitIsFullScreen || exit) {
            try {
                await document.exitFullscreen?.()
                // @ts-ignore
                await document.webkitExitFullscreen?.()
            } catch {
                // ignore
            }
            if (ref.current) {
                ref.current.style.maxWidth = ""
                ref.current.style.maxHeight = ""
            }
            setTimeout(() => {
                if (functions.isImage(coverImg)) {
                    resizeImageCanvas()
                }
            }, 100)
        } else {
            try {
                await fullscreenRef.current?.requestFullscreen?.()
                // @ts-ignore
                await fullscreenRef.current?.webkitRequestFullscreen?.()
            } catch {
                // ignore
            }
            if (ref.current) {
                ref.current.style.maxWidth = "100vw"
                ref.current.style.maxHeight = "100vh"
            }
            setTimeout(() => {
                if (functions.isImage(coverImg)) {
                    resizeImageCanvas()
                }
            }, 100)
        }
    }

    const loadImage = async () => {
        if (!ref.current || !overlayRef.current || !lightnessRef.current || !dummyRef.current) return
        let src = coverImg
        const img = document.createElement("img")
        img.src = src 
        img.onload = () => {
            if (!ref.current || !overlayRef.current || !lightnessRef.current || !dummyRef.current) return
            const refCtx = ref.current.getContext("2d")
            ref.current.width = img.width
            ref.current.height = img.height
            refCtx?.drawImage(img, 0, 0, img.width, img.height)
            const overlayCtx = overlayRef.current.getContext("2d")
            overlayRef.current.width = img.width
            overlayRef.current.height = img.height
            overlayCtx?.drawImage(img, 0, 0, img.width, img.height)
            const lightnessCtx = lightnessRef.current.getContext("2d")
            lightnessRef.current.width = img.width
            lightnessRef.current.height = img.height
            lightnessCtx?.drawImage(img, 0, 0, img.width, img.height)
            const dummyCtx = dummyRef.current.getContext("2d")
            dummyRef.current.width = img.width
            dummyRef.current.height = img.height
            dummyCtx?.drawImage(img, 0, 0, img.width, img.height)
            ref.current.style.display = "flex"
        }
    }

    useEffect(() => {
        loadImage()
    }, [coverImg])

    const reverseSearch = async (service: string) => {
        if (!coverImg) return
        const baseMap = {
            "google": "https://lens.google.com/uploadbyurl?url=",
            "bing": "https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=",
            "yandex": "https://yandex.com/images/search?rpt=imageview&url=",
            "saucenao": "https://saucenao.com/search.php?url=",
            "ascii2d": "https://ascii2d.net/search/url/"
        }
        let url = tempLink
        if (!tempLink) {
            const arrayBuffer = await fetch(coverImg).then((r) => r.arrayBuffer())
            url = await functions.post("/api/misc/litterbox", new Uint8Array(arrayBuffer), session, setSessionFlag)
            localStorage.setItem("reverseSearchLink", url)
            setTempLink(url)
        }
        window.open(baseMap[service] + encodeURIComponent(url), "_blank", "noreferrer")
    }

    return (
        <div className="post-song-container" style={{zoom: props.scale ? props.scale : 1}}>
            {!props.noNotes ? <NoteEditor post={props.post} img={props.audio} order={props.order} unverified={props.unverified} noteID={props.noteID}/> : null}
            <div className="post-song-box" ref={containerRef} style={{display: noteMode ? "none" : "flex"}}>
                <div className="post-song-filters" ref={fullscreenRef}>
                    <div className={`post-image-top-buttons ${buttonHover ? "show-post-image-top-buttons" : ""}`} onMouseEnter={() => {setButtonHover(true); setShowReverseIcons(false)}} onMouseLeave={() => setButtonHover(false)}>
                        {showReverseIcons ? <img draggable={false} className="post-image-top-button" src={google} style={{filter: getFilter()}} onClick={() => reverseSearch("google")}/> : null}
                        {showReverseIcons ? <img draggable={false} className="post-image-top-button" src={bing} style={{filter: getFilter()}} onClick={() => reverseSearch("bing")}/> : null}
                        {showReverseIcons ? <img draggable={false} className="post-image-top-button" src={yandex} style={{filter: getFilter()}} onClick={() => reverseSearch("yandex")}/> : null}
                        {showReverseIcons ? <img draggable={false} className="post-image-top-button" src={saucenao} style={{filter: getFilter()}} onClick={() => reverseSearch("saucenao")}/> : null}
                        {showReverseIcons ? <img draggable={false} className="post-image-top-button" src={ascii2d} style={{filter: getFilter()}} onClick={() => reverseSearch("ascii2d")}/> : null}
                        {!props.noNotes ? <img draggable={false} className="post-image-top-button" src={reverseSearchIcon} style={{filter: getFilter()}} onClick={() => setShowReverseIcons((prev: boolean) => !prev)}/> : null}
                        {!props.noNotes ? <img draggable={false} className="post-image-top-button" src={noteToggleOn} style={{filter: getFilter()}} onClick={() => {setNoteMode(true); setNoteDrawingEnabled(true)}}/> : null}
                        <img draggable={false} className="post-image-top-button" src={imageExpand ? contract : expand} style={{filter: getFilter()}} onClick={() => setImageExpand(!imageExpand)}/>
                    </div>
                    <div className={`post-image-previous-button ${previousButtonHover ? "show-post-image-mid-buttons" : ""}`} onMouseEnter={() => setPreviousButtonHover(true)} onMouseLeave={() => setPreviousButtonHover(false)}>
                        <img draggable={false} className="post-image-mid-button" src={prevIcon} style={{filter: getFilter()}} onClick={() => props.previous?.()}/>
                    </div>
                    <div className={`post-image-next-button ${nextButtonHover ? "show-post-image-mid-buttons" : ""}`} onMouseEnter={() => setNextButtonHover(true)} onMouseLeave={() => setNextButtonHover(false)}>
                        <img draggable={false} className="post-image-mid-button" src={nextIcon} style={{filter: getFilter()}} onClick={() => props.next?.()}/>
                    </div>
                    <canvas draggable={false} className="dummy-post-song" ref={dummyRef}></canvas>
                    <div className="relative-ref">
                        <div className="audio-controls" ref={audioControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                            <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <p className="audio-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                                <Slider ref={audioSliderRef} className="audio-slider" trackClassName="audio-slider-track" thumbClassName="audio-slider-thumb" min={0} max={100} value={dragging ? (dragProgress / duration) * 100 : progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                                <p className="audio-control-text">{functions.formatSeconds(duration)}</p>
                            </div>
                            <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <div className="audio-control-row-container">
                                    <img draggable={false} className="audio-control-img" src={audioReverseIcon} onClick={() => changeReverse()}/>
                                    <img draggable={false} className="audio-control-img" ref={audioSpeedRef} src={audioSpeedIcon} onClick={() => setShowSpeedDropdown((prev) => !prev)}/>
                                    <img draggable={false} className="audio-control-img" ref={audioPitchRef} src={audioPreservePitchIcon} onClick={() => setShowPitchDropdown((prev) => !prev)}/>
                                </div> 
                                <div className="audio-ontrol-row-container">
                                    <img draggable={false} className="audio-control-img" src={audioRewindIcon} onClick={() => setRewindFlag(true)}/>
                                    <img draggable={false} className="audio-control-img" onClick={() => updatePlay()} src={getAudioPlayIcon()}/>
                                    <img draggable={false} className="audio-control-img" src={audioFastforwardIcon} onClick={() => setFastForwardFlag(true)}/>
                                </div>    
                                <div className="audio-control-row-container">
                                    <img draggable={false} className="audio-control-img" src={audioClearIcon} onClick={() => setResetFlag(true)}/>
                                </div>  
                                <div className="audio-control-row-container">
                                    <img draggable={false} className="audio-control-img" src={audioFullscreenIcon} onClick={() => fullscreen()}/>
                                </div> 
                                <div className="audio-control-row-container" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                                    <img draggable={false} className="audio-control-img" ref={audioVolumeRef} src={getAudioVolumeIcon()} onClick={updateMute}/>
                                </div> 
                            </div>
                            <div className={`audio-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getAudioSpeedMarginRight(), marginTop: "-240px"}}
                            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                {/* <Slider ref={audioSpeedSliderRef} invert orientation="vertical" className="audio-speed-slider" trackClassName="audio-speed-slider-track" thumbClassName="audio-speed-slider-thumb"
                                value={speed} min={0.5} max={4} step={0.5} onChange={(value) => setSpeed(value)}/> */}
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(4); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">4x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(2); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">2x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(1.75); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">1.75x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(1.5); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">1.5x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(1.25); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">1.25x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(1); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">1x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(0.75); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">0.75x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(0.5); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">0.5x</span>
                                </div>
                                <div className="audio-speed-dropdown-item" onClick={() => {setSpeed(0.25); setShowSpeedDropdown(false)}}>
                                    <span className="audio-speed-dropdown-text">0.25x</span>
                                </div>
                            </div>
                            <div className={`audio-pitch-dropdown ${showPitchDropdown ? "" : "hide-pitch-dropdown"}`} style={{marginRight: getAudioPitchMarginRight(), marginTop: "-240px"}}
                            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(24); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">+24</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(19); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">+19</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(12); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">+12</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(7); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">+7</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(0); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">0</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(-7); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">-7</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(-12); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">-12</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(-19); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">-19</span>
                                </div>
                                <div className="audio-pitch-dropdown-item" onClick={() => {setPitch(-24); setShowPitchDropdown(false)}}>
                                    <span className="audio-pitch-dropdown-text">-24</span>
                                </div>
                            </div>
                            <div className={`audio-volume-dropdown ${showVolumeSlider ? "" : "hide-volume-dropdown"}`} style={{marginRight: getAudioVolumeMarginRight(), marginTop: "-110px"}}
                            onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                                <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="audio-volume-slider" trackClassName="audio-volume-slider-track" thumbClassName="audio-volume-slider-thumb"
                                value={volume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
                            </div>
                        </div>
                        <canvas draggable={false} className="post-lightness-overlay" ref={lightnessRef}></canvas>
                        <canvas draggable={false} className="post-sharpen-overlay" ref={overlayRef}></canvas>
                        <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
                        <canvas draggable={false} className="post-song-expand" ref={ref}></canvas>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostSong