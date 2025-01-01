import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import show from "../../assets/icons/show.png"
import hide from "../../assets/icons/hide.png"
import functions from "../../structures/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../../store"
import "./styles/sitepage.less"

const ChangePasswordPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [showPassword3, setShowPassword3] = useState(false)
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

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
    }, [])

    useEffect(() => {
        document.title = i18n.user.changePassword
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
            setRedirect("/change-password")
            history.push("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
    }, [session])

    const getEye = () => {
        return showPassword ? hide : show
    }

    const getEye2 = () => {
        return showPassword2 ? hide : show
    }

    const getEye3 = () => {
        return showPassword3 ? hide : show
    }

    const submit = async () => {
        if (newPassword.trim() !== confirmNewPassword.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.changePassword.noMatch
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badPassword = functions.validatePassword(session.username.trim(), newPassword.trim(), i18n)
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
            await functions.post("/api/user/changepassword", {oldPassword, newPassword}, session, setSessionFlag)
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
                    <span className="sitepage-title">{i18n.user.changePassword}</span>
                    {submitted ?
                    <>
                    <span className="sitepage-link">{i18n.pages.changePassword.submitHeading}</span>
                    <div className="sitepage-button-container-left">
                        <button className="sitepage-button" onClick={() => history.push("/profile")}>←{i18n.buttons.back}</button>
                    </div>
                    </> : <>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide3">{i18n.labels.oldPassword}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye()} style={{filter: getFilter()}} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide3">{i18n.labels.newPassword}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye2()} style={{filter: getFilter()}} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide3">{i18n.labels.confirmNewPassword}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye3()} style={{filter: getFilter()}} onClick={() => setShowPassword3((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword3 ? "text" : "password"} spellCheck={false} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←{i18n.buttons.back}</button>
                        <button className="sitepage-button" onClick={() => submit()}>{i18n.user.changePassword}</button>
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