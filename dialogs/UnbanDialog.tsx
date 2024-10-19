import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, UnbanNameContext, HideTitlebarContext, UpdateUserFlagContext,
SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const UnbanDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {unbanName, setUnbanName} = useContext(UnbanNameContext)
    const {updateUserFlag, setUpdateUserFlag} = useContext(UpdateUserFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Unban User"
    }, [])

    useEffect(() => {
        if (unbanName) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [unbanName])


    const unban = async () => {
        if (!permissions.isMod(session)) return setUnbanName(null)
        await functions.post("/api/user/unban", {username: unbanName, reason}, session, setSessionFlag)
        setUnbanName(null)
        setUpdateUserFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            unban()
        } else {
            setUnbanName(null)
        }
    }

    if (unbanName) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Unban User</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Do you want to unban this user?</span>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Unban"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default UnbanDialog