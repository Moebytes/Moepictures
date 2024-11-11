import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, EnableDragContext,
RevertGroupHistoryIDContext, RevertGroupHistoryFlagContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

const RevertGroupHistoryDialog: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {revertGroupHistoryID, setRevertGroupHistoryID} = useContext(RevertGroupHistoryIDContext)
    const {revertGroupHistoryFlag, setRevertGroupHistoryFlag} = useContext(RevertGroupHistoryFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Revert Group History"
    }, [])

    useEffect(() => {
        if (revertGroupHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [revertGroupHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setRevertGroupHistoryFlag(true)
        } else {
            if (!keep) setRevertGroupHistoryID(null)
        }
    }

    const close = () => {
        setRevertGroupHistoryID(null)
    }

    if (revertGroupHistoryID?.failed) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Group History</span>
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

    if (revertGroupHistoryID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Revert Group History</span>
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
                            <span className="dialog-title">Revert Group History</span>
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

export default RevertGroupHistoryDialog