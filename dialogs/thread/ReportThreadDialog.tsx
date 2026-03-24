/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useThreadDialogSelector, useThreadDialogActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const ReportThreadDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {reportThreadID} = useThreadDialogSelector()
    const {setReportThreadID} = useThreadDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (reportThreadID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [reportThreadID])


    const reportThread = async () => {
        if (!reportThreadID) return
        const badReason = functions.validation.validateReason(reason, i18n)
        if (badReason) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badReason
            await functions.timeout(2000)
            setError(false)
            return
        }
        await functions.http.post("/api/thread/report", {threadID: reportThreadID, reason}, session, setSessionFlag)
        setSubmitted(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            reportThread()
        } else {
            setReportThreadID(null)
        }
    }

    const close = () => {
        setReportThreadID(null)
        setSubmitted(false)
        setReason("")
    }

    if (reportThreadID) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.reportThread.title}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.reportThread.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.reportThread.header}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div> 
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.report}</button>
                        </div> </>}
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default ReportThreadDialog