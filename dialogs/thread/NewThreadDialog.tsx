import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useThreadDialogSelector, useThreadDialogActions, useSessionSelector, 
useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
import emojiSelect from "../../assets/svg/emoji-select.svg"
import MiniTextBox, {MiniTextBoxRef} from "../../ui/MiniTextBox"
import lewdIcon from "../../assets/icons/lewdgirl.png"
import radioButton from "../../assets/svg/radiobutton.svg"
import radioButtonChecked from "../../assets/svg/radiobutton-checked.svg"
import "../dialog.less"

const NewThreadDialog: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {showNewThreadDialog} = useThreadDialogSelector()
    const {setShowNewThreadDialog} = useThreadDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [threadTitle, setThreadTitle] = useState("")
    const [threadContent, setThreadContent] = useState("")
    const [r18, setR18] = useState(false)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const textBoxRef = useRef<MiniTextBoxRef>(null)
    const navigate = useNavigate()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--titleButtons")
    }

    useEffect(() => {
        if (showNewThreadDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showNewThreadDialog])

    const newThread = async () => {
        const threadContent = await textBoxRef.current!.resolveReplacements()
        const badTitle = functions.validation.validateTitle(threadTitle, i18n)
        if (badTitle) {
            textBoxRef.current?.showError(badTitle)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        const badContent = functions.validation.validateThread(threadContent, i18n)
        if (badContent) {
            textBoxRef.current?.showError(badContent)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        try {
            const threadID = await functions.http.post("/api/thread/create", {title: threadTitle, content: threadContent, r18}, session, setSessionFlag)
            setShowNewThreadDialog(false)
            if (threadID) navigate(`/thread/${threadID}`)
        } catch {
            textBoxRef.current?.showError(i18n.dialogs.newThread.error)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            newThread()
        } else {
            setShowNewThreadDialog(false)
        }
    }

    if (showNewThreadDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" ref={dialogRef} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.newThread.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.title}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={threadTitle} onChange={(event) => setThreadTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.content}: </span>
                        </div>
                        <MiniTextBox ref={textBoxRef} type="reply" height={330} text={threadContent} setText={setThreadContent} textRef={textRef} emojiRef={emojiRef}/>
                        {session.showR18 ?
                        <div className="dialog-row">
                            <img className="dialog-checkbox" src={r18 ? getIcon(radioButtonChecked) : getIcon(radioButton)} onClick={() => setR18((prev: boolean) => !prev)} style={{marginLeft: "0px", filter}}/>
                            <span className="dialog-text" style={{marginLeft: "10px"}}>R18</span>
                            <img className="dialog-title-img" src={lewdIcon} style={{marginLeft: "15px", height: "50px", filter}}/>
                        </div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button className="dialog-emoji-button" ref={emojiRef} onClick={() => textBoxRef.current?.toggleEmojiDropdown()}>
                                <img src={emojiSelect}/>
                            </button>
                            <button className={textBoxRef.current?.getPreviewMode() ? "dialog-edit-button" : "dialog-preview-button"} 
                            onClick={() => textBoxRef.current?.togglePreviewMode()}>
                            {textBoxRef.current?.getPreviewMode() ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.post}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default NewThreadDialog