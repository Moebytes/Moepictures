import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeleteReplyIDContext, DeleteReplyFlagContext, 
HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
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
        document.title = "Moepictures: Delete Reply"
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
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete Reply</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Do you want to delete this reply?</span>
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

export default DeleteReplyDialog