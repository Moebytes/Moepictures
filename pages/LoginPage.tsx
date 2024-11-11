import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import show from "../assets/icons/show.png"
import hide from "../assets/icons/hide.png"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, RelativeContext, SessionContext, MobileContext,
HideTitlebarContext, HeaderTextContext, SessionFlagContext, SidebarTextContext, RedirectContext} from "../Context"
import {useThemeSelector} from "../store"
import "./styles/sitepage.less"
import functions from "../structures/Functions"

const LoginPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [showPassword, setShowPassword] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState(" ")
    const [error, setError] = useState(false)
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
        setEnableDrag(false)
        if (sidebarText !== "Login required.") setSidebarText("")
        document.title = "Login"
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

    const login = async () => {
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
            const result = await functions.post("/api/user/login", {username, password, captchaResponse}, session, setSessionFlag)
            setSessionFlag(true)
            if (redirect) {
                await functions.timeout(20)
                history.push(redirect)
                setRedirect(null)
            } else {
                history.push("/posts")
            }
            if (result === "2fa") {
                history.push("/2fa")
            }
            setError(false)
        } catch (err: any) {
            let errMsg = "Invalid username, password, or captcha."
            if (err.response?.data.includes("Too many login attempts")) errMsg = "Too many login attempts, try again later."
            errorRef.current!.innerText = errMsg
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
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
                    <span className="sitepage-title">Login</span>
                    <Link to="/signup">
                        <span className="sitepage-link-clickable">Don't have an account? Sign up.</span>
                    </Link>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Username:</span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Password:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye()} style={{filter: getFilter()}} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null}/>
                        </div>
                    </div>
                    <Link style={{width: "max-content"}} to ="/forgot-password">
                        <span className="sitepage-link-clickable">Forgot Password?</span>
                    </Link>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => login()}>Login</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default LoginPage