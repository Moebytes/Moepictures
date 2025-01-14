import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {Post, Note} from "../types/Types"

const flagSlice = createSlice({
    name: "flag",
    initialState: {
        randomFlag: false,
        imageSearchFlag: null as Post[] | null,
        headerFlag: false,
        commentSearchFlag: null as string | null,
        noteSearchFlag: null as string | null,
        threadSearchFlag: null as string | null,
        messageSearchFlag: null as string | null,
        groupSearchFlag: null as string | null,
        tagSearchFlag: null as string | null,
        pageFlag: null as number | null,
        downloadIDs: [] as string[],
        postAmount: 0,
        downloadFlag: false,
        reloadPostFlag: false,
        updateUserFlag: false,
        commentID: 0,
        commentJumpFlag: false,
        redirect: null as string | null,
        postFlag: false,
        groupFlag: false,
        messageFlag: false,
        tagFlag: false as string | boolean,
        pasteNoteFlag: null as Note[] | null,
        historyFlag: false
    },
    reducers: {
        setRandomFlag: (state, action) => {state.randomFlag = action.payload},
        setImageSearchFlag: (state, action) => {state.imageSearchFlag = action.payload},
        setHeaderFlag: (state, action) => {state.headerFlag = action.payload},
        setCommentSearchFlag: (state, action) => {state.commentSearchFlag = action.payload},
        setNoteSearchFlag: (state, action) => {state.noteSearchFlag = action.payload},
        setThreadSearchFlag: (state, action) => {state.threadSearchFlag = action.payload},
        setMessageSearchFlag: (state, action) => {state.messageSearchFlag = action.payload},
        setGroupSearchFlag: (state, action) => {state.groupSearchFlag = action.payload},
        setTagSearchFlag: (state, action) => {state.tagSearchFlag = action.payload},
        setPageFlag: (state, action) => {state.pageFlag = action.payload},
        setDownloadIDs: (state, action) => {state.downloadIDs = action.payload},
        setPostAmount: (state, action) => {state.postAmount = action.payload},
        setDownloadFlag: (state, action) => {state.downloadFlag = action.payload},
        setReloadPostFlag: (state, action) => {state.reloadPostFlag = action.payload},
        setUpdateUserFlag: (state, action) => {state.updateUserFlag = action.payload},
        setCommentID: (state, action) => {state.commentID = action.payload},
        setCommentJumpFlag: (state, action) => {state.commentJumpFlag = action.payload},
        setRedirect: (state, action) => {state.redirect = action.payload},
        setPostFlag: (state, action) => {state.postFlag = action.payload},
        setGroupFlag: (state, action) => {state.groupFlag = action.payload},
        setMessageFlag: (state, action) => {state.messageFlag = action.payload},
        setTagFlag: (state, action) => {state.tagFlag = action.payload},
        setPasteNoteFlag: (state, action) => {state.pasteNoteFlag = action.payload},
        setHistoryFlag: (state, action) => {state.historyFlag = action.payload}
    }
})

const {
    setRandomFlag, setImageSearchFlag, setHeaderFlag, setCommentSearchFlag,
    setPageFlag, setDownloadIDs, setDownloadFlag, setReloadPostFlag,
    setUpdateUserFlag, setCommentID, setCommentJumpFlag, setPostFlag,
    setGroupFlag, setMessageFlag, setTagFlag, setPostAmount, setRedirect,
    setGroupSearchFlag, setThreadSearchFlag, setNoteSearchFlag, setMessageSearchFlag,
    setPasteNoteFlag, setHistoryFlag, setTagSearchFlag
} = flagSlice.actions

export const useFlagSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        randomFlag: selector((state) => state.flag.randomFlag),
        imageSearchFlag: selector((state) => state.flag.imageSearchFlag),
        headerFlag: selector((state) => state.flag.headerFlag),
        commentSearchFlag: selector((state) => state.flag.commentSearchFlag),
        noteSearchFlag: selector((state) => state.flag.noteSearchFlag),
        threadSearchFlag: selector((state) => state.flag.threadSearchFlag),
        messageSearchFlag: selector((state) => state.flag.messageSearchFlag),
        groupSearchFlag: selector((state) => state.flag.groupSearchFlag),
        tagSearchFlag: selector((state) => state.flag.tagSearchFlag),
        pageFlag: selector((state) => state.flag.pageFlag),
        downloadIDs: selector((state) => state.flag.downloadIDs),
        postAmount: selector((state) => state.flag.postAmount),
        downloadFlag: selector((state) => state.flag.downloadFlag),
        reloadPostFlag: selector((state) => state.flag.reloadPostFlag),
        updateUserFlag: selector((state) => state.flag.updateUserFlag),
        commentID: selector((state) => state.flag.commentID),
        commentJumpFlag: selector((state) => state.flag.commentJumpFlag),
        redirect: selector((state) => state.flag.redirect),
        postFlag: selector((state) => state.flag.postFlag),
        groupFlag: selector((state) => state.flag.groupFlag),
        messageFlag: selector((state) => state.flag.messageFlag),
        tagFlag: selector((state) => state.flag.tagFlag),
        pasteNoteFlag: selector((state) => state.flag.pasteNoteFlag),
        historyFlag: selector((state) => state.flag.historyFlag)
    }
}

export const useFlagActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setRandomFlag: (state: boolean) => dispatch(setRandomFlag(state)),
        setImageSearchFlag: (state: Post[] | null) => dispatch(setImageSearchFlag(state)),
        setHeaderFlag: (state: boolean) => dispatch(setHeaderFlag(state)),
        setCommentSearchFlag: (state: string | null) => dispatch(setCommentSearchFlag(state)),
        setNoteSearchFlag: (state: string | null) => dispatch(setNoteSearchFlag(state)),
        setThreadSearchFlag: (state: string | null) => dispatch(setThreadSearchFlag(state)),
        setMessageSearchFlag: (state: string | null) => dispatch(setMessageSearchFlag(state)),
        setGroupSearchFlag: (state: string | null) => dispatch(setGroupSearchFlag(state)),
        setTagSearchFlag: (state: string | null) => dispatch(setTagSearchFlag(state)),
        setPageFlag: (state: number | null) => dispatch(setPageFlag(state)),
        setDownloadIDs: (state: string[]) => dispatch(setDownloadIDs(state)),
        setPostAmount: (state: number) => dispatch(setPostAmount(state)),
        setDownloadFlag: (state: boolean) => dispatch(setDownloadFlag(state)),
        setReloadPostFlag: (state: boolean) => dispatch(setReloadPostFlag(state)),
        setUpdateUserFlag: (state: boolean) => dispatch(setUpdateUserFlag(state)),
        setCommentID: (state: number) => dispatch(setCommentID(state)),
        setCommentJumpFlag: (state: boolean) => dispatch(setCommentJumpFlag(state)),
        setRedirect: (state: string | null) => dispatch(setRedirect(state)),
        setPostFlag: (state: boolean) => dispatch(setPostFlag(state)),
        setGroupFlag: (state: boolean) => dispatch(setGroupFlag(state)),
        setMessageFlag: (state: boolean) => dispatch(setMessageFlag(state)),
        setTagFlag: (state: string | boolean) => dispatch(setTagFlag(state)),
        setPasteNoteFlag: (state: Note[] | null) => dispatch(setPasteNoteFlag(state)),
        setHistoryFlag: (state: boolean) => dispatch(setHistoryFlag(state)),
    }    
}

export default flagSlice.reducer