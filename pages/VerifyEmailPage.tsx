import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../store"
import "./styles/sitepage.less"
import session from "express-session"

const VerifyEmailPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

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
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
    }, [])

    useEffect(() => {
        document.title = i18n.pages.verifyEmail.title
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/verify-email")
            history.push("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
        if (session.emailVerified) {
            history.push("/verify-email-success")
        }
    }, [session])

    const submit = async () => {
        let email = newEmail ? newEmail : session.email
        const badEmail = functions.validateEmail(email, i18n)
        if (badEmail) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badEmail
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/user/verifyemail", {email, captchaResponse}, session, setSessionFlag)
            setSubmitted(true)
            setSessionFlag(true)
            setError(false)
        } catch (err: any) {
            let errMsg = i18n.pages.changeEmail.error
            if (err.response?.data.includes("Email already sent")) errMsg = i18n.pages.changeEmail.alreadySent
            errorRef.current!.innerText = errMsg
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
        }
        setNewEmail("")
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">{i18n.pages.verifyEmail.title}</span>
                    {submitted ?
                    <>
                    <span className="sitepage-link">{i18n.pages.verifyEmail.submitHeading}</span>
                    <div className="sitepage-button-container-left">
                        <button className="sitepage-button" onClick={() => setSubmitted(false)}>{i18n.buttons.ok}</button>
                    </div>
                    </> : <>
                    <span className="sitepage-link">{i18n.pages.verifyEmail.heading}</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.verifyEmail.unverifiedEmail}: </span>
                        <span className="sitepage-text-small2">{session.email}</span>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.verifyEmail.optionalAddressChange}: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => submit()}>{i18n.pages.verifyEmail.resend}</button>
                    </div>
                    </>
                    }
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default VerifyEmailPage