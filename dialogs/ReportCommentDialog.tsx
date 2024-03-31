import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ReportCommentIDContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/reportcommentdialog.less"
import Draggable from "react-draggable"
import axios from "axios"

const ReportCommentDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {reportCommentID, setReportCommentID} = useContext(ReportCommentIDContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Report Comment"
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
        await axios.post("/api/comment/report", {commentID: reportCommentID, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
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
            <div className="reportcomment-dialog">
                <Draggable handle=".reportcomment-dialog-title-container">
                <div className="reportcomment-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="reportcomment-container">
                        <div className="reportcomment-dialog-title-container">
                            <span className="reportcomment-dialog-title">Report Comment</span>
                        </div>
                        {submitted ? <>
                        <div className="reportcomment-dialog-row">
                            <span className="reportcomment-dialog-text">Comment report was sent. Thank you!</span>
                        </div>
                        <div className="reportcomment-dialog-row">
                            <button onClick={() => close()} className="download-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="download-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="reportcomment-dialog-row">
                            <span className="reportcomment-dialog-text">Report comments that are spam, offensive, or otherwise breaking the rules.</span>
                        </div>
                        <div className="reportcomment-dialog-row">
                            <span className="reportcomment-dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="reportcomment-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div> 
                        {error ? <div className="reportcomment-dialog-validation-container"><span className="reportcomment-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="reportcomment-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Report"}</button>
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