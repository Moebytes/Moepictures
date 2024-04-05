import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditReplyIDContext, EditReplyFlagContext,
EditReplyContentContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/editreplydialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import axios from "axios"

const EditReplyDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editReplyID, setEditReplyID} = useContext(EditReplyIDContext)
    const {editReplyFlag, setEditReplyFlag} = useContext(EditReplyFlagContext)
    const {editReplyContent, setEditReplyContent} = useContext(EditReplyContentContext)
    const {session, setSession} = useContext(SessionContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Edit Reply"
    }, [])

    useEffect(() => {
        if (editReplyID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editReplyID])

    const editReply = async () => {
        setEditReplyFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editReply()
        } else {
            setEditReplyID(null)
        }
    }

    if (editReplyID) {
        return (
            <div className="editreply-dialog">
                <Draggable handle=".editreply-dialog-title-container">
                <div className="editreply-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="editreply-container">
                        <div className="editreply-dialog-title-container">
                            <span className="editreply-dialog-title">Edit Reply</span>
                        </div>
                        <div className="editreply-dialog-row">
                            <span className="editreply-dialog-text">Content: </span>
                        </div>
                        <div className="editreply-dialog-row">
                            <textarea className="editreply-textarea" spellCheck={false} value={editReplyContent} onChange={(event) => setEditReplyContent(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="editreply-dialog-validation-container"><span className="editreply-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="editreply-dialog-row">
                            <button onClick={() => click("reject")} className="editreply-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="editreply-button">{"Edit"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditReplyDialog