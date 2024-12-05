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
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Takedown Tag"
    }, [])

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
        if (takedownTag.banned) {
            return "Restore Tag"
        } else {
            return "Takedown Tag"
        }
    }

    const getPrompt = () => {
        if (takedownTag.banned) {
            return "Do you want to restore this tag and all related posts?"
        } else {
            return "Are you sure that you want to takedown this tag and all related posts?"
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
                                <button onClick={() => click("reject")} className="dialog-button">{"No"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Yes"}</button>
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