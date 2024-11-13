import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useTranslationDialogSelector, useTranslationDialogActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

const DeleteTranslationHistoryDialog: React.FunctionComponent = (props) => {
    const {setEnableDrag} = useInteractionActions()
    const {deleteTranslationHistoryID} = useTranslationDialogSelector()
    const {setDeleteTranslationHistoryID, setDeleteTranslationHistoryFlag} = useTranslationDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete Translation History"
    }, [])

    useEffect(() => {
        if (deleteTranslationHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteTranslationHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setDeleteTranslationHistoryFlag(true)
        } else {
            if (!keep) setDeleteTranslationHistoryID(null)
        }
    }

    const close = () => {
        setDeleteTranslationHistoryID(null)
    }

    if (deleteTranslationHistoryID?.failed) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete Translation History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">The current history state cannot be deleted.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (deleteTranslationHistoryID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete Translation History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Do you want to delete this history state?</span>
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

export default DeleteTranslationHistoryDialog