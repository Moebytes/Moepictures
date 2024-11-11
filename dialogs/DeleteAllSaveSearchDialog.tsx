import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, DeleteAllSaveSearchDialogContext,
HideTitlebarContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const DeleteAllSaveSearchDialog: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deleteAllSaveSearchDialog, setDeleteAllSaveSearchDialog} = useContext(DeleteAllSaveSearchDialogContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete All Saved Searches"
    }, [])

    useEffect(() => {
        if (deleteAllSaveSearchDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteAllSaveSearchDialog])

    const deleteAllSavedSearches = async () => {
        await functions.delete("/api/user/savesearch/delete", {all: true}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteAllSavedSearches()
        }
        setDeleteAllSaveSearchDialog(false)
    }

    if (deleteAllSaveSearchDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "285px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete All Saved Searches</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Are you sure you want to delete all saved searches?</span>
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

export default DeleteAllSaveSearchDialog