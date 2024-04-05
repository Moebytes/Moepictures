import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeleteReplyIDContext, DeleteReplyFlagContext, 
HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/deletereplydialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import axios from "axios"

const DeleteReplyDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deleteReplyID, setDeleteReplyID} = useContext(DeleteReplyIDContext)
    const {deleteReplyFlag, setDeleteReplyFlag} = useContext(DeleteReplyFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Reply"
    }, [])

    useEffect(() => {
        if (deleteReplyID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteReplyID])

    const deleteReply = async () => {
        setDeleteReplyFlag(true)
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deleteReply()
        } else {
            setDeleteReplyID(null)
        }
    }

    if (deleteReplyID) {
        return (
            <div className="deletereply-dialog">
                <Draggable handle=".deletereply-dialog-title-container">
                <div className="deletereply-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deletereply-container">
                        <div className="deletereply-dialog-title-container">
                            <span className="deletereply-dialog-title">Delete Reply</span>
                        </div>
                        <div className="deletereply-dialog-row">
                            <span className="deletereply-dialog-text">Do you want to delete this reply?</span>
                        </div>
                        <div className="deletereply-dialog-row">
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

export default DeleteReplyDialog