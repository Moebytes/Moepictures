import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, usePostDialogSelector, usePostDialogActions, useSessionSelector, 
useSessionActions, useFlagActions} from "../store"
import {useThemeSelector} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import deleteIcon from "../assets/icons/delete.png"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const ParentDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {childPostObj} = usePostDialogSelector()
    const {setChildPostObj} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const [parentID, setParentID] = useState("")
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        if (childPostObj) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            setParentID(childPostObj.post.parentID || "")
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            setParentID("")
        }
    }, [childPostObj])

    const parent = async () => {
        if (permissions.isContributor(session)) {
            const data = {
                postID: childPostObj.post.postID,
                unverified: childPostObj.unverified,
                parentID
            }
            setChildPostObj(null)
            await functions.put("/api/post/quickedit", data, session, setSessionFlag)
            setPostFlag(true)
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
            const data = {
                postID: childPostObj.post.postID,
                unverified: childPostObj.unverified,
                parentID,
                reason
            }
            await functions.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            parent()
        } else {
            setChildPostObj(null)
        }
    }

    const close = () => {
        setChildPostObj(null)
        setSubmitted(false)
        setReason("")
    }

    if (childPostObj) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Add to Parent</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot parent.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "300px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Add to Parent</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Parent ID: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={parentID} onChange={(event) => setParentID(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Parent"}</button>
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
                <div className="dialog-box" style={{width: "300px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Add to Parent Request</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Your request was submitted.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text">Parent ID: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={parentID} onChange={(event) => setParentID(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Reason: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Submit Request"}</button>
                        </div> </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default ParentDialog