import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useMiscDialogSelector, useMiscDialogActions} from "../../store"
import functions from "../../structures/Functions"
import "../dialog.less"
import Draggable from "react-draggable"

const QRCodeDialog: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {qrcodeImage} = useMiscDialogSelector()
    const {setQRCodeImage} = useMiscDialogActions()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.qrcode.title
    }, [i18n])

    useEffect(() => {
        if (qrcodeImage) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "all"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [qrcodeImage])

    const click = (button: "accept" | "reject") => {
        setQRCodeImage("")
    }

    if (qrcodeImage) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px"}} onMouseEnter={() => setEnableDrag(false)} 
                onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.qrcode.title}</span>
                        </div>
                        <div className="dialog-row" style={{justifyContent: "center"}}>
                            <img src={qrcodeImage} style={{height: "200px", width: "auto"}}/>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default QRCodeDialog