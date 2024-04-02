import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext,
RevertTranslationHistoryIDContext, RevertTranslationHistoryFlagContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/reverttranslationhistorydialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

const RevertTranslationHistoryDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {revertTranslationHistoryID, setRevertTranslationHistoryID} = useContext(RevertTranslationHistoryIDContext)
    const {revertTranslationHistoryFlag, setRevertTranslationHistoryFlag} = useContext(RevertTranslationHistoryFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Revert Translation History"
    }, [])

    useEffect(() => {
        if (revertTranslationHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [revertTranslationHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setRevertTranslationHistoryFlag(true)
        } else {
            if (!keep) setRevertTranslationHistoryID(null)
        }
    }

    const close = () => {
        setRevertTranslationHistoryID(null)
    }

    if (revertTranslationHistoryID?.failed) {
        return (
            <div className="revert-translation-history-dialog">
                <Draggable handle=".revert-translation-history-dialog-title-container">
                <div className="revert-translation-history-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="revert-translation-history-container">
                        <div className="revert-translation-history-dialog-title-container">
                            <span className="revert-translation-history-dialog-title">Revert Translation History</span>
                        </div>
                        <div className="revert-translation-history-dialog-row">
                            <span className="revert-translation-history-dialog-text">This is already the current history state.</span>
                        </div>
                        <div className="revert-translation-history-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (revertTranslationHistoryID) {
        return (
            <div className="revert-translation-history-dialog">
                <Draggable handle=".revert-translation-history-dialog-title-container">
                <div className="revert-translation-history-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="revert-translation-history-container">
                        <div className="revert-translation-history-dialog-title-container">
                            <span className="revert-translation-history-dialog-title">Revert Translation History</span>
                        </div>
                        <div className="revert-translation-history-dialog-row">
                            <span className="revert-translation-history-dialog-text">Are you sure that you want to revert back to this history state?</span>
                        </div>
                        <div className="revert-translation-history-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"No"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Yes"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default RevertTranslationHistoryDialog