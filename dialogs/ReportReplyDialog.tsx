import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ReportReplyIDContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/reportreplydialog.less"
import Draggable from "react-draggable"
import axios from "axios"

const ReportReplyDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {reportReplyID, setReportReplyID} = useContext(ReportReplyIDContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Report Reply"
    }, [])

    useEffect(() => {
        if (reportReplyID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [reportReplyID])


    const reportReply = async () => {
        const badReason = functions.validateReason(reason)
        if (badReason) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badReason
            await functions.timeout(2000)
            setError(false)
            return
        }
        await axios.post("/api/reply/report", {replyID: reportReplyID, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        setSubmitted(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            reportReply()
        } else {
            setReportReplyID(null)
        }
    }

    const close = () => {
        setReportReplyID(null)
        setSubmitted(false)
        setReason("")
    }

    if (reportReplyID) {
        return (
            <div className="reportreply-dialog">
                <Draggable handle=".reportreply-dialog-title-container">
                <div className="reportreply-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="reportreply-container">
                        <div className="reportreply-dialog-title-container">
                            <span className="reportreply-dialog-title">Report Reply</span>
                        </div>
                        {submitted ? <>
                        <div className="reportreply-dialog-row">
                            <span className="reportreply-dialog-text">Reply report was sent. Thank you!</span>
                        </div>
                        <div className="reportreply-dialog-row">
                            <button onClick={() => close()} className="download-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="download-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="reportreply-dialog-row">
                            <span className="reportreply-dialog-text">Report replies that are spam, offensive, or otherwise breaking the rules.</span>
                        </div>
                        <div className="reportreply-dialog-row">
                            <span className="reportreply-dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="reportreply-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div> 
                        {error ? <div className="reportreply-dialog-validation-container"><span className="reportreply-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="reportreply-dialog-row">
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

export default ReportReplyDialog