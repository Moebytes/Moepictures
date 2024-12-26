import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const searchDialogSlice = createSlice({
    name: "searchDialog",
    initialState: {
        deleteSearchHistoryID: null as string | null,
        deleteSearchHistoryFlag: false,
        showDeleteAllHistoryDialog: false,
        saveSearchDialog: false,
        editSaveSearchName: "",
        editSaveSearchKey: "",
        editSaveSearchTags: "",
        deleteAllSaveSearchDialog: false
    },
    reducers: {
        setDeleteSearchHistoryID: (state, action) => {state.deleteSearchHistoryID = action.payload},
        setDeleteSearchHistoryFlag: (state, action) => {state.deleteSearchHistoryFlag = action.payload},
        setShowDeleteAllHistoryDialog: (state, action) => {state.showDeleteAllHistoryDialog = action.payload},
        setSaveSearchDialog: (state, action) => {state.saveSearchDialog = action.payload},
        setEditSaveSearchName: (state, action) => {state.editSaveSearchName = action.payload},
        setEditSaveSearchKey: (state, action) => {state.editSaveSearchKey = action.payload},
        setEditSaveSearchTags: (state, action) => {state.editSaveSearchTags = action.payload},
        setDeleteAllSaveSearchDialog: (state, action) => {state.deleteAllSaveSearchDialog = action.payload}
    }
})

const {
    setDeleteSearchHistoryID, setDeleteSearchHistoryFlag, setShowDeleteAllHistoryDialog,
    setSaveSearchDialog, setEditSaveSearchName,
    setEditSaveSearchKey, setEditSaveSearchTags, setDeleteAllSaveSearchDialog
} = searchDialogSlice.actions

export const useSearchDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        deleteSearchHistoryID: selector((state) => state.searchDialog.deleteSearchHistoryID),
        deleteSearchHistoryFlag: selector((state) => state.searchDialog.deleteSearchHistoryFlag),
        showDeleteAllHistoryDialog: selector((state) => state.searchDialog.showDeleteAllHistoryDialog),
        saveSearchDialog: selector((state) => state.searchDialog.saveSearchDialog),
        editSaveSearchName: selector((state) => state.searchDialog.editSaveSearchName),
        editSaveSearchKey: selector((state) => state.searchDialog.editSaveSearchKey),
        editSaveSearchTags: selector((state) => state.searchDialog.editSaveSearchTags),
        deleteAllSaveSearchDialog: selector((state) => state.searchDialog.deleteAllSaveSearchDialog)
    }
}

export const useSearchDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setDeleteSearchHistoryID: (state: string | null) => dispatch(setDeleteSearchHistoryID(state)),
        setDeleteSearchHistoryFlag: (state: boolean) => dispatch(setDeleteSearchHistoryFlag(state)),
        setShowDeleteAllHistoryDialog: (state: boolean) => dispatch(setShowDeleteAllHistoryDialog(state)),
        setSaveSearchDialog: (state: boolean) => dispatch(setSaveSearchDialog(state)),
        setEditSaveSearchName: (state: string) => dispatch(setEditSaveSearchName(state)),
        setEditSaveSearchKey: (state: string) => dispatch(setEditSaveSearchKey(state)),
        setEditSaveSearchTags: (state: string) => dispatch(setEditSaveSearchTags(state)),
        setDeleteAllSaveSearchDialog: (state: boolean) => dispatch(setDeleteAllSaveSearchDialog(state))
    }    
}

export default searchDialogSlice.reducer