import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useNoteDialogSelector, useNoteDialogActions, useSessionSelector} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"

const OCRDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {noteOCRDialog} = useNoteDialogSelector()
    const {setNoteOCRDialog, setNoteOCRFlag} = useNoteDialogActions()
    const {session} = useSessionSelector()
    const [running, setRunning] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        document.title = i18n.dialogs.ocr.title
    }, [i18n])

    useEffect(() => {
        if (noteOCRDialog) {
            document.body.style.pointerEvents = "none"
            setRunning(false)
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [noteOCRDialog])

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            setNoteOCRFlag(true)
            setRunning(true)
        } else {
            setNoteOCRDialog(false)
        }
    }

    if (noteOCRDialog) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "260px", height: "170px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">OCR Page</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Can't use this function.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (running) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "260px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">OCR Page</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", alignItems: "center", height: "100%"}}>
                                <span className="dialog-text">Running OCR...</span>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "260px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.ocr.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.ocr.header}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.no}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.yes}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default OCRDialog