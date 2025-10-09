import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useMessageDialogSelector, useMessageDialogActions} from "../../store"
import functions from "../../functions/Functions"
import "../dialog.less"
import Draggable from "react-draggable"
import permissions from "../../structures/Permissions"

const DeleteMessageReplyDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteMsgReplyID} = useMessageDialogSelector()
    const {setDeleteMsgReplyID, setDeleteMsgReplyFlag} = useMessageDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        document.title = i18n.dialogs.deleteMessageReply.title
    }, [i18n])

    useEffect(() => {
        if (deleteMsgReplyID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteMsgReplyID])

    const deleteReply = async () => {
        setDeleteMsgReplyFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteReply()
        } else {
            setDeleteMsgReplyID(null)
        }
    }

    if (deleteMsgReplyID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.deleteMessageReply.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteMessageReply.header}</span>
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
    return null
}

export default DeleteMessageReplyDialog