import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import show from "../assets/icons/show.png"
import hide from "../assets/icons/hide.png"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext,
HeaderTextContext, SidebarTextContext, SessionContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import "./styles/signuppage.less"
import axios from "axios"

const SignUpPage: React.FunctionComponent = (props) => {
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
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
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
        const captcha = await axios.get("/api/misc/captcha/create", {params: {color: getCaptchaColor()}, withCredentials: true}).then((r) => r.data)
        setCaptcha(captcha)
        setCaptchaResponse("")
    }

    useEffect(() => {
        updateCaptcha()
    }, [theme])

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Moepictures: Sign Up"
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
            errorRef.current!.innerText = "Passwords don't match."
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badPassword = functions.validatePassword(username.trim(), password.trim())
        if (badPassword) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badPassword
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badEmail = functions.validateEmail(email.trim())
        if (badEmail) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badEmail
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badUsername = functions.validateUsername(username.trim())
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
            await functions.timeout(20)
            errorRef.current.innerText = "Solve the captcha."
            await functions.timeout(2000)
            return setError(false)
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/user/signup", {username, email, password, captchaResponse}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad username, password, email, or captcha."
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
        }
    }

    const goToLogin = () => {
        history.push("/login")
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="signup">
                    <span className="signup-title">Sign Up</span>
                    {submitted ? <>
                    <span className="signup-validation">Your account has been created. You should have received a confirmation link in your email. Please verify your email and login again.</span>
                    <div className="signup-button-container" style={{justifyContent: "flex-start"}}>
                        <button className="signup-button" onClick={() => goToLogin()}>Login</button>
                    </div>
                    </> :
                    <>
                    <Link to="/login">
                        <span className="signup-link">Already have an account? Login.</span>
                    </Link>
                    <div className="signup-row">
                        <span className="signup-text">Email Address:</span>
                        <input className="signup-input" type="text" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="signup-row">
                        <span className="signup-text">Username:</span>
                        <input className="signup-input" type="text" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="signup-row">
                        <span className="signup-text">Password:</span>
                        <div className="signup-pass">
                            <img className="signup-pass-show" src={getEye()} style={{filter: getFilter()}} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="signup-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="signup-row">
                        <span className="signup-text">Confirm Password:</span>
                        <div className="signup-pass">
                            <img className="signup-pass-show" src={getEye2()} style={{filter: getFilter()}} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="signup-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="signup-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="signup-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <span className="signup-validation">
                        -Passwords must contain at least 10 characters<br/>
                        -At least three of the following: lowercase letters, uppercase
                        letters, numbers, and special symbols
                    </span>
                    {error ? <div className="signup-validation-container"><span className="signup-validation" ref={errorRef}></span></div> : null}
                    <div className="signup-button-container">
                        <button className="signup-button" onClick={() => submit()}>Sign Up</button>
                    </div></>}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default SignUpPage