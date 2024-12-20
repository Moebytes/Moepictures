import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const flagSlice = createSlice({
    name: "flag",
    initialState: {
        randomFlag: false,
        imageSearchFlag: false,
        headerFlag: false,
        commentSearchFlag: null as string | null,
        noteSearchFlag: null as string | null,
        threadSearchFlag: null as string | null,
        groupSearchFlag: null as string | null,
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
        tagFlag: false
    },
    reducers: {
        setRandomFlag: (state, action) => {state.randomFlag = action.payload},
        setImageSearchFlag: (state, action) => {state.imageSearchFlag = action.payload},
        setHeaderFlag: (state, action) => {state.headerFlag = action.payload},
        setCommentSearchFlag: (state, action) => {state.commentSearchFlag = action.payload},
        setNoteSearchFlag: (state, action) => {state.noteSearchFlag = action.payload},
        setThreadSearchFlag: (state, action) => {state.threadSearchFlag = action.payload},
        setGroupSearchFlag: (state, action) => {state.groupSearchFlag = action.payload},
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
        setTagFlag: (state, action) => {state.tagFlag = action.payload}
    }
})

const {
    setRandomFlag, setImageSearchFlag, setHeaderFlag, setCommentSearchFlag,
    setPageFlag, setDownloadIDs, setDownloadFlag, setReloadPostFlag,
    setUpdateUserFlag, setCommentID, setCommentJumpFlag, setPostFlag,
    setGroupFlag, setMessageFlag, setTagFlag, setPostAmount, setRedirect,
    setGroupSearchFlag, setThreadSearchFlag, setNoteSearchFlag
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
        groupSearchFlag: selector((state) => state.flag.groupSearchFlag),
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
        tagFlag: selector((state) => state.flag.tagFlag)
    }
}

export const useFlagActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setRandomFlag: (state: any) => dispatch(setRandomFlag(state)),
        setImageSearchFlag: (state: any) => dispatch(setImageSearchFlag(state)),
        setHeaderFlag: (state: any) => dispatch(setHeaderFlag(state)),
        setCommentSearchFlag: (state: any) => dispatch(setCommentSearchFlag(state)),
        setNoteSearchFlag: (state: any) => dispatch(setNoteSearchFlag(state)),
        setThreadSearchFlag: (state: any) => dispatch(setThreadSearchFlag(state)),
        setGroupSearchFlag: (state: any) => dispatch(setGroupSearchFlag(state)),
        setPageFlag: (state: any) => dispatch(setPageFlag(state)),
        setDownloadIDs: (state: any) => dispatch(setDownloadIDs(state)),
        setPostAmount: (state: any) => dispatch(setPostAmount(state)),
        setDownloadFlag: (state: any) => dispatch(setDownloadFlag(state)),
        setReloadPostFlag: (state: any) => dispatch(setReloadPostFlag(state)),
        setUpdateUserFlag: (state: any) => dispatch(setUpdateUserFlag(state)),
        setCommentID: (state: any) => dispatch(setCommentID(state)),
        setCommentJumpFlag: (state: any) => dispatch(setCommentJumpFlag(state)),
        setRedirect: (state: any) => dispatch(setRedirect(state)),
        setPostFlag: (state: any) => dispatch(setPostFlag(state)),
        setGroupFlag: (state: any) => dispatch(setGroupFlag(state)),
        setMessageFlag: (state: any) => dispatch(setMessageFlag(state)),
        setTagFlag: (state: any) => dispatch(setTagFlag(state))
    }
}

export default flagSlice.reducer