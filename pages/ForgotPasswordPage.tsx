import React, {useEffect, useContext, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext} from "../App"
import "./styles/forgotpasspage.less"

const ForgotPasswordPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const [clicked, setClicked] = useState(false)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        setRelative(false)
        document.title = "Moebooru: Forgot Password"
    }, [])


    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="forgot-pass" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="forgot-pass-title">Forgot Password</span>
                    {clicked ?
                    <>
                    <span className="forgot-pass-link">Reset password link sent. Check your email.</span>
                    <div className="forgot-pass-button-container-left">
                        <button className="forgot-pass-button" onClick={() => setClicked(false)}>←Back</button>
                    </div>
                    </> : <>
                    <span className="forgot-pass-link">Enter your email to receive a password reset link.</span>
                    <div className="forgot-pass-row">
                        <span className="forgot-pass-text">Email Address:</span>
                        <input className="forgot-pass-input" type="text" spellCheck={false}/>
                    </div>
                    <div className="forgot-pass-button-container">
                        <button className="forgot-pass-button" onClick={() => setClicked(true)}>Send Link</button>
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

export default ForgotPasswordPage