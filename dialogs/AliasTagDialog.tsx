import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

const AliasTagDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {aliasTagID, aliasTagName} = useTagDialogSelector()
    const {setAliasTagID, setAliasTagName, setAliasTagFlag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Alias Tag"
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
        if (permissions.isMod(session)){
            setAliasTagFlag(true)
        } else {
            const badReason = functions.validateReason(reason, i18n)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            try {
                await functions.post("/api/tag/aliasto/request", {tag: aliasTagID, aliasTo: aliasTagName, reason}, session, setSessionFlag)
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
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "250px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Alias Tag Request</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot submit a request.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "250px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Alias Tag</span>
                            </div>
                            <div className="dialog-center-row">
                                <span className="dialog-text">Alias To:</span>
                                <input className="dialog-input-taller" style={{width: "100px"}} type="text" spellCheck={false} value={aliasTagName} onChange={(event) => setAliasTagName(event.target.value)}/>
                            </div>
                            <div className="dialog-center-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Alias"}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Alias Tag Request</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-center-row">
                            <span className="dialog-text">Your alias request was submitted.</span>
                        </div>
                        <div className="dialog-center-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div> 
                        </> : <>
                        <div className="dialog-center-row">
                            <span className="dialog-text">Alias To:</span>
                            <input className="dialog-input-taller" style={{width: "100px"}} type="text" spellCheck={false} value={aliasTagName} onChange={(event) => setAliasTagName(event.target.value)}/>
                        </div>
                        <div className="dialog-center-row">
                            <span className="dialog-text">Reason:</span>
                            <input className="dialog-input-taller" style={{width: "100px"}} type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-center-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Submit"}</button>
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