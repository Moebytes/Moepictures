import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions, useSessionSelector, useSessionActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import r18 from "../assets/icons/r18.png"
import "./styles/dialog.less"

const R18Dialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {r18Confirmation} = useMiscDialogSelector()
    const {setR18Confirmation} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "R18 Confirmation"
    }, [])

    useEffect(() => {
        if (r18Confirmation) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [r18Confirmation])

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            await functions.post("/api/user/r18", {r18: true}, session, setSessionFlag)
            setSessionFlag(true)
        }
        setR18Confirmation(false)
    }

    if (r18Confirmation) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "375px", height: "260px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <img className="dialog-title-img" src={r18} style={{marginLeft: "0px", marginRight: "10px"}}/>
                            <span className="dialog-title" style={{color: "var(--r18Color)"}}>Warning: Explicit Content</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text" style={{color: "var(--r18Color)"}}>
                                R18 Content is only suitable to be viewed by people over the age of 18. By continuing, you confirm that you 
                                are 18 years old or older and willing to view such content.
                            </span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button" style={{backgroundColor: "#c02d6b"}}>{"Quit"}</button>
                            <button onClick={() => click("accept")} className="dialog-button" style={{backgroundColor: "#fa337d"}}>{"I'm over 18"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default R18Dialog