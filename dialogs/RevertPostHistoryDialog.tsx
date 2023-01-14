import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext,
RevertPostHistoryIDContext, RevertPostHistoryFlagContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/revertposthistorydialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

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
        document.title = "Moebooru: Revert Post History"
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
            <div className="revertposthistory-dialog">
                <Draggable handle=".revertposthistory-dialog-title-container">
                <div className="revertposthistory-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="revertposthistory-container">
                        <div className="revertposthistory-dialog-title-container">
                            <span className="revertposthistory-dialog-title">Revert Post History</span>
                        </div>
                        <div className="revertposthistory-dialog-row">
                            <span className="revertposthistory-dialog-text">Could not apply this state because you don't have permission to replace the image.</span>
                        </div>
                        <div className="revertposthistory-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (revertPostHistoryID?.failed) {
        return (
            <div className="revertposthistory-dialog">
                <Draggable handle=".revertposthistory-dialog-title-container">
                <div className="revertposthistory-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="revertposthistory-container">
                        <div className="revertposthistory-dialog-title-container">
                            <span className="revertposthistory-dialog-title">Revert Post History</span>
                        </div>
                        <div className="revertposthistory-dialog-row">
                            <span className="revertposthistory-dialog-text">This is already the current history state.</span>
                        </div>
                        <div className="revertposthistory-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (revertPostHistoryID) {
        return (
            <div className="revertposthistory-dialog">
                <Draggable handle=".revertposthistory-dialog-title-container">
                <div className="revertposthistory-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="revertposthistory-container">
                        <div className="revertposthistory-dialog-title-container">
                            <span className="revertposthistory-dialog-title">Revert Post History</span>
                        </div>
                        <div className="revertposthistory-dialog-row">
                            <span className="revertposthistory-dialog-text">Are you sure that you want to revert back to this history state?</span>
                        </div>
                        <div className="revertposthistory-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"No"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Yes"}</button>
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