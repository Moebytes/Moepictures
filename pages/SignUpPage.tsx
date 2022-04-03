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
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext} from "../Context"
import "./styles/signuppage.less"

const SignUpPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        document.title = "Moebooru: Sign Up"
    }, [])

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

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="signup" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="signup-title">Sign Up</span>
                    <Link to="/login">
                        <span className="signup-link">Already have an account? Login.</span>
                    </Link>
                    <div className="signup-row">
                        <span className="signup-text">Email Address:</span>
                        <input className="signup-input" type="text" spellCheck={false}/>
                    </div>
                    <div className="signup-row">
                        <span className="signup-text">Username:</span>
                        <input className="signup-input" type="text" spellCheck={false}/>
                    </div>
                    <div className="signup-row">
                        <span className="signup-text">Password:</span>
                        <div className="signup-pass">
                            <img className="signup-pass-show" src={getEye()} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="signup-pass-input" type={showPassword ? "text" : "password"} spellCheck={false}/>
                        </div>
                    </div>
                    <div className="signup-row">
                        <span className="signup-text">Confirm Password:</span>
                        <div className="signup-pass">
                            <img className="signup-pass-show" src={getEye2()} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="signup-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false}/>
                        </div>
                    </div>
                    <span className="signup-validation">
                        -Passwords must contain at least 10 characters<br/>
                        -At least three of the following: lowercase letters, uppercase
                        letters, numbers, and special symbols
                    </span>
                    <div className="signup-button-container">
                        <button className="signup-button">Sign Up</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default SignUpPage