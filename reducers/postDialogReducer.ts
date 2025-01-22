import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {HistoryID, PostSearch, PostHistory, UnverifiedPost, MiniTag, TagGroupCategory} from "../types/Types"

interface TagEditID {
    post: PostSearch | PostHistory | UnverifiedPost, 
    order: number,
    unverified?: boolean, 
    artists: MiniTag[], 
    characters: MiniTag[], 
    series: MiniTag[], 
    meta: MiniTag[],
    tags: MiniTag[],
    tagGroups?: TagGroupCategory[]
}

interface PostEditID {
    post: PostSearch | PostHistory | UnverifiedPost, 
    unverified?: boolean
}

interface PrivateID {
    post: PostSearch | PostHistory | UnverifiedPost
    artists: MiniTag[]
}

interface UndeleteID {
    postID: string 
    unverified?: boolean
}

interface PostInfoID {
    post: PostSearch | PostHistory | UnverifiedPost, 
    order: number
}

const postDialogSlice = createSlice({
    name: "postDialog",
    initialState: {
        deletePostID: null as PostEditID | null,
        takedownPostID: null as PostEditID | null,
        deletePostHistoryID: null as HistoryID | null,
        deletePostHistoryFlag: false,
        revertPostHistoryID: null as HistoryID | null,
        revertPostHistoryFlag: false,
        lockPostID: null as PostEditID | null,
        privatePostID: null as PrivateID | null,
        tagEditID: null as TagEditID | null,
        sourceEditID: null as TagEditID | null,
        showBulkTagEditDialog: false,
        showBulkDeleteDialog: false,
        compressPostID: null as PostEditID | null,
        upscalePostID: null as PostEditID | null,
        childPostObj: null as PostEditID | null,
        undeletePostID: null as UndeleteID | null,
        permaDeletePostID: null as string | null,
        permaDeletePostFlag: false,
        permaDeleteAllDialog: false,
        appealPostID: null as string | null,
        postInfoID: null as PostInfoID | null,
        splitPostID: null as PostInfoID | null,
        joinPostID: null as PostEditID | null
    },
    reducers: {
        setDeletePostID: (state, action) => {state.deletePostID = action.payload},
        setTakedownPostID: (state, action) => {state.takedownPostID = action.payload},
        setDeletePostHistoryID: (state, action) => {state.deletePostHistoryID = action.payload},
        setDeletePostHistoryFlag: (state, action) => {state.deletePostHistoryFlag = action.payload},
        setRevertPostHistoryID: (state, action) => {state.revertPostHistoryID = action.payload},
        setRevertPostHistoryFlag: (state, action) => {state.revertPostHistoryFlag = action.payload},
        setLockPostID: (state, action) => {state.lockPostID = action.payload},
        setPrivatePostID: (state, action) => {state.privatePostID = action.payload},
        setTagEditID: (state, action) => {state.tagEditID = action.payload},
        setSourceEditID: (state, action) => {state.sourceEditID = action.payload},
        setShowBulkTagEditDialog: (state, action) => {state.showBulkTagEditDialog = action.payload},
        setShowBulkDeleteDialog: (state, action) => {state.showBulkDeleteDialog = action.payload},
        setCompressPostID: (state, action) => {state.compressPostID = action.payload},
        setUpscalePostID: (state, action) => {state.upscalePostID = action.payload},
        setChildPostObj: (state, action) => {state.childPostObj = action.payload},
        setUndeletePostID: (state, action) => {state.undeletePostID = action.payload},
        setPermaDeletePostID: (state, action) => {state.permaDeletePostID = action.payload},
        setPermaDeletePostFlag: (state, action) => {state.permaDeletePostFlag = action.payload},
        setPermaDeleteAllDialog: (state, action) => {state.permaDeleteAllDialog = action.payload},
        setAppealPostID: (state, action) => {state.appealPostID = action.payload},
        setPostInfoID: (state, action) => {state.postInfoID = action.payload},
        setSplitPostID: (state, action) => {state.splitPostID = action.payload},
        setJoinPostID: (state, action) => {state.joinPostID = action.payload}
    }
})

const {
    setDeletePostID, setTakedownPostID, setDeletePostHistoryID,
    setDeletePostHistoryFlag, setRevertPostHistoryID, setRevertPostHistoryFlag, 
    setLockPostID, setPrivatePostID, setTagEditID, setSourceEditID, setChildPostObj,
    setShowBulkTagEditDialog, setShowBulkDeleteDialog, setCompressPostID, setUpscalePostID,
    setUndeletePostID, setPermaDeletePostID, setPermaDeletePostFlag, setPermaDeleteAllDialog, 
    setAppealPostID, setPostInfoID, setSplitPostID, setJoinPostID
} = postDialogSlice.actions

