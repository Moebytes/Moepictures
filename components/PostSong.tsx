import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {ThemeContext, EnableDragContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, DownloadFlagContext, DownloadURLsContext, DisableZoomContext, SpeedContext,
ReverseContext, MobileContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import Slider from "react-slider"
import audioReverseIcon from "../assets/purple/audio-reverse.png"
import audioSpeedIcon from "../assets/purple/audio-speed.png"
import audioClearIcon from "../assets/purple/audio-clear.png"
import audioPlayIcon from "../assets/purple/audio-play.png"
import audioPauseIcon from "../assets/purple/audio-pause.png"
import audioRewindIcon from "../assets/purple/audio-rewind.png"
import audioFastforwardIcon from "../assets/purple/audio-fastforward.png"
import audioPreservePitchIcon from "../assets/purple/audio-preservepitch.png"
import audioPreservePitchOnIcon from "../assets/purple/audio-preservepitch-on.png"
import audioFullscreenIcon from "../assets/purple/audio-fullscreen.png"
import audioVolumeIcon from "../assets/purple/audio-volume.png"
import audioVolumeLowIcon from "../assets/purple/audio-volume-low.png"
import audioVolumeMuteIcon from "../assets/purple/audio-volume-mute.png"
import path from "path"
import * as Tone from "tone"
import "./styles/postsong.less"
import silence from "../assets/misc/silence.mp3"

interface Props {
    audio: string
    coverImg?: string
    width?: number
    height?: number
    scale?: number
    noKeydown?: boolean
    comicPages?: any
}

let player: Tone.Player
let grain: Tone.GrainPlayer
let downsampleTimer = null as any
let Downsampler: any

const initialize = async () => {
    player = new Tone.Player(silence).sync().toDestination()
    grain = new Tone.GrainPlayer(silence).sync()
    grain.grainSize = 0.1
    grain.overlap = 0.1
    /*
    const context = Tone.getContext()
    let worklet = "" as any
    try {
        worklet = new WorkerUrl(new URL("../structures/Downsampler.js", import.meta.url), {name: "downsample"})
    } catch {
        worklet = new URL("downsample.js", window.location.href)
    }
    await context.addAudioWorkletModule(worklet, "downsampler")
    Downsampler = context.createAudioWorkletNode("downsampler")*/
}

if (typeof window !== "undefined") initialize()

const PostSong: React.FunctionComponent<Props> = (props) => {
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
    const {mobile, setMobile} = useContext(MobileContext)
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
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
    const audioVolumeRef = useRef(null) as any
    const audioSpeedSliderRef = useRef<any>(null)
    const audioVolumeSliderRef = useRef<any>(null)
    const [secondsProgress, setSecondsProgress] = useState(0)
    const [progress, setProgress] = useState(0)
    const [dragProgress, setDragProgress] = useState(0) as any
    const {reverse, setReverse} = useContext(ReverseContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const [volume, setVolume] = useState(0.75)
    const [previousVolume, setPreviousVolume] = useState(0)
    const [paused, setPaused] = useState(true)
    const [preservesPitch, setPreservesPitch] = useState(false)
    const [duration, setDuration] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [coverImg, setCoverImg] = useState(null) as any
    const [seekTo, setSeekTo] = useState(null) as any
    const [effects, setEffects] = useState([]) as any
    const [init, setInit] = useState(false)
    
    const loadAudio = async () => {
        if (!player || !grain) return
        player.start()
        grain.start()
        grain.buffer.load(props.audio)
        player.load(props.audio)
        await Tone.loaded()
        updateDuration()
        stop()
        refreshState()
        setInit(true)
    }

    const updateSongCover = async () => {
        const songCover = await functions.songCover(props.audio)
        setCoverImg(songCover)
    }

    useEffect(() => {
        setSecondsProgress(0)
        setProgress(0)
        setDragProgress(0)
        setDuration(0)
        setDragging(false)
        setSeekTo(null)
        setEffects([])
        setInit(false)
        if (ref.current) ref.current.style.opacity = "1"
        updateSongCover()
    }, [props.audio])

    const removeEffect = (type: string) => {
        const index = effects.findIndex((e: any) => e?.type === type)
        if (index !== -1) {
            effects[index] = null as any
            setEffects(effects.filter(Boolean))
        }
    }

    const pushEffect = (type: string, node: any) => {
        const obj = {type, node}
        const index = effects.findIndex((e: any) => e?.type === type)
        if (index !== -1) {
            effects[index] = obj
            setEffects(effects)
        } else {
            effects.push(obj)
            setEffects(effects)
        }
    }
    
    const applyEffects = () => {
        if (!player || !grain) return
        player.disconnect()
        grain.disconnect()
        const nodes = effects.map((e: any) => e?.node).filter(Boolean)
        const current = preservesPitch ? grain : player
        if (nodes[0]) {
            nodes.forEach((n: any) => n.disconnect())
            const gain = new Tone.Gain(1).toDestination()
            current.chain(...[...nodes]).connect(gain.input)
        } else {
            current.toDestination()
        }
    }

    useEffect(() => {
        const id = window.setInterval(() => {
            if (!duration) return
            let percent = (Tone.getTransport().seconds / duration)
            if (!Number.isFinite(percent)) return
            if (!dragging) {
                if (reverse) {
                    setProgress((1-percent) * 100)
                    setSecondsProgress(duration - Tone.getTransport().seconds)
                } else {
                    setProgress(percent * 100)
                    setSecondsProgress(Tone.getTransport().seconds)
                }
            }
            if (Tone.getTransport().seconds > duration) {
                // Tone.getTransport().seconds = 0
                stop()
                updatePlay(true)
            }
        }, 1000)
        return () => {
            window.clearInterval(id)
        }
    }, [dragging, reverse, duration])

    const refreshState = () => {
        const apply = {grain, player}
        updateSpeed(speed)
        updateReverse(reverse)
    }

    const updateDuration = (value?: number) => {
        const current = preservesPitch ? grain : player
        setDuration(current.buffer.duration / current.playbackRate)
    }

    const updatePlay = async (alwaysPlay?: boolean) => {
        if (!init) await loadAudio()
        await Tone.start()
        if (paused || alwaysPlay) {
            Tone.getTransport().start()
            setPaused(false)
        } else {
            Tone.getTransport().pause()
            setPaused(true)
        }
    }

    const stop = () => {
        Tone.getTransport().stop()
    }

    const updateMute = () => {
        if (Tone.getDestination().volume.value > 0) {
            Tone.getDestination().mute = true
            Tone.getDestination().volume.value = functions.linearToDecibels(0)
            setVolume(0)
        } else {
            const newVol = previousVolume ? previousVolume : 1
            Tone.getDestination().mute = false
            Tone.getDestination().volume.value = functions.linearToDecibels(functions.logSlider(newVol))
            setVolume(newVol)
        }
        setShowVolumeSlider((prev) => !prev)
    }

    const updateVolume = (value: number) => {
        if (value > 1) value = 1
        if (value < 0) value = 0
        if (Number.isNaN(value)) value = 0
        Tone.getDestination().volume.value = functions.linearToDecibels(functions.logSlider(value))
        if (value > 0) {
            Tone.getDestination().mute = false
        } else {
            Tone.getDestination().mute = true
        }
        setVolume(value)
        setPreviousVolume(value)
    }

    const updateSpeed = async (value?: number | string, applyState?: any) => {
        if (!duration) return
        let currentGrain = grain
        let currentPlayer = player
        if (applyState) {
            currentGrain = applyState.grain
            currentPlayer = applyState.player
        }
        if (preservesPitch) {
            currentGrain.playbackRate = speed
        } else {
            currentPlayer.playbackRate = speed
        }
        let percent = Tone.getTransport().seconds / duration
        setDuration(grain.buffer.duration / speed)
        let val = percent * duration
        if (val < 0) val = 0
        if (val > duration - 1) val = duration - 1
        Tone.getTransport().seconds = val
    }

    useEffect(() => {
        updateSpeed()
    }, [speed, preservesPitch])

    const updateReverse = async (value?: boolean, applyState?: any) => {
        if (!duration) return
        let percent = Tone.getTransport().seconds / duration
        let val = (1-percent) * duration
        if (val < 0) val = 0
        if (val > duration - 1) val = duration - 1
        let currentGrain = grain
        let currentPlayer = player
        if (applyState) {
            currentGrain = applyState.grain
            currentPlayer = applyState.player
        }
        if (value === false || !reverse) {
            if (!applyState) Tone.getTransport().seconds = val
            currentGrain.reverse = false
            currentPlayer.reverse = false
        } else {
            if (!applyState) Tone.getTransport().seconds = val
            currentGrain.reverse = true
            currentPlayer.reverse = true
        }
    }

    useEffect(() => {
        updateReverse()
    }, [reverse])

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

    useEffect(() => {
        let observer = null as any
        if (functions.isImage(coverImg)) {
            observer = new ResizeObserver(resizeImageCanvas)
            observer.observe(ref.current!)
        }
        window.addEventListener("fullscreenchange", exitFullScreen)
        window.addEventListener("webkitfullscreenchange", exitFullScreen)
        return () => {
            observer?.disconnect()
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
    }, [dragging, dragProgress])

    const getPreversePitchIcon = () => {
        if (preservesPitch) return audioPreservePitchIcon
        return audioPreservePitchOnIcon
    }

    const getAudioSpeedMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioSpeedRef.current?.getBoundingClientRect()
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

    useEffect(() => {
        if (seekTo) {
            let progress = (100 / duration) * seekTo
            if (reverse) progress = 100 - progress
            Tone.getTransport().seconds = seekTo
            setProgress(progress)
            setSecondsProgress(seekTo)
            setSeekTo(null)
        }
    }, [seekTo, reverse])

    const seek = (position: number) => {
        let secondsProgress = reverse ? ((100 - position) / 100) * duration : (position / 100) * duration
        let progress = reverse ? 100 - position : position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !reverse 
        let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        setReverse(val)
        // setSeekTo(secondsProgress)
    }

    const changePreservesPitch = (value?: boolean) => {
        const secondsProgress = (progress / 100) * duration
        const val = value !== undefined ? value : !preservesPitch
        setPreservesPitch(val)
        if (val) {
            player.disconnect()
            grain.toDestination()
        } else {
            grain.disconnect()
            player.toDestination()
        }
        // setSeekTo(secondsProgress)
    }

    const rewind = (value?: number) => {
        if (!value) value = Math.floor(duration / 10)
        const current = Tone.getTransport().seconds
        let seconds = current - value
        if (reverse) seconds = current + value
        if (seconds < 0) seconds = 0
        if (seconds > duration) seconds = duration
        setSeekTo(seconds)
    }

    const fastforward = (value?: number) => {
        if (!value) value = Math.floor(duration / 10)
        const current = Tone.getTransport().seconds
        let seconds = current + value
        if (reverse) seconds = current - value
        if (seconds < 0) seconds = 0
        if (seconds > duration) seconds = duration
        setSeekTo(seconds)
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

    const downsample = async (noApply?: boolean) => {
        if (!Downsampler) return
        if (pixelate === 1) {
            removeEffect("downsample")
            return applyEffects()
        }
        if (downsampleTimer) return 
        downsampleTimer = setTimeout(() => {
            downsampleTimer = null
        }, 100)
        // @ts-ignore
        const downsampleParam = Downsampler.parameters.get("downsample")
        downsampleParam.value = (pixelate - 1) / 9
        pushEffect("downsample", Downsampler)
        applyEffects()
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
    }, [pixelate, preservesPitch])

    const rateOn = () => {
        if ((speed !== 1) || (reverse !== false)) return true 
        return false
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadURLs.includes(props.audio)) {
                functions.download(path.basename(props.audio), props.audio)
                setDownloadURLs(downloadURLs.filter((s: string) => s !== props.audio))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag])

    const controlMouseEnter = () => {
        if (audioControls.current) audioControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedDropdown(false)
        setShowVolumeSlider(false)
        if (audioControls.current) audioControls.current.style.opacity = "0"
    }

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

    const reset = () => {
        changeReverse(false)
        changePreservesPitch(false)
        setSpeed(1)
        setPaused(false)
        setShowSpeedDropdown(false)
        setEffects([])
        stop()
        updatePlay(true)
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
                ref.current.style.maxWidth = `calc(100vw - ${functions.sidebarWidth()}px - 70px)`
                ref.current.style.maxHeight = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
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

    return (
        <div className="post-song-container" style={{zoom: props.scale ? props.scale : 1}}>
            <div className="post-song-box" ref={containerRef}>
                <div className="post-song-filters" ref={fullscreenRef}>
                    <canvas className="dummy-post-song" ref={dummyRef}></canvas>
                    <div className="relative-ref">
                        <div className="audio-controls" ref={audioControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                            <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <p className="audio-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                                <Slider ref={audioSliderRef} className="audio-slider" trackClassName="audio-slider-track" thumbClassName="audio-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                                <p className="audio-control-text">{functions.formatSeconds(duration)}</p>
                            </div>
                            <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <div className="audio-control-row-container">
                                    <img className="audio-control-img" onClick={() => changeReverse()} src={audioReverseIcon}/>
                                    <img className="audio-control-img" ref={audioSpeedRef} src={audioSpeedIcon} onClick={() => setShowSpeedDropdown((prev) => !prev)}/>
                                    <img className="audio-control-img" onClick={() => changePreservesPitch()} src={getPreversePitchIcon()}/>
                                </div> 
                                <div className="audio-ontrol-row-container">
                                    <img className="audio-control-img" src={audioRewindIcon} onClick={() => rewind()}/>
                                    <img className="audio-control-img" onClick={() => updatePlay()} src={getAudioPlayIcon()}/>
                                    <img className="audio-control-img" src={audioFastforwardIcon} onClick={() => fastforward()}/>
                                </div>    
                                <div className="audio-control-row-container">
                                    <img className="audio-control-img" src={audioClearIcon} onClick={reset}/>
                                </div>  
                                <div className="audio-control-row-container">
                                    <img className="audio-control-img" src={audioFullscreenIcon} onClick={() => fullscreen()}/>
                                </div> 
                                <div className="audio-control-row-container" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                                    <img className="audio-control-img" ref={audioVolumeRef} src={getAudioVolumeIcon()} onClick={updateMute}/>
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
                            <div className={`audio-volume-dropdown ${showVolumeSlider ? "" : "hide-volume-dropdown"}`} style={{marginRight: getAudioVolumeMarginRight(), marginTop: "-110px"}}
                            onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                                <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="volume-slider" trackClassName="volume-slider-track" thumbClassName="volume-slider-thumb"
                                value={volume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
                            </div>
                        </div>
                        <canvas className="post-lightness-overlay" ref={lightnessRef}></canvas>
                        <canvas className="post-sharpen-overlay" ref={overlayRef}></canvas>
                        <canvas className="post-pixelate-canvas" ref={pixelateRef}></canvas>
                        <canvas className="post-song" ref={ref}></canvas>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostSong