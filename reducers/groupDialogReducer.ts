import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const groupDialogSlice = createSlice({
    name: "groupDialog",
    initialState: {
        favGroupID: null as any,
        editFavGroupObj: null as any,
        deleteFavGroupObj: null as any,
        bulkFavGroupDialog: false,
        groupPostID: null as any,
        editGroupObj: null as any,
        deleteGroupObj: null as any,
        deleteGroupHistoryID: null as any,
        deleteGroupHistoryFlag: false,
        revertGroupHistoryID: null as any,
        revertGroupHistoryFlag: false
    },
    reducers: {
        setFavGroupID: (state, action) => {state.favGroupID = action.payload},
        setEditFavGroupObj: (state, action) => {state.editFavGroupObj = action.payload},
        setDeleteFavGroupObj: (state, action) => {state.deleteFavGroupObj = action.payload},
        setBulkFavGroupDialog: (state, action) => {state.bulkFavGroupDialog = action.payload},
        setGroupPostID: (state, action) => {state.groupPostID = action.payload},
        setEditGroupObj: (state, action) => {state.editGroupObj = action.payload},
        setDeleteGroupObj: (state, action) => {state.deleteGroupObj = action.payload},
        setDeleteGroupHistoryID: (state, action) => {state.deleteGroupHistoryID = action.payload},
        setDeleteGroupHistoryFlag: (state, action) => {state.deleteGroupHistoryFlag = action.payload},
        setRevertGroupHistoryID: (state, action) => {state.revertGroupHistoryID = action.payload},
        setRevertGroupHistoryFlag: (state, action) => {state.revertGroupHistoryFlag = action.payload}
    }
})

const {
    setFavGroupID, setEditFavGroupObj, setDeleteFavGroupObj, setBulkFavGroupDialog,
    setGroupPostID, setEditGroupObj, setDeleteGroupObj, setDeleteGroupHistoryID, 
    setDeleteGroupHistoryFlag, setRevertGroupHistoryID, setRevertGroupHistoryFlag
} = groupDialogSlice.actions

export const useGroupDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        favGroupID: selector((state) => state.groupDialog.favGroupID),
        editFavGroupObj: selector((state) => state.groupDialog.editFavGroupObj),
        deleteFavGroupObj: selector((state) => state.groupDialog.deleteFavGroupObj),
        bulkFavGroupDialog: selector((state) => state.groupDialog.bulkFavGroupDialog),
        groupPostID: selector((state) => state.groupDialog.groupPostID),
        editGroupObj: selector((state) => state.groupDialog.editGroupObj),
        deleteGroupObj: selector((state) => state.groupDialog.deleteGroupObj),
        deleteGroupHistoryID: selector((state) => state.groupDialog.deleteGroupHistoryID),
        deleteGroupHistoryFlag: selector((state) => state.groupDialog.deleteGroupHistoryFlag),
        revertGroupHistoryID: selector((state) => state.groupDialog.revertGroupHistoryID),
        revertGroupHistoryFlag: selector((state) => state.groupDialog.revertGroupHistoryFlag)
    }
}

export const useGroupDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setFavGroupID: (state: any) => dispatch(setFavGroupID(state)),
        setEditFavGroupObj: (state: any) => dispatch(setEditFavGroupObj(state)),
        setDeleteFavGroupObj: (state: any) => dispatch(setDeleteFavGroupObj(state)),
        setBulkFavGroupDialog: (state: any) => dispatch(setBulkFavGroupDialog(state)),
        setGroupPostID: (state: any) => dispatch(setGroupPostID(state)),
        setEditGroupObj: (state: any) => dispatch(setEditGroupObj(state)),
        setDeleteGroupObj: (state: any) => dispatch(setDeleteGroupObj(state)),
        setDeleteGroupHistoryID: (state: any) => dispatch(setDeleteGroupHistoryID(state)),
        setDeleteGroupHistoryFlag: (state: any) => dispatch(setDeleteGroupHistoryFlag(state)),
        setRevertGroupHistoryID: (state: any) => dispatch(setRevertGroupHistoryID(state)),
        setRevertGroupHistoryFlag: (state: any) => dispatch(setRevertGroupHistoryFlag(state))
    }
}

export default groupDialogSlice.reducer