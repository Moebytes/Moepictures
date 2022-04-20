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
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, SessionContext,
HideTitlebarContext, HeaderTextContext, SessionFlagContext, SidebarTextContext, RedirectContext} from "../Context"
import "./styles/loginpage.less"
import axios from "axios"
import functions from "../structures/Functions"

const LoginPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
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
    const [showPassword, setShowPassword] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        if (sidebarText !== "Login required.") setSidebarText("")
        document.title = "Moebooru: Login"
    }, [])

    useEffect(() => {
        if (!session.cookie) return
        if (session.username) {
            history.push("/profile")
        }
    }, [session])

    const getEye = () => {
        if (theme === "purple") return showPassword ? hide : show
        if (theme === "purple-light") return showPassword ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword ? hideMagentaLight : showMagentaLight
        return showPassword ? hide : show
    }

    const login = async () => {
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            const result = await axios.post("/api/login", {username, password}, {withCredentials: true}).then((r) => r.data)
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
        } catch (e) {
            console.log(e)
            errorRef.current!.innerText = "Invalid username or password."
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
                <div className="login">
                    <span className="login-title">Login</span>
                    <Link to="/signup">
                        <span className="login-link">Don't have an account? Sign up.</span>
                    </Link>
                    <div className="login-row">
                        <span className="login-text">Username:</span>
                        <input className="login-input" type="text" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="login-row">
                        <span className="login-text">Password:</span>
                        <div className="login-pass">
                            <img className="login-pass-show" src={getEye()} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="login-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                        </div>
                    </div>
                    <Link to ="/forgot-password">
                        <span className="login-link">Forgot Password?</span>
                    </Link>
                    {error ? <div className="login-validation-container"><span className="login-validation" ref={errorRef}></span></div> : null}
                    <div className="login-button-container">
                        <button className="login-button" onClick={() => login()}>Login</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default LoginPage