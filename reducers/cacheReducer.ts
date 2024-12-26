import {createSlice} from "@reduxjs/toolkit"
import {createSelector} from "reselect"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {PostSearch, PostOrdered, Post, MiniTag, TagCount, UnverifiedPost} from "../types/Types"

const cacheSlice = createSlice({
    name: "cache",
    initialState: {
        emojis: {} as {[key: string]: string},
        posts: [] as PostSearch[] | PostOrdered[] | Post[],
        tags: [] as MiniTag[] | TagCount[],
        visiblePosts: [] as PostSearch[],
        unverifiedPosts: [] as UnverifiedPost[],
        uploadDropFiles: [] as File[],
    },
    reducers: {
        setEmojis: (state, action) => {state.emojis = action.payload},
        setPosts: (state, action) => {state.posts = action.payload},
        setTags: (state, action) => {state.tags = action.payload},
        setVisiblePosts: (state, action) => {state.visiblePosts = action.payload},
        setUnverifiedPosts: (state, action) => {state.unverifiedPosts = action.payload},
        setUploadDropFiles: (state, action) => {state.uploadDropFiles = action.payload}
    }    
})

const {setEmojis, setPosts, setTags, setVisiblePosts, setUnverifiedPosts, setUploadDropFiles} = cacheSlice.actions

export const useCacheSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        emojis: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.emojis)),
        posts: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.posts)),
        tags: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.tags)),
        visiblePosts: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.visiblePosts)),
        unverifiedPosts: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.unverifiedPosts)),
        uploadDropFiles: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.uploadDropFiles))
    }
}

export const useCacheActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEmojis: (state: {[key: string]: string}) => dispatch(setEmojis(state)),
        setPosts: (state: PostSearch[] | PostOrdered[] | Post[]) => {dispatch(setPosts(state))},
        setTags: (state: MiniTag[] | TagCount[]) => dispatch(setTags(state)),
        setVisiblePosts: (state: PostSearch[]) => dispatch(setVisiblePosts(state)),
        setUnverifiedPosts: (state: UnverifiedPost[]) => dispatch(setUnverifiedPosts(state)),
        setUploadDropFiles: (state: File[]) => dispatch(setUploadDropFiles(state))
    }
}

export default cacheSlice.reducer