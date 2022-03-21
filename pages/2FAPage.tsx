import React, {useEffect, useContext, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "./TitleBar"
import NavBar from "./NavBar"
import Footer from "./Footer"
import SideBar from "./SideBar"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext} from "../App"
import "../styles/2fapage.less"

const f2aPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        document.title = "Moebooru: 2-Factor Authentication"
    }, [])

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="f2a" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="f2a-title">2-Factor Authentication</span>
                    <span className="f2a-link">Please enter your 2FA token or one of your backup codes.</span>
                    <div className="f2a-row">
                        <span className="f2a-text">2FA Token:</span>
                        <input className="f2a-input" type="text" spellCheck={false}/>
                    </div>
                    <div className="f2a-button-container">
                        <button className="f2a-button">Validate</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default f2aPage