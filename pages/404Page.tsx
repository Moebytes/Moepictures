import React, {useEffect, useContext} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import Footer from "../components/Footer"
import $404 from "../assets/images/404.png"
import {HideNavbarContext, HideSidebarContext, ThemeContext, RelativeContext} from "../App"
import "./styles/404page.less"

const $404Page: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        setRelative(false)
        document.title = "Moebooru: 404 Error"
    }, [])

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar text="404 error."/>
            <div className="content">
                <div className="f404-container">
                    <span className={`f404-text ${!theme.includes("light") ? "f404-darker" : ""}`}>404 Error</span>
                    <img className="f404" src={$404}/>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default $404Page