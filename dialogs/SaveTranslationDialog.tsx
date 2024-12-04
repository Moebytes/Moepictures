import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useTranslationDialogSelector, useTranslationDialogActions, useSessionSelector, 
useSessionActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

interface Props {
    post: any
    unverified?: boolean
}

const SaveTranslationDialog: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {showSaveTranslationDialog, saveTranslationData, saveTranslationOrder} = useTranslationDialogSelector()
    const {setShowSaveTranslationDialog, setSaveTranslationData} = useTranslationDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Save Translation"
    }, [])

    useEffect(() => {
        if (showSaveTranslationDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showSaveTranslationDialog])

    const saveTranslation = async () => {
        if (props.unverified) {
            await functions.put("/api/translation/save/unverified", {postID: props.post.postID, data: saveTranslationData, order: saveTranslationOrder, reason}, session, setSessionFlag)
            return setSubmitted(true)
        } else {
            if (permissions.isContributor(session)) {
                await functions.post("/api/translation/save", {postID: props.post.postID, data: saveTranslationData, order: saveTranslationOrder, reason}, session, setSessionFlag)
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
                functions.post("/api/translation/save/request", {postID: props.post.postID, data: saveTranslationData, order: saveTranslationOrder, reason}, session, setSessionFlag)
                setSubmitted(true)
            }
        }
    }

    const click = async (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            saveTranslation()
        }
        if (!keep) {
            setShowSaveTranslationDialog(false)
            setSaveTranslationData(null)
            setReason("")
        }
    }

    const close = () => {
        setShowSaveTranslationDialog(false)
        setSaveTranslationData(null)
        setSubmitted(false)
        setReason("")
    }

    if (showSaveTranslationDialog) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "340px", height: "170px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Save Translation</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot save translations.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (props.post.locked && !permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "340px", height: "170px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Save Translation</span>
                            </div>
                            <span className="dialog-ban-text">This post is locked. Cannot save translations.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "340px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Save Translation</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Do you want to save the translation changes made to this post?</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Reason: </span>
                                <input className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"No"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Yes"}</button>
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
                            <span className="dialog-title">Save Translation Request</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Your translation request was submitted.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text-small">Do you want to save the translation changes made to this post?</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Reason: </span>
                            <input className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept", true)} className="dialog-button">{"Submit Request"}</button>
                        </div> </> }
                    </div>
                </div>
                </Draggable>
            </div>
        )
        
    }
    return null
}

export default SaveTranslationDialog