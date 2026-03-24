/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const PageDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag, setMobileScrolling} = useInteractionActions()
    const {showPageDialog} = useMiscDialogSelector()
    const {setShowPageDialog} = useMiscDialogActions()
    const {setPageFlag} = useFlagActions()
    const [pageField, setPageField] = useState("")
    const controls = useDragControls()

    useEffect(() => {
        if (showPageDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setPageField("")
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [showPageDialog])


    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setPageFlag(Number(pageField))
            setTimeout(() => {
                setMobileScrolling(false)
            }, 100)
        }
        setShowPageDialog(false)
    }


    if (showPageDialog) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.page.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.page}:</span>
                            <input className="dialog-input-taller" type="number" spellCheck={false} value={pageField} onChange={(event) => setPageField(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.go}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default PageDialog