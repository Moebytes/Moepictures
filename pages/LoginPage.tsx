import React, {useEffect, useContext, useState} from "react"
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
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext} from "../App"
import "./styles/loginpage.less"

const LoginPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        setRelative(false)
        document.title = "Moebooru: Login"
    }, [])

    const getEye = () => {
        if (theme === "purple") return showPassword ? hide : show
        if (theme === "purple-light") return showPassword ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword ? hideMagentaLight : showMagentaLight
        return showPassword ? hide : show
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="login" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="login-title">Login</span>
                    <Link to="/signup">
                        <span className="login-link">Don't have an account? Sign up.</span>
                    </Link>
                    <div className="login-row">
                        <span className="login-text">Username:</span>
                        <input className="login-input" type="text" spellCheck={false}/>
                    </div>
                    <div className="login-row">
                        <span className="login-text">Password:</span>
                        <div className="login-pass">
                            <img className="login-pass-show" src={getEye()} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="login-pass-input" type={showPassword ? "text" : "password"} spellCheck={false}/>
                        </div>
                    </div>
                    <Link to ="/forgot-password">
                        <span className="login-link">Forgot Password?</span>
                    </Link>
                    <div className="login-button-container">
                        <Link to="/2fa">
                            <button className="login-button">Login</button>
                        </Link>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default LoginPage