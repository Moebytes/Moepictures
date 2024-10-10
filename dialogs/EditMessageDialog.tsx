import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditMessageIDContext, EditMessageFlagContext,
EditMessageTitleContext, EditMessageContentContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"

const EditMessageDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editMessageID, setEditMessageID} = useContext(EditMessageIDContext)
    const {editMessageFlag, setEditMessageFlag} = useContext(EditMessageFlagContext)
    const {editMessageTitle, setEditMessageTitle} = useContext(EditMessageTitleContext)
    const {editMessageContent, setEditMessageContent} = useContext(EditMessageContentContext)
    const {session, setSession} = useContext(SessionContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Edit Message"
    }, [])

    useEffect(() => {
        if (editMessageID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editMessageID])

    const editMessage = async () => {
        setEditMessageFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editMessage()
        } else {
            setEditMessageID(null)
        }
    }

    if (editMessageID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Edit Message</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Title: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={editMessageTitle} onChange={(event) => setEditMessageTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Content: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" style={{resize: "vertical", height: "330px"}} spellCheck={false} value={editMessageContent} onChange={(event) => setEditMessageContent(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
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

export default EditMessageDialog