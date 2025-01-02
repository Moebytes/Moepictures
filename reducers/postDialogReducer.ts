import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {HistoryID, PostSearch, PostHistory, UnverifiedPost, MiniTag} from "../types/Types"

interface TagEditID {
    post: PostSearch | PostHistory | UnverifiedPost, 
    unverified?: boolean, 
    artists: MiniTag[], 
    characters: MiniTag[], 
    series: MiniTag[], 
    tags: MiniTag[]
}

interface ChildEditID {
    post: PostSearch | PostHistory | UnverifiedPost, 
    unverified?: boolean
}

interface PostObj {
    postID: string
    artists: MiniTag[]
}

interface UndeleteID {
    postID: string 
    unverified?: boolean
}

const postDialogSlice = createSlice({
    name: "postDialog",
    initialState: {
        showDeletePostDialog: false,
        showTakedownPostDialog: false,
        deletePostHistoryID: null as HistoryID | null,
        deletePostHistoryFlag: false,
        revertPostHistoryID: null as HistoryID | null,
        revertPostHistoryFlag: false,
        lockPostID: null as string | null,
        privatePostObj: null as PostObj | null,
        tagEditID: null as TagEditID | null,
        sourceEditID: null as TagEditID | null,
        showBulkTagEditDialog: false,
        showBulkDeleteDialog: false,
        showCompressingDialog: false,
        showUpscalingDialog: false,
        childPostObj: null as ChildEditID | null,
        undeletePostID: null as UndeleteID | null,
        permaDeletePostID: null as string | null,
        permaDeletePostFlag: false,
        permaDeleteAllDialog: false,
        appealPostID: null as string | null
    },
    reducers: {
        setShowDeletePostDialog: (state, action) => {state.showDeletePostDialog = action.payload},
        setShowTakedownPostDialog: (state, action) => {state.showTakedownPostDialog = action.payload},
        setDeletePostHistoryID: (state, action) => {state.deletePostHistoryID = action.payload},
        setDeletePostHistoryFlag: (state, action) => {state.deletePostHistoryFlag = action.payload},
        setRevertPostHistoryID: (state, action) => {state.revertPostHistoryID = action.payload},
        setRevertPostHistoryFlag: (state, action) => {state.revertPostHistoryFlag = action.payload},
        setLockPostID: (state, action) => {state.lockPostID = action.payload},
        setPrivatePostObj: (state, action) => {state.privatePostObj = action.payload},
        setTagEditID: (state, action) => {state.tagEditID = action.payload},
        setSourceEditID: (state, action) => {state.sourceEditID = action.payload},
        setShowBulkTagEditDialog: (state, action) => {state.showBulkTagEditDialog = action.payload},
        setShowBulkDeleteDialog: (state, action) => {state.showBulkDeleteDialog = action.payload},
        setShowCompressingDialog: (state, action) => {state.showCompressingDialog = action.payload},
        setShowUpscalingDialog: (state, action) => {state.showUpscalingDialog = action.payload},
        setChildPostObj: (state, action) => {state.childPostObj = action.payload},
        setUndeletePostID: (state, action) => {state.undeletePostID = action.payload},
        setPermaDeletePostID: (state, action) => {state.permaDeletePostID = action.payload},
        setPermaDeletePostFlag: (state, action) => {state.permaDeletePostFlag = action.payload},
        setPermaDeleteAllDialog: (state, action) => {state.permaDeleteAllDialog = action.payload},
        setAppealPostID: (state, action) => {state.appealPostID = action.payload}
    }
})

const {
    setShowDeletePostDialog, setShowTakedownPostDialog, setDeletePostHistoryID,
    setDeletePostHistoryFlag, setRevertPostHistoryID, setRevertPostHistoryFlag, 
    setLockPostID, setPrivatePostObj, setTagEditID, setSourceEditID, setChildPostObj,
    setShowBulkTagEditDialog, setShowBulkDeleteDialog, setShowCompressingDialog, setShowUpscalingDialog,
    setUndeletePostID, setPermaDeletePostID, setPermaDeletePostFlag, setPermaDeleteAllDialog, setAppealPostID
} = postDialogSlice.actions

