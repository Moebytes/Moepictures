import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditCommentIDContext, EditCommentFlagContext, 
EditCommentTextContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
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
        document.title = "Edit Comment"
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
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "400px", height: "250px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Edit Comment</span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" style={{height: "140px"}} spellCheck={false} value={editCommentText} onChange={(event) => setEditCommentText(event.target.value)}></textarea>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Edit"}</button>
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