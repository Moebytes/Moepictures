import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useSessionSelector, useSessionActions, 
useSearchDialogSelector, useSearchDialogActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const DeleteAllSearchHistoryDialog: React.FunctionComponent = (props) => {
    const {setEnableDrag} = useInteractionActions()
    const {showDeleteAllHistoryDialog} = useSearchDialogSelector()
    const {setShowDeleteAllHistoryDialog} = useSearchDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete All Search History"
    }, [])

    useEffect(() => {
        if (showDeleteAllHistoryDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showDeleteAllHistoryDialog])

    const deleteAllHistory = async () => {
        await functions.delete("/api/user/history/delete", {all: true}, session, setSessionFlag)
        history.push("/posts")
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteAllHistory()
        }
        setShowDeleteAllHistoryDialog(false)
    }

    if (showDeleteAllHistoryDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "285px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete All Search History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Are you sure you want to delete all of your history?</span>
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

export default DeleteAllSearchHistoryDialog