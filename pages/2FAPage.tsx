import React, {useEffect, useContext, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import SideBar from "../components/SideBar"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext} from "../Context"
import "./styles/2fapage.less"

const f2aPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [showPassword, setShowPassword] = useState(false)
    const {relative, setRelative} = useContext(RelativeContext)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        document.title = "Moebooru: 2-Factor Authentication"
    }, [])

    return (
        <>
        <DragAndDrop/>
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