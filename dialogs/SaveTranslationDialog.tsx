import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideTitlebarContext, HideSidebarContext, ThemeContext, EnableDragContext, 
ShowSaveTranslationDialogContext, SaveTranslationDataContext, SaveTranslationOrderContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/savetranslationdialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

interface Props {
    post: any
}

const SaveTranslationDialog: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showSaveTranslationDialog, setShowSaveTranslationDialog} = useContext(ShowSaveTranslationDialogContext)
    const {saveTranslationData, setSaveTranslationData} = useContext(SaveTranslationDataContext)
    const {saveTranslationOrder, setSaveTranslationOrder} = useContext(SaveTranslationOrderContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Save Translation"
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
        if (session.username) {
            await axios.post("/api/translation/save", {postID: props.post.postID, data: saveTranslationData, order: saveTranslationOrder, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSubmitted(true)
        } else {
            const badReason = functions.validateReason(reason)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
            }
            await axios.post("/api/translation/save/request", {postID: props.post.postID, data: saveTranslationData, order: saveTranslationOrder, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSubmitted(true)
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
        if (session.username) {
            return (
                <div className="save-translation-dialog">
                    <Draggable handle=".save-translation-dialog-title-container">
                    <div className="save-translation-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="save-translation-container">
                            <div className="save-translation-dialog-title-container">
                                <span className="save-translation-dialog-title">Save Translation</span>
                            </div>
                            <div className="save-translation-dialog-row">
                                <span className="save-translation-dialog-text">Do you want to save the translation changes made to this post?</span>
                            </div>
                            <div className="save-translation-dialog-row">
                                <span className="save-translation-dialog-text">Reason: </span>
                                <input className="save-translation-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                            </div>
                            <div className="save-translation-dialog-row">
                                <button onClick={() => click("reject")} className="download-button">{"No"}</button>
                                <button onClick={() => click("accept")} className="download-button">{"Yes"}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="save-translation-dialog">
                <Draggable handle=".save-translation-dialog-title-container">
                <div className="save-translation-dialog-box" style={{width: "350px", height: submitted ? "125px" : "250px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="save-translation-container">
                        <div className="save-translation-dialog-title-container">
                            <span className="save-translation-dialog-title">Save Translation Request</span>
                        </div>
                        {submitted ? <>
                        <div className="save-translation-dialog-row">
                            <span className="save-translation-dialog-text">Your translation request was submitted.</span>
                        </div>
                        <div className="save-translation-dialog-row">
                            <button onClick={() => close()} className="download-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="download-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="save-translation-dialog-row">
                            <span className="save-translation-dialog-text-small">Do you want to save the translation changes made to this post?</span>
                        </div>
                        <div className="save-translation-dialog-row">
                            <span className="save-translation-dialog-text">Reason: </span>
                            <input className="save-translation-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="save-translation-dialog-validation-container"><span className="save-translation-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="save-translation-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept", true)} className="download-button">{"Submit Request"}</button>
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