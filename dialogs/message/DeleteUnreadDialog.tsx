/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useThemeSelector, useInteractionActions, useMessageDialogSelector, 
useMessageDialogActions, useSessionSelector, useSessionActions,
useFlagActions} from "../../store"
import {motion, useDragControls} from "framer-motion"
import functions from "../../functions/Functions"
import "../dialog.less"

const DeleteUnreadDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteUnreadDialog} = useMessageDialogSelector()
    const {setDeleteUnreadDialog} = useMessageDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setMessageSearchFlag} = useFlagActions()
    const controls = useDragControls()

    useEffect(() => {
        if (deleteUnreadDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deleteUnreadDialog])

    const deleteUnread = async () => {
        await functions.http.delete("/api/message/deleteunread", null, session, setSessionFlag)
        setMessageSearchFlag("")
    }

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            await deleteUnread()
        } 
        setDeleteUnreadDialog(false)
    }

    if (deleteUnreadDialog) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "320px", height: "240px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.buttons.deleteUnread}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteUnread.header}</span>
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

export default DeleteUnreadDialog