export const usePostDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        deletePostID: selector((state) => state.postDialog.deletePostID),
        takedownPostID: selector((state) => state.postDialog.takedownPostID),
        deletePostHistoryID: selector((state) => state.postDialog.deletePostHistoryID),
        deletePostHistoryFlag: selector((state) => state.postDialog.deletePostHistoryFlag),
        revertPostHistoryID: selector((state) => state.postDialog.revertPostHistoryID),
        revertPostHistoryFlag: selector((state) => state.postDialog.revertPostHistoryFlag),
        lockPostID: selector((state) => state.postDialog.lockPostID),
        privatePostID: selector((state) => state.postDialog.privatePostID),
        tagEditID: selector((state) => state.postDialog.tagEditID),
        sourceEditID: selector((state) => state.postDialog.sourceEditID),
        showBulkTagEditDialog: selector((state) => state.postDialog.showBulkTagEditDialog),
        showBulkDeleteDialog: selector((state) => state.postDialog.showBulkDeleteDialog),
        compressPostID: selector((state) => state.postDialog.compressPostID),
        upscalePostID: selector((state) => state.postDialog.upscalePostID),
        childPostObj: selector((state) => state.postDialog.childPostObj),
        undeletePostID: selector((state) => state.postDialog.undeletePostID),
        permaDeletePostID: selector((state) => state.postDialog.permaDeletePostID),
        permaDeletePostFlag: selector((state) => state.postDialog.permaDeletePostFlag),
        permaDeleteAllDialog: selector((state) => state.postDialog.permaDeleteAllDialog),
        appealPostID: selector((state) => state.postDialog.appealPostID),
        postInfoID: selector((state) => state.postDialog.postInfoID),
        splitPostID: selector((state) => state.postDialog.splitPostID),
        joinPostID: selector((state) => state.postDialog.joinPostID)
    }
}

export const usePostDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setDeletePostID: (state: PostEditID | null) => dispatch(setDeletePostID(state)),
        setTakedownPostID: (state: PostEditID | null) => dispatch(setTakedownPostID(state)),
        setDeletePostHistoryID: (state: HistoryID | null) => dispatch(setDeletePostHistoryID(state)),
        setDeletePostHistoryFlag: (state: boolean) => dispatch(setDeletePostHistoryFlag(state)),
        setRevertPostHistoryID: (state: HistoryID | null) => dispatch(setRevertPostHistoryID(state)),
        setRevertPostHistoryFlag: (state: boolean) => dispatch(setRevertPostHistoryFlag(state)),
        setLockPostID: (state: PostEditID | null) => dispatch(setLockPostID(state)),
        setPrivatePostID: (state: PrivateID | null) => dispatch(setPrivatePostID(state)),
        setTagEditID: (state: TagEditID | null) => dispatch(setTagEditID(state)),
        setSourceEditID: (state: TagEditID | null) => dispatch(setSourceEditID(state)),
        setShowBulkTagEditDialog: (state: boolean) => dispatch(setShowBulkTagEditDialog(state)),
        setShowBulkDeleteDialog: (state: boolean) => dispatch(setShowBulkDeleteDialog(state)),
        setCompressPostID: (state: PostEditID | null) => dispatch(setCompressPostID(state)),
        setUpscalePostID: (state: PostEditID | null) => dispatch(setUpscalePostID(state)),
        setChildPostObj: (state: PostEditID | null) => dispatch(setChildPostObj(state)),
        setUndeletePostID: (state: UndeleteID | null) => dispatch(setUndeletePostID(state)),
        setPermaDeletePostID: (state: string | null) => dispatch(setPermaDeletePostID(state)),
        setPermaDeletePostFlag: (state: boolean) => dispatch(setPermaDeletePostFlag(state)),
        setPermaDeleteAllDialog: (state: boolean) => dispatch(setPermaDeleteAllDialog(state)),
        setAppealPostID: (state: string | null) => dispatch(setAppealPostID(state)),
        setPostInfoID: (state: PostInfoID | null) => dispatch(setPostInfoID(state)),
        setSplitPostID: (state: PostInfoID | null) => dispatch(setSplitPostID(state)),
        setJoinPostID: (state: PostEditID | null) => dispatch(setJoinPostID(state))
    }    
}

export default postDialogSlice.reducer