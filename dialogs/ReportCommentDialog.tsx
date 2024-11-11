import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, ReportCommentIDContext, HideTitlebarContext,
SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const ReportCommentDialog: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {reportCommentID, setReportCommentID} = useContext(ReportCommentIDContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Report Comment"
    }, [])

    useEffect(() => {
        if (reportCommentID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [reportCommentID])


    const reportComment = async () => {
        const badReason = functions.validateReason(reason)
        if (badReason) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badReason
            await functions.timeout(2000)
            setError(false)
            return
        }
        await functions.post("/api/comment/report", {commentID: reportCommentID, reason}, session, setSessionFlag)
        setSubmitted(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            reportComment()
        } else {
            setReportCommentID(null)
        }
    }

    const close = () => {
        setReportCommentID(null)
        setSubmitted(false)
        setReason("")
    }

    if (reportCommentID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Report Comment</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Comment report was sent. Thank you!</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text">Report comments that are spam, offensive, or otherwise breaking the rules.</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div> 
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Report"}</button>
                        </div> </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default ReportCommentDialog