import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {UnverifiedPost, PostHistory, PostFull} from "../types/Types"

const playbackSlice = createSlice({
    name: "playback",
    initialState: {
        audio: "",
        audioPost: null as UnverifiedPost | PostHistory | PostFull | null,
        speed: 1,
        reverse: false,
        pitch: 0,
        volume: 0.75,
        previousVolume: 0,
        paused: true,
        preservePitch: true,
        duration: 0,
        seekTo: null as number | null,
        secondsProgress: 0,
        progress: 0,
        dragProgress: null as number | null,
        dragging: false,
        rewindFlag: false,
        fastForwardFlag: false,
        playFlag: null as string | null,
        volumeFlag: null as number | null,
        muteFlag: false,
        resetFlag: false,
        disableZoom: true
    },
    reducers: {
        setAudio: (state, action) => {state.audio = action.payload},
        setAudioPost: (state, action) => {state.audioPost = action.payload},
        setSpeed: (state, action) => {state.speed = action.payload},
        setReverse: (state, action) => {state.reverse = action.payload},
        setPitch: (state, action) => {state.pitch = action.payload},
        setVolume: (state, action) => {state.volume = action.payload},
        setPreviousVolume: (state, action) => {state.previousVolume = action.payload},
        setPaused: (state, action) => {state.paused = action.payload},
        setPreservePitch: (state, action) => {state.preservePitch = action.payload},
        setDuration: (state, action) => {state.duration = action.payload},
        setSeekTo: (state, action) => {state.seekTo = action.payload},
        setSecondsProgress: (state, action) => {state.secondsProgress = action.payload},
        setProgress: (state, action) => {state.progress = action.payload},
        setDragProgress: (state, action) => {state.dragProgress = action.payload},
        setDragging: (state, action) => {state.dragging = action.payload},
        setRewindFlag: (state, action) => {state.rewindFlag = action.payload},
        setFastForwardFlag: (state, action) => {state.fastForwardFlag = action.payload},
        setPlayFlag: (state, action) => {state.playFlag = action.payload},
        setVolumeFlag: (state, action) => {state.volumeFlag = action.payload},
        setMuteFlag: (state, action) => {state.muteFlag = action.payload},
        setResetFlag: (state, action) => {state.resetFlag = action.payload},
        setDisableZoom: (state, action) => {state.disableZoom = action.payload}
    }
})

const {
    setAudio, setAudioPost, setSpeed, setReverse, setPitch, setVolume, setPreviousVolume, 
    setPaused, setPreservePitch, setDuration, setSeekTo, setSecondsProgress, setProgress,
    setDragProgress, setDragging, setRewindFlag, setFastForwardFlag, setPlayFlag, 
    setVolumeFlag, setMuteFlag, setResetFlag, setDisableZoom
} = playbackSlice.actions

export const usePlaybackSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        audio: selector((state) => state.playback.audio),
        audioPost: selector((state) => state.playback.audioPost),
        speed: selector((state) => state.playback.speed),
        reverse: selector((state) => state.playback.reverse),
        pitch: selector((state) => state.playback.pitch),
        volume: selector((state) => state.playback.volume),
        previousVolume: selector((state) => state.playback.previousVolume),
        paused: selector((state) => state.playback.paused),
        preservePitch: selector((state) => state.playback.preservePitch),
        duration: selector((state) => state.playback.duration),
        seekTo: selector((state) => state.playback.seekTo),
        secondsProgress: selector((state) => state.playback.secondsProgress),
        progress: selector((state) => state.playback.progress),
        dragProgress: selector((state) => state.playback.dragProgress),
        dragging: selector((state) => state.playback.dragging),
        rewindFlag: selector((state) => state.playback.rewindFlag),
        fastForwardFlag: selector((state) => state.playback.fastForwardFlag),
        playFlag: selector((state) => state.playback.playFlag),
        volumeFlag: selector((state) => state.playback.volumeFlag),
        muteFlag: selector((state) => state.playback.muteFlag),
        resetFlag: selector((state) => state.playback.resetFlag),
        disableZoom: selector((state) => state.playback.disableZoom)
    }
}

export const usePlaybackActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setAudio: (state: string) => dispatch(setAudio(state)),
        setAudioPost: (state: UnverifiedPost | PostHistory | PostFull | null) => dispatch(setAudioPost(state)),
        setSpeed: (state: number) => dispatch(setSpeed(state)),
        setReverse: (state: boolean) => dispatch(setReverse(state)),
        setPitch: (state: number) => dispatch(setPitch(state)),
        setVolume: (state: number) => dispatch(setVolume(state)),
        setPreviousVolume: (state: number) => dispatch(setPreviousVolume(state)),
        setPaused: (state: boolean) => dispatch(setPaused(state)),
        setPreservePitch: (state: boolean) => dispatch(setPreservePitch(state)),
        setDuration: (state: number) => dispatch(setDuration(state)),
        setSeekTo: (state: number | null) => dispatch(setSeekTo(state)),
        setSecondsProgress: (state: number) => dispatch(setSecondsProgress(state)),
        setProgress: (state: number) => dispatch(setProgress(state)),
        setDragProgress: (state: number | null) => dispatch(setDragProgress(state)),
        setDragging: (state: boolean) => dispatch(setDragging(state)),
        setRewindFlag: (state: boolean) => dispatch(setRewindFlag(state)),
        setFastForwardFlag: (state: boolean) => dispatch(setFastForwardFlag(state)),
        setPlayFlag: (state: string | null) => dispatch(setPlayFlag(state)),
        setVolumeFlag: (state: number | null) => dispatch(setVolumeFlag(state)),
        setMuteFlag: (state: boolean) => dispatch(setMuteFlag(state)),
        setResetFlag: (state: boolean) => dispatch(setResetFlag(state)),
        setDisableZoom: (state: boolean) => dispatch(setDisableZoom(state))
    }
}

export default playbackSlice.reducer