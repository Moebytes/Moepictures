/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const getQueryPage = () => {
    if (typeof window === "undefined") return 1
    const pageParam = new URLSearchParams(location.search).get("page")
    return pageParam ? Number(pageParam) : 1
}

const initialPage = getQueryPage()

const pageSlice = createSlice({
    name: "page",
    initialState: {
        page: initialPage,
        commentsPage: initialPage,
        notesPage: initialPage,
        artistsPage: initialPage,
        charactersPage: initialPage,
        seriesPage: initialPage,
        tagsPage: initialPage,
        forumPage: initialPage,
        forumPostsPage: initialPage,
        threadPage: initialPage,
        mailPage: initialPage,
        historyPage: initialPage,
        modPage: initialPage,
        groupsPage: initialPage,
        messagePage: initialPage,
        relatedPage: initialPage,
        readerPage: initialPage
    },
    reducers: {
        setPage: (state, action) => {state.page = action.payload},
        setCommentsPage: (state, action) => {state.commentsPage = action.payload},
        setNotesPage: (state, action) => {state.notesPage = action.payload},
        setArtistsPage: (state, action) => {state.artistsPage = action.payload},
        setCharactersPage: (state, action) => {state.charactersPage = action.payload},
        setSeriesPage: (state, action) => {state.seriesPage = action.payload},
        setTagsPage: (state, action) => {state.tagsPage = action.payload},
        setForumPage: (state, action) => {state.forumPage = action.payload},
        setForumPostsPage: (state, action) => {state.forumPostsPage = action.payload},
        setThreadPage: (state, action) => {state.threadPage = action.payload},
        setMailPage: (state, action) => {state.mailPage = action.payload},
        setHistoryPage: (state, action) => {state.historyPage = action.payload},
        setModPage: (state, action) => {state.modPage = action.payload},
        setGroupsPage: (state, action) => {state.groupsPage = action.payload},
        setMessagePage: (state, action) => {state.messagePage = action.payload},
        setRelatedPage: (state, action) => {state.relatedPage = action.payload},
        setReaderPage: (state, action) => {state.readerPage = action.payload}
    }    
})

const {
    setPage, setCommentsPage, setNotesPage, setArtistsPage, 
    setCharactersPage, setSeriesPage, setTagsPage, setForumPage, 
    setThreadPage, setMailPage, setHistoryPage, setModPage, 
    setGroupsPage, setMessagePage, setRelatedPage, setForumPostsPage,
    setReaderPage
} = pageSlice.actions

export const usePageSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        page: selector((state) => state.page.page),
        commentsPage: selector((state) => state.page.commentsPage),
        notesPage: selector((state) => state.page.notesPage),
        artistsPage: selector((state) => state.page.artistsPage),
        charactersPage: selector((state) => state.page.charactersPage),
        seriesPage: selector((state) => state.page.seriesPage),
        tagsPage: selector((state) => state.page.tagsPage),
        forumPage: selector((state) => state.page.forumPage),
        forumPostsPage: selector((state) => state.page.forumPostsPage),
        threadPage: selector((state) => state.page.threadPage),
        mailPage: selector((state) => state.page.mailPage),
        historyPage: selector((state) => state.page.historyPage),
        modPage: selector((state) => state.page.modPage),
        groupsPage: selector((state) => state.page.groupsPage),
        messagePage: selector((state) => state.page.messagePage),
        relatedPage: selector((state) => state.page.relatedPage),
        readerPage: selector((state) => state.page.readerPage)
    }
}

export const usePageActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setPage: (state: number) => dispatch(setPage(state)),
        setCommentsPage: (state: number) => dispatch(setCommentsPage(state)),
        setNotesPage: (state: number) => dispatch(setNotesPage(state)),
        setArtistsPage: (state: number) => dispatch(setArtistsPage(state)),
        setCharactersPage: (state: number) => dispatch(setCharactersPage(state)),
        setSeriesPage: (state: number) => dispatch(setSeriesPage(state)),
        setTagsPage: (state: number) => dispatch(setTagsPage(state)),
        setForumPage: (state: number) => dispatch(setForumPage(state)),
        setForumPostsPage: (state: number) => dispatch(setForumPostsPage(state)),
        setThreadPage: (state: number) => dispatch(setThreadPage(state)),
        setMailPage: (state: number) => dispatch(setMailPage(state)),
        setHistoryPage: (state: number) => dispatch(setHistoryPage(state)),
        setModPage: (state: number) => dispatch(setModPage(state)),
        setGroupsPage: (state: number) => dispatch(setGroupsPage(state)),
        setMessagePage: (state: number) => dispatch(setMessagePage(state)),
        setRelatedPage: (state: number) => dispatch(setRelatedPage(state)),
        setReaderPage: (state: number) => dispatch(setReaderPage(state))
    }
}

export default pageSlice.reducer