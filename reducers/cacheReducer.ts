/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {createSlice} from "@reduxjs/toolkit"
import {createSelector} from "reselect"
import {useSelector, useDispatch} from "react-redux"
import {useMemo} from "react"
import type {StoreState, StoreDispatch} from "../store"
import {PostSearch, PostOrdered, Post, PostHistory, MiniTag, TagCount, TagCategories, TagGroupCategory, UnverifiedPost, TagCategorySearch} from "../types/Types"

interface LoadedFile {
    name: string, 
    type: string, 
    size: number, 
    lastModified: number, 
    content: string
}
const serializeFile = async (file: File) => {
    const readFileAsBase64 = (file: File) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })
    }
    return {
        name: file.name, type: file.type, 
        size: file.size, lastModified: file.lastModified, 
        content: await readFileAsBase64(file)
    } as LoadedFile
}

const unserializeFile = (obj: {name: string, type: string, size: number, lastModified: number, content: string}) => {
    const byteString = atob(obj.content.split(",")[1])
    const byteArray = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i)
    }
    const contentBlob = new Blob([byteArray], {type: obj.type})
    return new File([contentBlob], obj.name, {type: obj.type, lastModified: obj.lastModified})
}

const cacheSlice = createSlice({
    name: "cache",
    initialState: {
        emojis: {} as {[key: string]: string},
        posts: [] as PostSearch[] | PostOrdered[] | Post[],
        navigationPosts: [] as PostSearch[] | PostOrdered[] | Post[],
        tags: [] as MiniTag[] | TagCount[],
        sortedTags: [] as TagCount[],
        visiblePosts: [] as PostSearch[],
        unverifiedPosts: [] as UnverifiedPost[],
        uploadDropFiles: [] as {name: string, type: string, size: number, lastModified: number, content: string}[],
        bannerTags: [] as TagCount[],
        post: null as PostSearch | PostHistory | null,
        tagCategories: null as TagCategories | null,
        tagGroupCategories: [] as TagGroupCategory[],
        order: 1,
        artists: [] as TagCategorySearch[],
        characters: [] as TagCategorySearch[],
        series: [] as TagCategorySearch[]
    },
    reducers: {
        setEmojis: (state, action) => {state.emojis = action.payload},
        setPosts: (state, action) => {state.posts = action.payload},
        setNavigationPosts: (state, action) => {state.navigationPosts = action.payload},
        setTags: (state, action) => {state.tags = action.payload},
        setSortedTags: (state, action) => {state.sortedTags = action.payload},
        setVisiblePosts: (state, action) => {state.visiblePosts = action.payload},
        setUnverifiedPosts: (state, action) => {state.unverifiedPosts = action.payload},
        setUploadDropFiles: (state, action) => {state.uploadDropFiles = action.payload},
        setBannerTags: (state, action) => {state.bannerTags = action.payload},
        setPost: (state, action) => {state.post = action.payload},
        setTagCategories: (state, action) => {state.tagCategories = action.payload},
        setTagGroupCategories: (state, action) => {state.tagGroupCategories = action.payload},
        setOrder: (state, action) => {state.order = action.payload},
        setArtists: (state, action) => {state.artists = action.payload},
        setCharacters: (state, action) => {state.characters = action.payload},
        setSeries: (state, action) => {state.series = action.payload}
    }    
})

const {
    setEmojis, setPosts, setTags, setVisiblePosts, setUnverifiedPosts, setUploadDropFiles,
    setBannerTags, setPost, setTagCategories, setOrder, setArtists, setCharacters,
    setSeries, setTagGroupCategories, setNavigationPosts, setSortedTags
} = cacheSlice.actions

