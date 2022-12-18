import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, HideTitlebarContext, SessionContext, MobileContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/captchadialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import axios from "axios"

interface Props {
    forceCaptcha?: boolean
}

const CaptchaDialog: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
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
    const captchaRef = useRef<any>(null)

    useEffect(() => {
        document.title = "Moebooru: Captcha"
    }, [])

    useEffect(() => {
        if (!session.cookie) return
        if (session.captchaAmount === undefined) session.captchaAmount = 51
        if (!props.forceCaptcha) {
            let ignoreCaptcha = sessionStorage.getItem("ignoreCaptcha") as any
            ignoreCaptcha = ignoreCaptcha ? ignoreCaptcha === "true" : false
            if (ignoreCaptcha) return setNeedsVerification(false)
        }
        if (session.captchaAmount > 50) {
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

    const siteKey = "123c92b0-ebd6-4dd7-b152-46a9c503510c"

    const captcha = async () => {
        if (!captchaResponse) {
            setError(true)
            await functions.timeout(20)
            errorRef.current.innerText = "Solve the captcha."
            await functions.timeout(3000)
            return setError(false)
        }
        try {
            await axios.post("/api/misc/captcha", {siteKey, captchaResponse}, {withCredentials: true})
            captchaRef.current?.resetCaptcha()
            setSessionFlag(true)
            setNeedsVerification(false)
            history.go(0)
        } catch {
            setError(true)
            await functions.timeout(20)
            errorRef.current.innerText = "Captcha error."
            await functions.timeout(3000)
            return setError(false)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            captcha()
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
                                <HCaptcha sitekey={siteKey} theme="dark" onVerify={(response) => setCaptchaResponse(response)} />
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