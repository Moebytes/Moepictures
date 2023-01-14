import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext,
RevertTagHistoryIDContext, RevertTagHistoryFlagContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/reverttaghistorydialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

const RevertTagHistoryDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {revertTagHistoryID, setRevertTagHistoryID} = useContext(RevertTagHistoryIDContext)
    const {revertTagHistoryFlag, setRevertTagHistoryFlag} = useContext(RevertTagHistoryFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Revert Tag History"
    }, [])

    useEffect(() => {
        if (revertTagHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [revertTagHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setRevertTagHistoryFlag(true)
        } else {
            if (!keep) setRevertTagHistoryID(null)
        }
    }

    const close = () => {
        setRevertTagHistoryID(null)
    }

    if (revertTagHistoryID?.failed) {
        return (
            <div className="reverttaghistory-dialog">
                <Draggable handle=".reverttaghistory-dialog-title-container">
                <div className="reverttaghistory-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="reverttaghistory-container">
                        <div className="reverttaghistory-dialog-title-container">
                            <span className="reverttaghistory-dialog-title">Revert Tag History</span>
                        </div>
                        <div className="reverttaghistory-dialog-row">
                            <span className="reverttaghistory-dialog-text">This is already the current history state.</span>
                        </div>
                        <div className="reverttaghistory-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (revertTagHistoryID) {
        return (
            <div className="reverttaghistory-dialog">
                <Draggable handle=".reverttaghistory-dialog-title-container">
                <div className="reverttaghistory-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="reverttaghistory-container">
                        <div className="reverttaghistory-dialog-title-container">
                            <span className="reverttaghistory-dialog-title">Revert Tag History</span>
                        </div>
                        <div className="reverttaghistory-dialog-row">
                            <span className="reverttaghistory-dialog-text">Are you sure that you want to revert back to this history state?</span>
                        </div>
                        <div className="reverttaghistory-dialog-row">
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

export default RevertTagHistoryDialog