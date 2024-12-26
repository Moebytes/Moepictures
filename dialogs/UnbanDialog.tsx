import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useMiscDialogSelector, useMiscDialogActions,
useFlagActions} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const UnbanDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {unbanName} = useMiscDialogSelector()
    const {setUnbanName} = useMiscDialogActions()
    const {setUpdateUserFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = i18n.dialogs.unban.title
    }, [i18n])

    useEffect(() => {
        if (unbanName) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [unbanName])


    const unban = async () => {
        if (!unbanName) return
        if (!permissions.isMod(session)) return setUnbanName(null)
        await functions.post("/api/user/unban", {username: unbanName}, session, setSessionFlag)
        setUnbanName(null)
        setUpdateUserFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            unban()
        } else {
            setUnbanName(null)
        }
    }

    if (unbanName) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.unban.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.unban.header}</span>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.unban}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default UnbanDialog