const selectEmojis = createSelector((state: StoreState) => state.cache, (cache) => cache.emojis)
const selectPosts = createSelector((state: StoreState) => state.cache, (cache) => cache.posts)
const selectNavigationPosts = createSelector((state: StoreState) => state.cache, (cache) => cache.navigationPosts)
const selectTags = createSelector((state: StoreState) => state.cache, (cache) => cache.tags)
const selectSortedTags = createSelector((state: StoreState) => state.cache, (cache) => cache.sortedTags)
const selectVisiblePosts = createSelector((state: StoreState) => state.cache, (cache) => cache.visiblePosts)
const selectUnverifiedPosts = createSelector((state: StoreState) => state.cache, (cache) => cache.unverifiedPosts)
const selectUploadDropFiles = createSelector((state: StoreState) => state.cache, (cache) => cache.uploadDropFiles)
const selectBannerTags = createSelector((state: StoreState) => state.cache, (cache) => cache.bannerTags)
const selectPost = createSelector((state: StoreState) => state.cache, (cache) => cache.post)
const selectTagCategories = createSelector((state: StoreState) => state.cache, (cache) => cache.tagCategories)
const selectTagGroupCategories = createSelector((state: StoreState) => state.cache, (cache) => cache.tagGroupCategories)
const selectOrder = createSelector((state: StoreState) => state.cache, (cache) => cache.order)
const selectArtists = createSelector((state: StoreState) => state.cache, (cache) => cache.artists)
const selectCharacters = createSelector((state: StoreState) => state.cache, (cache) => cache.characters)
const selectSeries = createSelector((state: StoreState) => state.cache, (cache) => cache.series)

export const useCacheSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    const uploadDropFilesSelect = selector(selectUploadDropFiles)

    const uploadDropFiles = useMemo(() => {
        return uploadDropFilesSelect.map(unserializeFile)
    }, [uploadDropFilesSelect])

    return {
        emojis: selector(selectEmojis),
        posts: selector(selectPosts),
        navigationPosts: selector(selectNavigationPosts),
        tags: selector(selectTags),
        sortedTags: selector(selectSortedTags),
        visiblePosts: selector(selectVisiblePosts),
        unverifiedPosts: selector(selectUnverifiedPosts),
        bannerTags: selector(selectBannerTags),
        post: selector(selectPost),
        tagCategories: selector(selectTagCategories),
        tagGroupCategories: selector(selectTagGroupCategories),
        order: selector(selectOrder),
        artists: selector(selectArtists),
        characters: selector(selectCharacters),
        series: selector(selectSeries),
        uploadDropFiles
    }
}

export const useCacheActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEmojis: (state: {[key: string]: string}) => dispatch(setEmojis(state)),
        setPosts: (state: PostSearch[] | PostOrdered[] | Post[]) => dispatch(setPosts(state)),
        setNavigationPosts: (state: PostSearch[] | PostOrdered[] | Post[]) => dispatch(setNavigationPosts(state)),
        setTags: (state: MiniTag[] | TagCount[]) => dispatch(setTags(state)),
        setSortedTags: (state: TagCount[]) => dispatch(setSortedTags(state)),
        setVisiblePosts: (state: PostSearch[]) => dispatch(setVisiblePosts(state)),
        setUnverifiedPosts: (state: UnverifiedPost[]) => dispatch(setUnverifiedPosts(state)),
        setUploadDropFiles: (state: LoadedFile[]) => dispatch(setUploadDropFiles(state)),
        setBannerTags: (state: TagCount[]) => dispatch(setBannerTags(state)),
        setPost: (state: PostSearch | PostHistory | null) => dispatch(setPost(state)),
        setTagCategories: (state: TagCategories | null) => dispatch(setTagCategories(state)),
        setTagGroupCategories: (state: TagGroupCategory[]) => dispatch(setTagGroupCategories(state)),
        setOrder: (state: number) => dispatch(setOrder(state)),
        setArtists: (state: TagCategorySearch[]) => dispatch(setArtists(state)),
        setCharacters: (state: TagCategorySearch[]) => dispatch(setCharacters(state)),
        setSeries: (state: TagCategorySearch[]) => dispatch(setSeries(state)),
        serializeFile: (file: File) => serializeFile(file)
    }
}

export default cacheSlice.reducer