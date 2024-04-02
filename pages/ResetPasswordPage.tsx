import React, {useEffect, useContext, useState, useRef} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import show from "../assets/purple/show.png"
import hide from "../assets/purple/hide.png"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext,
HeaderTextContext, SidebarTextContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import axios from "axios"
import "./styles/resetpasspage.less"

const ResetPasswordPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [submitted, setSubmitted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [error, setError] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [token, setToken] = useState("")
    const history = useHistory()
    const errorRef = useRef<any>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Moebooru: Reset Password"

        const token = new URLSearchParams(window.location.search).get("token")
        const username = new URLSearchParams(window.location.search).get("username")
        if (!token || !username) history.push("/posts")
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const getEye = () => {
        return showPassword ? hide : show
    }

    const getEye2 = () => {
        return showPassword2 ? hide : show
    }

    const submit = async () => {
        const token = new URLSearchParams(window.location.search).get("token") ?? ""
        const username = new URLSearchParams(window.location.search).get("username") ?? ""
        if (newPassword.trim() !== confirmNewPassword.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Passwords don't match."
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badPassword = functions.validatePassword(username, newPassword.trim())
        if (badPassword) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badPassword
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/user/resetpassword", {username, token, password: newPassword}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad password."
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
                <div className="reset-pass">
                    <span className="reset-pass-title">Reset Password</span>
                    {submitted ?
                    <>
                    <span className="reset-pass-link">Your password has been reset.</span>
                    <div className="reset-pass-button-container-left">
                        <Link to="/login">
                            <button className="reset-pass-button" onClick={() => history.push("/login")}>Login</button>
                        </Link>
                    </div>
                    </> : <>
                    <div className="reset-pass-row">
                        <span className="reset-pass-text">New Password:</span>
                        <div className="reset-pass-pass">
                            <img className="reset-pass-pass-show" src={getEye()} style={{filter: getFilter()}} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="reset-pass-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="reset-pass-row">
                        <span className="reset-pass-text">Confirm New Password:</span>
                        <div className="reset-pass-pass">
                            <img className="reset-pass-pass-show" src={getEye2()} style={{filter: getFilter()}} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="reset-pass-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    {error ? <div className="reset-pass-validation-container"><span className="reset-pass-validation" ref={errorRef}></span></div> : null}
                    <div className="reset-pass-button-container">
                        <button className="reset-pass-button" onClick={() => submit()}>Reset Password</button>
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

export default ResetPasswordPage