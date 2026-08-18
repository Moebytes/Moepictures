/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, 
useTagDialogSelector, useTagDialogActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const DeleteAliasHistoryDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteAliasHistoryID} = useTagDialogSelector()
    const {setDeleteAliasHistoryID, setDeleteAliasHistoryFlag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (deleteAliasHistoryID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            functions.dom.changeTitle(getTitle(), i18n)
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deleteAliasHistoryID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setDeleteAliasHistoryFlag(true)
        } else {
            setDeleteAliasHistoryID(null)
        }
    }

    const getTitle = () => {
        if (!deleteAliasHistoryID) return
        if (deleteAliasHistoryID.type === "alias" || deleteAliasHistoryID.type === "undo alias") {
            return i18n.dialogs.deleteAliasHistory.aliasTitle
        } else if (deleteAliasHistoryID.type === "implication" || deleteAliasHistoryID.type === "undo implication") {
            return i18n.dialogs.deleteAliasHistory.implicationTitle
        }
    }

    if (deleteAliasHistoryID) {
        if (permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "270px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.deleteGroupHistory.header}</span>
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

export default DeleteAliasHistoryDialog