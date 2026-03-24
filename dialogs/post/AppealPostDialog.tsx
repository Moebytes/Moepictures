/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const AppealPostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {appealPostID} = usePostDialogSelector()
    const {setAppealPostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const [reason, setReason] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (appealPostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [appealPostID])

    const appealPost = async () => {
        if (!appealPostID) return
        await functions.http.post("/api/post/appeal", {postID: appealPostID, reason}, session, setSessionFlag)
        setAppealPostID(null)
        setPostFlag(appealPostID)
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            appealPost()
        } else {
            setAppealPostID(null)
        }
    }


    if (appealPostID) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "500px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.appealPost.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text-small">{i18n.dialogs.appealPost.header}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.appeal}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
        
    }
    return null
}

export default AppealPostDialog