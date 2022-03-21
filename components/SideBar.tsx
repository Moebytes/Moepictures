import React, {useContext, useEffect, useState} from "react"
import {ThemeContext, HideSidebarContext, HideNavbarContext, EnableDragContext} from "../App"
import {HashLink as Link} from "react-router-hash-link"
import search from "../assets/purple/search.png"
import searchImage from "../assets/purple/search-image.png"
import searchMagenta from "../assets/magenta/search.png"
import searchImageMagenta from "../assets/magenta/search-image.png"
import searchPurpleLight from "../assets/purple-light/search.png"
import searchImagePurpleLight from "../assets/purple-light/search-image.png"
import searchMagentaLight from "../assets/magenta-light/search.png"
import searchImageMagentaLight from "../assets/magenta-light/search-image.png"
import random from "../assets/purple/random.png"
import randomMagenta from "../assets/magenta/random.png"
import randomPurpleLight from "../assets/purple-light/random.png"
import randomMagentaLight from "../assets/magenta-light/random.png"
import terms from "../assets/purple/terms.png"
import termsMagenta from "../assets/magenta/terms.png"
import termsPurpleLight from "../assets/purple-light/terms.png"
import termsMagentaLight from "../assets/magenta-light/terms.png"
import contact from "../assets/purple/contact.png"
import contactMagenta from "../assets/magenta/contact.png"
import contactPurpleLight from "../assets/purple-light/contact.png"
import contactMagentaLight from "../assets/magenta-light/contact.png"
import code from "../assets/purple/code.png"
import codeMagenta from "../assets/magenta/code.png"
import codePurpleLight from "../assets/purple-light/code.png"
import codeMagentaLight from "../assets/magenta-light/code.png"
import pack from "../package.json"
import "../styles/sidebar.less"

interface Props {
    text?: string
}

const SideBar: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const [tags, setTags] = useState([]) as any
    const [maxTags, setMaxTags] = useState(26)

    useEffect(() => {
        setTags(["loli", "azur lane", "animated", "with audio", "kancolle", "leggings", "stockings",
    "gabriel dropout", "kiniro mosaic", "himouto! umaru-chan", "sword art online", "is the order a rabbit?", "sexual intercourse", 
    "saliva", "cum",
    "loli", "copulation", "animated", "with audio", "kancolle", "leggings", "stockings",
    "gabriel dropout", "kiniro mosaic", "himouto! umaru-chan", "sword art online", "is the order a rabbit?", "sexual intercourse", 
    "saliva", "cum"])
    }, [])

    useEffect(() => {
        const scrollHandler = () => {
            const sidebar = document.querySelector(".sidebar") as HTMLElement
            if (hideNavbar) {
                if (window.scrollY === 0) {
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 26) setMaxTags(26)
                } else {
                    sidebar.style.height = "calc(100vh - 35px)"
                    if (maxTags !== 30) setMaxTags(30)
                }
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            setTimeout(() => {
                window.removeEventListener("scroll", scrollHandler)
            }, 10)
        }
    })

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        if (!hideNavbar) {
            sidebar.style.height = "calc(100vh - 35px - 77px)"
            if (maxTags !== 26) setMaxTags(26)
        } else {
            if (window.scrollY !== 0) {
                sidebar.style.height = "calc(100vh - 35px)"
                if (maxTags !== 30) setMaxTags(30)
            }
        }
    }, [hideNavbar])

    const getSearchIcon = () => {
        if (theme === "purple") return search
        if (theme === "purple-light") return searchPurpleLight
        if (theme === "magenta") return searchMagenta
        if (theme === "magenta-light") return searchMagentaLight
        return search
    }

    const getSearchImageIcon = () => {
        if (theme === "purple") return searchImage
        if (theme === "purple-light") return searchImagePurpleLight
        if (theme === "magenta") return searchImageMagenta
        if (theme === "magenta-light") return searchImageMagentaLight
        return searchImage
    }

    const getRandomIcon = () => {
        if (theme === "purple") return random
        if (theme === "purple-light") return randomPurpleLight
        if (theme === "magenta") return randomMagenta
        if (theme === "magenta-light") return randomMagentaLight
        return random
    }

    const getTermsIcon = () => {
        if (theme === "purple") return terms
        if (theme === "purple-light") return termsPurpleLight
        if (theme === "magenta") return termsMagenta
        if (theme === "magenta-light") return termsMagentaLight
        return terms
    }

    const getContactIcon = () => {
        if (theme === "purple") return contact
        if (theme === "purple-light") return contactPurpleLight
        if (theme === "magenta") return contactMagenta
        if (theme === "magenta-light") return contactMagentaLight
        return contact
    }

    const getCodeIcon = () => {
        if (theme === "purple") return code
        if (theme === "purple-light") return codePurpleLight
        if (theme === "magenta") return codeMagenta
        if (theme === "magenta-light") return codeMagentaLight
        return code
    }

    const generateTagJSX = () => {
        let jsx = [] as any
        let max = tags.length > maxTags ? maxTags : tags.length
        for (let i = 0; i < max; i++) {
            jsx.push(
                <div className="tag-row">
                    <span className="tag-hover">
                        <span className="tag">{tags[i]}</span>
                        <span className="tag-count">{Math.floor(Math.random() * 1000)}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    return (
        <div className={`sidebar ${hideSidebar ? "hide-sidebar" : ""} ${hideNavbar ? "sidebar-top" : ""}`} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
            <div className="sidebar-container">
                <div className="sidebar-text-container">
                    <span className="sidebar-text">{props.text}</span>
                </div>
                <div className="search-container">
                    <input className="search" type="search" spellCheck="false"/>
                    <img className={!theme || theme === "purple" ? "search-icon" : `search-icon-${theme}`} src={getSearchIcon()}/>
                    <img className={!theme || theme === "purple" ? "search-image-icon" : `search-image-icon-${theme}`} src={getSearchImageIcon()}/>
                </div>
                <div className="random-container">
                    <img className={!theme || theme === "purple" ? "random" : `random-${theme}`} src={getRandomIcon()}/>
                </div>
                <div className="tag-container">
                    {generateTagJSX()}
                </div>
                <div className="sidebar-footer">
                    <span className="sidebar-footer-text">©{new Date().getFullYear()} Tenpi</span>
                    <Link to="/terms">
                        <img className="sidebar-footer-icon" src={getTermsIcon()}/>
                    </Link>
                    <Link to="/contact">
                        <img className="sidebar-footer-icon" src={getContactIcon()}/>
                    </Link>
                    <img className="sidebar-footer-icon" src={getCodeIcon()} onClick={() => window.open(pack.repository.url, "_blank")}/>
                </div>
            </div>
        </div>
    )
}

export default SideBar