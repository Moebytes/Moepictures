import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, RedirectContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext, MobileContext,
SessionFlagContext} from "../Context"
import {useThemeSelector} from "../store"
import "./styles/sitepage.less"
import session from "express-session"

const VerifyEmailPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
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
        document.title = "Verify Email"
    }, [])

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
            setSidebarText("Login required.")
        }
        if (session.emailVerified) {
            history.push("/verify-email-success")
        }
    }, [session])

    const submit = async () => {
        let email = newEmail ? newEmail : session.email
        const badEmail = functions.validateEmail(email)
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
        errorRef.current!.innerText = "Submitting..."
        try {
            await functions.post("/api/user/verifyemail", {email, captchaResponse}, session, setSessionFlag)
            setSubmitted(true)
            setSessionFlag(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad email or captcha."
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
                    <span className="sitepage-title">Verify Email</span>
                    {submitted ?
                    <>
                    <span className="sitepage-link">Verification email resent. Check your email.</span>
                    <div className="sitepage-button-container-left">
                        <button className="sitepage-button" onClick={() => setSubmitted(false)}>Ok</button>
                    </div>
                    </> : <>
                    <span className="sitepage-link">You must verify your email address in order to use your account. If you need to 
                    change your email and/or resend the verification link, you can do so below.</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Unverified Email: </span>
                        <span className="sitepage-text-small2">{session.email}</span>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Optional Address Change: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => submit()}>Resend Verification Link</button>
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