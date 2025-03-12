import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogActions, usePostDialogSelector, useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import Draggable from "react-draggable"
import "../dialog.less"

const PermaDeleteAllPostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {permaDeleteAllDialog} = usePostDialogSelector()
    const {setPermaDeleteAllDialog} = usePostDialogActions()
    const {setHistoryFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        document.title = i18n.dialogs.permaDeleteAllPost.title
    }, [i18n])

    useEffect(() => {
        if (permaDeleteAllDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [permaDeleteAllDialog])

    const emptyRecycleBin = async () => {
        if (permissions.isAdmin(session)) {
            await functions.delete("/api/post/emptybin", null, session, setSessionFlag)
        }
        setHistoryFlag(true)
        setPermaDeleteAllDialog(false)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            emptyRecycleBin()
        } else {
            setPermaDeleteAllDialog(false)
        }
    }

    if (permaDeleteAllDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "285px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.permaDeleteAllPost.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.permaDeleteAllPost.header}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} style={{backgroundColor: "var(--deletedColor)"}} 
                            className="dialog-button">{i18n.buttons.deleteAll}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default PermaDeleteAllPostDialog