import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const tagDialogSlice = createSlice({
    name: "tagDialog",
    initialState: {
        deleteTagHistoryID: null as any,
        deleteTagHistoryFlag: false,
        revertTagHistoryID: null as any,
        revertTagHistoryFlag: false,
        editTagObj: null as any,
        editTagFlag: false,
        deleteTagID: null as any,
        deleteTagFlag: false,
        aliasTagID: null as any,
        aliasTagFlag: false,
        aliasTagName: "",
        takedownTag: null as any,
        categorizeTag: null as any,
        showBulkTagEditDialog: false,
        deleteAliasHistoryID: null as any,
        deleteAliasHistoryFlag: false,
        revertAliasHistoryID: null as any,
        revertAliasHistoryFlag: false
    },
    reducers: {
        setDeleteTagHistoryID: (state, action) => {state.deleteTagHistoryID = action.payload},
        setDeleteTagHistoryFlag: (state, action) => {state.deleteTagHistoryFlag = action.payload},
        setRevertTagHistoryID: (state, action) => {state.revertTagHistoryID = action.payload},
        setRevertTagHistoryFlag: (state, action) => {state.revertTagHistoryFlag = action.payload},
        setEditTagObj: (state, action) => {state.editTagObj = action.payload},
        setEditTagFlag: (state, action) => {state.editTagFlag = action.payload},
        setDeleteTagID: (state, action) => {state.deleteTagID = action.payload},
        setDeleteTagFlag: (state, action) => {state.deleteTagFlag = action.payload},
        setAliasTagID: (state, action) => {state.aliasTagID = action.payload},
        setAliasTagFlag: (state, action) => {state.aliasTagFlag = action.payload},
        setAliasTagName: (state, action) => {state.aliasTagName = action.payload},
        setTakedownTag: (state, action) => {state.takedownTag = action.payload},
        setCategorizeTag: (state, action) => {state.categorizeTag = action.payload},
        setShowBulkTagEditDialog: (state, action) => {state.showBulkTagEditDialog = action.payload},
        setDeleteAliasHistoryID: (state, action) => {state.deleteAliasHistoryID = action.payload},
        setDeleteAliasHistoryFlag: (state, action) => {state.deleteAliasHistoryFlag = action.payload},
        setRevertAliasHistoryID: (state, action) => {state.revertAliasHistoryID = action.payload},
        setRevertAliasHistoryFlag: (state, action) => {state.revertAliasHistoryFlag = action.payload}
    }
})

const {
    setDeleteTagHistoryID, setDeleteTagHistoryFlag, setRevertTagHistoryID, setRevertTagHistoryFlag,
    setEditTagObj, setEditTagFlag, setDeleteTagID, setDeleteTagFlag, setAliasTagID, setAliasTagFlag,
    setAliasTagName, setTakedownTag, setCategorizeTag, setShowBulkTagEditDialog,
    setDeleteAliasHistoryID, setDeleteAliasHistoryFlag, setRevertAliasHistoryID, setRevertAliasHistoryFlag
} = tagDialogSlice.actions

export const useTagDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        deleteTagHistoryID: selector((state) => state.tagDialog.deleteTagHistoryID),
        deleteTagHistoryFlag: selector((state) => state.tagDialog.deleteTagHistoryFlag),
        revertTagHistoryID: selector((state) => state.tagDialog.revertTagHistoryID),
        revertTagHistoryFlag: selector((state) => state.tagDialog.revertTagHistoryFlag),
        editTagObj: selector((state) => state.tagDialog.editTagObj),
        editTagFlag: selector((state) => state.tagDialog.editTagFlag),
        deleteTagID: selector((state) => state.tagDialog.deleteTagID),
        deleteTagFlag: selector((state) => state.tagDialog.deleteTagFlag),
        aliasTagID: selector((state) => state.tagDialog.aliasTagID),
        aliasTagFlag: selector((state) => state.tagDialog.aliasTagFlag),
        aliasTagName: selector((state) => state.tagDialog.aliasTagName),
        takedownTag: selector((state) => state.tagDialog.takedownTag),
        categorizeTag: selector((state) => state.tagDialog.categorizeTag),
        showBulkTagEditDialog: selector((state) => state.tagDialog.showBulkTagEditDialog),
        deleteAliasHistoryID: selector((state) => state.tagDialog.deleteAliasHistoryID),
        deleteAliasHistoryFlag: selector((state) => state.tagDialog.deleteAliasHistoryFlag),
        revertAliasHistoryID: selector((state) => state.tagDialog.revertAliasHistoryID),
        revertAliasHistoryFlag: selector((state) => state.tagDialog.revertAliasHistoryFlag)
    }
}

export const useTagDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setDeleteTagHistoryID: (state: any) => dispatch(setDeleteTagHistoryID(state)),
        setDeleteTagHistoryFlag: (state: any) => dispatch(setDeleteTagHistoryFlag(state)),
        setRevertTagHistoryID: (state: any) => dispatch(setRevertTagHistoryID(state)),
        setRevertTagHistoryFlag: (state: any) => dispatch(setRevertTagHistoryFlag(state)),
        setEditTagObj: (state: any) => dispatch(setEditTagObj(state)),
        setEditTagFlag: (state: any) => dispatch(setEditTagFlag(state)),
        setDeleteTagID: (state: any) => dispatch(setDeleteTagID(state)),
        setDeleteTagFlag: (state: any) => dispatch(setDeleteTagFlag(state)),
        setAliasTagID: (state: any) => dispatch(setAliasTagID(state)),
        setAliasTagFlag: (state: any) => dispatch(setAliasTagFlag(state)),
        setAliasTagName: (state: any) => dispatch(setAliasTagName(state)),
        setTakedownTag: (state: any) => dispatch(setTakedownTag(state)),
        setCategorizeTag: (state: any) => dispatch(setCategorizeTag(state)),
        setShowBulkTagEditDialog: (state: any) => dispatch(setShowBulkTagEditDialog(state)),
        setDeleteAliasHistoryID: (state: any) => dispatch(setDeleteAliasHistoryID(state)),
        setDeleteAliasHistoryFlag: (state: any) => dispatch(setDeleteAliasHistoryFlag(state)),
        setRevertAliasHistoryID: (state: any) => dispatch(setRevertAliasHistoryID(state)),
        setRevertAliasHistoryFlag: (state: any) => dispatch(setRevertAliasHistoryFlag(state))
    }
}

export default tagDialogSlice.reducer