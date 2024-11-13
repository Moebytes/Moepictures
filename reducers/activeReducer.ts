import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const activeSlice = createSlice({
    name: "active",
    initialState: {
        activeDropdown: "none",
        filterDropActive: false,
        activeGroup: null as unknown as string,
        activeFavgroup: null as any,
        headerText: "",
        sidebarText: "",
        quoteText: "",
        helpTab: "help",
        modState: "posts",
        actionBanner: null as string | null,
        newsBanner: null as any
    },
    reducers: {
        setActiveDropdown: (state, action) => {state.activeDropdown = action.payload},
        setFilterDropActive: (state, action) => {state.filterDropActive = action.payload},
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
    setActionBanner, setNewsBanner
} = activeSlice.actions

export const useActiveSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        activeDropdown: selector((state) => state.active.activeDropdown),
        filterDropActive: selector((state) => state.active.filterDropActive),
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
        setActiveDropdown: (state: any) => dispatch(setActiveDropdown(state)),
        setFilterDropActive: (state: any) => dispatch(setFilterDropActive(state)),
        setActiveGroup: (state: any) => dispatch(setActiveGroup(state)),
        setActiveFavgroup: (state: any) => dispatch(setActiveFavgroup(state)),
        setHeaderText: (state: any) => dispatch(setHeaderText(state)),
        setSidebarText: (state: any) => dispatch(setSidebarText(state)),
        setQuoteText: (state: any) => dispatch(setQuoteText(state)),
        setHelpTab: (state: any) => dispatch(setHelpTab(state)),
        setModState: (state: any) => dispatch(setModState(state)),
        setActionBanner: (state: any) => dispatch(setActionBanner(state)),
        setNewsBanner: (state: any) => dispatch(setNewsBanner(state))
    }
}

export default activeSlice.reducer