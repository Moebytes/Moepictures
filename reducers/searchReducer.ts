import {createSlice} from "@reduxjs/toolkit"
import {createSelector} from "reselect"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {PostType, PostRating, PostStyle, PostSize, PostSort} from "../types/Types"

const searchSlice = createSlice({
    name: "search",
    initialState: {
        search: "",
        searchFlag: false,
        imageType: "all" as PostType,
        ratingType: "all" as PostRating,
        styleType: "all" as PostStyle,
        sizeType: "medium" as PostSize,
        sortType: "random" as PostSort,
        sortReverse: false,
        square: false,
        scroll: false,
        selectionMode: false,
        selectionItems: Array.from(new Set<string>()),
        selectionPosts: Object.fromEntries(new Map<string, any>()),
        pageMultiplier: 1,
        format: "jpg",
        autoSearch: false,
        saveSearch: false,
        noteMode: false,
        noteDrawingEnabled: false,
        imageExpand: false,
        showUpscaled: false,
        showChildren: false
    },
    reducers: {
        setSearch: (state, action) => {state.search = action.payload},
        setSearchFlag: (state, action) => {state.searchFlag = action.payload},
        setImageType: (state, action) => {state.imageType = action.payload},
        setRatingType: (state, action) => {state.ratingType = action.payload},
        setStyleType: (state, action) => {state.styleType = action.payload},
        setSizeType: (state, action) => {state.sizeType = action.payload},
        setSortType: (state, action) => {state.sortType = action.payload},
        setSortReverse: (state, action) => {state.sortReverse = action.payload},
        setSquare: (state, action) => {state.square = action.payload},
        setScroll: (state, action) => {state.scroll = action.payload},
        setSelectionMode: (state, action) => {state.selectionMode = action.payload},
        setSelectionItems: (state, action) => {state.selectionItems = Array.from(action.payload)},
        setSelectionPosts: (state, action) => {state.selectionPosts = Object.fromEntries(action.payload)},
        setPageMultiplier: (state, action) => {state.pageMultiplier = action.payload},
        setFormat: (state, action) => {state.format = action.payload},
        setAutoSearch: (state, action) => {state.autoSearch = action.payload},
        setSaveSearch: (state, action) => {state.saveSearch = action.payload},
        setNoteMode: (state, action) => {state.noteMode = action.payload},
        setNoteDrawingEnabled: (state, action) => {state.noteDrawingEnabled = action.payload},
        setImageExpand: (state, action) => {state.imageExpand = action.payload},
        setShowUpscaled: (state, action) => {state.showUpscaled = action.payload},
        setShowChildren: (state, action) => {state.showChildren = action.payload}
    }    
})

const {
    setSearch, setSearchFlag, setImageType, setRatingType, setStyleType, setSizeType,
    setSortType, setSortReverse, setSquare, setScroll, setSelectionMode, setPageMultiplier,
    setSelectionItems, setSelectionPosts, setFormat, setAutoSearch, setSaveSearch,
    setNoteMode, setNoteDrawingEnabled, setImageExpand, setShowUpscaled,
    setShowChildren
} = searchSlice.actions

export const useSearchSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        search: selector((state) => state.search.search),
        searchFlag: selector((state) => state.search.searchFlag),
        imageType: selector((state) => state.search.imageType),
        ratingType: selector((state) => state.search.ratingType),
        styleType: selector((state) => state.search.styleType),
        sizeType: selector((state) => state.search.sizeType),
        sortType: selector((state) => state.search.sortType),
        sortReverse: selector((state) => state.search.sortReverse),
        square: selector((state) => state.search.square),
        scroll: selector((state) => state.search.scroll),
        selectionMode: selector((state) => state.search.selectionMode),
        selectionItems: selector(createSelector((state: StoreState) => state.search, (search) => new Set<string>(search.selectionItems))),
        selectionPosts: selector(createSelector((state: StoreState) => state.search, (search) => new Map<string, any>(Object.entries(search.selectionPosts)))),
        pageMultiplier: selector((state) => state.search.pageMultiplier),
        format: selector((state) => state.search.format),
        autoSearch: selector((state) => state.search.autoSearch),
        saveSearch: selector((state) => state.search.saveSearch),
        noteMode: selector((state) => state.search.noteMode),
        noteDrawingEnabled: selector((state) => state.search.noteDrawingEnabled),
        imageExpand: selector((state) => state.search.imageExpand),
        showUpscaled: selector((state) => state.search.showUpscaled),
        showChildren: selector((state) => state.search.showChildren),
    }
}

export const useSearchActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setSearch: (state: any) => dispatch(setSearch(state)),
        setSearchFlag: (state: any) => dispatch(setSearchFlag(state)),
        setImageType: (state: any) => dispatch(setImageType(state)),
        setRatingType: (state: any) => dispatch(setRatingType(state)),
        setStyleType: (state: any) => dispatch(setStyleType(state)),
        setSizeType: (state: any) => dispatch(setSizeType(state)),
        setSortType: (state: any) => dispatch(setSortType(state)),
        setSortReverse: (state: any) => dispatch(setSortReverse(state)),
        setSquare: (state: any) => dispatch(setSquare(state)),
        setScroll: (state: any) => dispatch(setScroll(state)),
        setSelectionMode: (state: any) => dispatch(setSelectionMode(state)),
        setSelectionItems: (state: any) => dispatch(setSelectionItems(state)),
        setSelectionPosts: (state: any) => dispatch(setSelectionPosts(state)),
        setPageMultiplier: (state: any) => dispatch(setPageMultiplier(state)),
        setFormat: (state: any) => dispatch(setFormat(state)),
        setAutoSearch: (state: any) => dispatch(setAutoSearch(state)),
        setSaveSearch: (state: any) => dispatch(setSaveSearch(state)),
        setNoteMode: (state: any) => dispatch(setNoteMode(state)),
        setNoteDrawingEnabled: (state: any) => dispatch(setNoteDrawingEnabled(state)),
        setImageExpand: (state: any) => dispatch(setImageExpand(state)),
        setShowUpscaled: (state: any) => dispatch(setShowUpscaled(state)),
        setShowChildren: (state: any) => dispatch(setShowChildren(state))
    }
}

export default searchSlice.reducer