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
        tagTooltipY: 0,
        tagTooltipTag: null as string | null,
        tagTooltipEnabled: false,
        postTooltipX: 0,
        postTooltipY: 0,
        postTooltipEnabled: false,
        postTooltipID: null as string | null,
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
        setTagToolTipY: (state, action) => {state.tagTooltipY = action.payload},
        setTagToolTipTag: (state, action) => {state.tagTooltipTag = action.payload},
        setTagToolTipEnabled: (state, action) => {state.tagTooltipEnabled = action.payload},
        setPostToolTipX: (state, action) => {state.postTooltipX = action.payload},
        setPostToolTipY: (state, action) => {state.postTooltipY = action.payload},
        setPostTooltipEnabled: (state, action) => {state.postTooltipEnabled = action.payload},
        setPostTooltipID: (state, action) => {state.postTooltipID = action.payload},
    }    
})

const {
    setEnableDrag, setSidebarHover, setMobileScrolling, setScrollY,
    setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, 
    setTagToolTipTag, setTagToolTipEnabled, setTagToolTipY,
    setPostToolTipX, setPostToolTipY, setPostTooltipEnabled,
    setPostTooltipID
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
        tagTooltipY: selector((state) => state.interaction.tagTooltipY),
        tagTooltipTag: selector((state) => state.interaction.tagTooltipTag),
        tagTooltipEnabled: selector((state) => state.interaction.tagTooltipEnabled),
        postTooltipX: selector((state) => state.interaction.postTooltipX),
        postTooltipY: selector((state) => state.interaction.postTooltipY),
        postTooltipEnabled: selector((state) => state.interaction.postTooltipEnabled),
        postTooltipID: selector((state) => state.interaction.postTooltipID)
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
        setTagToolTipY: (state: number) => dispatch(setTagToolTipY(state)),
        setTagToolTipTag: (state: string | null) => dispatch(setTagToolTipTag(state)),
        setTagToolTipEnabled: (state: boolean) => dispatch(setTagToolTipEnabled(state)),
        setPostToolTipX: (state: number) => dispatch(setPostToolTipX(state)),
        setPostToolTipY: (state: number) => dispatch(setPostToolTipY(state)),
        setPostTooltipEnabled: (state: boolean) => dispatch(setPostTooltipEnabled(state)),
        setPostTooltipID: (state: string | null) => dispatch(setPostTooltipID(state))
    }
}

export default interactionSlice.reducer