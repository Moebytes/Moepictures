import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import SideBar from "../components/SideBar"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, 
HeaderTextContext, SidebarTextContext, SessionContext, SessionFlagContext, RedirectContext, MobileContext} from "../Context"
import "./styles/2faenablepage.less"
import functions from "../structures/Functions"
import axios from "axios"

const $2FAEnablePage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [showPassword, setShowPassword] = useState(false)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [qr, setQR] = useState(null) as any
    const [showValidation, setShowValidation] = useState(false)
    const [token, setToken] = useState("")
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
        document.title = "Moebooru: Enable 2-Factor Authentication"
        if (session?.$2fa) get2FAQRCode()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const get2FAQRCode = async () => {
        const qrcode = await axios.post("/api/2faqr", null, {withCredentials: true}).then((r) => r.data)
        if (qrcode) {
            const arrayBuffer = await fetch(qrcode).then((r) => r.arrayBuffer())
            setQR(functions.arrayBufferToBase64(arrayBuffer))
        }
    }

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/enable-2fa")
            history.push("/login")
            setSidebarText("Login required.")
        }
        if (session.$2fa) {
            get2FAQRCode()
        }
    }, [session])

    const toggle = async () => {
        const {qr} = await axios.post("/api/enable2fa", null, {withCredentials: true}).then((r) => r.data)
        if (qr) {
            const arrayBuffer = await fetch(qr).then((r) => r.arrayBuffer())
            setQR(functions.arrayBufferToBase64(arrayBuffer))
            setShowValidation(true)
        } else {
            setQR(null)
            setShowValidation(false)
        }
        setSessionFlag(true)
    }

    const commit2FA = async () => {
        if (!token.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Bad token."
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/commit2fa", {token}, {withCredentials: true})
            setSessionFlag(true)
            setShowValidation(false)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad token."
            await functions.timeout(2000)
            setError(false)
        }
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="f2a-enable">
                    <span className="f2a-enable-title">2-Factor Authentication</span>
                    <span className="f2a-enable-link">2fa provides much stronger security for your account during login, by requiring an additional time-sensitive code.</span>
                    <div className="f2a-enable-row">
                        <span className="f2a-enable-text">Status: </span>
                        <span className="f2a-enable-text" style={{cursor: "pointer", marginLeft: "10px"}} onClick={toggle}>{session.$2fa ? "Enabled" : "Disabled"}</span>
                    </div>
                    {qr ? <>
                    <div className="f2a-enable-row">
                        <span className="f2a-enable-link">Scan the following QR Code in a 2FA authentication app (eg. Authy). </span>
                    </div>
                    <div className="f2a-enable-row">
                        <img className="f2a-qr" src={qr}/>
                    </div>
                    </> : null}
                    {showValidation ? <>
                    <div className="f2a-enable-row">
                        <span className="f2a-enable-link">To finish enabling 2FA, you must enter a valid 2fa token.</span>
                    </div>
                    <div className="f2a-enable-row">
                        <span className="f2a-enable-text">2FA Token:</span>
                        <input className="f2a-enable-input" type="text" spellCheck={false} value={token} onChange={(event) => setToken(event.target.value)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onKeyDown={(event) => event.key === "Enter" ? commit2FA() : null}/>
                    </div>
                    {error ? <div className="f2a-enable-validation-container"><span className="f2a-enable-validation" ref={errorRef}></span></div> : null}
                    <div className="f2a-enable-row">
                        <button className="f2a-button" onClick={commit2FA}>Enable 2FA</button>
                    </div>
                    </> : null}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default $2FAEnablePage