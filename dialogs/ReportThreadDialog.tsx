import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ReportThreadIDContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/reportthreaddialog.less"
import Draggable from "react-draggable"
import axios from "axios"

const ReportThreadDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {reportThreadID, setReportThreadID} = useContext(ReportThreadIDContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Report Thread"
    }, [])

    useEffect(() => {
        if (reportThreadID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [reportThreadID])


    const reportThread = async () => {
        const badReason = functions.validateReason(reason)
        if (badReason) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badReason
            await functions.timeout(2000)
            setError(false)
            return
        }
        await axios.post("/api/thread/report", {threadID: reportThreadID, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        setSubmitted(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            reportThread()
        } else {
            setReportThreadID(null)
        }
    }

    const close = () => {
        setReportThreadID(null)
        setSubmitted(false)
        setReason("")
    }

    if (reportThreadID) {
        return (
            <div className="reportthread-dialog">
                <Draggable handle=".reportthread-dialog-title-container">
                <div className="reportthread-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="reportthread-container">
                        <div className="reportthread-dialog-title-container">
                            <span className="reportthread-dialog-title">Report Thread</span>
                        </div>
                        {submitted ? <>
                        <div className="reportthread-dialog-row">
                            <span className="reportthread-dialog-text">Thread report was sent. Thank you!</span>
                        </div>
                        <div className="reportthread-dialog-row">
                            <button onClick={() => close()} className="download-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="download-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="reportthread-dialog-row">
                            <span className="reportthread-dialog-text">Report threads that are spam, offensive, or otherwise breaking the rules.</span>
                        </div>
                        <div className="reportthread-dialog-row">
                            <span className="reportthread-dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="reportthread-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div> 
                        {error ? <div className="reportthread-dialog-validation-container"><span className="reportthread-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="reportthread-dialog-row">
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

export default ReportThreadDialog