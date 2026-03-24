/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, 
useGroupDialogActions, useSessionSelector} from "../../store"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const RevertGroupHistoryDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {revertGroupHistoryID} = useGroupDialogSelector()
    const {setRevertGroupHistoryID, setRevertGroupHistoryFlag} = useGroupDialogActions()
    const {session} = useSessionSelector()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (revertGroupHistoryID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [revertGroupHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setRevertGroupHistoryFlag(true)
        } else {
            if (!keep) setRevertGroupHistoryID(null)
        }
    }

    const close = () => {
        setRevertGroupHistoryID(null)
    }

    if (revertGroupHistoryID?.failed) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.revertGroupHistory.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.revertGroupHistory.currentState}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (revertGroupHistoryID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.revertGroupHistory.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.revertGroupHistory.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.revertGroupHistory.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.revertGroupHistory.header}</span>
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

export default RevertGroupHistoryDialog