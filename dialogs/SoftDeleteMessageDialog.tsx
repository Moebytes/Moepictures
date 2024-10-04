import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, SoftDeleteMessageIDContext, SoftDeleteMessageFlagContext, 
HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"

const SoftDeleteMessageDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {softDeleteMessageID, setSoftDeleteMessageID} = useContext(SoftDeleteMessageIDContext)
    const {softDeleteMessageFlag, setSoftDeleteMessageFlag} = useContext(SoftDeleteMessageFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Soft Delete Message"
    }, [])

    useEffect(() => {
        if (softDeleteMessageID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [softDeleteMessageID])

    const softDeleteMessage = async () => {
        setSoftDeleteMessageFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            softDeleteMessage()
        } else {
            setSoftDeleteMessageID(null)
        }
    }

    if (softDeleteMessageID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "320px", height: "240px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Soft Delete Message</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Do you want to soft delete this message from your inbox? (It will appear again if the other recipient replies).</span>
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

export default SoftDeleteMessageDialog