import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const miscDialogSlice = createSlice({
    name: "miscDialog",
    initialState: {
        showDownloadDialog: false,
        showPageDialog: false,
        showDeleteAccountDialog: false,
        banName: null as any,
        unbanName: null as any,
        promoteName: null as any,
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
        setShowDownloadDialog: (state: any) => dispatch(setShowDownloadDialog(state)),
        setShowPageDialog: (state: any) => dispatch(setShowPageDialog(state)),
        setShowDeleteAccountDialog: (state: any) => dispatch(setShowDeleteAccountDialog(state)),
        setBanName: (state: any) => dispatch(setBanName(state)),
        setUnbanName: (state: any) => dispatch(setUnbanName(state)),
        setPromoteName: (state: any) => dispatch(setPromoteName(state)),
        setPremiumRequired: (state: any) => dispatch(setPremiumRequired(state)),
        setR18Confirmation: (state: any) => dispatch(setR18Confirmation(state)),
        setDisable2FADialog: (state: any) => dispatch(setDisable2FADialog(state)),
        setDisable2FAFlag: (state: any) => dispatch(setDisable2FAFlag(state))
    }
}

export default miscDialogSlice.reducer