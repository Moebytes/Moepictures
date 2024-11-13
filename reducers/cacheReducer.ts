import {createSlice} from "@reduxjs/toolkit"
import {createSelector} from "reselect"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const cacheSlice = createSlice({
    name: "cache",
    initialState: {
        emojis: [] as any[],
        posts: [] as any[],
        tags: [] as any[],
        visiblePosts: [] as any[],
        unverifiedPosts: [] as any[],
        uploadDropFiles: [] as any[],
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
        emojis: selector((state) => state.cache.emojis),
        posts: selector((state) => state.cache.posts),
        tags: selector((state) => state.cache.tags),
        visiblePosts: selector((state) => state.cache.visiblePosts),
        unverifiedPosts: selector((state) => state.cache.unverifiedPosts),
        uploadDropFiles: selector((state) => state.cache.uploadDropFiles)
    }
}

export const useCacheActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEmojis: (state: any) => dispatch(setEmojis(state)),
        setPosts: (state: any) => {dispatch(setPosts(state))},
        setTags: (state: any) => dispatch(setTags(state)),
        setVisiblePosts: (state: any) => dispatch(setVisiblePosts(state)),
        setUnverifiedPosts: (state: any) => dispatch(setUnverifiedPosts(state)),
        setUploadDropFiles: (state: any) => dispatch(setUploadDropFiles(state))
    }
}

export default cacheSlice.reducer