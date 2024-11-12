import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useSessionSelector, useSessionActions, 
useSearchDialogSelector, useSearchDialogActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const DeleteAllSaveSearchDialog: React.FunctionComponent = (props) => {
    const {setEnableDrag} = useInteractionActions()
    const {deleteAllSaveSearchDialog} = useSearchDialogSelector()
    const {setDeleteAllSaveSearchDialog} = useSearchDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const history = useHistory()

    useEffect(() => {
        document.title = "Delete All Saved Searches"
    }, [])

    useEffect(() => {
        if (deleteAllSaveSearchDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteAllSaveSearchDialog])

    const deleteAllSavedSearches = async () => {
        await functions.delete("/api/user/savesearch/delete", {all: true}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteAllSavedSearches()
        }
        setDeleteAllSaveSearchDialog(false)
    }

    if (deleteAllSaveSearchDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "285px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Delete All Saved Searches</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Are you sure you want to delete all saved searches?</span>
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

export default DeleteAllSaveSearchDialog