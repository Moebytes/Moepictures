import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeleteCommentIDContext, DeleteCommentFlagContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/deletecommentdialog.less"
import Draggable from "react-draggable"
import axios from "axios"

const DeleteCommentDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deleteCommentID, setDeleteCommentID} = useContext(DeleteCommentIDContext)
    const {deleteCommentFlag, setDeleteCommentFlag} = useContext(DeleteCommentFlagContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Comment"
    }, [])

    useEffect(() => {
        if (deleteCommentID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteCommentID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setDeleteCommentFlag(true)
        } else {
            setDeleteCommentID(null)
        }
    }

    if (deleteCommentID) {
        return (
            <div className="deletecomment-dialog">
                <Draggable handle=".deletecomment-dialog-title-container">
                <div className="deletecomment-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deletecomment-container">
                        <div className="deletecomment-dialog-title-container">
                            <span className="deletecomment-dialog-title">Delete Comment</span>
                        </div>
                        <div className="deletecomment-dialog-row">
                            <span className="deletecomment-dialog-text">Are you sure that you want to delete this comment?</span>
                        </div>
                        <div className="deletecomment-dialog-row">
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

export default DeleteCommentDialog