import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useSearchSelector, useSearchActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import SearchSuggestions from "../components/SearchSuggestions"
import "./styles/dialog.less"

const BulkDeleteDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {showBulkDeleteDialog} = usePostDialogSelector()
    const {setShowBulkDeleteDialog} = usePostDialogActions()
    const {selectionMode, selectionItems} = useSearchSelector()
    const {setSelectionMode} = useSearchActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = i18n.dialogs.bulkDelete.title
    }, [i18n])

    useEffect(() => {
        if (showBulkDeleteDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showBulkDeleteDialog])

    const bulkDelete = async () => {
        if (!permissions.isAdmin(session)) return setShowBulkDeleteDialog(false)
        if (!selectionMode) return setShowBulkDeleteDialog(false)
        for (const postID of selectionItems.values()) {
            await functions.delete("/api/post/delete", {postID}, session, setSessionFlag)
        }
        history.go(0)
        setShowBulkDeleteDialog(false)
        setSelectionMode(false)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            bulkDelete()
        } else {
            setShowBulkDeleteDialog(false)
        }
    }

    if (permissions.isAdmin(session) && showBulkDeleteDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "310px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.bulkDelete.title}</span>
                        </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.bulkDelete.header}</span>
                            </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.dialogs.bulkDelete.title}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default BulkDeleteDialog