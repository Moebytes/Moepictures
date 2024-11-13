import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const translationDialogSlice = createSlice({
    name: "translationDialog",
    initialState: {
        editTranslationID: null as any,
        editTranslationFlag: false,
        editTranslationText: "",
        editTranslationTranscript: "",
        showSaveTranslationDialog: false,
        saveTranslationData: null as any,
        saveTranslationOrder: 1,
        deleteTranslationHistoryID: null as any,
        deleteTranslationHistoryFlag: false,
        revertTranslationHistoryID: null as any,
        revertTranslationHistoryFlag: false,
        translationOCRDialog: false,
        translationOCRFlag: false
    },
    reducers: {
        setEditTranslationID: (state, action) => {state.editTranslationID = action.payload},
        setEditTranslationFlag: (state, action) => {state.editTranslationFlag = action.payload},
        setEditTranslationText: (state, action) => {state.editTranslationText = action.payload},
        setEditTranslationTranscript: (state, action) => {state.editTranslationTranscript = action.payload},
        setShowSaveTranslationDialog: (state, action) => {state.showSaveTranslationDialog = action.payload},
        setSaveTranslationData: (state, action) => {state.saveTranslationData = action.payload},
        setSaveTranslationOrder: (state, action) => {state.saveTranslationOrder = action.payload},
        setDeleteTranslationHistoryID: (state, action) => {state.deleteTranslationHistoryID = action.payload},
        setDeleteTranslationHistoryFlag: (state, action) => {state.deleteTranslationHistoryFlag = action.payload},
        setRevertTranslationHistoryID: (state, action) => {state.revertTranslationHistoryID = action.payload},
        setRevertTranslationHistoryFlag: (state, action) => {state.revertTranslationHistoryFlag = action.payload},
        setTranslationOCRDialog: (state, action) => {state.translationOCRDialog = action.payload},
        setTranslationOCRFlag: (state, action) => {state.translationOCRFlag = action.payload}
    }
})

const {
    setEditTranslationID, setEditTranslationFlag, setEditTranslationText, setEditTranslationTranscript,
    setShowSaveTranslationDialog, setSaveTranslationData, setSaveTranslationOrder,
    setDeleteTranslationHistoryID, setDeleteTranslationHistoryFlag, setRevertTranslationHistoryID,
    setRevertTranslationHistoryFlag, setTranslationOCRDialog, setTranslationOCRFlag
} = translationDialogSlice.actions

export const useTranslationDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        editTranslationID: selector((state) => state.translationDialog.editTranslationID),
        editTranslationFlag: selector((state) => state.translationDialog.editTranslationFlag),
        editTranslationText: selector((state) => state.translationDialog.editTranslationText),
        editTranslationTranscript: selector((state) => state.translationDialog.editTranslationTranscript),
        showSaveTranslationDialog: selector((state) => state.translationDialog.showSaveTranslationDialog),
        saveTranslationData: selector((state) => state.translationDialog.saveTranslationData),
        saveTranslationOrder: selector((state) => state.translationDialog.saveTranslationOrder),
        deleteTranslationHistoryID: selector((state) => state.translationDialog.deleteTranslationHistoryID),
        deleteTranslationHistoryFlag: selector((state) => state.translationDialog.deleteTranslationHistoryFlag),
        revertTranslationHistoryID: selector((state) => state.translationDialog.revertTranslationHistoryID),
        revertTranslationHistoryFlag: selector((state) => state.translationDialog.revertTranslationHistoryFlag),
        translationOCRDialog: selector((state) => state.translationDialog.translationOCRDialog),
        translationOCRFlag: selector((state) => state.translationDialog.translationOCRFlag)
    }
}

export const useTranslationDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEditTranslationID: (state: any) => dispatch(setEditTranslationID(state)),
        setEditTranslationFlag: (state: any) => dispatch(setEditTranslationFlag(state)),
        setEditTranslationText: (state: any) => dispatch(setEditTranslationText(state)),
        setEditTranslationTranscript: (state: any) => dispatch(setEditTranslationTranscript(state)),
        setShowSaveTranslationDialog: (state: any) => dispatch(setShowSaveTranslationDialog(state)),
        setSaveTranslationData: (state: any) => dispatch(setSaveTranslationData(state)),
        setSaveTranslationOrder: (state: any) => dispatch(setSaveTranslationOrder(state)),
        setDeleteTranslationHistoryID: (state: any) => dispatch(setDeleteTranslationHistoryID(state)),
        setDeleteTranslationHistoryFlag: (state: any) => dispatch(setDeleteTranslationHistoryFlag(state)),
        setRevertTranslationHistoryID: (state: any) => dispatch(setRevertTranslationHistoryID(state)),
        setRevertTranslationHistoryFlag: (state: any) => dispatch(setRevertTranslationHistoryFlag(state)),
        setTranslationOCRDialog: (state: any) => dispatch(setTranslationOCRDialog(state)),
        setTranslationOCRFlag: (state: any) => dispatch(setTranslationOCRFlag(state))
    }
}

export default translationDialogSlice.reducer