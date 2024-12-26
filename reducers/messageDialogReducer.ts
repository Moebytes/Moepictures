import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {Message} from "../types/Types"

const messageDialogSlice = createSlice({
    name: "messageDialog",
    initialState: {
        dmTarget: null as string | null,
        deleteMessageID: null as string | null,
        deleteMessageFlag: false,
        softDeleteMessageID: null as string | null,
        softDeleteMessageFlag: false,
        editMessageID: null as string | null,
        editMessageFlag: false,
        editMessageTitle: "",
        editMessageContent: "",
        editMessageR18: false,
        deleteMsgReplyID: null as string | null,
        deleteMsgReplyFlag: false,
        editMsgReplyID: null as string | null,
        editMsgReplyFlag: false,
        editMsgReplyContent: "",
        editMsgReplyR18: false,
        forwardMessageObj: null as Message | null
    },
    reducers: {
        setDMTarget: (state, action) => {state.dmTarget = action.payload},
        setDeleteMessageID: (state, action) => {state.deleteMessageID = action.payload},
        setDeleteMessageFlag: (state, action) => {state.deleteMessageFlag = action.payload},
        setSoftDeleteMessageID: (state, action) => {state.softDeleteMessageID = action.payload},
        setSoftDeleteMessageFlag: (state, action) => {state.softDeleteMessageFlag = action.payload},
        setEditMessageID: (state, action) => {state.editMessageID = action.payload},
        setEditMessageFlag: (state, action) => {state.editMessageFlag = action.payload},
        setEditMessageTitle: (state, action) => {state.editMessageTitle = action.payload},
        setEditMessageContent: (state, action) => {state.editMessageContent = action.payload},
        setEditMessageR18: (state, action) => {state.editMessageR18 = action.payload},
        setDeleteMsgReplyID: (state, action) => {state.deleteMsgReplyID = action.payload},
        setDeleteMsgReplyFlag: (state, action) => {state.deleteMsgReplyFlag = action.payload},
        setEditMsgReplyID: (state, action) => {state.editMsgReplyID = action.payload},
        setEditMsgReplyFlag: (state, action) => {state.editMsgReplyFlag = action.payload},
        setEditMsgReplyContent: (state, action) => {state.editMsgReplyContent = action.payload},
        setEditMsgReplyR18: (state, action) => {state.editMsgReplyR18 = action.payload},
        setForwardMessageObj: (state, action) => {state.forwardMessageObj = action.payload}
    }
})

const {
    setDMTarget, setDeleteMessageID, setDeleteMessageFlag, setSoftDeleteMessageID, setSoftDeleteMessageFlag,
    setEditMessageID, setEditMessageFlag, setEditMessageTitle, setEditMessageContent, setEditMessageR18,
    setDeleteMsgReplyID, setDeleteMsgReplyFlag, setEditMsgReplyID, setEditMsgReplyFlag, setEditMsgReplyR18,
    setForwardMessageObj, setEditMsgReplyContent
} = messageDialogSlice.actions

export const useMessageDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        dmTarget: selector((state) => state.messageDialog.dmTarget),
        deleteMessageID: selector((state) => state.messageDialog.deleteMessageID),
        deleteMessageFlag: selector((state) => state.messageDialog.deleteMessageFlag),
        softDeleteMessageID: selector((state) => state.messageDialog.softDeleteMessageID),
        softDeleteMessageFlag: selector((state) => state.messageDialog.softDeleteMessageFlag),
        editMessageID: selector((state) => state.messageDialog.editMessageID),
        editMessageFlag: selector((state) => state.messageDialog.editMessageFlag),
        editMessageTitle: selector((state) => state.messageDialog.editMessageTitle),
        editMessageContent: selector((state) => state.messageDialog.editMessageContent),
        editMessageR18: selector((state) => state.messageDialog.editMessageR18),
        deleteMsgReplyID: selector((state) => state.messageDialog.deleteMsgReplyID),
        deleteMsgReplyFlag: selector((state) => state.messageDialog.deleteMsgReplyFlag),
        editMsgReplyID: selector((state) => state.messageDialog.editMsgReplyID),
        editMsgReplyFlag: selector((state) => state.messageDialog.editMsgReplyFlag),
        editMsgReplyContent: selector((state) => state.messageDialog.editMsgReplyContent),
        editMsgReplyR18: selector((state) => state.messageDialog.editMsgReplyR18),
        forwardMessageObj: selector((state) => state.messageDialog.forwardMessageObj)
    }
}

export const useMessageDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setDMTarget: (state: string | null) => dispatch(setDMTarget(state)),
        setDeleteMessageID: (state: string | null) => dispatch(setDeleteMessageID(state)),
        setDeleteMessageFlag: (state: boolean) => dispatch(setDeleteMessageFlag(state)),
        setSoftDeleteMessageID: (state: string | null) => dispatch(setSoftDeleteMessageID(state)),
        setSoftDeleteMessageFlag: (state: boolean) => dispatch(setSoftDeleteMessageFlag(state)),
        setEditMessageID: (state: string | null) => dispatch(setEditMessageID(state)),
        setEditMessageFlag: (state: boolean) => dispatch(setEditMessageFlag(state)),
        setEditMessageTitle: (state: string) => dispatch(setEditMessageTitle(state)),
        setEditMessageContent: (state: string) => dispatch(setEditMessageContent(state)),
        setEditMessageR18: (state: boolean) => dispatch(setEditMessageR18(state)),
        setDeleteMsgReplyID: (state: string | null) => dispatch(setDeleteMsgReplyID(state)),
        setDeleteMsgReplyFlag: (state: boolean) => dispatch(setDeleteMsgReplyFlag(state)),
        setEditMsgReplyID: (state: string | null) => dispatch(setEditMsgReplyID(state)),
        setEditMsgReplyFlag: (state: boolean) => dispatch(setEditMsgReplyFlag(state)),
        setEditMsgReplyContent: (state: string) => dispatch(setEditMsgReplyContent(state)),
        setEditMsgReplyR18: (state: boolean) => dispatch(setEditMsgReplyR18(state)),
        setForwardMessageObj: (state: Message | null) => dispatch(setForwardMessageObj(state))
    }    
}

export default messageDialogSlice.reducer