import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions} from "../store"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

interface Props {
    forceCaptcha?: boolean
}

const CaptchaDialog: React.FunctionComponent<Props> = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()
    const [needsVerification, setNeedsVerification] = useState(false)
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getCaptchaColor = () => {
        if (theme.includes("light")) return "#ffffff"
        return "#09071c"
    }

    const updateCaptcha = async () => {
        const captcha = await functions.get("/api/misc/captcha/create", {color: getCaptchaColor()}, session, setSessionFlag)
        setCaptcha(captcha)
        setCaptchaResponse("")
    }

    useEffect(() => {
        updateCaptcha()
    }, [session, theme])

    useEffect(() => {
        document.title = i18n.dialogs.captcha.title
    }, [i18n])

    useEffect(() => {
        if (!session.cookie) return
        if (!props.forceCaptcha) {
            let ignoreCaptcha = sessionStorage.getItem("ignoreCaptcha")
            if (ignoreCaptcha === "true") return setNeedsVerification(false)
        }
        if (session.captchaNeeded) {
            if (!needsVerification) setNeedsVerification(true)
        } else {
            if (needsVerification) setNeedsVerification(false)
        }
    }, [session])

    useEffect(() => {
        if (needsVerification) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "all"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [needsVerification])

    const submitCaptcha = async () => {
        if (!captchaResponse) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Solve the captcha."
            await functions.timeout(3000)
            return setError(false)
        }
        try {
            await functions.post("/api/misc/captcha", {captchaResponse}, session, setSessionFlag)
            setSessionFlag(true)
            setNeedsVerification(false)
            history.go(0)
        } catch {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Captcha error."
            await functions.timeout(3000)
            setError(false)
            updateCaptcha()
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            submitCaptcha()
            sessionStorage.setItem("ignoreCaptcha", "false")
        } else {
            sessionStorage.setItem("ignoreCaptcha", "true")
            setNeedsVerification(false)
        }
    }

    const close = () => {
        setSubmitted(false)
    }

    if (needsVerification) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.captcha.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.captcha.header}</span>
                            </div>
                            <div className="dialog-row" style={{pointerEvents: "all"}}>
                                <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)}/>
                            </div>
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.ignore}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.solve}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
    }
    return null
}

export default CaptchaDialog