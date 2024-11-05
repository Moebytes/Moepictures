import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useLocation, useHistory} from "react-router-dom"
import {ThemeContext, EnableDragContext, DownloadFlagContext, DownloadIDsContext, SpeedContext,
ReverseContext, MobileContext, SessionContext, SiteHueContext,SiteLightnessContext, SiteSaturationContext, 
ImageExpandContext, PixelateContext, AudioContext, PitchContext, VolumeContext, PreviousVolumeContext, DurationContext,
ProgressContext, SecondsProgressContext, SeekToContext, DragProgressContext, DraggingContext, PausedContext,
RewindFlagContext, FastforwardFlagContext, PlayFlagContext, VolumeFlagContext, ResetFlagContext, 
MuteFlagContext, AudioPostContext} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import musicplaying from "../assets/icons/musicplaying.gif"
import playerRewind from "../assets/icons/player-rewind.png"
import playerFastforward from "../assets/icons/player-fastforward.png"
import playerPlay from "../assets/icons/player-play.png"
import playerPause from "../assets/icons/player-pause.png"
import playerReverse from "../assets/icons/player-reverse.png"
import playerReverseActive from "../assets/icons/player-reverse-active.png"
import playerSpeed from "../assets/icons/player-speed.png"
import playerSpeedActive from "../assets/icons/player-speed-active.png"
import playerPitch from "../assets/icons/player-pitch.png"
import playerPitchActive from "../assets/icons/player-pitch-active.png"
import playerVolume from "../assets/icons/player-volume.png"
import playerVolumeLow from "../assets/icons/player-volume-low.png"
import playerVolumeMute from "../assets/icons/player-volume-mute.png"
import playerClear from "../assets/icons/player-clear.png"
import playerStop from "../assets/icons/player-stop.png"
import * as Tone from "tone"
import silence from "../assets/misc/silence.mp3"
import "./styles/audioplayer.less"

let player: Tone.Player
let audioNode: any
let bitcrusherNode: any
let soundtouchNode: any
let gainNode: any

const initialize = async () => {
    player = new Tone.Player(silence).sync().start()
    const context = Tone.getContext()
    // @ts-ignore
    audioNode = new Tone.ToneAudioNode()
    gainNode = new Tone.Gain(1)
    await context.addAudioWorkletModule("./bitcrusher.js", "bitcrusher")
    bitcrusherNode = context.createAudioWorkletNode("bitcrush-processor")
    await context.addAudioWorkletModule("./soundtouch.js", "soundtouch")
    soundtouchNode = context.createAudioWorkletNode("soundtouch-processor")
    audioNode.input = player
    audioNode.output = gainNode.input
    audioNode.input.chain(soundtouchNode, bitcrusherNode, audioNode.output)
    audioNode.toDestination()
}

if (typeof window !== "undefined") initialize()

