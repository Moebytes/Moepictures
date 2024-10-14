import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, EnableDragContext, DeleteFavGroupNameContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const DeleteFavgroupDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteFavGroupName, setDeleteFavGroupName} = useContext(DeleteFavGroupNameContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete Comment"
    }, [])

    useEffect(() => {
        if (deleteFavGroupName) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteFavGroupName])

    const deleteFavgroup = async () => {
        await functions.delete("/api/favgroup", {name: deleteFavGroupName}, session, setSessionFlag)
        setDeleteFavGroupName(null)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteFavgroup()
        } else {
            setDeleteFavGroupName(null)
        }
    }

    if (deleteFavGroupName) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete Favgroup</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Are you sure you want to delete this favgroup?</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"No"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Yes"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default DeleteFavgroupDialog