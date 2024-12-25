import React, {useEffect, useState, useRef} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import show from "../assets/icons/show.png"
import hide from "../assets/icons/hide.png"
import functions from "../structures/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useLayoutSelector} from "../store"
import "./styles/sitepage.less"

const ResetPasswordPage: React.FunctionComponent = (props) => {
    const {siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [error, setError] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [token, setToken] = useState("")
    const history = useHistory()
    const errorRef = useRef<HTMLSpanElement>(null)

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

        const token = new URLSearchParams(window.location.search).get("token")
        const username = new URLSearchParams(window.location.search).get("username")
        if (!token || !username) history.push("/posts")
    }, [])

    useEffect(() => {
        document.title = i18n.pages.resetPassword.title
    }, [i18n])

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
            errorRef.current!.innerText = i18n.pages.changePassword.noMatch
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badPassword = functions.validatePassword(username, newPassword.trim(), i18n)
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
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/user/resetpassword", {username, token, password: newPassword}, session, setSessionFlag)
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = i18n.pages.changePassword.error
            await functions.timeout(2000)
            setError(false)
        }
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">{i18n.pages.resetPassword.title}</span>
                    {submitted ?
                    <>
                    <span className="sitepage-link">{i18n.pages.resetPassword.submitHeading}</span>
                    <div className="sitepage-button-container-left">
                        <Link to="/login">
                            <button className="sitepage-button" onClick={() => history.push("/login")}>{i18n.navbar.login}</button>
                        </Link>
                    </div>
                    </> : <>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide3">{i18n.labels.newPassword}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye()} style={{filter: getFilter()}} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide3">{i18n.labels.confirmNewPassword}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye2()} style={{filter: getFilter()}} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => submit()}>{i18n.pages.resetPassword.title}</button>
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