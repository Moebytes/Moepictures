import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, PremiumRequiredContext, 
HideTitlebarContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import premiumStar from "../assets/icons/premiumStar.png"
import "./styles/dialog.less"

const PremiumRequiredDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {premiumRequired, setPremiumRequired} = useContext(PremiumRequiredContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Premium Required"
    }, [])

    useEffect(() => {
        if (premiumRequired) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [premiumRequired])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            history.push("/premium")
        }
        setPremiumRequired(false)
    }

    const getPremiumText = () => {
        if (premiumRequired === "tags") {
            return "You need premium to search more than 3 tags. Would you like to visit the premium page?"
        }
        return "Premium is required to use this feature. Would you like to visit the premium page?"
    }

    if (premiumRequired) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "355px", height: "220px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title" style={{color: "var(--premiumColor)"}}>Premium Required</span>
                            <img className="dialog-title-img" src={premiumStar}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text" style={{color: "var(--premiumColor)"}}>{getPremiumText()}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button" style={{backgroundColor: "#ff17af"}}>{"Quit"}</button>
                            <button onClick={() => click("accept")} className="dialog-button" style={{backgroundColor: "#ff3bd7"}}>{"Premium Page"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default PremiumRequiredDialog