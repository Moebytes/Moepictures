import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

interface SessionData {
    cookie: any
    username: string
    email: string
    joinDate: string
    image: string | null
    imageHash: string | null
    imagePost: string | null
    bio: string 
    emailVerified: boolean
    publicFavorites: boolean
    showRelated: boolean
    showTooltips: boolean
    showTagBanner: boolean
    downloadPixivID: boolean
    autosearchInterval: number
    upscaledImages: boolean
    savedSearches: string
    showR18: boolean
    premiumExpiration: string
    banExpiration: string
    $2fa: boolean
    role: string
    captchaNeeded: boolean
    csrfToken: string
    banned: boolean
    publicKey: string
}

const sessionSlice = createSlice({
    name: "session",
    initialState: {
        session: {} as SessionData,
        sessionFlag: false,
        userImg: "",
        userImgPost: "",
        hasNotification: false
    },
    reducers: {
        setSession: (state, action) => {state.session = action.payload},
        setSessionFlag: (state, action) => {state.sessionFlag = action.payload},
        setUserImg: (state, action) => {state.userImg = action.payload},
        setUserImgPost: (state, action) => {state.userImgPost = action.payload},
        setHasNotification: (state, action) => {state.hasNotification = action.payload}
    }    
})

const {setSession, setSessionFlag, setUserImg, setUserImgPost, setHasNotification} = sessionSlice.actions

export const useSessionSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        session: selector((state) => state.session.session),
        sessionFlag: selector((state) => state.session.sessionFlag),
        userImg: selector((state) => state.session.userImg),
        userImgPost: selector((state) => state.session.userImgPost),
        hasNotification: selector((state) => state.session.hasNotification)
    }
}

export const useSessionActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setSession: (state: any) => dispatch(setSession(state)),
        setSessionFlag: (state: any) => dispatch(setSessionFlag(state)),
        setUserImg: (state: any) => dispatch(setUserImg(state)),
        setUserImgPost: (state: any) => dispatch(setUserImgPost(state)),
        setHasNotification: (state: any) => dispatch(setHasNotification(state))
    }
}

export default sessionSlice.reducer