import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import SideBar from "../components/SideBar"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext,
HeaderTextContext, SidebarTextContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import axios from "axios"
import "./styles/2fapage.less"

const $2FAPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [showPassword, setShowPassword] = useState(false)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [error, setError] = useState(false)
    const [token, setToken] = useState("")
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Moebooru: 2-Factor Authentication"
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
        if (session.username) {
            history.push("/profile")
        }
    }, [session])

    const validate = async () => {
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
            await axios.post("/api/2fa", {token}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSessionFlag(true)
            history.push("/posts")
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
                <div className="f2a">
                    <span className="f2a-title">2-Factor Authentication</span>
                    <span className="f2a-link">Please enter your 2FA token.</span>
                    <div className="f2a-row">
                        <span className="f2a-text">2FA Token:</span>
                        <input className="f2a-input" type="text" spellCheck={false} value={token} onChange={(event) => setToken(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? validate() : null}/>
                    </div>
                    {error ? <div className="f2a-validation-container"><span className="f2a-validation" ref={errorRef}></span></div> : null}
                    <div className="f2a-button-container">
                        <button className="f2a-button" onClick={validate}>Validate</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default $2FAPage