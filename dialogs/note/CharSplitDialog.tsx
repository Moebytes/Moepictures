/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useNoteDialogSelector, 
useNoteDialogActions, useSessionSelector} from "../../store"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const CharSplitDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {noteCharSplitDialog, noteCharSplitFlag} = useNoteDialogSelector()
    const {setNoteCharSplitDialog, setNoteCharSplitFlag} = useNoteDialogActions()
    const {session} = useSessionSelector()
    const [running, setRunning] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (noteCharSplitDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setRunning(false)
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [noteCharSplitDialog])

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            setNoteCharSplitFlag(true)
            setRunning(true)
        } else {
            setNoteCharSplitDialog(false)
        }
    }

    const close = () => {
        setRunning(false)
        setNoteCharSplitFlag(false)
        setNoteCharSplitDialog(false)
    }

    if (typeof noteCharSplitFlag === "string") {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "400px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.characterSplit.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.characterSplit.tagGroups}</span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea-static" contentEditable={false}
                            style={{resize: "vertical"}} value={noteCharSplitFlag.trim()}></textarea>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (noteCharSplitDialog) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "300px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.characterSplit.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.ocr.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                    </motion.div>
                </div>
            )
        }

        if (running) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "300px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.characterSplit.title}</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", alignItems: "center", height: "100%"}}>
                                <span className="dialog-text">{i18n.dialogs.characterSplit.running}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "300px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.characterSplit.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.characterSplit.header}</span>
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

export default CharSplitDialog