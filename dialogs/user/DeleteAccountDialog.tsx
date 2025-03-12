import React, {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useMiscDialogSelector, useMiscDialogActions, useActiveActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"

const DeleteAccountDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSidebarText} = useActiveActions()
    const {showDeleteAccountDialog} = useMiscDialogSelector()
    const {setShowDeleteAccountDialog} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const navigate = useNavigate()

    useEffect(() => {
        document.title = i18n.buttons.deleteAccount
    }, [i18n])

    useEffect(() => {
        if (showDeleteAccountDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showDeleteAccountDialog])

    const deleteAccount = async () => {
        await functions.delete("/api/user/delete", null, session, setSessionFlag)
        setSessionFlag(true)
        navigate("/posts")
        setSidebarText(i18n.sidebar.accountDeleted)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteAccount()
        }
        setShowDeleteAccountDialog(false)
    }

    if (showDeleteAccountDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.buttons.deleteAccount}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text-small">
                                {i18n.dialogs.deleteAccount.header}<br/><br/>
                                {i18n.dialogs.deleteAccount.header2}<br/><br/>
                                {i18n.dialogs.deleteAccount.header3}
                            </span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.deleteAccount}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default DeleteAccountDialog