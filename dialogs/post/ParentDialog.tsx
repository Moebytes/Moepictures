/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useReducer} from "react"
import {useInteractionActions, usePostDialogSelector, usePostDialogActions, useSessionSelector, 
useSessionActions, useFlagActions} from "../../store"
import {useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

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
    const controls = useDragControls()

    useEffect(() => {
        if (childPostObj) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setParentID(childPostObj.post.parentID || "")
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
            setParentID("")
        }
    }, [childPostObj])

    const parent = async () => {
        if (!childPostObj) return
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
            await functions.http.put("/api/post/quickedit", data, session, setSessionFlag)
            setPostFlag(childPostObj.post.postID)
        } else {
            const badReason = functions.validation.validateReason(reason, i18n)
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
            functions.http.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
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
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.sidebar.addParent}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.parent.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </motion.div>
                </div>
            )
        }

        if (permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "300px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
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
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "300px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
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
                </motion.div>
            </div>
        )
    }
    return null
}

export default ParentDialog