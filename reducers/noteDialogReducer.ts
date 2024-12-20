import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const noteDialogSlice = createSlice({
    name: "noteDialog",
    initialState: {
        editNoteID: null as any,
        editNoteFlag: false,
        editNoteText: "",
        editNoteTranscript: "",
        showSaveNoteDialog: false,
        saveNoteData: null as any,
        saveNoteOrder: 1,
        deleteNoteHistoryID: null as any,
        deleteNoteHistoryFlag: false,
        revertNoteHistoryID: null as any,
        revertNoteHistoryFlag: false,
        noteOCRDialog: false,
        noteOCRFlag: false
    },
    reducers: {
        setEditNoteID: (state, action) => {state.editNoteID = action.payload},
        setEditNoteFlag: (state, action) => {state.editNoteFlag = action.payload},
        setEditNoteText: (state, action) => {state.editNoteText = action.payload},
        setEditNoteTranscript: (state, action) => {state.editNoteTranscript = action.payload},
        setShowSaveNoteDialog: (state, action) => {state.showSaveNoteDialog = action.payload},
        setSaveNoteData: (state, action) => {state.saveNoteData = action.payload},
        setSaveNoteOrder: (state, action) => {state.saveNoteOrder = action.payload},
        setDeleteNoteHistoryID: (state, action) => {state.deleteNoteHistoryID = action.payload},
        setDeleteNoteHistoryFlag: (state, action) => {state.deleteNoteHistoryFlag = action.payload},
        setRevertNoteHistoryID: (state, action) => {state.revertNoteHistoryID = action.payload},
        setRevertNoteHistoryFlag: (state, action) => {state.revertNoteHistoryFlag = action.payload},
        setNoteOCRDialog: (state, action) => {state.noteOCRDialog = action.payload},
        setNoteOCRFlag: (state, action) => {state.noteOCRFlag = action.payload}
    }
})

const {
    setEditNoteID, setEditNoteFlag, setEditNoteText, setEditNoteTranscript,
    setShowSaveNoteDialog, setSaveNoteData, setSaveNoteOrder,
    setDeleteNoteHistoryID, setDeleteNoteHistoryFlag, setRevertNoteHistoryID,
    setRevertNoteHistoryFlag, setNoteOCRDialog, setNoteOCRFlag
} = noteDialogSlice.actions

export const useNoteDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        editNoteID: selector((state) => state.noteDialog.editNoteID),
        editNoteFlag: selector((state) => state.noteDialog.editNoteFlag),
        editNoteText: selector((state) => state.noteDialog.editNoteText),
        editNoteTranscript: selector((state) => state.noteDialog.editNoteTranscript),
        showSaveNoteDialog: selector((state) => state.noteDialog.showSaveNoteDialog),
        saveNoteData: selector((state) => state.noteDialog.saveNoteData),
        saveNoteOrder: selector((state) => state.noteDialog.saveNoteOrder),
        deleteNoteHistoryID: selector((state) => state.noteDialog.deleteNoteHistoryID),
        deleteNoteHistoryFlag: selector((state) => state.noteDialog.deleteNoteHistoryFlag),
        revertNoteHistoryID: selector((state) => state.noteDialog.revertNoteHistoryID),
        revertNoteHistoryFlag: selector((state) => state.noteDialog.revertNoteHistoryFlag),
        noteOCRDialog: selector((state) => state.noteDialog.noteOCRDialog),
        noteOCRFlag: selector((state) => state.noteDialog.noteOCRFlag)
    }
}

export const useNoteDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setEditNoteID: (state: any) => dispatch(setEditNoteID(state)),
        setEditNoteFlag: (state: any) => dispatch(setEditNoteFlag(state)),
        setEditNoteText: (state: any) => dispatch(setEditNoteText(state)),
        setEditNoteTranscript: (state: any) => dispatch(setEditNoteTranscript(state)),
        setShowSaveNoteDialog: (state: any) => dispatch(setShowSaveNoteDialog(state)),
        setSaveNoteData: (state: any) => dispatch(setSaveNoteData(state)),
        setSaveNoteOrder: (state: any) => dispatch(setSaveNoteOrder(state)),
        setDeleteNoteHistoryID: (state: any) => dispatch(setDeleteNoteHistoryID(state)),
        setDeleteNoteHistoryFlag: (state: any) => dispatch(setDeleteNoteHistoryFlag(state)),
        setRevertNoteHistoryID: (state: any) => dispatch(setRevertNoteHistoryID(state)),
        setRevertNoteHistoryFlag: (state: any) => dispatch(setRevertNoteHistoryFlag(state)),
        setNoteOCRDialog: (state: any) => dispatch(setNoteOCRDialog(state)),
        setNoteOCRFlag: (state: any) => dispatch(setNoteOCRFlag(state))
    }
}

export default noteDialogSlice.reducer