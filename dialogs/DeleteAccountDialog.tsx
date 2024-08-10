import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, SidebarTextContext,
ShowDeleteAccountDialogContext, HideTitlebarContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import axios from "axios"

const DeleteAccountDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {showDeleteAccountDialog, setShowDeleteAccountDialog} = useContext(ShowDeleteAccountDialogContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moepictures: Delete Account"
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
        await axios.delete("/api/user/delete", {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
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