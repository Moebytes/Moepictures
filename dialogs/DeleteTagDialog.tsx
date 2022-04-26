import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeleteTagIDContext, DeleteTagFlagContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/deletetagdialog.less"
import axios from "axios"

const DeleteTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deleteTagID, setDeleteTagID} = useContext(DeleteTagIDContext)
    const {deleteTagFlag, setDeleteTagFlag} = useContext(DeleteTagFlagContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Tag"
    }, [])

    useEffect(() => {
        if (deleteTagID) {
            document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteTagID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setDeleteTagFlag(true)
        } else {
            setDeleteTagID(null)
        }
    }

    if (deleteTagID) {
        return (
            <div className="deletetag-dialog">
                <div className="deletetag-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deletetag-container">
                        <span className="deletetag-dialog-title">Delete Tag</span>
                        <div className="deletetag-dialog-row">
                            <span className="deletetag-dialog-text">Are you sure that you want to delete this tag?</span>
                        </div>
                        <div className="deletetag-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"No"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Yes"}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export default DeleteTagDialog