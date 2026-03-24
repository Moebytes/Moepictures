/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useThreadDialogSelector, useThreadDialogActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import "../dialog.less"

const DeleteReplyDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteReplyID} = useThreadDialogSelector()
    const {setDeleteReplyID, setDeleteReplyFlag} = useThreadDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (deleteReplyID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deleteReplyID])

    const deleteReply = async () => {
        setDeleteReplyFlag(true)
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deleteReply()
        } else {
            setDeleteReplyID(null)
        }
    }

    if (deleteReplyID) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.deleteReply.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteReply.header}</span>
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

export default DeleteReplyDialog