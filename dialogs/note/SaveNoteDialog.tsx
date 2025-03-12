import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useNoteDialogSelector, useNoteDialogActions, useSessionSelector, 
useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"
import {PostSearch, PostHistory, UnverifiedPost} from "../../types/Types"

const SaveNoteDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {saveNoteID, saveNoteData, saveNoteOrder} = useNoteDialogSelector()
    const {setSaveNoteID, setSaveNoteData} = useNoteDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        document.title = i18n.dialogs.saveNote.title
    }, [i18n])

    useEffect(() => {
        if (saveNoteID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [saveNoteID])

    const saveNote = async () => {
        if (!saveNoteID || !saveNoteData) return
        if (saveNoteID.unverified) {
            await functions.put("/api/note/save/unverified", {postID: saveNoteID.post.postID, data: saveNoteData, order: saveNoteOrder, reason}, session, setSessionFlag)
            return setSubmitted(true)
        } else {
            if (permissions.isContributor(session)) {
                await functions.post("/api/note/save", {postID: saveNoteID.post.postID, data: saveNoteData, order: saveNoteOrder, reason}, session, setSessionFlag)
                setSubmitted(true)
            } else {
                const badReason = functions.validateReason(reason, i18n)
                if (badReason) {
                    setError(true)
                    if (!errorRef.current) await functions.timeout(20)
                    errorRef.current!.innerText = badReason
                    await functions.timeout(2000)
                    setError(false)
                }
                functions.post("/api/note/save/request", {postID: saveNoteID.post.postID, data: saveNoteData, order: saveNoteOrder, reason}, session, setSessionFlag)
                setSubmitted(true)
            }
        }
    }

    const click = async (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            saveNote()
        }
        if (!keep) {
            setSaveNoteID(null)
            setSaveNoteData(null)
            setReason("")
        }
    }

    const close = () => {
        setSaveNoteID(null)
        setSaveNoteData(null)
        setSubmitted(false)
        setReason("")
    }

    if (saveNoteID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "340px", height: "170px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.saveNote.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.saveNote.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (saveNoteID.post.locked && !permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "340px", height: "170px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.saveNote.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.saveNote.locked}.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (saveNoteID.unverified || permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "340px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.saveNote.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.saveNote.header}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.reason}: </span>
                                <input className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
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

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "340px", height: submitted ? "155px" : "250px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.saveNote.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.saveNote.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text-small">{i18n.dialogs.saveNote.header}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept", true)} className="dialog-button">{i18n.buttons.submitRequest}</button>
                        </div> </> }
                    </div>
                </div>
                </Draggable>
            </div>
        )
        
    }
    return null
}

export default SaveNoteDialog