import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from "react"
import {useNavigate} from "react-router-dom"
import withPostWrapper, {PostWrapperProps, PostWrapperRef} from "./withPostWrapper"
import {useSessionSelector, useFilterSelector, usePlaybackSelector, usePlaybackActions, useSearchSelector, useInteractionActions} from "../../store"
import Slider from "react-slider"
import reverseIcon from "../../assets/svg/reverse.svg"
import speedIcon from "../../assets/svg/speed.svg"
import clearIcon from "../../assets/svg/clear.svg"
import playIcon from "../../assets/svg/play.svg"
import pauseIcon from "../../assets/svg/pause.svg"
import fullscreenIcon from "../../assets/svg/fullscreen.svg"
import rewindIcon from "../../assets/svg/rewind.svg"
import fastforwardIcon from "../../assets/svg/fastforward.svg"
import preservePitchIcon from "../../assets/svg/pitch.svg"
import volumeIcon from "../../assets/svg/volume.svg"
import volumeLowIcon from "../../assets/svg/volume-low.svg"
import volumeMuteIcon from "../../assets/svg/volume-mute.svg"
import path from "path"
import functions from "../../functions/Functions"
import "./styles/postsong.less"

const PostSong = forwardRef<PostWrapperRef, PostWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {audioSecondsProgress, audioProgress, audioDragProgress, audioReverse, audioVolume, audioPaused, audioDuration, audioDragging} = usePlaybackSelector()
    const {setAudio, setAudioPost, setAudioRewindFlag, setAudioFastForwardFlag, setPlayFlag, setVolumeFlag, setMuteFlag, setResetFlag, 
    setAudioSecondsProgress, setAudioProgress, setAudioDragProgress, setAudioReverse, setAudioSpeed, setPitch, setAudioPaused, setAudioDragging, setAudioSeekTo} = usePlaybackActions()
    const {setEnableDrag} = useInteractionActions()
    const {imageExpand, format} = useSearchSelector()
    const [showPitchDropdown, setShowPitchDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const audioControls = useRef<HTMLDivElement>(null)
    const audioSliderRef = useRef<Slider>(null)
    const audioSpeedRef = useRef<HTMLImageElement>(null)
    const audioPitchRef = useRef<HTMLImageElement>(null)
    const audioVolumeRef = useRef<HTMLImageElement>(null)
    const audioSpeedSliderRef = useRef<Slider>(null)
    const audioVolumeSliderRef = useRef<Slider>(null)
    const [song, setSong] = useState("")
    const [coverImg, setCoverImg] = useState("")
    const {toggleFullscreen} = props
    const {tempLink, setTempLink} = props
    const {audioTempLink, setAudioTempLink} = props
    const {showSpeedDropdown, setShowSpeedDropdown} = props
    const {audioRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props
    const navigate = useNavigate()

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "#e839ff")
    }

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const decryptAudio = async () => {
        if (!props.audio) return
        const decryptedAudio = await functions.crypto.decryptItem(props.audio, session)
        if (decryptedAudio) setSong(decryptedAudio)
    }

    useEffect(() => {
        if (audioRef.current) audioRef.current.style.opacity = "1"
        if (props.audio) {
            setTempLink(tempLink ? "" : localStorage.getItem("reverseSearchLink") || "")
            setAudioTempLink("")
        }
    }, [props.audio])

    useEffect(() => {
        decryptAudio()
    }, [props.audio, session])

    const updateSongCover = async () => {
        const songCover = await functions.audio.songCover(song)
        setCoverImg(songCover)
    }

    useEffect(() => {
        if (song) {
            setAudio(song)
            if (props.post) setAudioPost(props.post)
            updateSongCover()
        }
    }, [song])

    useEffect(() => {
        if (audioSliderRef.current) audioSliderRef.current.resize()
        if (audioSpeedSliderRef.current) audioSpeedSliderRef.current.resize()
        if (audioVolumeSliderRef.current) audioVolumeSliderRef.current.resize()
    })

    useEffect(() => {
        if (!audioDragging && audioDragProgress !== null) {
            setAudioSecondsProgress(audioDragProgress)
            setAudioProgress((audioDragProgress / audioDuration) * 100)
            setAudioDragProgress(null)
        }
    }, [audioDragging, audioDragProgress, audioDuration])

    const getSpeedMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -2
        return `${raw + offset}px`
    }

    const getPitchMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioPitchRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -2
        return `${raw + offset}px`
    }

    const getVolumeMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -7
        return `${raw + offset}px`
    }

    const closeDropdowns = () => {
        setShowPitchDropdown(false)
        setShowSpeedDropdown(false)
    }

    const toggleDropdown = (dropdown: string) => {
        if (dropdown === "pitch") {
            if (showPitchDropdown) {
                setShowPitchDropdown(false)
            } else {
                closeDropdowns()
                setShowPitchDropdown(true)
            }
        }
        if (dropdown === "speed") {
            if (showSpeedDropdown) {
                setShowSpeedDropdown(false)
            } else {
                closeDropdowns()
                setShowSpeedDropdown(true)
            }
        }
    }

    const updateProgressText = (value: number) => {
        let percent = value / 100
        if (audioReverse === true) {
            const secondsProgress = (1-percent) * audioDuration
            setAudioDragProgress(audioDuration - secondsProgress)
        } else {
            const secondsProgress = percent * audioDuration
            setAudioDragProgress(secondsProgress)
        }
    }

    const seek = (position: number) => {
        if (!props.post) return
        setAudio(song)
        setAudioPost(props.post)
        setPlayFlag("always")
        let secondsProgress = audioReverse ? ((100 - position) / 100) * audioDuration : (position / 100) * audioDuration
        let progress = audioReverse ? 100 - position : position
        setAudioProgress(progress)
        setAudioDragging(false)
        setAudioSeekTo(secondsProgress)
    }

    const updatePlay = () => {
        if (!props.post) return
        setAudio(song)
        setAudioPost(props.post)
        setPlayFlag("toggle")
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !audioReverse
        setAudioReverse(val)
    }

    const updateMute = () => {
        setMuteFlag(true)
        setShowVolumeSlider((prev) => !prev)
    }

    const updateVolume = (value: number) => {
        setVolumeFlag(value)
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
        if (audioPaused) return getIcon(playIcon)
        return getIcon(pauseIcon)
    }

    const getAudioVolumeIcon = () => {
        if (audioVolume > 0.5) {
            return getIcon(volumeIcon)
        } else if (audioVolume > 0) {
            return getIcon(volumeLowIcon)
        } else {
            return getIcon(volumeMuteIcon)
        }
    }

    const download = async () => {
        let filename = path.basename(props.audio!).replace(/\?.*$/, "")
        functions.dom.download(filename, song)
    }

    const controlMouseEnter = () => {
        if (audioControls.current) audioControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedDropdown(false)
        setShowPitchDropdown(false)
        setShowVolumeSlider(false)
        if (audioControls.current) audioControls.current.style.opacity = "0"
    }

    return (
        <>
        <img draggable={false} className="dummy-post-image" src={coverImg}/>
        <div className="audio-controls" ref={audioControls} onMouseUp={() => setAudioDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
            <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <p className="audio-control-text">{audioDragging ? functions.date.formatSeconds(audioDragProgress || 0) : functions.date.formatSeconds(audioSecondsProgress)}</p>
                <Slider ref={audioSliderRef} className="audio-slider" trackClassName="audio-slider-track" thumbClassName="audio-slider-thumb" min={0} max={100} 
                value={audioDragging ? ((audioDragProgress || 0) / audioDuration) * 100 : audioProgress} onBeforeChange={() => setAudioDragging(true)} 
                onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                <p className="audio-control-text">{functions.date.formatSeconds(audioDuration)}</p>
            </div>
            <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="audio-control-row-container">
                    <img draggable={false} className="audio-control-img" src={getIcon(reverseIcon)} onClick={() => changeReverse()}/>
                    <img draggable={false} className="audio-control-img" ref={audioSpeedRef} src={getIcon(speedIcon)} onClick={() => toggleDropdown("speed")}/>
                    <img draggable={false} className="audio-control-img" ref={audioPitchRef} src={getIcon(preservePitchIcon)} onClick={() => toggleDropdown("pitch")}/>
                </div> 
                <div className="audio-control-row-container">
                    <img draggable={false} className="audio-control-img" src={getIcon(rewindIcon)} onClick={() => setAudioRewindFlag(true)}/>
                    <img draggable={false} className="audio-control-img" onClick={() => updatePlay()} src={getAudioPlayIcon()}/>
                    <img draggable={false} className="audio-control-img" src={getIcon(fastforwardIcon)} onClick={() => setAudioFastForwardFlag(true)}/>
                </div>    
                <div className="audio-control-row-container">
                    <img draggable={false} className="audio-control-img" src={getIcon(clearIcon)} onClick={() => setResetFlag(true)}/>
                </div>  
                <div className="audio-control-row-container">
                    <img draggable={false} className="audio-control-img" src={getIcon(fullscreenIcon)} onClick={() => toggleFullscreen()}/>
                </div> 
                <div className="audio-control-row-container" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                    <img draggable={false} className="audio-control-img" ref={audioVolumeRef} src={getAudioVolumeIcon()} onClick={updateMute}/>
                </div> 
            </div>
            <div className={`audio-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getSpeedMarginRight(), marginTop: "-230px"}}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(4); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">4x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(2); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">2x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(1.75); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">1.75x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(1.5); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">1.5x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(1.25); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">1.25x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(1); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">1x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(0.75); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">0.75x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(0.5); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">0.5x</span>
                </div>
                <div className="audio-speed-dropdown-item" onClick={() => {setAudioSpeed(0.25); setShowSpeedDropdown(false)}}>
                    <span className="audio-speed-dropdown-text">0.25x</span>
                </div>
            </div>
            <div className={`audio-pitch-dropdown ${showPitchDropdown ? "" : "hide-pitch-dropdown"}`} style={{marginRight: getPitchMarginRight(), marginTop: "-240px"}}
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
            <div className={`audio-volume-dropdown ${showVolumeSlider ? "" : "hide-volume-dropdown"}`} style={{marginRight: getVolumeMarginRight(), marginTop: "-110px"}}
            onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="audio-volume-slider" trackClassName="audio-volume-slider-track" thumbClassName="audio-volume-slider-thumb"
                value={audioVolume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
            </div>
        </div>
        <img draggable={false} className="post-lightness-overlay" ref={lightnessRef}/>
        <img draggable={false} className="post-sharpen-overlay" ref={overlayRef}/>
        <canvas draggable={false} className="post-effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
        <img draggable={false} className={`${imageExpand? "post-image-expand" : "post-image"}`} ref={audioRef} 
        src={coverImg} onLoad={(event) => onLoaded(event)} style={{minWidth: "400px"}} fetchPriority="high"/>
        </>
    )
})

export default withPostWrapper(PostSong)