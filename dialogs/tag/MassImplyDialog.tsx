/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions,
useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import "../dialog.less"

const MassImplyDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {massImplyDialog} = useTagDialogSelector()
    const {setMassImplyDialog} = useTagDialogActions()
    const {setTagSearchFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [wildcard, setWildcard] = useState("")
    const [implyTo, setImplyTo] = useState("")
    const controls = useDragControls()

    useEffect(() => {
        if (massImplyDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setWildcard("")
            setImplyTo("")
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [massImplyDialog])

    const massImply = async () => {
        if (!massImplyDialog) return
        if (permissions.isAdmin(session)) {
            await functions.http.post("/api/tag/massimply", {wildcard, implyTo}, session, setSessionFlag)
            setTagSearchFlag(implyTo)
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            massImply()
            setMassImplyDialog(false)
        } else {
            setMassImplyDialog(false)
        }
    }

    if (massImplyDialog) {
        if (permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "360px", height: "300px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.massImply.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.massImply.header}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.massImply.wildcard}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={wildcard} onChange={(event) => setWildcard(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.massImply.implyTo}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={implyTo} onChange={(event) => setImplyTo(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button style={{backgroundColor: "var(--buttonBG)"}} onClick={() => click("accept")} className="dialog-button">{i18n.dialogs.massImply.title}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default MassImplyDialog