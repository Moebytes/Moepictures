import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DMTargetContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import axios from "axios"

const DMDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {dmTarget, setDMTarget} = useContext(DMTargetContext)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Send Message"
    }, [])

    useEffect(() => {
        if (dmTarget) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [dmTarget])

    const sendMessage = async () => {
        try {
            const message = await axios.post("/api/message/create", {title, content, recipient: dmTarget}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true}).then((r) => r.data)
            setDMTarget(null)
            if (message.messageID) history.push(`/message/${message.messageID}`)
        } catch {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Bad title or content."
            await functions.timeout(2000)
            setError(false)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            sendMessage()
        } else {
            setDMTarget(null)
        }
    }

    if (dmTarget) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "500px", height: "420px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Send Message</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Title: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={title} onChange={(event) => setTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Content: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" style={{height: "200px"}} spellCheck={false} value={content} onChange={(event) => setContent(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Send"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default DMDialog