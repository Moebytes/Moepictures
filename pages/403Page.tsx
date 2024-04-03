import React, {useEffect, useContext} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import Footer from "../components/Footer"
import $403 from "../assets/misc/403.png"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext,
MobileContext} from "../Context"
import "./styles/403page.less"

const $403Page: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("403 error.")
        document.title = "Moebooru: 403 Error"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="f403-container">
                    <span className={`f403-text ${!theme.includes("light") ? "f404-darker" : ""}`}>403 Error</span>
                    <img className="f403" src={$403}/>
                </div>
                <Footer noPadding={true}/>
            </div>
        </div>
        </>
    )
}

export default $403Page