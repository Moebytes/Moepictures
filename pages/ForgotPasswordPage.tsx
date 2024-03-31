import React, {useEffect, useContext, useState, useRef} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext} from "../Context"
import functions from "../structures/Functions"
import axios from "axios"
import "./styles/forgotpasspage.less"

const ForgotPasswordPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const [email, setEmail] = useState("")
    const errorRef = useRef<any>(null)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Moebooru: Forgot Password"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const submit = async () => {
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        await axios.post("/api/user/forgotpassword", {email}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        setSubmitted(true)
        setError(false)
        setEmail("")
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="forgot-pass">
                    <span className="forgot-pass-title">Forgot Password</span>
                    {submitted ?
                    <>
                    <span className="forgot-pass-link">A password reset link was sent if this account exists.</span>
                    <div className="forgot-pass-button-container-left">
                        <button className="forgot-pass-button" onClick={() => setSubmitted(false)}>←Back</button>
                    </div>
                    </> : <>
                    <span className="forgot-pass-link">Enter your email to receive a password reset link.</span>
                    <div className="forgot-pass-row">
                        <span className="forgot-pass-text">Email Address:</span>
                        <input className="forgot-pass-input" type="text" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    {error ? <div className="forgot-pass-validation-container"><span className="forgot-pass-validation" ref={errorRef}></span></div> : null}
                    <div className="forgot-pass-button-container">
                        <button className="forgot-pass-button" onClick={() => submit()}>Send Link</button>
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

export default ForgotPasswordPage