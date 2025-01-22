import {createSlice} from "@reduxjs/toolkit"
import {createSelector} from "reselect"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {PostSearch, PostOrdered, Post, PostHistory, MiniTag, TagCount, TagCategories, TagGroupCategory, UnverifiedPost, TagCategorySearch} from "../types/Types"

const cacheSlice = createSlice({
    name: "cache",
    initialState: {
        emojis: {} as {[key: string]: string},
        posts: [] as PostSearch[] | PostOrdered[] | Post[],
        tags: [] as MiniTag[] | TagCount[],
        visiblePosts: [] as PostSearch[],
        unverifiedPosts: [] as UnverifiedPost[],
        uploadDropFiles: [] as File[],
        bannerTags: [] as TagCount[],
        post: null as PostSearch | PostHistory | null,
        tagCategories: null as TagCategories | null,
        tagGroupCategories: [] as TagGroupCategory[],
        order: 1,
        related: [] as PostSearch[],
        artists: [] as TagCategorySearch[],
        characters: [] as TagCategorySearch[],
        series: [] as TagCategorySearch[]
    },
    reducers: {
        setEmojis: (state, action) => {state.emojis = action.payload},
        setPosts: (state, action) => {state.posts = action.payload},
        setTags: (state, action) => {state.tags = action.payload},
        setVisiblePosts: (state, action) => {state.visiblePosts = action.payload},
        setUnverifiedPosts: (state, action) => {state.unverifiedPosts = action.payload},
        setUploadDropFiles: (state, action) => {state.uploadDropFiles = action.payload},
        setBannerTags: (state, action) => {state.bannerTags = action.payload},
        setPost: (state, action) => {state.post = action.payload},
        setTagCategories: (state, action) => {state.tagCategories = action.payload},
        setTagGroupCategories: (state, action) => {state.tagGroupCategories = action.payload},
        setOrder: (state, action) => {state.order = action.payload},
        setRelated: (state, action) => {state.related = action.payload},
        setArtists: (state, action) => {state.artists = action.payload},
        setCharacters: (state, action) => {state.characters = action.payload},
        setSeries: (state, action) => {state.series = action.payload}
    }    
})

const {
    setEmojis, setPosts, setTags, setVisiblePosts, setUnverifiedPosts, setUploadDropFiles,
    setBannerTags, setPost, setTagCategories, setOrder, setRelated, setArtists, setCharacters,
    setSeries, setTagGroupCategories
} = cacheSlice.actions

export const useCacheSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        emojis: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.emojis)),
        posts: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.posts)),
        tags: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.tags)),
        visiblePosts: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.visiblePosts)),
        unverifiedPosts: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.unverifiedPosts)),
        uploadDropFiles: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.uploadDropFiles)),
        bannerTags: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.bannerTags)),
        post: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.post)),
        tagCategories: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.tagCategories)),
        tagGroupCategories: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.tagGroupCategories)),
        order: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.order)),
        related: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.related)),
        artists: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.artists)),
        characters: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.characters)),
        series: selector(createSelector((state: StoreState) => state.cache, (cache) => cache.series))
    }
}

export const useCacheActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEmojis: (state: {[key: string]: string}) => dispatch(setEmojis(state)),
        setPosts: (state: PostSearch[] | PostOrdered[] | Post[]) => dispatch(setPosts(state)),
        setTags: (state: MiniTag[] | TagCount[]) => dispatch(setTags(state)),
        setVisiblePosts: (state: PostSearch[]) => dispatch(setVisiblePosts(state)),
        setUnverifiedPosts: (state: UnverifiedPost[]) => dispatch(setUnverifiedPosts(state)),
        setUploadDropFiles: (state: File[]) => dispatch(setUploadDropFiles(state)),
        setBannerTags: (state: TagCount[]) => dispatch(setBannerTags(state)),
        setPost: (state: PostSearch | PostHistory | null) => dispatch(setPost(state)),
        setTagCategories: (state: TagCategories | null) => dispatch(setTagCategories(state)),
        setTagGroupCategories: (state: TagGroupCategory[]) => dispatch(setTagGroupCategories(state)),
        setOrder: (state: number) => dispatch(setOrder(state)),
        setRelated: (state: PostSearch[]) => dispatch(setRelated(state)),
        setArtists: (state: TagCategorySearch[]) => dispatch(setArtists(state)),
        setCharacters: (state: TagCategorySearch[]) => dispatch(setCharacters(state)),
        setSeries: (state: TagCategorySearch[]) => dispatch(setSeries(state))
    }
}

export default cacheSlice.reducer