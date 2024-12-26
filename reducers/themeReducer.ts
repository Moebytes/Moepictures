import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {Themes, Languages} from "../types/Types"
import en from "../assets/locales/en.json"
import ja from "../assets/locales/ja.json"

const translations: Record<string, typeof en> = {en, ja: ja as any}

const themeSlice = createSlice({
    name: "theme",
    initialState: {
        language: "en" as Languages,
        theme: "dark" as Themes,
        siteHue: 180,
        siteSaturation: 100,
        siteLightness: 50
    },
    reducers: {
        setTheme: (state, action) => {state.theme = action.payload},
        setSiteHue: (state, action) => {state.siteHue = action.payload},
        setSiteSaturation: (state, action) => {state.siteSaturation = action.payload},
        setSiteLightness: (state, action) => {state.siteLightness = action.payload},
        setLanguage: (state, action) => {state.language = action.payload}
    }    
})

const {setTheme, setSiteHue, setSiteSaturation, setSiteLightness, setLanguage} = themeSlice.actions

export const useThemeSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        theme: selector((state) => state.theme.theme),
        siteHue: selector((state) => state.theme.siteHue),
        siteSaturation: selector((state) => state.theme.siteSaturation),
        siteLightness: selector((state) => state.theme.siteLightness),
        language: selector((state) => state.theme.language),
        i18n: translations[selector((state) => state.theme.language)]
    }
}

export const useThemeActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setTheme: (state: Themes) => dispatch(setTheme(state)),
        setSiteHue: (state: number) => dispatch(setSiteHue(state)),
        setSiteSaturation: (state: number) => dispatch(setSiteSaturation(state)),
        setSiteLightness: (state: number) => dispatch(setSiteLightness(state)),
        setLanguage: (state: Languages) => dispatch(setLanguage(state))
    }
}

export default themeSlice.reducer