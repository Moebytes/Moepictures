import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import show from "../assets/purple/show.png"
import hide from "../assets/purple/hide.png"
import showPurpleLight from "../assets/purple-light/show.png"
import hidePurpleLight from "../assets/purple-light/hide.png"
import showMagenta from "../assets/magenta/show.png"
import hideMagenta from "../assets/magenta/hide.png"
import showMagentaLight from "../assets/magenta-light/show.png"
import hideMagentaLight from "../assets/magenta-light/hide.png"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RedirectContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext} from "../Context"
import axios from "axios"
import "./styles/changepasspage.less"

const ChangePasswordPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {session, setSession} = useContext(SessionContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)

    const [submitted, setSubmitted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [showPassword3, setShowPassword3] = useState(false)
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
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
        setEnableDrag(false)
        document.title = "Moebooru: Change Password"
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
            setRedirect("/change-password")
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    const getEye = () => {
        if (theme === "purple") return showPassword ? hide : show
        if (theme === "purple-light") return showPassword ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword ? hideMagentaLight : showMagentaLight
        return showPassword ? hide : show
    }

    const getEye2 = () => {
        if (theme === "purple") return showPassword2 ? hide : show
        if (theme === "purple-light") return showPassword2 ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword2 ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword2 ? hideMagentaLight : showMagentaLight
        return showPassword2 ? hide : show
    }

    const getEye3 = () => {
        if (theme === "purple") return showPassword3 ? hide : show
        if (theme === "purple-light") return showPassword3 ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword3 ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword3 ? hideMagentaLight : showMagentaLight
        return showPassword3 ? hide : show
    }

    const submit = async () => {
        if (newPassword.trim() !== confirmNewPassword.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Passwords don't match."
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badPassword = functions.validatePassword(session.username.trim(), newPassword.trim())
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
            await axios.post("/api/user/changepassword", {oldPassword, newPassword}, {withCredentials: true})
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
                <div className="change-pass">
                    <span className="change-pass-title">Change Password</span>
                    {submitted ?
                    <>
                    <span className="change-pass-link">Your password has been changed.</span>
                    <div className="change-pass-button-container-left">
                        <button className="change-pass-button" onClick={() => history.push("/profile")}>←Back</button>
                    </div>
                    </> : <>
                    <div className="change-pass-row">
                        <span className="change-pass-text">Old Password:</span>
                        <div className="change-pass-pass">
                            <img className="change-pass-pass-show" src={getEye()} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="change-pass-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="change-pass-row">
                        <span className="change-pass-text">New Password:</span>
                        <div className="change-pass-pass">
                            <img className="change-pass-pass-show" src={getEye2()} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="change-pass-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="change-pass-row">
                        <span className="change-pass-text">Confirm New Password:</span>
                        <div className="change-pass-pass">
                            <img className="change-pass-pass-show" src={getEye3()} onClick={() => setShowPassword3((prev) => !prev)}/>
                            <input className="change-pass-pass-input" type={showPassword3 ? "text" : "password"} spellCheck={false} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    {error ? <div className="change-pass-validation-container"><span className="change-pass-validation" ref={errorRef}></span></div> : null}
                    <div className="change-pass-button-container">
                        <button style={{marginRight: "20px"}} className="change-username-button" onClick={() => history.push("/profile")}>←Back</button>
                        <button className="change-pass-button" onClick={() => submit()}>Change Password</button>
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

export default ChangePasswordPage