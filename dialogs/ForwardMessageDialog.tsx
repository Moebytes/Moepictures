import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, MessageFlagContext, 
ForwardMessageObjContext, HideTitlebarContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const ForwardMessageDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {forwardMessageObj, setForwardMessageObj} = useContext(ForwardMessageObjContext)
    const {messageFlag, setMessageFlag} = useContext(MessageFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [recipients, setRecipients] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Forward Message"
    }, [])

    useEffect(() => {
        if (forwardMessageObj) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            setRecipients(forwardMessageObj.recipients.join(" "))
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            setRecipients("")
        }
    }, [forwardMessageObj])

    const forwardMessage = async () => {
        let cleanedRecipients = recipients.split(/\s+/g).map((r: any) => r.trim())
        if (cleanedRecipients.length < 1) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "At least 1 recipient is required."
            await functions.timeout(2000)
            return setError(false)
        }
        if (cleanedRecipients.length > 5 && !permissions.isMod(session)) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "You can't send to more than 5 recipients."
            await functions.timeout(2000)
            return setError(false)
        }
        await functions.post("/api/message/forward", {messageID: forwardMessageObj.messageID, recipients: cleanedRecipients}, session, setSessionFlag)
        setForwardMessageObj(null)
        setMessageFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            forwardMessage()
        } else {
            setForwardMessageObj(null)
        }
    }

    if (forwardMessageObj) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "500px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Forward Message</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">You may add or remove recipients.</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Recipients: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" style={{resize: "vertical", height: "100px"}} spellCheck={false} value={recipients} onChange={(event) => setRecipients(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Forward"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default ForwardMessageDialog