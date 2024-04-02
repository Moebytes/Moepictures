import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, HideTitlebarContext, 
SessionContext, MobileContext, SessionFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/captchadialog.less"
import Draggable from "react-draggable"
import axios from "axios"

interface Props {
    forceCaptcha?: boolean
}

const CaptchaDialog: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [posX, setPosX] = useState(0)
    const [posY, setPosY] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()
    const [needsVerification, setNeedsVerification] = useState(false)
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const captchaRef = useRef<any>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getCaptchaColor = () => {
        if (theme.includes("light")) return "#ffffff"
        return "#09071c"
    }

    const updateCaptcha = async () => {
        const captcha = await axios.get("/api/misc/captcha/create", {params: {color: getCaptchaColor()}, withCredentials: true}).then((r) => r.data)
        setCaptcha(captcha)
        setCaptchaResponse("")
    }

    useEffect(() => {
        updateCaptcha()
    }, [theme])

    useEffect(() => {
        document.title = "Moebooru: Captcha"
    }, [])

    useEffect(() => {
        if (!session.cookie) return
        if (session.captchaAmount === undefined) session.captchaAmount = 0
        if (!props.forceCaptcha) {
            let ignoreCaptcha = sessionStorage.getItem("ignoreCaptcha") as any
            ignoreCaptcha = ignoreCaptcha ? ignoreCaptcha === "true" : false
            if (ignoreCaptcha) return setNeedsVerification(false)
        }
        if (session.captchaAmount > 1000) {
            if (!needsVerification) setNeedsVerification(true)
        } else {
            if (needsVerification) setNeedsVerification(false)
        }
    }, [session])

    useEffect(() => {
        if (needsVerification) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "all"
            captchaRef.current?.resetCaptcha()
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [needsVerification])

    const submitCaptcha = async () => {
        if (!captchaResponse) {
            setError(true)
            await functions.timeout(20)
            errorRef.current.innerText = "Solve the captcha."
            await functions.timeout(3000)
            return setError(false)
        }
        try {
            await axios.post("/api/misc/captcha", {captchaResponse}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            captchaRef.current?.resetCaptcha()
            setSessionFlag(true)
            setNeedsVerification(false)
            history.go(0)
        } catch {
            setError(true)
            await functions.timeout(20)
            errorRef.current.innerText = "Captcha error."
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
                <div className="captcha-dialog">
                    <Draggable handle=".captcha-dialog-title-container">
                    <div className="captcha-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="captcha-container">
                            <div className="captcha-dialog-title-container">
                                <span className="captcha-dialog-title">Human Verification</span>
                            </div>
                            <div className="captcha-dialog-row" style={{pointerEvents: "all"}}>
                                <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                                <input className="captcha-dialog-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)}/>
                            </div>
                            {error ? <div className="captcha-dialog-validation-container"><span className="captcha-dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="captcha-dialog-row">
                                <button onClick={() => click("reject")} className="download-button">{"No Tags"}</button>
                                <button onClick={() => click("accept")} className="download-button">{"Solve"}</button>
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