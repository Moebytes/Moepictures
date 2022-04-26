import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, AliasTagIDContext, 
AliasTagFlagContext, AliasTagNameContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/aliastagdialog.less"
import axios from "axios"

const AliasTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {aliasTagID, setAliasTagID} = useContext(AliasTagIDContext)
    const {aliasTagFlag, setAliasTagFlag} = useContext(AliasTagFlagContext)
    const {aliasTagName, setAliasTagName} = useContext(AliasTagNameContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Alias Tag"
    }, [])

    useEffect(() => {
        if (aliasTagID) {
            document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [aliasTagID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setAliasTagFlag(true)
        } else {
            setAliasTagID(null)
        }
    }

    if (aliasTagID) {
        return (
            <div className="aliastag-dialog">
                <div className="aliastag-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="aliastag-container">
                        <span className="aliastag-dialog-title">Alias Tag</span>
                        <div className="aliastag-dialog-row">
                            <span className="aliastag-dialog-text">Alias To:</span>
                            <input className="aliastag-dialog-input" type="text" spellCheck={false} value={aliasTagName} onChange={(event) => setAliasTagName(event.target.value)}/>
                        </div>
                        <div className="aliastag-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Alias"}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export default AliasTagDialog