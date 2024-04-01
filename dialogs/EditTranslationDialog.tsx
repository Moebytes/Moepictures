import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditTranslationIDContext, EditTranslationFlagContext, 
EditTranslationTextContext, EditTranslationTranscriptContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/edittranslationdialog.less"
import Draggable from "react-draggable"
import axios from "axios"

const EditTranslationDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editTranslationFlag, setEditTranslationFlag} = useContext(EditTranslationFlagContext)
    const {editTranslationID, setEditTranslationID} = useContext(EditTranslationIDContext)
    const {editTranslationText, setEditTranslationText} = useContext(EditTranslationTextContext)
    const {editTranslationTranscript, setEditTranslationTranscript} = useContext(EditTranslationTranscriptContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Edit Translation"
    }, [])

    useEffect(() => {
        if (editTranslationID !== null) {
            document.body.style.pointerEvents = "all"
            setEnableDrag(false)
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editTranslationID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setEditTranslationFlag(true)
        } else {
            setEditTranslationText("")
            setEditTranslationTranscript("")
            setEditTranslationID(null)
        }
    }

    if (editTranslationID !== null) {
        return (
            <div className="edit-translation-dialog">
                <Draggable handle=".edit-translation-dialog-title-container">
                <div className="edit-translation-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="edit-translation-container">
                        <div className="edit-translation-dialog-title-container">
                            <span className="edit-translation-dialog-title">Edit Translation</span>
                        </div>
                        <div className="edit-translation-dialog-row">
                            <span className="edit-translation-dialog-text">Transcription</span>
                        </div>
                        <div className="edit-translation-dialog-row" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea className="edit-translation-textarea" spellCheck={false} value={editTranslationTranscript} onChange={(event) => setEditTranslationTranscript(event.target.value)}></textarea>
                        </div>
                        <div className="edit-translation-dialog-row">
                            <span className="edit-translation-dialog-text">Translation</span>
                        </div>
                        <div className="edit-translation-dialog-row" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea className="edit-translation-textarea" spellCheck={false} value={editTranslationText} onChange={(event) => setEditTranslationText(event.target.value)}></textarea>
                        </div>
                        <div className="edit-translation-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Edit"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditTranslationDialog