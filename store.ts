import {configureStore} from "@reduxjs/toolkit"
import {useSelector as rawSelector, useDispatch as rawDispatch} from "react-redux"
import themeReducer, {setTheme, setSiteHue, setSiteLightness, setSiteSaturation} from "./reducers/themeReducer"

const store = configureStore({
    reducer: {
        theme: themeReducer
    }
})

type StoreState = ReturnType<typeof store.getState>
type StoreDispatch = typeof store.dispatch

export const useThemeSelector = () => {
    const selector = rawSelector.withTypes<StoreState>()
    return {
        theme: selector((state) => state.theme.theme),
        siteHue: selector((state) => state.theme.siteHue),
        siteSaturation: selector((state) => state.theme.siteSaturation),
        siteLightness: selector((state) => state.theme.siteLightness)
    }
}

export const useThemeActions = () => {
    const dispatch = rawDispatch.withTypes<StoreDispatch>()()
    return {
        setTheme: (state: any) => dispatch(setTheme(state)),
        setSiteHue: (state: any) => dispatch(setSiteHue(state)),
        setSiteSaturation: (state: any) => dispatch(setSiteSaturation(state)),
        setSiteLightness: (state: any) => dispatch(setSiteLightness(state))
    }
}

export default store