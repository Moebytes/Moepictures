import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useNoteDialogSelector, useNoteDialogActions} from "../store"
import functions from "../structures/Functions"
import "./styles/editnotedialog.less"
import Draggable from "react-draggable"

const EditNoteDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editNoteID, editNoteText, editNoteTranscript} = useNoteDialogSelector()
    const {setEditNoteFlag, setEditNoteID, setEditNoteText, setEditNoteTranscript} = useNoteDialogActions()
    const history = useHistory()

    useEffect(() => {
        document.title = i18n.dialogs.editNote.title
    }, [i18n])

    useEffect(() => {
        if (editNoteID !== null) {
            document.body.style.pointerEvents = "all"
            setEnableDrag(false)
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editNoteID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setEditNoteFlag(true)
        } else {
            setEditNoteText("")
            setEditNoteTranscript("")
            setEditNoteID(null)
        }
    }

    if (editNoteID !== null) {
        return (
            <div className="edit-note-dialog">
                <Draggable handle=".edit-note-dialog-title-container">
                <div className="edit-note-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="edit-note-container">
                        <div className="edit-note-dialog-title-container">
                            <span className="edit-note-dialog-title">{i18n.dialogs.editNote.title}</span>
                        </div>
                        <div className="edit-note-dialog-row">
                            <span className="edit-note-dialog-text">{i18n.labels.transcription}</span>
                        </div>
                        <div className="edit-note-dialog-row" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea className="edit-note-textarea" spellCheck={false} value={editNoteTranscript} onChange={(event) => setEditNoteTranscript(event.target.value)}></textarea>
                        </div>
                        <div className="edit-note-dialog-row">
                            <span className="edit-note-dialog-text">{i18n.labels.translation}</span>
                        </div>
                        <div className="edit-note-dialog-row" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea className="edit-note-textarea" spellCheck={false} value={editNoteText} onChange={(event) => setEditNoteText(event.target.value)}></textarea>
                        </div>
                        <div className="edit-note-dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.edit}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditNoteDialog