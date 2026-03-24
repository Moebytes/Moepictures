/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useMiscDialogSelector, useMiscDialogActions} from "../../store"
import functions from "../../functions/Functions"

import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const QRCodeDialog: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {qrcodeImage} = useMiscDialogSelector()
    const {setQRCodeImage} = useMiscDialogActions()
    const controls = useDragControls()

    useEffect(() => {
        if (qrcodeImage) {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [qrcodeImage])

    const click = (button: "accept" | "reject") => {
        setQRCodeImage("")
    }

    if (qrcodeImage) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px"}} onMouseEnter={() => setEnableDrag(false)} 
                onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.qrcode.title}</span>
                        </div>
                        <div className="dialog-row" style={{justifyContent: "center"}}>
                            <img src={qrcodeImage} style={{height: "200px", width: "auto"}}/>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default QRCodeDialog