import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useMessageDialogSelector, useMessageDialogActions} from "../store"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"

const SoftDeleteMessageDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {softDeleteMessageID} = useMessageDialogSelector()
    const {setSoftDeleteMessageID, setSoftDeleteMessageFlag} = useMessageDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Soft Delete Message"
    }, [])

    useEffect(() => {
        if (softDeleteMessageID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [softDeleteMessageID])

    const softDeleteMessage = async () => {
        setSoftDeleteMessageFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            softDeleteMessage()
        } else {
            setSoftDeleteMessageID(null)
        }
    }

    if (softDeleteMessageID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "320px", height: "240px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Soft Delete Message</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Do you want to soft delete this message? (It will appear again if any other recipient replies).</span>
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
    return null
}

export default SoftDeleteMessageDialog