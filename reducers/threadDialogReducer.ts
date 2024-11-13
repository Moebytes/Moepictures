import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const threadDialogSlice = createSlice({
    name: "threadDialog",
    initialState: {
        showNewThreadDialog: false,
        deleteThreadID: null as any,
        deleteThreadFlag: false,
        editThreadID: null as any,
        editThreadFlag: false,
        editThreadTitle: "",
        editThreadContent: "",
        editThreadR18: false,
        deleteReplyID: null as any,
        deleteReplyFlag: false,
        editReplyID: null as any,
        editReplyFlag: false,
        editReplyContent: "",
        editReplyR18: false,
        reportReplyID: null as any,
        reportThreadID: null as any
    },
    reducers: {
        setShowNewThreadDialog: (state, action) => {state.showNewThreadDialog = action.payload},
        setDeleteThreadID: (state, action) => {state.deleteThreadID = action.payload},
        setDeleteThreadFlag: (state, action) => {state.deleteThreadFlag = action.payload},
        setEditThreadID: (state, action) => {state.editThreadID = action.payload},
        setEditThreadFlag: (state, action) => {state.editThreadFlag = action.payload},
        setEditThreadTitle: (state, action) => {state.editThreadTitle = action.payload},
        setEditThreadContent: (state, action) => {state.editThreadContent = action.payload},
        setEditThreadR18: (state, action) => {state.editThreadR18 = action.payload},
        setDeleteReplyID: (state, action) => {state.deleteReplyID = action.payload},
        setDeleteReplyFlag: (state, action) => {state.deleteReplyFlag = action.payload},
        setEditReplyID: (state, action) => {state.editReplyID = action.payload},
        setEditReplyFlag: (state, action) => {state.editReplyFlag = action.payload},
        setEditReplyContent: (state, action) => {state.editReplyContent = action.payload},
        setEditReplyR18: (state, action) => {state.editReplyR18 = action.payload},
        setReportReplyID: (state, action) => {state.reportReplyID = action.payload},
        setReportThreadID: (state, action) => {state.reportThreadID = action.payload}
    }
})

const {
    setShowNewThreadDialog, setDeleteThreadID, setDeleteThreadFlag, setEditThreadID,
    setEditThreadFlag, setEditThreadTitle, setEditThreadContent, setEditThreadR18,
    setDeleteReplyID, setDeleteReplyFlag, setEditReplyID, setEditReplyFlag,
    setEditReplyContent, setEditReplyR18, setReportReplyID, setReportThreadID
} = threadDialogSlice.actions

export const useThreadDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        showNewThreadDialog: selector((state) => state.threadDialog.showNewThreadDialog),
        deleteThreadID: selector((state) => state.threadDialog.deleteThreadID),
        deleteThreadFlag: selector((state) => state.threadDialog.deleteThreadFlag),
        editThreadID: selector((state) => state.threadDialog.editThreadID),
        editThreadFlag: selector((state) => state.threadDialog.editThreadFlag),
        editThreadTitle: selector((state) => state.threadDialog.editThreadTitle),
        editThreadContent: selector((state) => state.threadDialog.editThreadContent),
        editThreadR18: selector((state) => state.threadDialog.editThreadR18),
        deleteReplyID: selector((state) => state.threadDialog.deleteReplyID),
        deleteReplyFlag: selector((state) => state.threadDialog.deleteReplyFlag),
        editReplyID: selector((state) => state.threadDialog.editReplyID),
        editReplyFlag: selector((state) => state.threadDialog.editReplyFlag),
        editReplyContent: selector((state) => state.threadDialog.editReplyContent),
        editReplyR18: selector((state) => state.threadDialog.editReplyR18),
        reportReplyID: selector((state) => state.threadDialog.reportReplyID),
        reportThreadID: selector((state) => state.threadDialog.reportThreadID)
    }
}

export const useThreadDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setShowNewThreadDialog: (state: any) => dispatch(setShowNewThreadDialog(state)),
        setDeleteThreadID: (state: any) => dispatch(setDeleteThreadID(state)),
        setDeleteThreadFlag: (state: any) => dispatch(setDeleteThreadFlag(state)),
        setEditThreadID: (state: any) => dispatch(setEditThreadID(state)),
        setEditThreadFlag: (state: any) => dispatch(setEditThreadFlag(state)),
        setEditThreadTitle: (state: any) => dispatch(setEditThreadTitle(state)),
        setEditThreadContent: (state: any) => dispatch(setEditThreadContent(state)),
        setEditThreadR18: (state: any) => dispatch(setEditThreadR18(state)),
        setDeleteReplyID: (state: any) => dispatch(setDeleteReplyID(state)),
        setDeleteReplyFlag: (state: any) => dispatch(setDeleteReplyFlag(state)),
        setEditReplyID: (state: any) => dispatch(setEditReplyID(state)),
        setEditReplyFlag: (state: any) => dispatch(setEditReplyFlag(state)),
        setEditReplyContent: (state: any) => dispatch(setEditReplyContent(state)),
        setEditReplyR18: (state: any) => dispatch(setEditReplyR18(state)),
        setReportReplyID: (state: any) => dispatch(setReportReplyID(state)),
        setReportThreadID: (state: any) => dispatch(setReportThreadID(state))
    }
}

export default threadDialogSlice.reducer