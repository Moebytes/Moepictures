import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {GroupPosts, Favgroup, Banner} from "../types/Types"

const activeSlice = createSlice({
    name: "active",
    initialState: {
        activeDropdown: "none",
        filterDropActive: false,
        showMusicFilters: false,
        activeGroup: null as GroupPosts | null,
        activeFavgroup: null as Favgroup | null,
        headerText: "",
        sidebarText: "",
        quoteText: "",
        helpTab: "help",
        modState: "posts",
        actionBanner: "",
        newsBanner: null as Banner | null
    },
    reducers: {
        setActiveDropdown: (state, action) => {state.activeDropdown = action.payload},
        setFilterDropActive: (state, action) => {state.filterDropActive = action.payload},
        setShowMusicFilters: (state, action) => {state.showMusicFilters = action.payload},
        setActiveGroup: (state, action) => {state.activeGroup = action.payload},
        setActiveFavgroup: (state, action) => {state.activeFavgroup = action.payload},
        setHeaderText: (state, action) => {state.headerText = action.payload},
        setSidebarText: (state, action) => {state.sidebarText = action.payload},
        setQuoteText: (state, action) => {state.quoteText = action.payload},
        setHelpTab: (state, action) => {state.helpTab = action.payload},
        setModState: (state, action) => {state.modState = action.payload},
        setActionBanner: (state, action) => {state.actionBanner = action.payload},
        setNewsBanner: (state, action) => {state.newsBanner = action.payload}
    }    
})

const {
    setActiveDropdown, setFilterDropActive, setActiveGroup, setActiveFavgroup,
    setHeaderText, setSidebarText, setQuoteText, setHelpTab, setModState,
    setActionBanner, setNewsBanner, setShowMusicFilters
} = activeSlice.actions

export const useActiveSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        activeDropdown: selector((state) => state.active.activeDropdown),
        filterDropActive: selector((state) => state.active.filterDropActive),
        showMusicFilters: selector((state) => state.active.showMusicFilters),
        activeGroup: selector((state) => state.active.activeGroup),
        activeFavgroup: selector((state) => state.active.activeFavgroup),
        headerText: selector((state) => state.active.headerText),
        sidebarText: selector((state) => state.active.sidebarText),
        quoteText: selector((state) => state.active.quoteText),
        helpTab: selector((state) => state.active.helpTab),
        modState: selector((state) => state.active.modState),
        actionBanner: selector((state) => state.active.actionBanner),
        newsBanner: selector((state) => state.active.newsBanner)
    }
}

export const useActiveActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setActiveDropdown: (state: string) => dispatch(setActiveDropdown(state)),
        setFilterDropActive: (state: boolean) => dispatch(setFilterDropActive(state)),
        setShowMusicFilters: (state: boolean) => dispatch(setShowMusicFilters(state)),
        setActiveGroup: (state: GroupPosts | null) => dispatch(setActiveGroup(state)),
        setActiveFavgroup: (state: Favgroup | null) => dispatch(setActiveFavgroup(state)),
        setHeaderText: (state: string) => dispatch(setHeaderText(state)),
        setSidebarText: (state: string) => dispatch(setSidebarText(state)),
        setQuoteText: (state: string) => dispatch(setQuoteText(state)),
        setHelpTab: (state: string) => dispatch(setHelpTab(state)),
        setModState: (state: string) => dispatch(setModState(state)),
        setActionBanner: (state: string | null) => dispatch(setActionBanner(state)),
        setNewsBanner: (state: Banner | null) => dispatch(setNewsBanner(state))
    }
}

export default activeSlice.reducer