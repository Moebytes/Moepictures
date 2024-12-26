import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions} from "../store"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"

const TakedownTagDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {takedownTag} = useTagDialogSelector()
    const {setTakedownTag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const history = useHistory()

    useEffect(() => {
        document.title = i18n.dialogs.takedownTag.title
    }, [i18n])

    useEffect(() => {
        if (takedownTag) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [takedownTag])

    const takedown = async () => {
        if (!takedownTag) return
        if (permissions.isMod(session)) {
            await functions.post("/api/tag/takedown", {tag: takedownTag.tag}, session, setSessionFlag)
            history.go(0)
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            takedown()
            setTakedownTag(null)
        } else {
            setTakedownTag(null)
        }
    }

    const close = () => {
        setTakedownTag(null)
        setSubmitted(false)
        setReason("")
    }

    const getTitle = () => {
        if (!takedownTag) return
        if (takedownTag.banned) {
            return i18n.dialogs.takedownTag.restoreTitle
        } else {
            return i18n.dialogs.takedownTag.title
        }
    }

    const getPrompt = () => {
        if (!takedownTag) return
        if (takedownTag.banned) {
            return i18n.dialogs.takedownTag.restoreHeader
        } else {
            return i18n.dialogs.takedownTag.header
        }
    }

    if (takedownTag) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{getPrompt()}</span>
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
    }
    return null
}

export default TakedownTagDialog