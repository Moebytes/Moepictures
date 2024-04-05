import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditThreadIDContext, EditThreadFlagContext,
EditThreadTitleContext, EditThreadContentContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/editthreaddialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import axios from "axios"

const EditThreadDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editThreadID, setEditThreadID} = useContext(EditThreadIDContext)
    const {editThreadFlag, setEditThreadFlag} = useContext(EditThreadFlagContext)
    const {editThreadTitle, setEditThreadTitle} = useContext(EditThreadTitleContext)
    const {editThreadContent, setEditThreadContent} = useContext(EditThreadContentContext)
    const {session, setSession} = useContext(SessionContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Edit Thread"
    }, [])

    useEffect(() => {
        if (editThreadID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editThreadID])

    const editThread = async () => {
        setEditThreadFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editThread()
        } else {
            setEditThreadID(null)
        }
    }

    if (editThreadID) {
        return (
            <div className="editthread-dialog">
                <Draggable handle=".editthread-dialog-title-container">
                <div className="editthread-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="editthread-container">
                        <div className="editthread-dialog-title-container">
                            <span className="editthread-dialog-title">Edit Thread</span>
                        </div>
                        <div className="editthread-dialog-row">
                            <span className="editthread-dialog-text">Title: </span>
                            <input className="editthread-dialog-input" type="text" spellCheck={false} value={editThreadTitle} onChange={(event) => setEditThreadTitle(event.target.value)}/>
                        </div>
                        <div className="editthread-dialog-row">
                            <span className="editthread-dialog-text">Content: </span>
                        </div>
                        <div className="editthread-dialog-row">
                            <textarea className="editthread-textarea" spellCheck={false} value={editThreadContent} onChange={(event) => setEditThreadContent(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="editthread-dialog-validation-container"><span className="editthread-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="editthread-dialog-row">
                            <button onClick={() => click("reject")} className="editthread-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="editthread-button">{"Edit"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditThreadDialog