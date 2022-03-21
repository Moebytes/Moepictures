import React, {useEffect, useContext} from "react"
import TitleBar from "./TitleBar"
import NavBar from "./NavBar"
import SideBar from "./SideBar"
import SortBar from "./SortBar"
import Footer from "./Footer"
import $404 from "../assets/images/404.png"
import {HideNavbarContext, HideSidebarContext, ThemeContext} from "../App"
import "../styles/404page.less"

const $404Page: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
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