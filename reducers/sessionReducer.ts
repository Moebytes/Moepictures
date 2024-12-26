import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"
import {Session} from "../types/Types"

const sessionSlice = createSlice({
    name: "session",
    initialState: {
        session: {} as Session,
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
        setSession: (state: Session) => dispatch(setSession(state)),
        setSessionFlag: (state: boolean) => dispatch(setSessionFlag(state)),
        setUserImg: (state: string) => dispatch(setUserImg(state)),
        setUserImgPost: (state: string) => dispatch(setUserImgPost(state)),
        setHasNotification: (state: boolean) => dispatch(setHasNotification(state))
    }
}

export default sessionSlice.reducer