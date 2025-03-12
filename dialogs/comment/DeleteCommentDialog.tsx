import React, {useEffect} from "react"
import {useThemeSelector, useInteractionActions, useCommentDialogSelector, useCommentDialogActions} from "../../store"
import functions from "../../structures/Functions"
import "../dialog.less"
import Draggable from "react-draggable"

const DeleteCommentDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteCommentID} = useCommentDialogSelector()
    const {setDeleteCommentID, setDeleteCommentFlag} = useCommentDialogActions()

    useEffect(() => {
        document.title = i18n.dialogs.deleteComment.title
    }, [i18n])

    useEffect(() => {
        if (deleteCommentID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteCommentID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setDeleteCommentFlag(true)
        } else {
            setDeleteCommentID(null)
        }
    }

    if (deleteCommentID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.deleteComment.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteComment.header}</span>
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

export default DeleteCommentDialog