/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useMiscDialogSelector, useMiscDialogActions, useActiveActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const DeleteAccountDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSidebarText} = useActiveActions()
    const {showDeleteAccountDialog} = useMiscDialogSelector()
    const {setShowDeleteAccountDialog} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const navigate = useNavigate()
    const controls = useDragControls()

    useEffect(() => {
        if (showDeleteAccountDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [showDeleteAccountDialog])

    const deleteAccount = async () => {
        await functions.http.delete("/api/user/delete", null, session, setSessionFlag)
        setSessionFlag(true)
        setTimeout(() => {
            navigate("/posts")
            setTimeout(() => {
                setSidebarText(i18n.sidebar.accountDeleted)
            }, 500)
        }, 500)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteAccount()
        }
        setShowDeleteAccountDialog(false)
    }

    if (showDeleteAccountDialog) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.buttons.deleteAccount}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text-small">
                                {i18n.dialogs.deleteAccount.header}<br/><br/>
                                {i18n.dialogs.deleteAccount.header2}<br/><br/>
                                {i18n.dialogs.deleteAccount.header3}<br/><br/>
                                {i18n.dialogs.deleteAccount.header4}
                            </span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.deleteAccount}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default DeleteAccountDialog