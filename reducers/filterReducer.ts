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
        setBitcrush: (state: number) => dispatch(setBitcrush(state))
    }
}

export default filterSlice.reducer