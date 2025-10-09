import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
import premiumStar from "../../assets/icons/premium-star.png"
import "../dialog.less"

const PremiumRequiredDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {premiumRequired} = useMiscDialogSelector()
    const {setPremiumRequired} = useMiscDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()

    useEffect(() => {
        document.title = i18n.dialogs.premium.title
    }, [i18n])

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
            navigate("/premium")
        }
        setPremiumRequired(false)
    }

    const getPremiumText = () => {
        if (premiumRequired === "tags") {
            return i18n.dialogs.premium.headerTags
        }
        return i18n.dialogs.premium.header
    }

    if (premiumRequired) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "355px", height: "220px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title" style={{color: "var(--premiumColor)"}}>{i18n.dialogs.premium.title}</span>
                            <img className="dialog-title-img" src={premiumStar}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text" style={{color: "var(--premiumColor)"}}>{getPremiumText()}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button" style={{backgroundColor: "#ff17af"}}>{i18n.buttons.quit}</button>
                            <button onClick={() => click("accept")} className="dialog-button" style={{backgroundColor: "#ff3bd7"}}>{i18n.buttons.premiumPage}</button>
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