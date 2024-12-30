import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {AliasHistoryID, HistoryID, TagHistory, Tag, TagType} from "../types/Types"

interface TagObj extends Partial<Omit<TagHistory, "featuredPost">> {
    tag: string
    featuredPost?: string | null
    failed?: boolean | string
}

interface CategorizeTagObj {
    tag: string
    type: TagType
}

const tagDialogSlice = createSlice({
    name: "tagDialog",
    initialState: {
        deleteTagHistoryID: null as HistoryID | null,
        deleteTagHistoryFlag: false,
        revertTagHistoryID: null as HistoryID | null,
        revertTagHistoryFlag: false,
        editTagObj: null as TagObj | null,
        editTagFlag: false,
        deleteTagID: null as string | null,
        deleteTagFlag: false,
        aliasTagID: null as string | null,
        aliasTagFlag: false,
        aliasTagName: "",
        takedownTag: null as Tag | TagHistory | null,
        categorizeTag: null as CategorizeTagObj | null,
        showBulkTagEditDialog: false,
        deleteAliasHistoryID: null as AliasHistoryID | null,
        deleteAliasHistoryFlag: false,
        revertAliasHistoryID: null as AliasHistoryID | null,
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
        setDeleteTagHistoryID: (state: HistoryID | null) => dispatch(setDeleteTagHistoryID(state)),
        setDeleteTagHistoryFlag: (state: boolean) => dispatch(setDeleteTagHistoryFlag(state)),
        setRevertTagHistoryID: (state: HistoryID | null) => dispatch(setRevertTagHistoryID(state)),
        setRevertTagHistoryFlag: (state: boolean) => dispatch(setRevertTagHistoryFlag(state)),
        setEditTagObj: (state: TagObj | null) => dispatch(setEditTagObj(state)),
        setEditTagFlag: (state: boolean) => dispatch(setEditTagFlag(state)),
        setDeleteTagID: (state: string | null) => dispatch(setDeleteTagID(state)),
        setDeleteTagFlag: (state: boolean) => dispatch(setDeleteTagFlag(state)),
        setAliasTagID: (state: string | null) => dispatch(setAliasTagID(state)),
        setAliasTagFlag: (state: boolean) => dispatch(setAliasTagFlag(state)),
        setAliasTagName: (state: string) => dispatch(setAliasTagName(state)),
        setTakedownTag: (state: Tag | TagHistory | null) => dispatch(setTakedownTag(state)),
        setCategorizeTag: (state: CategorizeTagObj | null) => dispatch(setCategorizeTag(state)),
        setShowBulkTagEditDialog: (state: boolean) => dispatch(setShowBulkTagEditDialog(state)),
        setDeleteAliasHistoryID: (state: AliasHistoryID | null) => dispatch(setDeleteAliasHistoryID(state)),
        setDeleteAliasHistoryFlag: (state: boolean) => dispatch(setDeleteAliasHistoryFlag(state)),
        setRevertAliasHistoryID: (state: AliasHistoryID | null) => dispatch(setRevertAliasHistoryID(state)),
        setRevertAliasHistoryFlag: (state: boolean) => dispatch(setRevertAliasHistoryFlag(state))
    }    
}

export default tagDialogSlice.reducer