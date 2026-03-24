/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogActions, usePostDialogSelector, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const PermaDeleteAllPostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {permaDeleteAllDialog} = usePostDialogSelector()
    const {setPermaDeleteAllDialog} = usePostDialogActions()
    const {setHistoryFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (permaDeleteAllDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [permaDeleteAllDialog])

    const emptyRecycleBin = async () => {
        if (permissions.isAdmin(session)) {
            functions.http.delete("/api/post/emptybin", null, session, setSessionFlag)
        }
        setHistoryFlag(true)
        setPermaDeleteAllDialog(false)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            emptyRecycleBin()
        } else {
            setPermaDeleteAllDialog(false)
        }
    }

    if (permaDeleteAllDialog) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "285px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.permaDeleteAllPost.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.permaDeleteAllPost.header}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} style={{backgroundColor: "var(--deletedColor)"}} 
                            className="dialog-button">{i18n.buttons.deleteAll}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default PermaDeleteAllPostDialog