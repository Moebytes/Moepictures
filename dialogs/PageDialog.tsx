import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ShowPageDialogContext, PageFlagContext,
HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/pagedialog.less"
import axios from "axios"

const PageDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const [pageField, setPageField] = useState("")
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Go To Page"
    }, [])

    useEffect(() => {
        if (showPageDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showPageDialog])


    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setPageFlag(Number(pageField))
        }
        setShowPageDialog(false)
    }


    if (showPageDialog) {
        return (
            <div className="page-dialog">
                <Draggable handle=".page-dialog-title-container">
                <div className="page-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="pagedialog-container">
                        <div className="page-dialog-title-container">
                            <span className="page-dialog-title">Go To Page</span>
                        </div>
                        <div className="page-dialog-row">
                            <span className="page-dialog-text">Page:</span>
                            <input className="page-dialog-input" type="number" spellCheck={false} value={pageField} onChange={(event) => setPageField(event.target.value)}/>
                        </div>
                        <div className="page-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Go"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default PageDialog