import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeleteThreadIDContext, DeleteThreadFlagContext, 
HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/deletethreaddialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import axios from "axios"

const DeleteThreadDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deleteThreadID, setDeleteThreadID} = useContext(DeleteThreadIDContext)
    const {deleteThreadFlag, setDeleteThreadFlag} = useContext(DeleteThreadFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Thread"
    }, [])

    useEffect(() => {
        if (deleteThreadID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteThreadID])

    const deleteThread = async () => {
        setDeleteThreadFlag(true)
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deleteThread()
        } else {
            setDeleteThreadID(null)
        }
    }

    if (deleteThreadID) {
        return (
            <div className="deletethread-dialog">
                <Draggable handle=".deletethread-dialog-title-container">
                <div className="deletethread-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deletethread-container">
                        <div className="deletethread-dialog-title-container">
                            <span className="deletethread-dialog-title">Delete Thread</span>
                        </div>
                        <div className="deletethread-dialog-row">
                            <span className="deletethread-dialog-text">Do you want to delete this thread?</span>
                        </div>
                        <div className="deletethread-dialog-row">
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

export default DeleteThreadDialog