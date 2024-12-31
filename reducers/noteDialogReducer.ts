import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {HistoryID, Note} from "../types/Types"

const noteDialogSlice = createSlice({
    name: "noteDialog",
    initialState: {
        editNoteID: null as number | null,
        editNoteFlag: false,
        editNoteText: "",
        editNoteTranscript: "",
        editNoteOverlay: false,
        editNoteFontSize: 100,
        editNoteBackgroundColor: "#ffffff",
        editNoteTextColor: "#000000",
        showSaveNoteDialog: false,
        saveNoteData: null as Note[] | null,
        saveNoteOrder: 1,
        deleteNoteHistoryID: null as HistoryID | null,
        deleteNoteHistoryFlag: false,
        revertNoteHistoryID: null as HistoryID | null,
        revertNoteHistoryFlag: false,
        noteOCRDialog: false,
        noteOCRFlag: false
    },
    reducers: {
        setEditNoteID: (state, action) => {state.editNoteID = action.payload},
        setEditNoteFlag: (state, action) => {state.editNoteFlag = action.payload},
        setEditNoteText: (state, action) => {state.editNoteText = action.payload},
        setEditNoteTranscript: (state, action) => {state.editNoteTranscript = action.payload},
        setEditNoteOverlay: (state, action) => {state.editNoteOverlay = action.payload},
        setEditNoteFontSize: (state, action) => {state.editNoteFontSize = action.payload},
        setEditNoteBackgroundColor: (state, action) => {state.editNoteBackgroundColor = action.payload},
        setEditNoteTextColor: (state, action) => {state.editNoteTextColor = action.payload},
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
    setRevertNoteHistoryFlag, setNoteOCRDialog, setNoteOCRFlag,
    setEditNoteOverlay, setEditNoteFontSize, setEditNoteBackgroundColor,
    setEditNoteTextColor
} = noteDialogSlice.actions

export const useNoteDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        editNoteID: selector((state) => state.noteDialog.editNoteID),
        editNoteFlag: selector((state) => state.noteDialog.editNoteFlag),
        editNoteText: selector((state) => state.noteDialog.editNoteText),
        editNoteTranscript: selector((state) => state.noteDialog.editNoteTranscript),
        editNoteOverlay: selector((state) => state.noteDialog.editNoteOverlay),
        editNoteFontSize: selector((state) => state.noteDialog.editNoteFontSize),
        editNoteBackgroundColor: selector((state) => state.noteDialog.editNoteBackgroundColor),
        editNoteTextColor: selector((state) => state.noteDialog.editNoteTextColor),
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
        setEditNoteID: (state: number | null) => dispatch(setEditNoteID(state)),
        setEditNoteFlag: (state: boolean) => dispatch(setEditNoteFlag(state)),
        setEditNoteText: (state: string) => dispatch(setEditNoteText(state)),
        setEditNoteTranscript: (state: string) => dispatch(setEditNoteTranscript(state)),
        setEditNoteOverlay: (state: boolean) => dispatch(setEditNoteOverlay(state)),
        setEditNoteFontSize: (state: number) => dispatch(setEditNoteFontSize(state)),
        setEditNoteBackgroundColor: (state: string) => dispatch(setEditNoteBackgroundColor(state)),
        setEditNoteTextColor: (state: string) => dispatch(setEditNoteTextColor(state)),
        setShowSaveNoteDialog: (state: boolean) => dispatch(setShowSaveNoteDialog(state)),
        setSaveNoteData: (state: Note[] | null) => dispatch(setSaveNoteData(state)),
        setSaveNoteOrder: (state: number) => dispatch(setSaveNoteOrder(state)),
        setDeleteNoteHistoryID: (state: HistoryID | null) => dispatch(setDeleteNoteHistoryID(state)),
        setDeleteNoteHistoryFlag: (state: boolean) => dispatch(setDeleteNoteHistoryFlag(state)),
        setRevertNoteHistoryID: (state: HistoryID | null) => dispatch(setRevertNoteHistoryID(state)),
        setRevertNoteHistoryFlag: (state: boolean) => dispatch(setRevertNoteHistoryFlag(state)),
        setNoteOCRDialog: (state: boolean) => dispatch(setNoteOCRDialog(state)),
        setNoteOCRFlag: (state: boolean) => dispatch(setNoteOCRFlag(state))
    }    
}

export default noteDialogSlice.reducer