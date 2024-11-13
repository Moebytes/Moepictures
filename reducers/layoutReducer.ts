import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const layoutSlice = createSlice({
    name: "layout",
    initialState: {
        mobile: false,
        tablet: false,
        relative: false,
        hideSortbar: false,
        hideSidebar: false,
        hideNavbar: false,
        hideTitlebar: false,
        hideMobileNavbar: true
    },
    reducers: {
        setMobile: (state, action) => {state.mobile = action.payload},
        setTablet: (state, action) => {state.tablet = action.payload},
        setRelative: (state, action) => {state.relative = action.payload},
        setHideSortbar: (state, action) => {state.hideSortbar = action.payload},
        setHideSidebar: (state, action) => {state.hideSidebar = action.payload},
        setHideNavbar: (state, action) => {state.hideNavbar = action.payload},
        setHideTitlebar: (state, action) => {state.hideTitlebar = action.payload},
        setHideMobileNavbar: (state, action) => {state.hideMobileNavbar = action.payload}
    }
})

const {setMobile, setTablet, setRelative, setHideNavbar, setHideSidebar, setHideSortbar, setHideTitlebar, setHideMobileNavbar} = layoutSlice.actions

export const useLayoutSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        mobile: selector((state) => state.layout.mobile),
        tablet: selector((state) => state.layout.tablet),
        relative: selector((state) => state.layout.relative),
        hideNavbar: selector((state) => state.layout.hideNavbar),
        hideSidebar: selector((state) => state.layout.hideSidebar),
        hideSortbar: selector((state) => state.layout.hideSortbar),
        hideTitlebar: selector((state) => state.layout.hideTitlebar),
        hideMobileNavbar: selector((state) => state.layout.hideMobileNavbar)
    }
}

export const useLayoutActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setMobile: (state: any) => dispatch(setMobile(state)),
        setTablet: (state: any) => dispatch(setTablet(state)),
        setRelative: (state: any) => dispatch(setRelative(state)),
        setHideNavbar: (state: any) => dispatch(setHideNavbar(state)),
        setHideSidebar: (state: any) => dispatch(setHideSidebar(state)),
        setHideSortbar: (state: any) => dispatch(setHideSortbar(state)),
        setHideTitlebar: (state: any) => dispatch(setHideTitlebar(state)),
        setHideMobileNavbar: (state: any) => dispatch(setHideMobileNavbar(state))
    }
}

export default layoutSlice.reducer