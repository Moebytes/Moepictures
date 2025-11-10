import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useMiscDialogActions, 
useMiscDialogSelector, useSessionSelector} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
import "../dialog.less"

const LineartDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {lineartLink} = useMiscDialogSelector()
    const {setLineartLink, setLineartFlag} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const [running, setRunning] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        document.title = i18n.dialogs.lineart.title
    }, [i18n])

    useEffect(() => {
        if (lineartLink) {
            document.body.style.pointerEvents = "none"
            setRunning(false)
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [lineartLink])

    const extractLineart = async () => {
        if (!lineartLink) return
        const arrayBuffer = await functions.http.getBuffer(lineartLink)
        const bytes = new Uint8Array(arrayBuffer)
        const resultBuffer = await functions.http.postBuffer("/api/misc/lineart", Object.values(bytes), session)
        const base64 = functions.byte.arrayBufferToBase64(resultBuffer)
        setLineartFlag(base64)
        setLineartLink(null)
    }

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            setRunning(true)
            extractLineart()
        } else {
            setLineartLink(null)
        }
    }

    if (lineartLink) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "260px", height: "170px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.lineart.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.ocr.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (running) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "260px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.lineart.title}</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", alignItems: "center", height: "100%"}}>
                                <span className="dialog-text">{i18n.dialogs.lineart.running}</span>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "260px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.lineart.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.lineart.header}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.no}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.yes}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default LineartDialog