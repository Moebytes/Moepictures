/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import "../dialog.less"

const TakedownTagDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {takedownTag} = useTagDialogSelector()
    const {setTakedownTag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const controls = useDragControls()

    useEffect(() => {
        if (takedownTag) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [takedownTag])

    const takedown = async () => {
        if (!takedownTag) return
        if (permissions.isMod(session)) {
            await functions.http.post("/api/tag/takedown", {tag: takedownTag.tag}, session, setSessionFlag)
            history.go(0)
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            takedown()
            setTakedownTag(null)
        } else {
            setTakedownTag(null)
        }
    }

    const close = () => {
        setTakedownTag(null)
        setSubmitted(false)
        setReason("")
    }

    const getTitle = () => {
        if (!takedownTag) return
        if (takedownTag.banned) {
            return i18n.dialogs.takedownTag.restoreTitle
        } else {
            return i18n.dialogs.takedownTag.title
        }
    }

    const getPrompt = () => {
        if (!takedownTag) return
        if (takedownTag.banned) {
            return i18n.dialogs.takedownTag.restoreHeader
        } else {
            return i18n.dialogs.takedownTag.header
        }
    }

    if (takedownTag) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{getPrompt()}</span>
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
    }
    return null
}

export default TakedownTagDialog