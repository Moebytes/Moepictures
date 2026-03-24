/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useTagDialogSelector, useTagDialogActions, useSessionSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const RevertAliasHistoryDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {revertAliasHistoryID} = useTagDialogSelector()
    const {setRevertAliasHistoryID, setRevertAliasHistoryFlag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (revertAliasHistoryID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            document.title = getTitle() || ""
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [revertAliasHistoryID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setRevertAliasHistoryFlag(true)
        } else {
            setRevertAliasHistoryID(null)
        }
    }

    const getTitle = () => {
        if (!revertAliasHistoryID) return
        if (revertAliasHistoryID.type === "alias") {
            return i18n.dialogs.revertAliasHistory.undoAliasTitle
        } else if (revertAliasHistoryID.type === "undo alias") {
            return i18n.dialogs.revertAliasHistory.redoAliasTitle
        } else if (revertAliasHistoryID.type === "implication") {
            return i18n.dialogs.revertAliasHistory.undoImplicationTitle
        } else if (revertAliasHistoryID.type === "undo implication") {
            return i18n.dialogs.revertAliasHistory.redoImplicationTitle
        }
    }
    const getDescription = () => {
        if (!revertAliasHistoryID) return
        if (revertAliasHistoryID.type === "alias") {
            return i18n.dialogs.revertAliasHistory.undoAliasHeading
        } else if (revertAliasHistoryID.type === "undo alias") {
            return i18n.dialogs.revertAliasHistory.redoAliasHeading
        } else if (revertAliasHistoryID.type === "implication") {
            return i18n.dialogs.revertAliasHistory.undoImplicationHeading
        } else if (revertAliasHistoryID.type === "undo implication") {
            return i18n.dialogs.revertAliasHistory.redoImplicationHeading
        }
    }

    if (revertAliasHistoryID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{getDescription()}</span>
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

export default RevertAliasHistoryDialog