const AudioPlayer: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {session, setSessions} = useContext(SessionContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadIDs, setDownloadIDs} = useContext(DownloadIDsContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {imageExpand, setImageExpand} = useContext(ImageExpandContext)
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showPitchDropdown, setShowPitchDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const audioControls = useRef<HTMLDivElement>(null)
    const audioSliderRef = useRef<any>(null)
    const audioSpeedRef = useRef(null) as any
    const audioPitchRef = useRef(null) as any
    const audioVolumeRef = useRef(null) as any
    const audioSpeedSliderRef = useRef<any>(null)
    const audioVolumeSliderRef = useRef<any>(null)
    const {secondsProgress, setSecondsProgress} = useContext(SecondsProgressContext)
    const {progress, setProgress} = useContext(ProgressContext)
    const {dragProgress, setDragProgress} = useContext(DragProgressContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const {pitch, setPitch} = useContext(PitchContext)
    const {volume, setVolume} = useContext(VolumeContext)
    const {previousVolume, setPreviousVolume} = useContext(PreviousVolumeContext)
    const {paused, setPaused} = useContext(PausedContext)
    const {duration, setDuration} = useContext(DurationContext)
    const {dragging, setDragging} = useContext(DraggingContext)
    const {seekTo, setSeekTo} = useContext(SeekToContext)
    const [init, setInit] = useState(false)
    const {audio, setAudio} = useContext(AudioContext)
    const {audioPost, setAudioPost} = useContext(AudioPostContext)
    const {rewindFlag, setRewindFlag} = useContext(RewindFlagContext)
    const {fastForwardFlag, setFastForwardFlag} = useContext(FastforwardFlagContext)
    const {playFlag, setPlayFlag} = useContext(PlayFlagContext)
    const {volumeFlag, setVolumeFlag} = useContext(VolumeFlagContext)
    const {muteFlag, setMuteFlag} = useContext(MuteFlagContext)
    const {resetFlag, setResetFlag} = useContext(ResetFlagContext)
    const [hover, setHover] = useState(false)
    const location = useLocation()
    const history = useHistory()

    useEffect(() => {
        if (location.pathname !== "/post") {
            if (Tone.getTransport().state === "stopped") quit()
        }
      }, [location.pathname])

    const getFilter = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }
    
    const loadAudio = async () => {
        if (!functions.isAudio(audio)) return
        stop()
        await player.load(audio)
        await Tone.loaded()
        updateDuration()
        refreshState()
        setInit(true)
    }

    useEffect(() => {
        setSecondsProgress(0)
        setProgress(0)
        setDragProgress(0)
        setDuration(0)
        setDragging(false)
        setSeekTo(null)
        setInit(false)
        loadAudio()
    }, [audio])

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
                Tone.getTransport().seconds = 0
                stop()
                updatePlay(true)
            }
        }, 1000)
        return () => {
            window.clearInterval(id)
        }
    }, [dragging, reverse, duration])

    const refreshState = () => {
        updateReverse(reverse)
        updateSpeed()
        updatePitch()
    }

    const updateDuration = () => {
        setDuration(player.buffer.duration / player.playbackRate)
    }

    const updatePlay = async (alwaysPlay?: boolean) => {
        if (!init) await loadAudio()
        await Tone.start()
        // Tone.getTransport().loop = true
        if (paused || alwaysPlay) {
            Tone.getTransport().start()
            setPaused(false)
        } else {
            Tone.getTransport().pause()
            setPaused(true)
        }
        if (duration > 10) {
            Tone.getTransport().loopStart = 0
            Tone.getTransport().loopEnd = duration
            Tone.getTransport().loop = true
        }
    }

    useEffect(() => {
        if (playFlag !== null) {
            if (playFlag === "always") {
                updatePlay(true)
            } else {
                updatePlay()
            }
            setPlayFlag(null)
        }
    }, [playFlag])

    const stop = () => {
        Tone.getTransport().stop()
    }

    const updateMute = () => {
        if (Number.isFinite(Tone.getDestination().volume.value)) {
            Tone.getDestination().volume.value = functions.linearToDecibels(0)
            Tone.getDestination().mute = true
            setVolume(0)
        } else {
            const newVol = previousVolume ? previousVolume : 1
            Tone.getDestination().volume.value = functions.linearToDecibels(functions.logSlider(newVol))
            Tone.getDestination().mute = false
            setVolume(newVol)
        }
        setShowVolumeSlider((prev) => !prev)
    }

    useEffect(() => {
        if (muteFlag) {
            updateMute()
            setMuteFlag(false)
        }
    }, [muteFlag])

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

    useEffect(() => {
        if (volumeFlag !== null) {
            updateVolume(volumeFlag)
            setVolumeFlag(null)
        }
    }, [volumeFlag])

    const updateSpeed = async () => {
        if (!duration) return
        player.playbackRate = speed
        let percent = Tone.getTransport().seconds / duration
        setDuration(player.buffer.duration / speed)
        let val = percent * duration
        if (val < 0) val = 0
        if (val > duration - 1) val = duration - 1
        Tone.getTransport().seconds = val
    }

    useEffect(() => {
        updateSpeed()
    }, [speed])

    const updateReverse = async (value?: boolean) => {
        if (!duration) return
        let percent = Tone.getTransport().seconds / duration
        let val = (1-percent) * duration
        if (val < 0) val = 0
        if (val > duration - 1) val = duration - 1
        if (value === false || !reverse) {
            Tone.getTransport().seconds = val
            player.reverse = false
        } else {
            Tone.getTransport().seconds = val
            player.reverse = true
        }
        let secondsProgress = player.reverse ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        setSeekTo(secondsProgress)
    }

    useEffect(() => {
        updateReverse(reverse)
    }, [reverse])

    const updatePitch = async () => {
        if (!soundtouchNode) return
        if (pitch === 0) {
            const pitchCorrect = 1 / speed
            return soundtouchNode.parameters.get("pitch").value = 1 * pitchCorrect
        }
        const pitchCorrect = 1 / speed
        soundtouchNode.parameters.get("pitch").value = functions.semitonesToScale(pitch) * pitchCorrect
    }

    useEffect(() => {
        updatePitch()
    }, [pitch, speed])

    const bitcrush = async () => {
        if (!bitcrusherNode) return
        if (pixelate === 1) return bitcrusherNode.parameters.get("sampleRate").value = 44100
        bitcrusherNode.parameters.get("sampleRate").value = Math.ceil(22050 / pixelate)
    }

    useEffect(() => {
        bitcrush()
    }, [pixelate])

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

    const getAudioPlayIcon = () => {
        if (paused) return playerPlay
        return playerPause
    }

    const getAudioVolumeIcon = () => {
        if (volume > 0.5) {
            return playerVolume
        } else if (volume > 0) {
            return playerVolumeLow
        } else {
            return playerVolumeMute
        }
    }

    const getAudioReverseIcon = () => {
        if (reverse) return playerReverseActive
        return playerReverse
    }

    const getAudioSpeedIcon = () => {
        if (speed === 1) return playerSpeed
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

    const handleKeydown = (event: any) => {
        const key = event.key
        if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement) && !(event.target.classList.contains("dialog-textarea"))) {
            if (key === "Space") {
                updatePlay()
            }
        }
    }

    useEffect(() => {
        window.addEventListener("keydown", handleKeydown)
        return () => {
            window.removeEventListener("keydown", handleKeydown)
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
        if (mobile) offset -= 10
        return `${raw + offset}px`
    }

    const getAudioPitchMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioPitchRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -2
        if (mobile) offset -= 10
        return `${raw + offset}px`
    }

    const getAudioVolumeMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = 7
        if (mobile) offset -= 10
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
        const seekToPosition = async () => {
            let progress = (100 / duration) * seekTo
            if (reverse) progress = 100 - progress
            Tone.getTransport().seconds = seekTo
            setProgress(progress)
            setSecondsProgress(seekTo)
            setSeekTo(null)
        }
        if (seekTo) seekToPosition()
    }, [seekTo, reverse])

    const seek = (position: number) => {
        updatePlay(true)
        let secondsProgress = reverse ? ((100 - position) / 100) * duration : (position / 100) * duration
        let progress = reverse ? 100 - position : position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !reverse 
        setReverse(val)
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

    useEffect(() => {
        if (rewindFlag) {
            rewind()
            setRewindFlag(false)
        }
    }, [rewindFlag])

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
        if (fastForwardFlag) {
            fastforward()
            setFastForwardFlag(false)
        }
    }, [fastForwardFlag])

    const reset = () => {
        changeReverse(false)
        setSpeed(1)
        setPitch(0)
        setPaused(false)
        setShowSpeedDropdown(false)
        setShowPitchDropdown(false)
        stop()
        updatePlay(true)
        setSeekTo(0)
    }

    useEffect(() => {
        if (resetFlag) {
            reset()
            setResetFlag(false)
        }
    }, [resetFlag])

    const quit = () => {
        stop()
        setPaused(true)
        setAudio("")
        setAudioPost(null)
        setInit(false)
    }

    const playerJSX = () => {
        if (mobile) {
            return (
                <div className="audio-player-row">
                    <div className="audio-player-container" style={{width: "100%"}}>
                        <p className="audio-player-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                        <Slider ref={audioSliderRef} className="audio-player-slider" trackClassName="audio-player-slider-track" thumbClassName="audio-player-slider-thumb" min={0} max={100} value={dragging ? (dragProgress / duration) * 100 : progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                        <p className="audio-player-text">{functions.formatSeconds(duration)}</p>
                    </div>
                    <div className="audio-player-container">
                        <img draggable={false} style={{filter: getFilter(), marginLeft: "10px"}} className="audio-player-icon" src={playerClear} onClick={() => reset()}/>
                        <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon" src={getAudioReverseIcon()} onClick={() => changeReverse()}/>
                        <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon" ref={audioSpeedRef} src={getAudioSpeedIcon()} onClick={() => toggleDropdown("speed")}/>
                        <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon-small" src={playerRewind} onClick={() => rewind()}/>
                        <img draggable={false} style={{filter: getFilter()}} className="audio-player-play-icon" src={getAudioPlayIcon()} onClick={() => updatePlay()}/>
                        <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon-small" src={playerFastforward} onClick={() => fastforward()}/>
                        <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon-small" src={playerStop} onClick={() => quit()}/>
                        <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon" ref={audioPitchRef} src={getAudioPitchIcon()} onClick={() => toggleDropdown("pitch")}/>
                        <img draggable={false} style={{filter: getFilter(), marginRight: "20px"}} ref={audioVolumeRef} className="audio-player-icon" src={getAudioVolumeIcon()} onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)} onClick={updateMute}/>
                    </div>
                </div>
            )
        }
        return (
            <div className="audio-player-row">
                <div className="audio-player-container">
                    <img draggable={false} style={{filter: getFilter()}} className="audio-player-img" src={musicplaying}/>
                    <img draggable={false} style={{filter: getFilter(), marginLeft: "0px"}} className="audio-player-icon-small" src={playerStop} onClick={() => quit()}/>
                    <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon-small" src={playerRewind} onClick={() => rewind()}/>
                    <img draggable={false} style={{filter: getFilter()}} className="audio-player-play-icon" src={getAudioPlayIcon()} onClick={() => updatePlay()}/>
                    <img draggable={false} style={{filter: getFilter(), marginRight: "10px"}} className="audio-player-icon-small" src={playerFastforward} onClick={() => fastforward()}/>
                </div>
                <div className="audio-player-container" style={{width: "100%"}}>
                    <p className="audio-player-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                    <Slider ref={audioSliderRef} className="audio-player-slider" trackClassName="audio-player-slider-track" thumbClassName="audio-player-slider-thumb" min={0} max={100} value={dragging ? (dragProgress / duration) * 100 : progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                    <p className="audio-player-text">{functions.formatSeconds(duration)}</p>
                </div>
                <div className="audio-player-container">
                    <img draggable={false} style={{filter: getFilter(), marginLeft: "10px"}} className="audio-player-icon" src={playerClear} onClick={() => reset()}/>
                    <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon" src={getAudioReverseIcon()} onClick={() => changeReverse()}/>
                    <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon" ref={audioSpeedRef} src={getAudioSpeedIcon()} onClick={() => toggleDropdown("speed")}/>
                    <img draggable={false} style={{filter: getFilter()}} className="audio-player-icon" ref={audioPitchRef} src={getAudioPitchIcon()} onClick={() => toggleDropdown("pitch")}/>
                    <img draggable={false} style={{filter: getFilter(), marginRight: "20px"}} ref={audioVolumeRef} className="audio-player-icon" src={getAudioVolumeIcon()} onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)} onClick={updateMute}/>
                </div>
            </div>
        )
    }

    const getHeight = () => {
        if (mobile) return audioPost ? "160px" : "120px"
        return audioPost ? "140px" : "100px"
    }

    if (audio) {
        return (
            <div className="audio-player" style={{height: getHeight()}} ref={audioControls} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onMouseUp={() => setDragging(false)}>
                {audioPost ? <div className="audio-player-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="audio-player-title" onClick={() => history.push(`/post/${audioPost.postID}/${audioPost.slug}`)}>{audioPost.title || "Unknown"}</span>
                </div> : null}
                {playerJSX()}
                <div className={`audio-player-speed-dropdown ${showSpeedDropdown ? "" : "hide-player-speed-dropdown"}`} style={{marginRight: getAudioSpeedMarginRight(), marginTop: "-370px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(4); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">4x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(2); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">2x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(1.75); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1.75x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(1.5); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1.5x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(1.25); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1.25x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(1); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(0.75); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">0.75x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(0.5); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">0.5x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setSpeed(0.25); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">0.25x</span>
                    </div>
                </div>
                <div className={`audio-player-pitch-dropdown ${showPitchDropdown ? "" : "hide-player-pitch-dropdown"}`} style={{marginRight: getAudioPitchMarginRight(), marginTop: "-370px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(24); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">+24</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(19); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">+19</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(12); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">+12</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(7); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">+7</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(0); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">0</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(-7); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">-7</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(-12); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">-12</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(-19); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">-19</span>
                    </div>
                    <div className="audio-player-pitch-dropdown-item" onClick={() => {setPitch(-24); setShowPitchDropdown(false)}}>
                        <span className="audio-player-pitch-dropdown-text">-24</span>
                    </div>
                </div>
                <div className={`audio-player-volume-dropdown ${showVolumeSlider ? "" : "hide-player-volume-dropdown"}`} style={{marginRight: getAudioVolumeMarginRight(), marginTop: "-270px"}}
                onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                    <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="audio-player-volume-slider" trackClassName="audio-player-volume-slider-track" thumbClassName="audio-player-volume-slider-thumb"
                    value={volume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
                </div>
            </div>
        )
    }
    return null
}

export default AudioPlayer