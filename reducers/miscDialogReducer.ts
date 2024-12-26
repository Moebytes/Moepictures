import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const miscDialogSlice = createSlice({
    name: "miscDialog",
    initialState: {
        showDownloadDialog: false,
        showPageDialog: false,
        showDeleteAccountDialog: false,
        banName: null as string | null,
        unbanName: null as string | null,
        promoteName: null as string | null,
        premiumRequired: false as string | boolean,
        r18Confirmation: false,
        disable2FADialog: false,
        disable2FAFlag: false
    },
    reducers: {
        setShowDownloadDialog: (state, action) => {state.showDownloadDialog = action.payload},
        setShowPageDialog: (state, action) => {state.showPageDialog = action.payload},
        setShowDeleteAccountDialog: (state, action) => {state.showDeleteAccountDialog = action.payload},
        setBanName: (state, action) => {state.banName = action.payload},
        setUnbanName: (state, action) => {state.unbanName = action.payload},
        setPromoteName: (state, action) => {state.promoteName = action.payload},
        setPremiumRequired: (state, action) => {state.premiumRequired = action.payload},
        setR18Confirmation: (state, action) => {state.r18Confirmation = action.payload},
        setDisable2FADialog: (state, action) => {state.disable2FADialog = action.payload},
        setDisable2FAFlag: (state, action) => {state.disable2FAFlag = action.payload}
    }
})

const {
    setShowDownloadDialog, setShowPageDialog, setShowDeleteAccountDialog,
    setBanName, setUnbanName, setPromoteName, setPremiumRequired,
    setR18Confirmation, setDisable2FADialog, setDisable2FAFlag
} = miscDialogSlice.actions

export const useMiscDialogSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        showDownloadDialog: selector((state) => state.miscDialog.showDownloadDialog),
        showPageDialog: selector((state) => state.miscDialog.showPageDialog),
        showDeleteAccountDialog: selector((state) => state.miscDialog.showDeleteAccountDialog),
        banName: selector((state) => state.miscDialog.banName),
        unbanName: selector((state) => state.miscDialog.unbanName),
        promoteName: selector((state) => state.miscDialog.promoteName),
        premiumRequired: selector((state) => state.miscDialog.premiumRequired),
        r18Confirmation: selector((state) => state.miscDialog.r18Confirmation),
        disable2FADialog: selector((state) => state.miscDialog.disable2FADialog),
        disable2FAFlag: selector((state) => state.miscDialog.disable2FAFlag)
    }
}

export const useMiscDialogActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setShowDownloadDialog: (state: boolean) => dispatch(setShowDownloadDialog(state)),
        setShowPageDialog: (state: boolean) => dispatch(setShowPageDialog(state)),
        setShowDeleteAccountDialog: (state: boolean) => dispatch(setShowDeleteAccountDialog(state)),
        setBanName: (state: string | null) => dispatch(setBanName(state)),
        setUnbanName: (state: string | null) => dispatch(setUnbanName(state)),
        setPromoteName: (state: string | null) => dispatch(setPromoteName(state)),
        setPremiumRequired: (state: string | boolean) => dispatch(setPremiumRequired(state)),
        setR18Confirmation: (state: boolean) => dispatch(setR18Confirmation(state)),
        setDisable2FADialog: (state: boolean) => dispatch(setDisable2FADialog(state)),
        setDisable2FAFlag: (state: boolean) => dispatch(setDisable2FAFlag(state))
    }
}

export default miscDialogSlice.reducer