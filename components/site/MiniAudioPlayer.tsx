import React, {useEffect, useRef, useState} from "react"
import {useLocation, useHistory} from "react-router-dom"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, useThemeSelector, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import Slider from "react-slider"
import playerRewind from "../../assets/icons/player-rewind.png"
import playerFastforward from "../../assets/icons/player-fastforward.png"
import playerPlay from "../../assets/icons/player-play.png"
import playerPause from "../../assets/icons/player-pause.png"
import playerReverse from "../../assets/icons/player-reverse.png"
import playerReverseActive from "../../assets/icons/player-reverse-active.png"
import playerSpeed from "../../assets/icons/player-speed.png"
import playerSpeedActive from "../../assets/icons/player-speed-active.png"
import playerPitch from "../../assets/icons/player-pitch.png"
import playerPitchActive from "../../assets/icons/player-pitch-active.png"
import playerVolume from "../../assets/icons/player-volume.png"
import playerVolumeLow from "../../assets/icons/player-volume-low.png"
import playerVolumeMute from "../../assets/icons/player-volume-mute.png"
import playerClear from "../../assets/icons/player-clear.png"
import playerStop from "../../assets/icons/player-stop.png"
import expandMusicPlayer from "../../assets/icons/expand-music-player.png"
import contractMusicPlayer from "../../assets/icons/contract-music-player.png"
import "./styles/miniaudioplayer.less"
import path from "path"

