import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, SidebarTextContext,
ShowDeleteAccountDialogContext, HideTitlebarContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/deleteaccountdialog.less"
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
        document.title = "Moebooru: Delete Account"
    }, [])

    useEffect(() => {
        if (showDeleteAccountDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showDeleteAccountDialog])

    const deleteAccount = async () => {
        await axios.delete("/api/user/delete", {withCredentials: true})
        setSessionFlag(true)
        setSidebarText("Account Deleted.")
        history.push("/posts")
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteAccount()
        }
        setShowDeleteAccountDialog(false)
    }

    if (showDeleteAccountDialog) {
        return (
            <div className="deleteaccount-dialog">
                <Draggable handle=".deleteaccount-dialog-title-container">
                <div className="deleteaccount-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deleteaccount-container">
                        <div className="deleteaccount-dialog-title-container">
                            <span className="deleteaccount-dialog-title">Delete Account</span>
                        </div>
                        <div className="deleteaccount-dialog-row">
                            <span className="deleteaccount-dialog-text">
                                Are you sure that you want to delete your account? This action is irreversible. You will permanently lose all of your favorites, comments, cuteness ratings, etc.<br/><br/>
                                Because Moebooru is a site focused on community contributions, we will not remove any of your submitted posts. The account that uploaded these posts will show up as "deleted".<br/><br/>
                                Are you sure that you want to continue?
                            </span>
                        </div>
                        <div className="deleteaccount-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Delete Account"}</button>
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