import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeletePostHistoryIDContext, 
DeletePostHistoryFlagContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/deleteposthistorydialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

const DeletePostHistoryDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deletePostHistoryID, setDeletePostHistoryID} = useContext(DeletePostHistoryIDContext)
    const {deletePostHistoryFlag, setDeletePostHistoryFlag} = useContext(DeletePostHistoryFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Post History"
    }, [])

    useEffect(() => {
        if (deletePostHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deletePostHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setDeletePostHistoryFlag(true)
        } else {
            if (!keep) setDeletePostHistoryID(null)
        }
    }

    const close = () => {
        setDeletePostHistoryID(null)
    }

    if (deletePostHistoryID?.failed) {
        return (
            <div className="deleteposthistory-dialog">
                <Draggable handle=".deleteposthistory-dialog-title-container">
                <div className="deleteposthistory-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deleteposthistory-container">
                        <div className="deleteposthistory-dialog-title-container">
                            <span className="deleteposthistory-dialog-title">Delete Post History</span>
                        </div>
                        <div className="deleteposthistory-dialog-row">
                            <span className="deleteposthistory-dialog-text">The current history state cannot be deleted.</span>
                        </div>
                        <div className="deleteposthistory-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (deletePostHistoryID) {
        return (
            <div className="deleteposthistory-dialog">
                <Draggable handle=".deleteposthistory-dialog-title-container">
                <div className="deleteposthistory-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deleteposthistory-container">
                        <div className="deleteposthistory-dialog-title-container">
                            <span className="deleteposthistory-dialog-title">Delete Post History</span>
                        </div>
                        <div className="deleteposthistory-dialog-row">
                            <span className="deleteposthistory-dialog-text">Are you sure that you want to delete this history state?</span>
                        </div>
                        <div className="deleteposthistory-dialog-row">
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

export default DeletePostHistoryDialog