const MiniAudioPlayer: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {lowpass, highpass, reverb, delay, phaser, bitcrush} = useFilterSelector()
    const {audio, audioPost, audioRewindFlag, audioFastForwardFlag, playFlag, volumeFlag, muteFlag, resetFlag, audioSecondsProgress, audioProgress, 
    audioDragProgress, audioReverse, audioSpeed, pitch, audioVolume, audioPreviousVolume, audioPaused, audioDuration, audioDragging, audioSeekTo,
    showMiniPlayer, showBigPlayer} = usePlaybackSelector()
    const {setAudio, setAudioPost, setAudioRewindFlag, setAudioFastForwardFlag, setPlayFlag, setVolumeFlag, setMuteFlag, setResetFlag, 
    setAudioSecondsProgress, setAudioProgress, setAudioDragProgress, setAudioReverse, setAudioSpeed, setPitch, setAudioVolume, setAudioPreviousVolume, setAudioPaused, 
    setAudioDuration, setAudioDragging, setAudioSeekTo, setShowMiniPlayer, setShowBigPlayer} = usePlaybackActions()
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showPitchDropdown, setShowPitchDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const audioControls = useRef<HTMLDivElement>(null)
    const audioSliderRef = useRef<Slider>(null)
    const audioSpeedRef = useRef<HTMLImageElement>(null)
    const audioPitchRef = useRef<HTMLImageElement>(null)
    const audioVolumeRef = useRef<HTMLImageElement>(null)
    const audioSpeedSliderRef = useRef<Slider>(null)
    const audioVolumeSliderRef = useRef<Slider>(null)
    const [init, setInit] = useState(false)
    const [hover, setHover] = useState(false)
    const [coverImg, setCoverImg] = useState("")
    const location = useLocation()
    const history = useHistory()

    const getFilter = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateSongCover = async () => {
        if (!audio) return
        let decrypted = await functions.decryptItem(audio, session)
        const songCover = await functions.songCover(decrypted)
        setCoverImg(songCover)
    }

    useEffect(() => {
        if (!session.cookie) return
        updateSongCover()
    }, [audio, session])

    const closeDropdowns = () => {
        setShowPitchDropdown(false)
        setShowSpeedDropdown(false)
    }

    useEffect(() => {
        const clickListener = () => {
            if (!hover) closeDropdowns()
        }
        window.addEventListener("click", clickListener)
        return () => {
            window.removeEventListener("click", clickListener)
        }
    }, [hover])

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

    const getAudioSpeedMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = 5
        if (mobile) offset -= 10
        return `${raw + offset}px`
    }

    const getAudioPitchMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioPitchRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = 2
        if (mobile) offset -= 10
        return `${raw + offset}px`
    }

    const getAudioVolumeMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "40px"
        const raw = controlRect.right - rect.right
        let offset = -5
        if (mobile) offset -= 10
        return `${raw + offset}px`
    }

    const getAudioPlayIcon = () => {
        if (audioPaused) return playerPlay
        return playerPause
    }

    const getAudioVolumeIcon = () => {
        if (audioVolume > 0.5) {
            return playerVolume
        } else if (audioVolume > 0) {
            return playerVolumeLow
        } else {
            return playerVolumeMute
        }
    }

    const getAudioReverseIcon = () => {
        if (audioReverse) return playerReverseActive
        return playerReverse
    }

    const getAudioSpeedIcon = () => {
        if (audioSpeed === 1) return playerSpeed
        return playerSpeedActive
    }

    const getAudioPitchIcon = () => {
        if (pitch === 0) return playerPitch
        return playerPitchActive
    }

    useEffect(() => {
        if (audioSliderRef.current) audioSliderRef.current.resize()
        if (audioSpeedSliderRef.current) audioSpeedSliderRef.current.resize()
        if (audioVolumeSliderRef.current) audioVolumeSliderRef.current.resize()
    })

    const quit = () => {
        setPlayFlag("stop")
        setShowMiniPlayer(false)
        setTimeout(() => {
            setAudioPaused(true)
            setAudio("")
            setAudioPost(null)
            setInit(false)
        }, 300)
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
        setPlayFlag("always")
        let secondsProgress = audioReverse ? ((100 - position) / 100) * audioDuration : (position / 100) * audioDuration
        let progress = audioReverse ? 100 - position : position
        setAudioProgress(progress)
        setAudioDragging(false)
        setAudioSeekTo(secondsProgress)
    }

    const updatePlay = () => {
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

    const playerJSX = () => {
        return (<>
            <div className="mini-audio-player-row">
                <div className="mini-audio-player-container" style={{width: "100%"}}>
                    <p className="mini-audio-player-text">{audioDragging ? functions.formatSeconds(audioDragProgress || 0) : functions.formatSeconds(audioSecondsProgress)}</p>
                    <Slider ref={audioSliderRef} className="mini-audio-player-slider" trackClassName="mini-audio-player-slider-track" thumbClassName="mini-audio-player-slider-thumb" min={0} max={100} value={audioDragging ? ((audioDragProgress || 0) / audioDuration) * 100 : audioProgress} onBeforeChange={() => setAudioDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                    <p className="mini-audio-player-text">{functions.formatSeconds(audioDuration)}</p>
                </div>
            </div>
            <div className="mini-audio-player-row">
                    <img draggable={false} style={{filter: getFilter()}} className="mini-audio-player-icon-small" src={playerStop} onClick={() => quit()}/>
                    <img draggable={false} style={{filter: getFilter()}} className="mini-audio-player-icon" src={getAudioReverseIcon()} onClick={() => changeReverse()}/>
                    <img draggable={false} style={{filter: getFilter()}} className="mini-audio-player-icon" ref={audioSpeedRef} src={getAudioSpeedIcon()} onClick={() => toggleDropdown("speed")}/>
                    <img draggable={false} style={{filter: getFilter()}} className="mini-audio-player-icon-small" src={playerRewind} onClick={() => setAudioRewindFlag(true)}/>
                    <img draggable={false} style={{filter: getFilter(), width: "27px"}} className="mini-audio-player-play-icon" src={getAudioPlayIcon()} onClick={() => updatePlay()}/>
                    <img draggable={false} style={{filter: getFilter()}} className="mini-audio-player-icon-small" src={playerFastforward} onClick={() => setAudioFastForwardFlag(true)}/>
                    <img draggable={false} style={{filter: getFilter()}} className="mini-audio-player-icon" ref={audioPitchRef} src={getAudioPitchIcon()} onClick={() => toggleDropdown("pitch")}/>
                    <img draggable={false} style={{filter: getFilter()}} className="mini-audio-player-icon" src={playerClear} onClick={() => setResetFlag(true)}/>
                    <img draggable={false} style={{filter: getFilter(), width: "25px"}} className="mini-audio-player-icon" ref={audioVolumeRef} src={getAudioVolumeIcon()} onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)} onClick={updateMute}/>
            </div>
            </>
        )
    }

    const getTitleJSX = () => {
        if (!audioPost) return null
        if (mobile) {
            return (
                <div className="mini-audio-player-row-start" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="mini-audio-player-title-mobile">{audioPost.title || "Unknown"}</span>
                </div>
            )
        } else {
            return (
                <div className="mini-audio-player-row-start" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="mini-audio-player-title">{audioPost.title || "Unknown"}</span>
                </div>
            )
        }
    }

    let style = mobile ? {top: "500px"} : {top: "40px"}
    if (typeof window !== "undefined") style = {top: `${functions.navbarHeight()}px`}

    if (audio) {
        return (
            <div className={`mini-audio-player ${showMiniPlayer ? "" : "hide-mini-audio-player"}`} style={style} ref={audioControls} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onMouseUp={() => setAudioDragging(false)}>
                <img className="mini-audio-player-expand-icon" src={showBigPlayer ? contractMusicPlayer : expandMusicPlayer} onClick={() => setShowBigPlayer(!showBigPlayer)}/>
                <div className="mini-audio-player-row">
                    <img className="mini-audio-player-img" src={coverImg} onClick={() => audioPost ? history.push(`/post/${audioPost.postID}/${audioPost.slug}`) : null} style={{height: !mobile && coverImg ? "150px" : "50px"}}/>
                </div>
                {getTitleJSX()}
                {playerJSX()}
                <div className={`mini-audio-player-speed-dropdown ${showSpeedDropdown ? "" : "hide-mini-player-speed-dropdown"}`} style={{marginRight: getAudioSpeedMarginRight(), marginTop: "40px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="mini-audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(4); setShowSpeedDropdown(false)}}>
                        <span className="mini-audio-player-speed-dropdown-text">4x</span>
                    </div>
                    <div className="mini-audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(2); setShowSpeedDropdown(false)}}>
                        <span className="mini-audio-player-speed-dropdown-text">2x</span>
                    </div>
                    <div className="mini-audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(1.5); setShowSpeedDropdown(false)}}>
                        <span className="mini-audio-player-speed-dropdown-text">1.5x</span>
                    </div>
                    <div className="mini-audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(1.25); setShowSpeedDropdown(false)}}>
                        <span className="mini-audio-player-speed-dropdown-text">1.25x</span>
                    </div>
                    <div className="mini-audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(1); setShowSpeedDropdown(false)}}>
                        <span className="mini-audio-player-speed-dropdown-text">1x</span>
                    </div>
                    <div className="mini-audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(0.5); setShowSpeedDropdown(false)}}>
                        <span className="mini-audio-player-speed-dropdown-text">0.5x</span>
                    </div>
                    <div className="mini-audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(0.25); setShowSpeedDropdown(false)}}>
                        <span className="mini-audio-player-speed-dropdown-text">0.25x</span>
                    </div>
                </div>
                <div className={`mini-audio-player-pitch-dropdown ${showPitchDropdown ? "" : "hide-mini-player-pitch-dropdown"}`} style={{marginRight: getAudioPitchMarginRight(), marginTop: "40px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="mini-audio-player-pitch-dropdown-item" onClick={() => {setPitch(24); setShowPitchDropdown(false)}}>
                        <span className="mini-audio-player-pitch-dropdown-text">+24</span>
                    </div>
                    <div className="mini-audio-player-pitch-dropdown-item" onClick={() => {setPitch(12); setShowPitchDropdown(false)}}>
                        <span className="mini-audio-player-pitch-dropdown-text">+12</span>
                    </div>
                    <div className="mini-audio-player-pitch-dropdown-item" onClick={() => {setPitch(7); setShowPitchDropdown(false)}}>
                        <span className="mini-audio-player-pitch-dropdown-text">+7</span>
                    </div>
                    <div className="mini-audio-player-pitch-dropdown-item" onClick={() => {setPitch(0); setShowPitchDropdown(false)}}>
                        <span className="mini-audio-player-pitch-dropdown-text">0</span>
                    </div>
                    <div className="mini-audio-player-pitch-dropdown-item" onClick={() => {setPitch(-7); setShowPitchDropdown(false)}}>
                        <span className="mini-audio-player-pitch-dropdown-text">-7</span>
                    </div>
                    <div className="mini-audio-player-pitch-dropdown-item" onClick={() => {setPitch(-12); setShowPitchDropdown(false)}}>
                        <span className="mini-audio-player-pitch-dropdown-text">-12</span>
                    </div>
                    <div className="mini-audio-player-pitch-dropdown-item" onClick={() => {setPitch(-24); setShowPitchDropdown(false)}}>
                        <span className="mini-audio-player-pitch-dropdown-text">-24</span>
                    </div>
                </div>
                <div className={`mini-audio-player-volume-dropdown ${showVolumeSlider ? "" : "hide-mini-player-volume-dropdown"}`} style={{marginRight: getAudioVolumeMarginRight(), marginTop: "130px"}}
                onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                    <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="mini-audio-player-volume-slider" trackClassName="mini-audio-player-volume-slider-track" thumbClassName="mini-audio-player-volume-slider-thumb"
                    value={audioVolume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
                </div>
            </div>
        )
    }
    return null
}

export default MiniAudioPlayer