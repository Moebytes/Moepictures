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
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
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
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.sidebar.addParent
    }, [i18n])

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
                type: childPostObj.post.type,
                rating: childPostObj.post.rating,
                style: childPostObj.post.style,
                unverified: childPostObj.unverified,
                parentID
            }
            setChildPostObj(null)
            await functions.put("/api/post/quickedit", data, session, setSessionFlag)
            setPostFlag(true)
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
            const data = {
                postID: childPostObj.post.postID,
                type: childPostObj.post.type,
                rating: childPostObj.post.rating,
                style: childPostObj.post.style,
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
                                <span className="dialog-title">{i18n.sidebar.addParent}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.parent.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
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
                                <span className="dialog-title">{i18n.sidebar.addParent}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.parentID}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={parentID} onChange={(event) => setParentID(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.sort.parent}</button>
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
                            <span className="dialog-title">{i18n.dialogs.parent.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.group.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.parentID}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={parentID} onChange={(event) => setParentID(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submitRequest}</button>
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