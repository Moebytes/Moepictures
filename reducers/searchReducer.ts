import {createSlice} from "@reduxjs/toolkit"
import {createSelector} from "reselect"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {PostType, PostRating, PostStyle, PostSize, PostSort, PostSearch, ImageFormat} from "../types/Types"

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
        selectionPosts: Object.fromEntries(new Map<string, PostSearch>()),
        pageMultiplier: 1,
        format: "jpg" as ImageFormat,
        autoSearch: false,
        saveSearch: false,
        favSearch: false,
        noteMode: false,
        noteDrawingEnabled: false,
        showTranscript: false,
        imageExpand: false,
        showUpscaled: false,
        showChildren: false,
        readerThumbnails: true,
        readerZoom: 100,
        readerInvert: false,
        readerHorizontal: false
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
        setFavSearch: (state, action) => {state.favSearch = action.payload},
        setNoteMode: (state, action) => {state.noteMode = action.payload},
        setNoteDrawingEnabled: (state, action) => {state.noteDrawingEnabled = action.payload},
        setShowTranscript: (state, action) => {state.showTranscript = action.payload},
        setImageExpand: (state, action) => {state.imageExpand = action.payload},
        setShowUpscaled: (state, action) => {state.showUpscaled = action.payload},
        setShowChildren: (state, action) => {state.showChildren = action.payload},
        setReaderThumbnails: (state, action) => {state.readerThumbnails = action.payload},
        setReaderHorizontal: (state, action) => {state.readerHorizontal = action.payload},
        setReaderInvert: (state, action) => {state.readerInvert = action.payload},
        setReaderZoom: (state, action) => {state.readerZoom = action.payload}
    }    
})

const {
    setSearch, setSearchFlag, setImageType, setRatingType, setStyleType, setSizeType,
    setSortType, setSortReverse, setSquare, setScroll, setSelectionMode, setPageMultiplier,
    setSelectionItems, setSelectionPosts, setFormat, setAutoSearch, setSaveSearch,
    setNoteMode, setNoteDrawingEnabled, setImageExpand, setShowUpscaled, setFavSearch,
    setShowChildren, setReaderHorizontal, setReaderInvert, setReaderThumbnails, setReaderZoom,
    setShowTranscript
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
        selectionPosts: selector(createSelector((state: StoreState) => state.search, (search) => new Map<string, PostSearch>(Object.entries(search.selectionPosts)))),
        pageMultiplier: selector((state) => state.search.pageMultiplier),
        format: selector((state) => state.search.format),
        autoSearch: selector((state) => state.search.autoSearch),
        saveSearch: selector((state) => state.search.saveSearch),
        favSearch: selector((state) => state.search.favSearch),
        noteMode: selector((state) => state.search.noteMode),
        noteDrawingEnabled: selector((state) => state.search.noteDrawingEnabled),
        imageExpand: selector((state) => state.search.imageExpand),
        showUpscaled: selector((state) => state.search.showUpscaled),
        showChildren: selector((state) => state.search.showChildren),
        readerHorizontal: selector((state) => state.search.readerHorizontal),
        readerThumbnails: selector((state) => state.search.readerThumbnails),
        readerInvert: selector((state) => state.search.readerInvert),
        readerZoom: selector((state) => state.search.readerZoom),
        showTranscript: selector((state) => state.search.showTranscript)
    }
}

export const useSearchActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setSearch: (state: string) => dispatch(setSearch(state)),
        setSearchFlag: (state: boolean) => dispatch(setSearchFlag(state)),
        setImageType: (state: PostType) => dispatch(setImageType(state)),
        setRatingType: (state: PostRating) => dispatch(setRatingType(state)),
        setStyleType: (state: PostStyle) => dispatch(setStyleType(state)),
        setSizeType: (state: PostSize) => dispatch(setSizeType(state)),
        setSortType: (state: PostSort) => dispatch(setSortType(state)),
        setSortReverse: (state: boolean) => dispatch(setSortReverse(state)),
        setSquare: (state: boolean) => dispatch(setSquare(state)),
        setScroll: (state: boolean) => dispatch(setScroll(state)),
        setSelectionMode: (state: boolean) => dispatch(setSelectionMode(state)),
        setSelectionItems: (state: Set<string>) => dispatch(setSelectionItems(state)),
        setSelectionPosts: (state: Map<string, PostSearch>) => dispatch(setSelectionPosts(state)),
        setPageMultiplier: (state: number) => dispatch(setPageMultiplier(state)),
        setFormat: (state: ImageFormat) => dispatch(setFormat(state)),
        setAutoSearch: (state: boolean) => dispatch(setAutoSearch(state)),
        setSaveSearch: (state: boolean) => dispatch(setSaveSearch(state)),
        setFavSearch: (state: boolean) => dispatch(setFavSearch(state)),
        setNoteMode: (state: boolean) => dispatch(setNoteMode(state)),
        setNoteDrawingEnabled: (state: boolean) => dispatch(setNoteDrawingEnabled(state)),
        setImageExpand: (state: boolean) => dispatch(setImageExpand(state)),
        setShowUpscaled: (state: boolean) => dispatch(setShowUpscaled(state)),
        setShowChildren: (state: boolean) => dispatch(setShowChildren(state)),
        setReaderHorizontal: (state: boolean) => dispatch(setReaderHorizontal(state)),
        setReaderThumbnails: (state: boolean) => dispatch(setReaderThumbnails(state)),
        setReaderInvert: (state: boolean) => dispatch(setReaderInvert(state)),
        setReaderZoom: (state: number) => dispatch(setReaderZoom(state)),
        setShowTranscript: (state: boolean) => dispatch(setShowTranscript(state))
    }
}

export default searchSlice.reducer