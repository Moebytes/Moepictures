import React, {useContext} from "react"
import {HashLink as Link} from "react-router-hash-link"
import eyedropper from "../assets/purple/eyedropper.png"
import light from "../assets/purple/light.png"
import dark from "../assets/purple/dark.png"
import eyedropperPurpleLight from "../assets/purple-light/eyedropper.png"
import lightPurpleLight from "../assets/purple-light/light.png"
import darkPurpleLight from "../assets/purple-light/dark.png"
import eyedropperMagenta from "../assets/magenta/eyedropper.png"
import lightMagenta from "../assets/magenta/light.png"
import darkMagenta from "../assets/magenta/dark.png"
import eyedropperMagentaLight from "../assets/magenta-light/eyedropper.png"
import lightMagentaLight from "../assets/magenta-light/light.png"
import darkMagentaLight from "../assets/magenta-light/dark.png"
import {ThemeContext, HideNavbarContext, HideSortbarContext, HideSidebarContext} from "../App"
import "../styles/navbar.less"

const NavBar: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)

    const colorChange = () => {
        let newTheme = ""
        if (!theme || theme === "purple") {
            newTheme = "magenta"
            setTheme("magenta")
        }
        if (theme === "magenta") {
            newTheme = "purple"
            setTheme("purple")
        }
        if (theme === "purple-light") {
            newTheme = "magenta-light"
            setTheme("magenta-light")
        }
        if (theme === "magenta-light") {
            newTheme = "purple-light"
            setTheme("purple-light")
        }
        localStorage.setItem("theme", newTheme)
    }

    const lightChange = () => {
        let newTheme = ""
        if (!theme || theme === "purple") {
            newTheme = "purple-light"
            setTheme("purple-light")
        }
        if (theme === "magenta") {
            newTheme = "magenta-light"
            setTheme("magenta-light")
        }
        if (theme === "purple-light") {
            newTheme = "purple"
            setTheme("purple")
        }
        if (theme === "magenta-light") {
            newTheme = "magenta"
            setTheme("magenta")
        }
        localStorage.setItem("theme", newTheme)
        
    }

    const getEyeDropper = () => {
        if (theme === "purple") return eyedropper
        if (theme === "purple-light") return eyedropperPurpleLight
        if (theme === "magenta") return eyedropperMagenta
        if (theme === "magenta-light") return eyedropperMagentaLight
        return eyedropper
    }

    const getLight = () => {
        if (theme === "purple") return light
        if (theme === "purple-light") return darkPurpleLight
        if (theme === "magenta") return lightMagenta
        if (theme === "magenta-light") return darkMagentaLight
        return light
    }

    return (
        <div className={`navbar ${hideNavbar ? "hide-navbar" : ""} ${hideSortbar && hideNavbar && hideSidebar ? "translate-navbar" : ""}`}>
            <div className="nav-text-container">
                <span className="nav-text nav-user-text">Login</span>
                <span className="nav-text">Posts</span>
                <span className="nav-text">Comments</span>
                <span className="nav-text">Artists</span>
                <span className="nav-text">Characters</span>
                <span className="nav-text">Series</span>
                <span className="nav-text">Tags</span>
                <Link to="/help">
                    <span className="nav-text">Help</span>
                </Link>
            </div>
            <div className="nav-color-container">
                <img className="nav-color" src={getEyeDropper()} onClick={colorChange}/>
                <img className="nav-color" src={getLight()} onClick={lightChange}/>
            </div>
        </div>
    )
}

export default NavBar