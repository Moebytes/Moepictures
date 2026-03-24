/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useThreadDialogSelector, useThreadDialogActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const DeleteThreadDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteThreadID} = useThreadDialogSelector()
    const {setDeleteThreadID, setDeleteThreadFlag} = useThreadDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (deleteThreadID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deleteThreadID])

    const deleteThread = async () => {
        setDeleteThreadFlag(true)
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deleteThread()
        } else {
            setDeleteThreadID(null)
        }
    }

    if (deleteThreadID) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.deleteThread.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteThread.header}</span>
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
    return null
}

export default DeleteThreadDialog