import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import show from "../../assets/icons/show.png"
import hide from "../../assets/icons/hide.png"
import functions from "../../structures/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useLayoutSelector} from "../../store"
import "./styles/sitepage.less"

const SignUpPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()

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
        document.title = i18n.pages.signup.title
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
        if (session.username) {
            navigate("/profile")
        }
    }, [session])

    const getEye = () => {
        return showPassword ? hide : show
    }

    const getEye2 = () => {
        return showPassword2 ? hide : show
    }

    const submit = async () => {
        if (password.trim() !== confirmPassword.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.changePassword.noMatch
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badPassword = functions.validatePassword(username.trim(), password.trim(), i18n)
        if (badPassword) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badPassword
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badEmail = functions.validateEmail(email.trim(), i18n)
        if (badEmail) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badEmail
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badUsername = functions.validateUsername(username.trim(), i18n)
        if (badUsername) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badUsername
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!captchaResponse) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.login.captcha
            await functions.timeout(2000)
            return setError(false)
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/user/signup", {username, email, password, captchaResponse}, session, setSessionFlag)
            setSubmitted(true)
            setError(false)
        } catch (err: any) {
            let errMsg = i18n.pages.signup.error
            if (err.response?.data.includes("Too many accounts created")) errMsg = i18n.pages.signup.rateLimit
            if (err.response?.data.includes("IP banned")) errMsg = i18n.pages.signup.banned
            errorRef.current!.innerText = errMsg
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
        }
    }

    const goToLogin = () => {
        navigate("/login")
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">{i18n.pages.signup.title}</span>
                    {submitted ? <>
                    <span className="sitepage-validation">{i18n.pages.signup.submitHeading}</span>
                    <div className="sitepage-button-container" style={{justifyContent: "flex-start"}}>
                        <button className="sitepage-button" onClick={() => goToLogin()}>{i18n.navbar.login}</button>
                    </div>
                    </> :
                    <>
                    <Link style={{width: "max-content"}} to="/login">
                        <span className="sitepage-link-clickable">{i18n.pages.signup.loginText}</span>
                    </Link>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.labels.emailAddress}:</span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.labels.username}:</span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.labels.password}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye()} style={{filter: getFilter()}} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.labels.confirmPassword}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye2()} style={{filter: getFilter()}} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <span className="sitepage-validation">
                        {i18n.pages.signup.lengthReq}<br/>
                        {i18n.pages.signup.varietyReq}
                    </span>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => submit()}>{i18n.pages.signup.title}</button>
                    </div></>}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default SignUpPage