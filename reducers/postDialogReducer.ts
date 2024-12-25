import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {PostSearch} from "../types/Types"

const postDialogSlice = createSlice({
    name: "postDialog",
    initialState: {
        showDeletePostDialog: false,
        showTakedownPostDialog: false,
        deletePostHistoryID: null as any,
        deletePostHistoryFlag: false,
        revertPostHistoryID: null as any,
        revertPostHistoryFlag: false,
        lockPostID: null as any,
        privatePostObj: null as any,
        tagEditID: null as any,
        sourceEditID: null as unknown as {unverified: boolean, post: PostSearch},
        showBulkTagEditDialog: false,
        showBulkDeleteDialog: false,
        showCompressingDialog: false,
        showUpscalingDialog: false,
        childPostObj: null as unknown as {unverified: boolean, post: PostSearch}
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
        setChildPostObj: (state, action) => {state.childPostObj = action.payload}
    }
})

const {
    setShowDeletePostDialog, setShowTakedownPostDialog, setDeletePostHistoryID,
    setDeletePostHistoryFlag, setRevertPostHistoryID, setRevertPostHistoryFlag, 
    setLockPostID, setPrivatePostObj, setTagEditID, setSourceEditID, setChildPostObj,
    setShowBulkTagEditDialog, setShowBulkDeleteDialog, setShowCompressingDialog, setShowUpscalingDialog
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
        childPostObj: selector((state) => state.postDialog.childPostObj)
    }
}

export const usePostDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setShowDeletePostDialog: (state: any) => dispatch(setShowDeletePostDialog(state)),
        setShowTakedownPostDialog: (state: any) => dispatch(setShowTakedownPostDialog(state)),
        setDeletePostHistoryID: (state: any) => dispatch(setDeletePostHistoryID(state)),
        setDeletePostHistoryFlag: (state: any) => dispatch(setDeletePostHistoryFlag(state)),
        setRevertPostHistoryID: (state: any) => dispatch(setRevertPostHistoryID(state)),
        setRevertPostHistoryFlag: (state: any) => dispatch(setRevertPostHistoryFlag(state)),
        setLockPostID: (state: any) => dispatch(setLockPostID(state)),
        setPrivatePostObj: (state: any) => dispatch(setPrivatePostObj(state)),
        setTagEditID: (state: any) => dispatch(setTagEditID(state)),
        setSourceEditID: (state: any) => dispatch(setSourceEditID(state)),
        setShowBulkTagEditDialog: (state: any) => dispatch(setShowBulkTagEditDialog(state)),
        setShowBulkDeleteDialog: (state: any) => dispatch(setShowBulkDeleteDialog(state)),
        setShowCompressingDialog: (state: any) => dispatch(setShowCompressingDialog(state)),
        setShowUpscalingDialog: (state: any) => dispatch(setShowUpscalingDialog(state)),
        setChildPostObj: (state: any) => dispatch(setChildPostObj(state))
    }
}

export default postDialogSlice.reducer