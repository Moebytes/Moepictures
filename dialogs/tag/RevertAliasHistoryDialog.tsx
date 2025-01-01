import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useTagDialogSelector, useTagDialogActions, useSessionSelector} from "../../store"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import Draggable from "react-draggable"
import "../dialog.less"

const RevertAliasHistoryDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {revertAliasHistoryID} = useTagDialogSelector()
    const {setRevertAliasHistoryID, setRevertAliasHistoryFlag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    useEffect(() => {
        if (revertAliasHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            document.title = getTitle() || ""
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [revertAliasHistoryID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setRevertAliasHistoryFlag(true)
        } else {
            setRevertAliasHistoryID(null)
        }
    }

    const getTitle = () => {
        if (!revertAliasHistoryID) return
        if (revertAliasHistoryID.type === "alias") {
            return i18n.dialogs.revertAliasHistory.undoAliasTitle
        } else if (revertAliasHistoryID.type === "undo alias") {
            return i18n.dialogs.revertAliasHistory.redoAliasTitle
        } else if (revertAliasHistoryID.type === "implication") {
            return i18n.dialogs.revertAliasHistory.undoImplicationTitle
        } else if (revertAliasHistoryID.type === "undo implication") {
            return i18n.dialogs.revertAliasHistory.redoImplicationTitle
        }
    }
    const getDescription = () => {
        if (!revertAliasHistoryID) return
        if (revertAliasHistoryID.type === "alias") {
            return i18n.dialogs.revertAliasHistory.undoAliasHeading
        } else if (revertAliasHistoryID.type === "undo alias") {
            return i18n.dialogs.revertAliasHistory.redoAliasHeading
        } else if (revertAliasHistoryID.type === "implication") {
            return i18n.dialogs.revertAliasHistory.undoImplicationHeading
        } else if (revertAliasHistoryID.type === "undo implication") {
            return i18n.dialogs.revertAliasHistory.redoImplicationHeading
        }
    }

    if (revertAliasHistoryID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{getDescription()}</span>
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

export default RevertAliasHistoryDialog