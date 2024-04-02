import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeleteTranslationHistoryIDContext, 
DeleteTranslationHistoryFlagContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/deletetranslationhistorydialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

const DeleteTranslationHistoryDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deleteTranslationHistoryID, setDeleteTranslationHistoryID} = useContext(DeleteTranslationHistoryIDContext)
    const {deleteTranslationHistoryFlag, setDeleteTranslationHistoryFlag} = useContext(DeleteTranslationHistoryFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Translation History"
    }, [])

    useEffect(() => {
        if (deleteTranslationHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteTranslationHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setDeleteTranslationHistoryFlag(true)
        } else {
            if (!keep) setDeleteTranslationHistoryID(null)
        }
    }

    const close = () => {
        setDeleteTranslationHistoryID(null)
    }

    if (deleteTranslationHistoryID?.failed) {
        return (
            <div className="delete-translation-history-dialog">
                <Draggable handle=".delete-translation-history-dialog-title-container">
                <div className="delete-translation-history-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="delete-translation-history-container">
                        <div className="delete-translation-history-dialog-title-container">
                            <span className="delete-translation-history-dialog-title">Delete Translation History</span>
                        </div>
                        <div className="delete-translation-history-dialog-row">
                            <span className="delete-translation-history-dialog-text">The current history state cannot be deleted.</span>
                        </div>
                        <div className="delete-translation-history-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (deleteTranslationHistoryID) {
        return (
            <div className="delete-translation-history-dialog">
                <Draggable handle=".delete-translation-history-dialog-title-container">
                <div className="delete-translation-history-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="delete-translation-history-container">
                        <div className="delete-translation-history-dialog-title-container">
                            <span className="delete-translation-history-dialog-title">Delete Translation History</span>
                        </div>
                        <div className="delete-translation-history-dialog-row">
                            <span className="delete-translation-history-dialog-text">Are you sure that you want to delete this history state?</span>
                        </div>
                        <div className="delete-translation-history-dialog-row">
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

export default DeleteTranslationHistoryDialog