import React, {useContext, useEffect} from "react"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import {ThemeContext, HideNavbarContext, EnableDragContext, RelativeContext} from "../App"
import "./styles/titlebar.less"

interface Props {
    text?: string
}

const TitleBar: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) setTheme(savedTheme)
    }, [])

    const getImg = () => {
        if (theme.includes("magenta")) return faviconMagenta
        return favicon
    }

    return (
        <div className={`titlebar ${hideNavbar ? "hide-titlebar" : ""} ${relative ? "titlebar-relative" : ""}`} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
           <Link to="/" className="titlebar-logo-container">
                <span className="titlebar-hover">
                    <div className="titlebar-text-container">
                            <span className="titlebar-text-a">M</span>
                            <span className="titlebar-text-b">o</span>
                            <span className="titlebar-text-a">e</span>
                            <span className="titlebar-text-b">b</span>
                            <span className="titlebar-text-a">o</span>
                            <span className="titlebar-text-b">o</span>
                            <span className="titlebar-text-a">r</span>
                            <span className="titlebar-text-b">u</span>
                    </div>
                    <img className="titlebar-img" src={getImg()}/>
                </span>
            </Link>
            <div className="titlebar-search-text-container">
                <span className="titlebar-search-text">{props.text}</span>
            </div>
        </div>
    )
}

export default TitleBar