export const usePostDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        showDeletePostDialog: selector((state) => state.postDialog.showDeletePostDialog),
        showTakedownPostDialog: selector((state) => state.postDialog.showTakedownPostDialog),
        deletePostHistoryID: selector((state) => state.postDialog.deletePostHistoryID),
        deletePostHistoryFlag: selector((state) => state.postDialog.deletePostHistoryFlag),
        revertPostHistoryID: selector((state) => state.postDialog.revertPostHistoryID),
        revertPostHistoryFlag: selector((state) => state.postDialog.revertPostHistoryFlag),
        lockPostID: selector((state) => state.postDialog.lockPostID),
        privatePostObj: selector((state) => state.postDialog.privatePostObj),
        tagEditID: selector((state) => state.postDialog.tagEditID),
        sourceEditID: selector((state) => state.postDialog.sourceEditID),
        showBulkTagEditDialog: selector((state) => state.postDialog.showBulkTagEditDialog),
        showBulkDeleteDialog: selector((state) => state.postDialog.showBulkDeleteDialog),
        showCompressingDialog: selector((state) => state.postDialog.showCompressingDialog),
        showUpscalingDialog: selector((state) => state.postDialog.showUpscalingDialog),
        childPostObj: selector((state) => state.postDialog.childPostObj),
        undeletePostID: selector((state) => state.postDialog.undeletePostID),
        permaDeletePostID: selector((state) => state.postDialog.permaDeletePostID),
        permaDeletePostFlag: selector((state) => state.postDialog.permaDeletePostFlag),
        permaDeleteAllDialog: selector((state) => state.postDialog.permaDeleteAllDialog),
        appealPostID: selector((state) => state.postDialog.appealPostID)
    }
}

export const usePostDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setShowDeletePostDialog: (state: boolean) => dispatch(setShowDeletePostDialog(state)),
        setShowTakedownPostDialog: (state: boolean) => dispatch(setShowTakedownPostDialog(state)),
        setDeletePostHistoryID: (state: HistoryID | null) => dispatch(setDeletePostHistoryID(state)),
        setDeletePostHistoryFlag: (state: boolean) => dispatch(setDeletePostHistoryFlag(state)),
        setRevertPostHistoryID: (state: HistoryID | null) => dispatch(setRevertPostHistoryID(state)),
        setRevertPostHistoryFlag: (state: boolean) => dispatch(setRevertPostHistoryFlag(state)),
        setLockPostID: (state: string | null) => dispatch(setLockPostID(state)),
        setPrivatePostObj: (state: PostObj | null) => dispatch(setPrivatePostObj(state)),
        setTagEditID: (state: TagEditID | null) => dispatch(setTagEditID(state)),
        setSourceEditID: (state: TagEditID | null) => dispatch(setSourceEditID(state)),
        setShowBulkTagEditDialog: (state: boolean) => dispatch(setShowBulkTagEditDialog(state)),
        setShowBulkDeleteDialog: (state: boolean) => dispatch(setShowBulkDeleteDialog(state)),
        setShowCompressingDialog: (state: boolean) => dispatch(setShowCompressingDialog(state)),
        setShowUpscalingDialog: (state: boolean) => dispatch(setShowUpscalingDialog(state)),
        setChildPostObj: (state: ChildEditID | null) => dispatch(setChildPostObj(state)),
        setUndeletePostID: (state: UndeleteID | null) => dispatch(setUndeletePostID(state)),
        setPermaDeletePostID: (state: string | null) => dispatch(setPermaDeletePostID(state)),
        setPermaDeletePostFlag: (state: boolean) => dispatch(setPermaDeletePostFlag(state)),
        setPermaDeleteAllDialog: (state: boolean) => dispatch(setPermaDeleteAllDialog(state)),
        setAppealPostID: (state: string | null) => dispatch(setAppealPostID(state))
    }    
}

export default postDialogSlice.reducer