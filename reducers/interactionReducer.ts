import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {PostSearch} from "../types/Types"

const interactionSlice = createSlice({
    name: "interaction",
    initialState: {
        enableDrag: false,
        sidebarHover: false,
        mobileScrolling: false,
        scrollY: 0,
        tooltipX: 0,
        tooltipY: 0,
        tooltipEnabled: false,
        tooltipPost: null as PostSearch | null,
        tooltipImg: "",
        tagTooltipY: 0,
        tagTooltipTag: null as string | null,
        tagTooltipEnabled: false
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
        setToolTipImg: (state, action) => {state.tooltipImg = action.payload},
        setTagToolTipY: (state, action) => {state.tagTooltipY = action.payload},
        setTagToolTipTag: (state, action) => {state.tagTooltipTag = action.payload},
        setTagToolTipEnabled: (state, action) => {state.tagTooltipEnabled = action.payload},
    }    
})

const {
    setEnableDrag, setSidebarHover, setMobileScrolling, setScrollY,
    setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, 
    setToolTipImg, setTagToolTipTag, setTagToolTipEnabled,
    setTagToolTipY
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
        tooltipImg: selector((state) => state.interaction.tooltipImg),
        tagTooltipY: selector((state) => state.interaction.tagTooltipY),
        tagTooltipTag: selector((state) => state.interaction.tagTooltipTag),
        tagTooltipEnabled: selector((state) => state.interaction.tagTooltipEnabled)
    }
}

export const useInteractionActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEnableDrag: (state: boolean) => dispatch(setEnableDrag(state)),
        setSidebarHover: (state: boolean) => dispatch(setSidebarHover(state)),
        setMobileScrolling: (state: boolean) => dispatch(setMobileScrolling(state)),
        setScrollY: (state: number) => dispatch(setScrollY(state)),
        setToolTipX: (state: number) => dispatch(setToolTipX(state)),
        setToolTipY: (state: number) => dispatch(setToolTipY(state)),
        setToolTipEnabled: (state: boolean) => dispatch(setToolTipEnabled(state)),
        setToolTipPost: (state: PostSearch | null) => dispatch(setToolTipPost(state)),
        setToolTipImg: (state: string) => dispatch(setToolTipImg(state)),
        setTagToolTipY: (state: number) => dispatch(setTagToolTipY(state)),
        setTagToolTipTag: (state: string | null) => dispatch(setTagToolTipTag(state)),
        setTagToolTipEnabled: (state: boolean) => dispatch(setTagToolTipEnabled(state))
    }
}

export default interactionSlice.reducer