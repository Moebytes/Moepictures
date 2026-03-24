/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import r18 from "../../assets/svg/lewd.svg"
import "../dialog.less"

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
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--r18Color")
    }

    useEffect(() => {
        if (r18Confirmation) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [r18Confirmation])

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            await functions.http.post("/api/user/r18", {r18: true}, session, setSessionFlag)
            setSessionFlag(true)
        }
        setR18Confirmation(false)
    }

    if (r18Confirmation) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "375px", height: "260px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <img className="dialog-title-img" src={getIcon(r18)} style={{marginLeft: "0px", marginRight: "10px"}}/>
                            <span className="dialog-title" style={{color: "var(--r18Color)"}}>{i18n.dialogs.r18.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text" style={{color: "var(--r18Color)"}}>
                                {i18n.dialogs.r18.header}
                            </span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button" style={{backgroundColor: "#c02d6b"}}>{i18n.buttons.quit}</button>
                            <button onClick={() => click("accept")} className="dialog-button" style={{backgroundColor: "#fa337d"}}>{i18n.buttons.over18}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default R18Dialog