import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useMiscDialogSelector, useMiscDialogActions, useActiveActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const DeleteAccountDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSidebarText} = useActiveActions()
    const {showDeleteAccountDialog} = useMiscDialogSelector()
    const {setShowDeleteAccountDialog} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete Account"
    }, [])

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
        history.push("/posts")
        setSidebarText("Account Deleted.")
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
                            <span className="dialog-title">Delete Account</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text-small">
                                Are you sure that you want to delete your account? This action is irreversible. You will permanently lose all of your favorites, comments, cuteness ratings, etc.<br/><br/>
                                Because Moepictures is a site focused on community contributions, we will not remove any of your submitted posts. The account that uploaded these posts will show up as "deleted".<br/><br/>
                                Are you sure that you want to continue?
                            </span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Delete Account"}</button>
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