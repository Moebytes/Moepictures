import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, AliasTagIDContext, 
AliasTagFlagContext, AliasTagNameContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/aliastagdialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

const AliasTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {aliasTagID, setAliasTagID} = useContext(AliasTagIDContext)
    const {aliasTagFlag, setAliasTagFlag} = useContext(AliasTagFlagContext)
    const {aliasTagName, setAliasTagName} = useContext(AliasTagNameContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Alias Tag"
    }, [])

    useEffect(() => {
        if (aliasTagID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [aliasTagID])

    const aliasTag = async () => {
        if (permissions.isStaff(session)){
            setAliasTagFlag(true)
        } else {
            const badReason = functions.validateReason(reason)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            try {
                await axios.post("/api/tag/aliasto/request", {tag: aliasTagID, aliasTo: aliasTagName, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
                setSubmitted(true)
            } catch {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = "Bad tag."
                await functions.timeout(2000)
                setError(false)
                return
            }
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            aliasTag()
        } else {
            setAliasTagID(null)
        }
    }

    const close = () => {
        setAliasTagID(null)
        setSubmitted(false)
        setReason("")
    }

    if (aliasTagID) {
        if (permissions.isStaff(session)) {
            return (
                <div className="aliastag-dialog">
                    <Draggable handle=".aliastag-dialog-title-container">
                    <div className="aliastag-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="aliastag-container">
                            <div className="aliastag-dialog-title-container">
                                <span className="aliastag-dialog-title">Alias Tag</span>
                            </div>
                            <div className="aliastag-dialog-row">
                                <span className="aliastag-dialog-text">Alias To:</span>
                                <input className="aliastag-dialog-input" type="text" spellCheck={false} value={aliasTagName} onChange={(event) => setAliasTagName(event.target.value)}/>
                            </div>
                            <div className="aliastag-dialog-row">
                                <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="download-button">{"Alias"}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="aliastag-dialog">
                <Draggable handle=".aliastag-dialog-title-container">
                <div className="aliastag-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="aliastag-container">
                        <div className="aliastag-dialog-title-container">
                            <span className="aliastag-dialog-title">Alias Tag Request</span>
                        </div>
                        {submitted ? <>
                        <div className="aliastag-dialog-row">
                            <span className="aliastag-dialog-text">Your alias request was submitted.</span>
                        </div>
                        <div className="aliastag-dialog-row">
                            <button onClick={() => close()} className="download-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="download-button">{"OK"}</button>
                        </div> 
                        </> : <>
                        <div className="aliastag-dialog-row">
                            <span className="aliastag-dialog-text">Alias To:</span>
                            <input className="aliastag-dialog-input" type="text" spellCheck={false} value={aliasTagName} onChange={(event) => setAliasTagName(event.target.value)}/>
                        </div>
                        <div className="aliastag-dialog-row">
                            <span className="aliastag-dialog-text">Reason:</span>
                            <input className="aliastag-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="aliastag-dialog-validation-container"><span className="aliastag-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="aliastag-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Submit Request"}</button>
                        </div> </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default AliasTagDialog