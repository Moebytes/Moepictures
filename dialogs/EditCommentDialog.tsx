import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditCommentIDContext, EditCommentFlagContext, 
EditCommentTextContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/editcommentdialog.less"
import Draggable from "react-draggable"
import axios from "axios"

const EditCommentDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editCommentID, setEditCommentID} = useContext(EditCommentIDContext)
    const {editCommentFlag, setEditCommentFlag} = useContext(EditCommentFlagContext)
    const {editCommentText, setEditCommentText} = useContext(EditCommentTextContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Edit Comment"
    }, [])

    useEffect(() => {
        if (editCommentID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editCommentID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setEditCommentFlag(true)
        } else {
            setEditCommentID(null)
        }
    }

    if (editCommentID) {
        return (
            <div className="editcomment-dialog">
                <Draggable handle=".editcomment-dialog-title-container">
                <div className="editcomment-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="editcomment-container">
                        <div className="editcomment-dialog-title-container">
                            <span className="editcomment-dialog-title">Edit Comment</span>
                        </div>
                        <div className="editcomment-dialog-row">
                            <textarea className="editcomment-textarea" spellCheck={false} value={editCommentText} onChange={(event) => setEditCommentText(event.target.value)}></textarea>
                        </div>
                        <div className="editcomment-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Edit"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditCommentDialog