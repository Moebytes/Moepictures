/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useMiscDialogActions, 
useMiscDialogSelector, useSessionSelector} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const SegmentateDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {segmentateLink} = useMiscDialogSelector()
    const {setSegmentateLink, setSegmentateFlag} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const [running, setRunning] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (segmentateLink) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setRunning(false)
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [segmentateLink])

    const segmentate = async () => {
        if (!segmentateLink) return
        const arrayBuffer = await functions.http.getBuffer(segmentateLink)
        const bytes = new Uint8Array(arrayBuffer)
        const resultBuffer = await functions.http.postBuffer("/api/misc/segmentate", Object.values(bytes), session)
        const base64 = functions.byte.arrayBufferToBase64(resultBuffer)
        setSegmentateFlag(base64)
        setSegmentateLink(null)
    }

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            setRunning(true)
            segmentate()
        } else {
            setSegmentateLink(null)
        }
    }

    if (segmentateLink) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "260px", height: "170px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.segmentate.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.ocr.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                    </motion.div>
                </div>
            )
        }

        if (running) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "260px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.segmentate.title}</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", alignItems: "center", height: "100%"}}>
                                <span className="dialog-text">{i18n.dialogs.segmentate.running}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "260px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.segmentate.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.segmentate.header}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.no}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.yes}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default SegmentateDialog