import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useThreadDialogSelector, useThreadDialogActions} from "../store"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"

const DeleteReplyDialog: React.FunctionComponent = (props) => {
    const {setEnableDrag} = useInteractionActions()
    const {deleteReplyID} = useThreadDialogSelector()
    const {setDeleteReplyID, setDeleteReplyFlag} = useThreadDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete Reply"
    }, [])

    useEffect(() => {
        if (deleteReplyID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteReplyID])

    const deleteReply = async () => {
        setDeleteReplyFlag(true)
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deleteReply()
        } else {
            setDeleteReplyID(null)
        }
    }

    if (deleteReplyID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete Reply</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Do you want to delete this reply?</span>
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

export default DeleteReplyDialog