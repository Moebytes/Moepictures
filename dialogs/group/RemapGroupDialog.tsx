/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector,
useSessionActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const RemapGroupDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {remapGroupObj} = useGroupDialogSelector()
    const {setRemapGroupObj} = useGroupDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setGroupFlag} = useFlagActions()
    const [items, setItems] = useState("")
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()
    const controls = useDragControls()
    
    useEffect(() => {
        if (remapGroupObj) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setItems(remapGroupObj.posts.map((p) => p.postID).join(" "))
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [remapGroupObj])

    const remapGroup = async () => {
        if (!remapGroupObj) return
        if (permissions.isContributor(session)) {
            const postIDs = items.trim().split(/\s+/g)
            await functions.http.put("/api/group/remap", {slug: remapGroupObj.slug, postIDs}, session, setSessionFlag)
            setRemapGroupObj(null)
            setGroupFlag(true)
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
            const postIDs = items.trim().split(/\s+/g)
            await functions.http.post("/api/group/request", {name: remapGroupObj.name, postIDs, reason}, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            remapGroup()
        } else {
            setRemapGroupObj(null)
        }
    }

    const close = () => {
        setRemapGroupObj(null)
        setSubmitted(false)
        setReason("")
    }

    const mainJSX = () => {
        return (
            <>
            <div className="dialog-row">
                <textarea className="dialog-textarea" style={{resize: "vertical"}} spellCheck={false} value={items} onChange={(event) => setItems(event.target.value)}></textarea>
            </div>
            </>
        )
    }

    if (remapGroupObj) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "350px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.remapGroup.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.banText}</span>
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
                    className="dialog-box" style={{width: "350px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.remapGroup.title}</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.remap}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "350px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.remapGroup.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.editGroup.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                        </> : <>
                        {mainJSX()}
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

export default RemapGroupDialog