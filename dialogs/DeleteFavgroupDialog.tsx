import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, EnableDragContext, DeleteFavGroupObjContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const DeleteFavgroupDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteFavGroupObj, setDeleteFavGroupObj} = useContext(DeleteFavGroupObjContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete Comment"
    }, [])

    useEffect(() => {
        if (deleteFavGroupObj) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteFavGroupObj])

    const deleteFavgroup = async () => {
        await functions.delete("/api/favgroup/delete", {name: deleteFavGroupObj.name}, session, setSessionFlag)
        setDeleteFavGroupObj(null)
        setSessionFlag(true)
        history.push("/profile")
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteFavgroup()
        } else {
            setDeleteFavGroupObj(null)
        }
    }

    if (deleteFavGroupObj) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete Favorite Group</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Are you sure you want to delete this favorite group?</span>
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