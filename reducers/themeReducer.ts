import {createSlice} from "@reduxjs/toolkit"

const themeSlice = createSlice({
    name: "siteColor",
    initialState: {
        theme: "dark",
        siteHue: 180,
        siteSaturation: 100,
        siteLightness: 50
    },
    reducers: {
        setTheme: (state, action) => {
            state.theme = action.payload
        },
        setSiteHue: (state, action) => {
            state.siteHue = action.payload
        },
        setSiteSaturation: (state, action) => {
            state.siteSaturation = action.payload
        },
        setSiteLightness: (state, action) => {
            state.siteLightness = action.payload
        }
    }
})

export const {setTheme, setSiteHue, setSiteSaturation, setSiteLightness} = themeSlice.actions
export default themeSlice.reducer