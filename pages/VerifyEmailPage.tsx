import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import axios from "axios"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RedirectContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext,
SessionFlagContext} from "../Context"
import "./styles/verifyemailpage.less"
import session from "express-session"

const VerifyEmailPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
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
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Verify Email"
    }, [])

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
            await axios.post("/api/verifyemail", {email}, {withCredentials: true})
            setSubmitted(true)
            setSessionFlag(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad email."
            await functions.timeout(2000)
            setError(false)
        }
        setNewEmail("")
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="verify-email">
                    <span className="verify-email-title">Verify Email</span>
                    {submitted ?
                    <>
                    <span className="verify-email-link">Verification email resent. Check your email.</span>
                    <div className="verify-email-button-container-left">
                        <button className="verify-email-button" onClick={() => setSubmitted(false)}>Ok</button>
                    </div>
                    </> : <>
                    <span className="verify-email-link">You must verify your email address in order to complete the signup process. If you need to 
                    change your email and/or resend the verification link, you can do so below.</span>
                    <div className="verify-email-row">
                        <span className="verify-email-text">Unverified Email: </span>
                        <span className="verify-email-text-small">{session.email}</span>
                    </div>
                    <div className="verify-email-row">
                        <span className="verify-email-text">Optional Address Change: </span>
                        <input className="verify-email-input" type="text" spellCheck={false} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    {error ? <div className="verify-email-validation-container"><span className="verify-email-validation" ref={errorRef}></span></div> : null}
                    <div className="verify-email-button-container">
                        <button className="verify-email-button" onClick={() => submit()}>Resend Verification Link</button>
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