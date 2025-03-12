import React, {useEffect, useRef, useState} from "react"
import {useLocation, useNavigate} from "react-router-dom"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, useThemeSelector, useSessionSelector} from "../../store"
import functions from "../../structures/Functions"
import Slider from "react-slider"
import musicplaying from "../../assets/icons/musicplaying.gif"
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
import * as Tone from "tone"
import silence from "../../assets/images/silence.mp3"
import "./styles/audioplayer.less"

let player: Tone.Player
let audioNode: Tone.ToneAudioNode
let bitcrusherNode: AudioWorkletNode
let soundtouchNode: AudioWorkletNode
let gainNode: Tone.Gain
let timer = null as any

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
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const {lowpass, highpass, reverb, delay, phaser, bitcrush} = useFilterSelector()
    const {audio, audioPost, audioRewindFlag, audioFastForwardFlag, playFlag, volumeFlag, muteFlag, resetFlag, audioSecondsProgress, audioProgress, 
    audioDragProgress, audioReverse, audioSpeed, pitch, audioVolume, audioPreviousVolume, audioPaused, audioDuration, audioDragging, audioSeekTo, showBigPlayer} = usePlaybackSelector()
    const {setAudio, setAudioPost, setAudioRewindFlag, setAudioFastForwardFlag, setPlayFlag, setVolumeFlag, setMuteFlag, setResetFlag, 
    setAudioSecondsProgress, setAudioProgress, setAudioDragProgress, setAudioReverse, setAudioSpeed, setPitch, setAudioVolume, setAudioPreviousVolume, setAudioPaused, 
    setAudioDuration, setAudioDragging, setAudioSeekTo} = usePlaybackActions()
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
    const [effects, setEffects] = useState([] as {type: string, node: (Tone.ToneAudioNode | AudioWorkletNode)}[])
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (location.pathname !== "/post") {
            if (Tone.getTransport().state === "stopped") quit()
        }
      }, [location.pathname])

    const getFilter = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const removeEffect = (type: string) => {
        const index = effects.findIndex((e) => e?.type === type)
        if (index !== -1) {
            effects[index] = null as any
            setEffects(effects.filter(Boolean))
        }
    }

    const pushEffect = (type: string, node: Tone.ToneAudioNode | AudioWorkletNode) => {
        const obj = {type, node}
        const index = effects.findIndex((e) => e?.type === type)
        if (index !== -1) {
            effects[index] = obj
        } else {
            effects.push(obj)
        }
        setEffects(effects)
    }
    
    const applyEffects = () => {
        if (!soundtouchNode) return
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            player.disconnect()
            soundtouchNode.disconnect()
            const nodes = effects.map((e) => e?.node).filter(Boolean)
            if (nodes.length) nodes.forEach((n) => n.disconnect())
            audioNode.input = player
            audioNode.input.chain(...[soundtouchNode, ...nodes, audioNode.output!])
        }, 25)
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
        setAudioSecondsProgress(0)
        setAudioProgress(0)
        setAudioDragProgress(0)
        setAudioDuration(0)
        setAudioDragging(false)
        setAudioSeekTo(null)
        setInit(false)
        loadAudio()
    }, [audio])

    useEffect(() => {
        const id = window.setInterval(() => {
            if (!audioDuration) return
            let percent = (Tone.getTransport().seconds / audioDuration)
            if (!Number.isFinite(percent)) return
            if (!audioDragging) {
                if (audioReverse) {
                    setAudioProgress((1-percent) * 100)
                    setAudioSecondsProgress(audioDuration - Tone.getTransport().seconds)
                } else {
                    setAudioProgress(percent * 100)
                    setAudioSecondsProgress(Tone.getTransport().seconds)
                }
            }
            if (Tone.getTransport().seconds > audioDuration) {
                Tone.getTransport().seconds = 0
                stop()
                updatePlay(true)
            }
        }, 1000)
        return () => {
            window.clearInterval(id)
        }
    }, [audioDragging, audioReverse, audioDuration])

    const refreshState = () => {
        updateReverse(audioReverse)
        updateSpeed()
        updatePitch()
    }

    const updateDuration = () => {
        setAudioDuration(player.buffer.duration / player.playbackRate)
    }

    const updatePlay = async (alwaysPlay?: boolean) => {
        if (!init) await loadAudio()
        await Tone.start()
        // Tone.getTransport().loop = true
        if (audioPaused || alwaysPlay) {
            Tone.getTransport().start()
            setAudioPaused(false)
        } else {
            Tone.getTransport().pause()
            setAudioPaused(true)
        }
        if (audioDuration > 10) {
            Tone.getTransport().loopStart = 0
            Tone.getTransport().loopEnd = audioDuration
            Tone.getTransport().loop = true
        }
    }

    useEffect(() => {
        if (playFlag !== null) {
            if (playFlag === "always") {
                updatePlay(true)
            } else if (playFlag === "stop") {
                stop()
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
            setAudioVolume(0)
        } else {
            const newVol = audioPreviousVolume ? audioPreviousVolume : 1
            Tone.getDestination().volume.value = functions.linearToDecibels(functions.logSlider(newVol))
            Tone.getDestination().mute = false
            setAudioVolume(newVol)
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
        setAudioVolume(value)
        setAudioPreviousVolume(value)
    }

    useEffect(() => {
        if (volumeFlag !== null) {
            updateVolume(volumeFlag)
            setVolumeFlag(null)
        }
    }, [volumeFlag])

    const updateSpeed = async () => {
        if (!audioDuration) return
        player.playbackRate = audioSpeed
        let percent = Tone.getTransport().seconds / audioDuration
        setAudioDuration(player.buffer.duration / audioSpeed)
        let val = percent * audioDuration
        if (val < 0) val = 0
        if (val > audioDuration - 1) val = audioDuration - 1
        Tone.getTransport().seconds = val
    }

    useEffect(() => {
        updateSpeed()
    }, [audioSpeed])

    const updateReverse = async (value?: boolean) => {
        if (!audioDuration) return
        let percent = Tone.getTransport().seconds / audioDuration
        let val = (1-percent) * audioDuration
        if (val < 0) val = 0
        if (val > audioDuration - 1) val = audioDuration - 1
        if (value === false || !audioReverse) {
            Tone.getTransport().seconds = val
            player.reverse = false
        } else {
            Tone.getTransport().seconds = val
            player.reverse = true
        }
        let secondsProgress = player.reverse ? (audioDuration / 100) * (100 - audioProgress) : (audioDuration / 100) * audioProgress
        setAudioSeekTo(secondsProgress)
    }

    useEffect(() => {
        updateReverse(audioReverse)
    }, [audioReverse])

    const updatePitch = async () => {
        if (!soundtouchNode) return
        const soundtouchParams = soundtouchNode.parameters as unknown as {get: (key: string) => AudioParam}
        if (pitch === 0) {
            const pitchCorrect = 1 / audioSpeed
            return soundtouchParams.get("pitch").value = 1 * pitchCorrect
        }
        const pitchCorrect = 1 / audioSpeed
        soundtouchParams.get("pitch").value = functions.semitonesToScale(pitch) * pitchCorrect
    }

    useEffect(() => {
        updatePitch()
    }, [pitch, audioSpeed])

    const updateBitcrush = async () => {
        if (!bitcrusherNode) return
        const bitcrushParams = bitcrusherNode.parameters as unknown as {get: (key: string) => AudioParam}
        bitcrushParams.get("sampleRate").value = functions.logSlider2(bitcrush, 44100, 100)
        if (bitcrush === 0) {
            removeEffect("bitcrush")
        } else {
            pushEffect("bitcrush", bitcrusherNode)
        }
        applyEffects()
    }

    useEffect(() => {
        updateBitcrush()
    }, [bitcrush])

    const updateLowpass = async () => {
        if (lowpass === 100) {
            removeEffect("lowpass")
        } else {
            const lowpassFilter = new Tone.Filter({type: "lowpass", frequency: functions.logSlider2(lowpass, 100, 20000), Q: 5, rolloff: -12})
            pushEffect("lowpass", lowpassFilter)
        }
        applyEffects()
    }

    useEffect(() => {
        updateLowpass()
    }, [lowpass])

    const updateHighpass = async () => {
        if (highpass === 0) {
            removeEffect("highpass")
        } else {
            const lowpassFilter = new Tone.Filter({type: "highpass", frequency: functions.logSlider2(highpass, 100, 20000), Q: 5, rolloff: -12})
            pushEffect("highpass", lowpassFilter)
        }
        applyEffects()
    }

    useEffect(() => {
        updateHighpass()
    }, [highpass])

    const updateReverb = async () => {
        if (reverb === 0) {
            removeEffect("reverb")
        } else {
            const reverbEffect = new Tone.Reverb({wet: reverb, decay: 3})
            pushEffect("reverb", reverbEffect)
        }
        applyEffects()
    }

    useEffect(() => {
        updateReverb()
    }, [reverb])

    const updateDelay = async () => {
        if (delay === 0) {
            removeEffect("delay")
        } else {
            const delayEffect = new Tone.PingPongDelay({wet: delay, delayTime: 0.25, feedback: 0.5})
            pushEffect("delay", delayEffect)
        }
        applyEffects()
    }

    useEffect(() => {
        updateDelay()
    }, [delay])

    const updatePhaser = async () => {
        if (phaser === 0) {
            removeEffect("phaser")
        } else {
            const phaserEffect = new Tone.Phaser({wet: phaser, frequency: 3})
            pushEffect("phaser", phaserEffect)
        }
        applyEffects()
    }

    useEffect(() => {
        updatePhaser()
    }, [phaser])

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

    const handleKeydown = (event: KeyboardEvent) => {
        const key = event.key
        if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement) && 
            !(event.target instanceof HTMLElement && event.target.classList.contains("dialog-textarea"))) {
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
        if (!audioDragging && audioDragProgress !== null) {
            setAudioSecondsProgress(audioDragProgress)
            setAudioProgress((audioDragProgress / audioDuration) * 100)
            setAudioDragProgress(null)
       }
    })

    const getAudioSpeedMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -10
        if (mobile) offset -= 10
        return `${raw + offset}px`
    }

    const getAudioPitchMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioPitchRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -10
        if (mobile) offset -= 10
        return `${raw + offset}px`
    }

    const getAudioVolumeMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = 0
        if (mobile) offset -= 10
        return `${raw + offset}px`
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

    useEffect(() => {
        const audioSeekToPosition = async () => {
            if (!audioSeekTo) return
            let audioProgress = (100 / audioDuration) * audioSeekTo
            if (audioReverse) audioProgress = 100 - audioProgress
            Tone.getTransport().seconds = audioSeekTo
            setAudioProgress(audioProgress)
            setAudioSecondsProgress(audioSeekTo)
            setAudioSeekTo(null)
        }
        if (audioSeekTo) audioSeekToPosition()
    }, [audioSeekTo, audioReverse])

    const seek = (position: number) => {
        updatePlay(true)
        let secondsProgress = audioReverse ? ((100 - position) / 100) * audioDuration : (position / 100) * audioDuration
        let audioProgress = audioReverse ? 100 - position : position
        setAudioProgress(audioProgress)
        setAudioDragging(false)
        setAudioSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !audioReverse 
        setAudioReverse(val)
    }

    const rewind = (value?: number) => {
        if (!value) value = Math.floor(audioDuration / 10)
        const current = Tone.getTransport().seconds
        let seconds = current - value
        if (audioReverse) seconds = current + value
        if (seconds < 0) seconds = 0
        if (seconds > audioDuration) seconds = audioDuration
        setAudioSeekTo(seconds)
    }

    useEffect(() => {
        if (audioRewindFlag) {
            rewind()
            setAudioRewindFlag(false)
        }
    }, [audioRewindFlag])

    const fastforward = (value?: number) => {
        if (!value) value = Math.floor(audioDuration / 10)
        const current = Tone.getTransport().seconds
        let seconds = current + value
        if (audioReverse) seconds = current - value
        if (seconds < 0) seconds = 0
        if (seconds > audioDuration) seconds = audioDuration
        setAudioSeekTo(seconds)
    }

    useEffect(() => {
        if (audioFastForwardFlag) {
            fastforward()
            setAudioFastForwardFlag(false)
        }
    }, [audioFastForwardFlag])

    const reset = () => {
        changeReverse(false)
        setAudioSpeed(1)
        setPitch(0)
        setAudioPaused(false)
        setShowSpeedDropdown(false)
        setShowPitchDropdown(false)
        stop()
        updatePlay(true)
        setAudioSeekTo(0)
    }

    useEffect(() => {
        if (resetFlag) {
            reset()
            setResetFlag(false)
        }
    }, [resetFlag])

    const quit = () => {
        stop()
        setAudioPaused(true)
        setAudio("")
        setAudioPost(null)
        setInit(false)
    }

    const playerJSX = () => {
        if (mobile) {
            return (
                <div className="audio-player-row">
                    <div className="audio-player-container" style={{width: "100%"}}>
                        <p className="audio-player-text">{audioDragging ? functions.formatSeconds(audioDragProgress || 0) : functions.formatSeconds(audioSecondsProgress)}</p>
                        <Slider ref={audioSliderRef} className="audio-player-slider" trackClassName="audio-player-slider-track" thumbClassName="audio-player-slider-thumb" min={0} max={100} value={audioDragging ? ((audioDragProgress || 0) / audioDuration) * 100 : audioProgress} onBeforeChange={() => setAudioDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                        <p className="audio-player-text">{functions.formatSeconds(audioDuration)}</p>
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
                    <p className="audio-player-text">{audioDragging ? functions.formatSeconds(audioDragProgress || 0) : functions.formatSeconds(audioSecondsProgress)}</p>
                    <Slider ref={audioSliderRef} className="audio-player-slider" trackClassName="audio-player-slider-track" thumbClassName="audio-player-slider-thumb" min={0} max={100} value={audioDragging ? ((audioDragProgress || 0) / audioDuration) * 100 : audioProgress} onBeforeChange={() => setAudioDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                    <p className="audio-player-text">{functions.formatSeconds(audioDuration)}</p>
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
        if (mobile) return audioPost ? "140px" : "100px"
        return audioPost ? "100px" : "60px"
    }

    if (!showBigPlayer) return null

    if (audio) {
        return (
            <div className="audio-player" style={{height: getHeight()}} ref={audioControls} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onMouseUp={() => setAudioDragging(false)}>
                {audioPost ? <div className="audio-player-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="audio-player-title" onClick={() => navigate(`/post/${audioPost.postID}/${audioPost.slug}`)}>{audioPost.title || "Unknown"}</span>
                </div> : null}
                {playerJSX()}
                <div className={`audio-player-speed-dropdown ${showSpeedDropdown ? "" : "hide-player-speed-dropdown"}`} style={{marginRight: getAudioSpeedMarginRight(), marginTop: "-340px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(4); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">4x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(2); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">2x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(1.75); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1.75x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(1.5); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1.5x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(1.25); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1.25x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(1); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">1x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(0.75); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">0.75x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(0.5); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">0.5x</span>
                    </div>
                    <div className="audio-player-speed-dropdown-item" onClick={() => {setAudioSpeed(0.25); setShowSpeedDropdown(false)}}>
                        <span className="audio-player-speed-dropdown-text">0.25x</span>
                    </div>
                </div>
                <div className={`audio-player-pitch-dropdown ${showPitchDropdown ? "" : "hide-player-pitch-dropdown"}`} style={{marginRight: getAudioPitchMarginRight(), marginTop: "-340px"}}
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
                <div className={`audio-player-volume-dropdown ${showVolumeSlider ? "" : "hide-player-volume-dropdown"}`} style={{marginRight: getAudioVolumeMarginRight(), marginTop: "-180px"}}
                onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                    <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="audio-player-volume-slider" trackClassName="audio-player-volume-slider-track" thumbClassName="audio-player-volume-slider-thumb"
                    value={audioVolume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
                </div>
            </div>
        )
    }
    return null
}

export default AudioPlayer