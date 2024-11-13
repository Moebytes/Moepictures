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
        pixelate: 1
    },
    reducers: {
        setBrightness: (state, action) => {state.brightness = action.payload},
        setContrast: (state, action) => {state.contrast = action.payload},
        setHue: (state, action) => {state.hue = action.payload},
        setSaturation: (state, action) => {state.saturation = action.payload},
        setLightness: (state, action) => {state.lightness = action.payload},
        setBlur: (state, action) => {state.blur = action.payload},
        setSharpen: (state, action) => {state.sharpen = action.payload},
        setPixelate: (state, action) => {state.pixelate = action.payload}
    }    
})

const {setBrightness, setContrast, setHue, setSaturation, setLightness, setBlur, setSharpen, setPixelate} = filterSlice.actions

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
        pixelate: selector((state) => state.filter.pixelate)
    }
}

export const useFilterActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setBrightness: (state: any) => dispatch(setBrightness(state)),
        setContrast: (state: any) => dispatch(setContrast(state)),
        setHue: (state: any) => dispatch(setHue(state)),
        setSaturation: (state: any) => dispatch(setSaturation(state)),
        setLightness: (state: any) => dispatch(setLightness(state)),
        setBlur: (state: any) => dispatch(setBlur(state)),
        setSharpen: (state: any) => dispatch(setSharpen(state)),
        setPixelate: (state: any) => dispatch(setPixelate(state))
    }
}

export default filterSlice.reducer