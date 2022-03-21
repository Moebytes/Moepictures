import React, {useEffect, useContext, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "./TitleBar"
import NavBar from "./NavBar"
import SideBar from "./SideBar"
import Footer from "./Footer"
import show from "../assets/purple/show.png"
import hide from "../assets/purple/hide.png"
import showPurpleLight from "../assets/purple-light/show.png"
import hidePurpleLight from "../assets/purple-light/hide.png"
import showMagenta from "../assets/magenta/show.png"
import hideMagenta from "../assets/magenta/hide.png"
import showMagentaLight from "../assets/magenta-light/show.png"
import hideMagentaLight from "../assets/magenta-light/hide.png"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext} from "../App"
import "../styles/resetpasspage.less"

const ResetPasswordPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [clicked, setClicked] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [showPassword3, setShowPassword3] = useState(false)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        document.title = "Moebooru: Reset Password"
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

    const getEye3 = () => {
        if (theme === "purple") return showPassword3 ? hide : show
        if (theme === "purple-light") return showPassword3 ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword3 ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword3 ? hideMagentaLight : showMagentaLight
        return showPassword3 ? hide : show
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="reset-pass" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="reset-pass-title">Reset Password</span>
                    {clicked ?
                    <>
                    <span className="reset-pass-link">Your password has been reset.</span>
                    <div className="reset-pass-button-container-left">
                        <Link to="/login">
                            <button className="reset-pass-button" onClick={() => setClicked(false)}>Login</button>
                        </Link>
                    </div>
                    </> : <>
                    <div className="reset-pass-row">
                        <span className="reset-pass-text">New Password:</span>
                        <div className="reset-pass-pass">
                            <img className="reset-pass-pass-show" src={getEye()} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="reset-pass-pass-input" type={showPassword ? "text" : "password"} spellCheck={false}/>
                        </div>
                    </div>
                    <div className="reset-pass-row">
                        <span className="reset-pass-text">Confirm New Password:</span>
                        <div className="reset-pass-pass">
                            <img className="reset-pass-pass-show" src={getEye2()} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="reset-pass-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false}/>
                        </div>
                    </div>
                    <div className="reset-pass-button-container">
                        <button className="reset-pass-button" onClick={() => setClicked(true)}>Reset Password</button>
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