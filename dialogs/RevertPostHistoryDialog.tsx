import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext,
RevertPostHistoryIDContext, RevertPostHistoryFlagContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

const RevertPostHistoryDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {revertPostHistoryID, setRevertPostHistoryID} = useContext(RevertPostHistoryIDContext)
    const {revertPostHistoryFlag, setRevertPostHistoryFlag} = useContext(RevertPostHistoryFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Revert Post History"
    }, [])

    useEffect(() => {
        if (revertPostHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [revertPostHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setRevertPostHistoryFlag(true)
        } else {
            if (!keep) setRevertPostHistoryID(null)
        }
    }

    const close = () => {
        setRevertPostHistoryID(null)
    }

    if (revertPostHistoryID?.failed === "img") {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Post History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Could not apply this state because you don't have permission to replace the image.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (revertPostHistoryID?.failed === "locked") {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Post History</span>
                        </div>
                        <span className="dialog-ban-text">This post is locked. Cannot revert history.</span>
                        <button className="dialog-ban-button" onClick={() => click("reject")}>
                            <span className="dialog-ban-button-text">←Back</span>
                        </button>
                    </div>
                </Draggable>
            </div>
        )
    }

    if (revertPostHistoryID?.failed) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Post History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">This is already the current history state.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (revertPostHistoryID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Revert Post History</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot revert history.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Post History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Are you sure that you want to revert back to this history state?</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"No"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Yes"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default RevertPostHistoryDialog