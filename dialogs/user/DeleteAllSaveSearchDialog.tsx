/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useSearchDialogSelector, useSearchDialogActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const DeleteAllSaveSearchDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteAllSaveSearchDialog} = useSearchDialogSelector()
    const {setDeleteAllSaveSearchDialog} = useSearchDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const controls = useDragControls()

    useEffect(() => {
        if (deleteAllSaveSearchDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deleteAllSaveSearchDialog])

    const deleteAllSavedSearches = async () => {
        await functions.http.delete("/api/user/savesearch/delete", {all: true}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteAllSavedSearches()
        }
        setDeleteAllSaveSearchDialog(false)
    }

    if (deleteAllSaveSearchDialog) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "285px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.deleteAllSaveSearch.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteAllSaveSearch.header}</span>
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

export default DeleteAllSaveSearchDialog