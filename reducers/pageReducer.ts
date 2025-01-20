import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const pageSlice = createSlice({
    name: "page",
    initialState: {
        page: 1,
        commentsPage: 1,
        notesPage: 1,
        artistsPage: 1,
        charactersPage: 1,
        seriesPage: 1,
        tagsPage: 1,
        forumPage: 1,
        forumPostsPage: 1,
        threadPage: 1,
        mailPage: 1,
        historyPage: 1,
        modPage: 1,
        groupsPage: 1,
        messagePage: 1,
        relatedPage: 1
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
        setRelatedPage: (state, action) => {state.relatedPage = action.payload}
    }    
})

const {
    setPage, setCommentsPage, setNotesPage, setArtistsPage, 
    setCharactersPage, setSeriesPage, setTagsPage, setForumPage, 
    setThreadPage, setMailPage, setHistoryPage, setModPage, 
    setGroupsPage, setMessagePage, setRelatedPage, setForumPostsPage
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
        relatedPage: selector((state) => state.page.relatedPage)
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
        setRelatedPage: (state: number) => dispatch(setRelatedPage(state))
    }
}

export default pageSlice.reducer