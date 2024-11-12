import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const interactionSlice = createSlice({
    name: "interaction",
    initialState: {
        enableDrag: false,
        sidebarHover: false,
        mobileScrolling: false,
        scrollY: null as any,
        tooltipX: 0,
        tooltipY: 0,
        tooltipEnabled: false,
        tooltipPost: null as any,
        tooltipImg: null as any
    },
    reducers: {
        setEnableDrag: (state, action) => {state.enableDrag = action.payload},
        setSidebarHover: (state, action) => {state.sidebarHover = action.payload},
        setMobileScrolling: (state, action) => {state.mobileScrolling = action.payload},
        setScrollY: (state, action) => {state.scrollY = action.payload},
        setToolTipX: (state, action) => {state.tooltipX = action.payload},
        setToolTipY: (state, action) => {state.tooltipY = action.payload},
        setToolTipEnabled: (state, action) => {state.tooltipEnabled = action.payload},
        setToolTipPost: (state, action) => {state.tooltipPost = action.payload},
        setToolTipImg: (state, action) => {state.tooltipImg = action.payload}
    }    
})

const {
    setEnableDrag, setSidebarHover, setMobileScrolling, setScrollY,
    setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, 
    setToolTipImg
} = interactionSlice.actions

export const useInteractionSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        enableDrag: selector((state) => state.interaction.enableDrag),
        sidebarHover: selector((state) => state.interaction.sidebarHover),
        mobileScrolling: selector((state) => state.interaction.mobileScrolling),
        scrollY: selector((state) => state.interaction.scrollY),
        tooltipX: selector((state) => state.interaction.tooltipX),
        tooltipY: selector((state) => state.interaction.tooltipY),
        tooltipEnabled: selector((state) => state.interaction.tooltipEnabled),
        tooltipPost: selector((state) => state.interaction.tooltipPost),
        tooltipImg: selector((state) => state.interaction.tooltipImg)
    }
}

export const useInteractionActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEnableDrag: (state: any) => dispatch(setEnableDrag(state)),
        setSidebarHover: (state: any) => dispatch(setSidebarHover(state)),
        setMobileScrolling: (state: any) => dispatch(setMobileScrolling(state)),
        setScrollY: (state: any) => dispatch(setScrollY(state)),
        setToolTipX: (state: any) => dispatch(setToolTipX(state)),
        setToolTipY: (state: any) => dispatch(setToolTipY(state)),
        setToolTipEnabled: (state: any) => dispatch(setToolTipEnabled(state)),
        setToolTipPost: (state: any) => dispatch(setToolTipPost(state)),
        setToolTipImg: (state: any) => dispatch(setToolTipImg(state))
    }
}

export default interactionSlice.reducer