/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useGroupDialogSelector, useGroupDialogActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import "../dialog.less"

const DeleteGroupDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteGroupObj} = useGroupDialogSelector()
    const {setDeleteGroupObj} = useGroupDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()
    const controls = useDragControls()

    useEffect(() => {
        if (deleteGroupObj) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deleteGroupObj])

    const deleteGroup = async () => {
        if (!deleteGroupObj) return
        if (permissions.isMod(session)) {
            await functions.http.delete("/api/group/delete", {slug: deleteGroupObj.slug}, session, setSessionFlag)
            navigate("/groups")
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
            await functions.http.post("/api/group/delete/request", {slug: deleteGroupObj.slug, reason}, session, setSessionFlag)
            setSubmitted(true)
        }
        setDeleteGroupObj(null)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteGroup()
        } else {
            setDeleteGroupObj(null)
        }
    }

    const close = () => {
        setDeleteGroupObj(null)
        setSubmitted(false)
        setReason("")
    }

    if (deleteGroupObj) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.deleteGroup.request}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.deleteGroup.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                    </motion.div>
                </div>
            )
        }

        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.deleteGroup.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.deleteGroup.header}</span>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.no}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.yes}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "500px", height: submitted ? "130px" : "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.deleteGroup.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteGroup.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteGroup.reasonHeader}</span>
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

export default DeleteGroupDialog