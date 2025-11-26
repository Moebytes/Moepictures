import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {HistoryID, Favgroup, GroupPosts} from "../types/Types"

interface GroupPostObj {
    postID: string
    group: GroupPosts
}

const groupDialogSlice = createSlice({
    name: "groupDialog",
    initialState: {
        favGroupID: null as string | null,
        addFavgroupPostObj: null as Favgroup | null,
        editFavGroupObj: null as Favgroup | null,
        deleteFavGroupObj: null as Favgroup | null,
        remapFavGroupObj: null as Favgroup | null,
        bulkFavGroupDialog: false,
        bulkGroupDialog: false,
        groupPostID: null as string | null,
        addGroupPostObj: null as GroupPosts | null,
        deleteGroupPostObj: null as GroupPostObj | null,
        editGroupObj: null as GroupPosts | null,
        deleteGroupObj: null as GroupPosts | null,
        remapGroupObj: null as GroupPosts | null,
        deleteGroupHistoryID: null as HistoryID | null,
        deleteGroupHistoryFlag: false,
        revertGroupHistoryID: null as HistoryID | null,
        revertGroupHistoryFlag: false
    },
    reducers: {
        setFavGroupID: (state, action) => {state.favGroupID = action.payload},
        setAddFavgroupPostObj: (state, action) => {state.addFavgroupPostObj = action.payload},
        setEditFavGroupObj: (state, action) => {state.editFavGroupObj = action.payload},
        setDeleteFavGroupObj: (state, action) => {state.deleteFavGroupObj = action.payload},
        setRemapFavGroupObj: (state, action) => {state.remapFavGroupObj = action.payload},
        setBulkFavGroupDialog: (state, action) => {state.bulkFavGroupDialog = action.payload},
        setBulkGroupDialog: (state, action) => {state.bulkGroupDialog = action.payload},
        setGroupPostID: (state, action) => {state.groupPostID = action.payload},
        setAddGroupPostObj: (state, action) => {state.addGroupPostObj = action.payload},
        setDeleteGroupPostObj: (state, action) => {state.deleteGroupPostObj = action.payload},
        setEditGroupObj: (state, action) => {state.editGroupObj = action.payload},
        setDeleteGroupObj: (state, action) => {state.deleteGroupObj = action.payload},
        setRemapGroupObj: (state, action) => {state.remapGroupObj = action.payload},
        setDeleteGroupHistoryID: (state, action) => {state.deleteGroupHistoryID = action.payload},
        setDeleteGroupHistoryFlag: (state, action) => {state.deleteGroupHistoryFlag = action.payload},
        setRevertGroupHistoryID: (state, action) => {state.revertGroupHistoryID = action.payload},
        setRevertGroupHistoryFlag: (state, action) => {state.revertGroupHistoryFlag = action.payload}
    }
})

const {
    setFavGroupID, setEditFavGroupObj, setDeleteFavGroupObj, setBulkFavGroupDialog,
    setGroupPostID, setEditGroupObj, setDeleteGroupObj, setDeleteGroupHistoryID, 
    setDeleteGroupHistoryFlag, setRevertGroupHistoryID, setRevertGroupHistoryFlag,
    setAddGroupPostObj, setDeleteGroupPostObj, setAddFavgroupPostObj,
    setBulkGroupDialog, setRemapFavGroupObj, setRemapGroupObj
} = groupDialogSlice.actions

export const useGroupDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        favGroupID: selector((state) => state.groupDialog.favGroupID),
        addFavgroupPostObj: selector((state) => state.groupDialog.addFavgroupPostObj),
        editFavGroupObj: selector((state) => state.groupDialog.editFavGroupObj),
        deleteFavGroupObj: selector((state) => state.groupDialog.deleteFavGroupObj),
        remapFavGroupObj: selector((state) => state.groupDialog.remapFavGroupObj),
        bulkFavGroupDialog: selector((state) => state.groupDialog.bulkFavGroupDialog),
        bulkGroupDialog: selector((state) => state.groupDialog.bulkGroupDialog),
        groupPostID: selector((state) => state.groupDialog.groupPostID),
        addGroupPostObj: selector((state) => state.groupDialog.addGroupPostObj),
        deleteGroupPostObj: selector((state) => state.groupDialog.deleteGroupPostObj),
        editGroupObj: selector((state) => state.groupDialog.editGroupObj),
        deleteGroupObj: selector((state) => state.groupDialog.deleteGroupObj),
        remapGroupObj: selector((state) => state.groupDialog.remapGroupObj),
        deleteGroupHistoryID: selector((state) => state.groupDialog.deleteGroupHistoryID),
        deleteGroupHistoryFlag: selector((state) => state.groupDialog.deleteGroupHistoryFlag),
        revertGroupHistoryID: selector((state) => state.groupDialog.revertGroupHistoryID),
        revertGroupHistoryFlag: selector((state) => state.groupDialog.revertGroupHistoryFlag)
    }
}

export const useGroupDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setFavGroupID: (state: string | null) => dispatch(setFavGroupID(state)),
        setAddFavgroupPostObj: (state: Favgroup | null) => dispatch(setAddFavgroupPostObj(state)),
        setEditFavGroupObj: (state: Favgroup | null) => dispatch(setEditFavGroupObj(state)),
        setDeleteFavGroupObj: (state: Favgroup | null) => dispatch(setDeleteFavGroupObj(state)),
        setRemapFavGroupObj: (state: Favgroup | null) => dispatch(setRemapFavGroupObj(state)),
        setBulkFavGroupDialog: (state: boolean) => dispatch(setBulkFavGroupDialog(state)),
        setBulkGroupDialog: (state: boolean) => dispatch(setBulkGroupDialog(state)),
        setGroupPostID: (state: string | null) => dispatch(setGroupPostID(state)),
        setAddGroupPostObj: (state: GroupPosts | null) => dispatch(setAddGroupPostObj(state)),
        setDeleteGroupPostObj: (state: GroupPostObj | null) => dispatch(setDeleteGroupPostObj(state)),
        setEditGroupObj: (state: GroupPosts | null) => dispatch(setEditGroupObj(state)),
        setDeleteGroupObj: (state: GroupPosts | null) => dispatch(setDeleteGroupObj(state)),
        setRemapGroupObj: (state: GroupPosts | null) => dispatch(setRemapGroupObj(state)),
        setDeleteGroupHistoryID: (state: HistoryID | null) => dispatch(setDeleteGroupHistoryID(state)),
        setDeleteGroupHistoryFlag: (state: boolean) => dispatch(setDeleteGroupHistoryFlag(state)),
        setRevertGroupHistoryID: (state: HistoryID | null) => dispatch(setRevertGroupHistoryID(state)),
        setRevertGroupHistoryFlag: (state: boolean) => dispatch(setRevertGroupHistoryFlag(state))
    }
}

export default groupDialogSlice.reducer