import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, 
useTagDialogSelector, useTagDialogActions} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const DeleteAliasHistoryDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteAliasHistoryID} = useTagDialogSelector()
    const {setDeleteAliasHistoryID, setDeleteAliasHistoryFlag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    useEffect(() => {
        if (deleteAliasHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            document.title = getTitle() || ""
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteAliasHistoryID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setDeleteAliasHistoryFlag(true)
        } else {
            setDeleteAliasHistoryID(null)
        }
    }

    const getTitle = () => {
        if (!deleteAliasHistoryID) return
        if (deleteAliasHistoryID.type === "alias" || deleteAliasHistoryID.type === "undo alias") {
            return i18n.dialogs.deleteAliasHistory.aliasTitle
        } else if (deleteAliasHistoryID.type === "implication" || deleteAliasHistoryID.type === "undo implication") {
            return i18n.dialogs.deleteAliasHistory.implicationTitle
        }
    }

    if (deleteAliasHistoryID) {
        if (permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "270px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.deleteGroupHistory.header}</span>
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

export default DeleteAliasHistoryDialog