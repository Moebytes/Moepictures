import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const filterSlice = createSlice({
    name: "filter",
    initialState: {
        brightness: 100,
        contrast: 100,
        hue: 180,
        saturation: 100,
        lightness: 100,
        blur: 0,
        sharpen: 0,
        pixelate: 1,
        splatter: 0,
        lowpass: 100,
        highpass: 0,
        reverb: 0,
        delay: 0,
        phaser: 0,
        bitcrush: 0
    },
    reducers: {
        setBrightness: (state, action) => {state.brightness = action.payload},
        setContrast: (state, action) => {state.contrast = action.payload},
        setHue: (state, action) => {state.hue = action.payload},
        setSaturation: (state, action) => {state.saturation = action.payload},
        setLightness: (state, action) => {state.lightness = action.payload},
        setBlur: (state, action) => {state.blur = action.payload},
        setSharpen: (state, action) => {state.sharpen = action.payload},
        setPixelate: (state, action) => {state.pixelate = action.payload},
        setSplatter: (state, action) => {state.splatter = action.payload},
        setLowpass: (state, action) => {state.lowpass = action.payload},
        setHighpass: (state, action) => {state.highpass = action.payload},
        setReverb: (state, action) => {state.reverb = action.payload},
        setDelay: (state, action) => {state.delay = action.payload},
        setPhaser: (state, action) => {state.phaser = action.payload},
        setBitcrush: (state, action) => {state.bitcrush = action.payload}
    }    
})

const {
    setBrightness, setContrast, setHue, setSaturation, setLightness, setBlur, 
    setSharpen, setPixelate, setSplatter, setLowpass, setHighpass, setReverb, 
    setDelay, setPhaser, setBitcrush
} = filterSlice.actions

export const useFilterSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        brightness: selector((state) => state.filter.brightness),
        contrast: selector((state) => state.filter.contrast),
        hue: selector((state) => state.filter.hue),
        saturation: selector((state) => state.filter.saturation),
        lightness: selector((state) => state.filter.lightness),
        blur: selector((state) => state.filter.blur),
        sharpen: selector((state) => state.filter.sharpen),
        pixelate: selector((state) => state.filter.pixelate),
        splatter: selector((state) => state.filter.splatter),
        lowpass: selector((state) => state.filter.lowpass),
        highpass: selector((state) => state.filter.highpass),
        reverb: selector((state) => state.filter.reverb),
        delay: selector((state) => state.filter.delay),
        phaser: selector((state) => state.filter.phaser),
        bitcrush: selector((state) => state.filter.bitcrush)
    }
}

const resetImageFilters = (dispatch: StoreDispatch) => {
    dispatch(setBrightness(100))
    dispatch(setContrast(100))
    dispatch(setHue(180))
    dispatch(setSaturation(100))
    dispatch(setLightness(100))
    dispatch(setBlur(0))
    dispatch(setSharpen(0))
    dispatch(setPixelate(1))
    dispatch(setSplatter(0))
}

const resetAudioFilters = (dispatch: StoreDispatch) => {
    dispatch(setLowpass(100))
    dispatch(setHighpass(0))
    dispatch(setReverb(0))
    dispatch(setDelay(0))
    dispatch(setPhaser(0))
    dispatch(setBitcrush(0))
}

export const useFilterActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setBrightness: (state: number) => dispatch(setBrightness(state)),
        setContrast: (state: number) => dispatch(setContrast(state)),
        setHue: (state: number) => dispatch(setHue(state)),
        setSaturation: (state: number) => dispatch(setSaturation(state)),
        setLightness: (state: number) => dispatch(setLightness(state)),
        setBlur: (state: number) => dispatch(setBlur(state)),
        setSharpen: (state: number) => dispatch(setSharpen(state)),
        setPixelate: (state: number) => dispatch(setPixelate(state)),
        setSplatter: (state: number) => dispatch(setSplatter(state)),
        setLowpass: (state: number) => dispatch(setLowpass(state)),
        setHighpass: (state: number) => dispatch(setHighpass(state)),
        setReverb: (state: number) => dispatch(setReverb(state)),
        setDelay: (state: number) => dispatch(setDelay(state)),
        setPhaser: (state: number) => dispatch(setPhaser(state)),
        setBitcrush: (state: number) => dispatch(setBitcrush(state)),
        resetImageFilters: () => resetImageFilters(dispatch),
        resetAudioFilters: () => resetAudioFilters(dispatch)
    }
}

export default filterSlice.reducer