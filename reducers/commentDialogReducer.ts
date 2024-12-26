import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const commentDialogSlice = createSlice({
    name: "commentDialog",
    initialState: {
        deleteCommentID: null as string | null,
        deleteCommentFlag: false,
        editCommentID: null as string | null,
        editCommentFlag: false,
        editCommentText: "",
        reportCommentID: null as string | null,
    },
    reducers: {
        setDeleteCommentID: (state, action) => {state.deleteCommentID = action.payload},
        setDeleteCommentFlag: (state, action) => {state.deleteCommentFlag = action.payload},
        setEditCommentID: (state, action) => {state.editCommentID = action.payload},
        setEditCommentFlag: (state, action) => {state.editCommentFlag = action.payload},
        setEditCommentText: (state, action) => {state.editCommentText = action.payload},
        setReportCommentID: (state, action) => {state.reportCommentID = action.payload}
    }
})

const {
    setDeleteCommentID, setDeleteCommentFlag, setEditCommentID, setEditCommentFlag,
    setEditCommentText, setReportCommentID
} = commentDialogSlice.actions

export const useCommentDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        deleteCommentID: selector((state) => state.commentDialog.deleteCommentID),
        deleteCommentFlag: selector((state) => state.commentDialog.deleteCommentFlag),
        editCommentID: selector((state) => state.commentDialog.editCommentID),
        editCommentFlag: selector((state) => state.commentDialog.editCommentFlag),
        editCommentText: selector((state) => state.commentDialog.editCommentText),
        reportCommentID: selector((state) => state.commentDialog.reportCommentID)
    }
}

export const useCommentDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setDeleteCommentID: (state: string | null) => dispatch(setDeleteCommentID(state)),
        setDeleteCommentFlag: (state: boolean) => dispatch(setDeleteCommentFlag(state)),
        setEditCommentID: (state: string | null) => dispatch(setEditCommentID(state)),
        setEditCommentFlag: (state: boolean) => dispatch(setEditCommentFlag(state)),
        setEditCommentText: (state: string) => dispatch(setEditCommentText(state)),
        setReportCommentID: (state: string | null) => dispatch(setReportCommentID(state))
    }
}

export default commentDialogSlice.reducer