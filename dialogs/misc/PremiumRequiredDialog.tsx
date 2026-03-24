/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import premiumStar from "../../assets/svg/premium-star.svg"
import "../dialog.less"

const PremiumRequiredDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {premiumRequired} = useMiscDialogSelector()
    const {setPremiumRequired} = useMiscDialogActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()
    const controls = useDragControls()

    const getPremiumIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--premiumColor")
    }

    useEffect(() => {
        if (premiumRequired) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
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
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "355px", height: "220px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title" style={{color: "var(--premiumColor)"}}>{i18n.dialogs.premium.title}</span>
                            <img className="dialog-title-img" src={getPremiumIcon(premiumStar)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text" style={{color: "var(--premiumColor)"}}>{getPremiumText()}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button" style={{backgroundColor: "#ff17af"}}>{i18n.buttons.quit}</button>
                            <button onClick={() => click("accept")} className="dialog-button" style={{backgroundColor: "#ff3bd7"}}>{i18n.buttons.premiumPage}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default PremiumRequiredDialog