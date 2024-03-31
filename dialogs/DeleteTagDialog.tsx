import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, DeleteTagIDContext, DeleteTagFlagContext, HideTitlebarContext,
SessionContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/deletetagdialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import axios from "axios"

const DeleteTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {deleteTagID, setDeleteTagID} = useContext(DeleteTagIDContext)
    const {deleteTagFlag, setDeleteTagFlag} = useContext(DeleteTagFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Tag"
    }, [])

    useEffect(() => {
        if (deleteTagID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteTagID])

    const deleteTag = async () => {
        if (permissions.isStaff(session)) {
            setDeleteTagFlag(true)
        } else {
            const badReason = functions.validateReason(reason)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            await axios.post("/api/tag/delete/request", {tag: deleteTagID, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deleteTag()
        } else {
            setDeleteTagID(null)
        }
    }

    const close = () => {
        setDeleteTagID(null)
        setSubmitted(false)
        setReason("")
    }

    if (deleteTagID) {
        if (permissions.isStaff(session)) {
            return (
                <div className="deletetag-dialog">
                    <Draggable handle=".deletetag-dialog-title-container">
                    <div className="deletetag-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="deletetag-container">
                            <div className="deletetag-dialog-title-container">
                                <span className="deletetag-dialog-title">Delete Tag</span>
                            </div>
                            <div className="deletetag-dialog-row">
                                <span className="deletetag-dialog-text">Are you sure that you want to delete this tag?</span>
                            </div>
                            <div className="deletetag-dialog-row">
                                <button onClick={() => click("reject")} className="download-button">{"No"}</button>
                                <button onClick={() => click("accept")} className="download-button">{"Yes"}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="deletetag-dialog">
                <Draggable handle=".deletetag-dialog-title-container">
                <div className="deletetag-dialog-box" style={{width: "500px", height: submitted ? "125px" : "250px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deletetag-container">
                        <div className="deletetag-dialog-title-container">
                            <span className="deletetag-dialog-title">Delete Tag Request</span>
                        </div>
                        {submitted ? <>
                        <div className="deletetag-dialog-row">
                            <span className="deletetag-dialog-text">Your delete request was submitted.</span>
                        </div>
                        <div className="deletetag-dialog-row">
                            <button onClick={() => close()} className="download-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="download-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="deletetag-dialog-row">
                            <span className="deletetag-dialog-text">If the tag is poor, you may request for it's deletion. Why do you want to delete this tag?</span>
                        </div>
                        <div className="deletetag-dialog-row">
                            <span className="deletetag-dialog-text">Reason: </span>
                            <input className="deletetag-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="deletetag-dialog-validation-container"><span className="deletetag-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="deletetag-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept", true)} className="download-button">{"Submit Request"}</button>
                        </div> </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )


    }
    return null
}

export default DeleteTagDialog