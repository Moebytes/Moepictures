import React, {useContext, useEffect, useState} from "react"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideSortbarContext, EnableDragContext, 
RelativeContext, HideTitlebarContext, SidebarHoverContext} from "../Context"
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
import artistImg from "../assets/images/artist.png"
import userImg from "../assets/images/user.png"
import setAvatar from "../assets/purple/setavatar.png"
import setAvatarMagenta from "../assets/magenta/setavatar.png"
import addTranslation from "../assets/purple/addtranslation.png"
import addTranslationMagenta from "../assets/magenta/addtranslation.png"
import report from "../assets/purple/report.png"
import reportMagenta from "../assets/magenta/report.png"
import edit from "../assets/purple/edit.png"
import editMagenta from "../assets/magenta/edit.png"
import history from "../assets/purple/history.png"
import historyMagenta from "../assets/magenta/history.png"
import deleteIcon from "../assets/purple/delete.png"
import deleteIconMagenta from "../assets/magenta/delete.png"
import pack from "../package.json"
import "./styles/sidebar.less"

interface Props {
    text?: string
    artist?: any
    characters?: any 
    series?: any
    tags?: any
    details?: any
    postID?: number
}

const SideBar: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {sidebarHover, setSidebarHover} = useContext(SidebarHoverContext)
    const [tags, setTags] = useState([]) as any
    const [maxTags, setMaxTags] = useState(26)

    useEffect(() => {
        setTags(["loli", "azur lane", "animated", "with audio", "kancolle", "leggings", "stockings",
    "gabriel dropout", "kiniro mosaic", "himouto! umaru-chan", "sword art online", "is the order a rabbit?",
    "loli", "copulation", "animated", "with audio", "kancolle", "leggings", "stockings",
    "gabriel dropout", "kiniro mosaic", "himouto! umaru-chan", "sword art online", "is the order a rabbit?", 
    "loli", "copulation", "animated", "with audio", "kancolle", "leggings", "stockings"])
    }, [])

    useEffect(() => {
        const scrollHandler = () => {
            const sidebar = document.querySelector(".sidebar") as HTMLElement
            if (!relative) {
                if (!hideTitlebar) {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 26) setMaxTags(26)
                } else {
                    if (window.scrollY !== 0) {
                        if (hideNavbar && window.scrollY > 77) {
                            sidebar.style.top = "0px"
                            sidebar.style.height = "100vh"
                            if (maxTags !== 30) setMaxTags(30)
                        } else {
                            sidebar.style.top = "35px"
                            sidebar.style.height = "calc(100vh - 35px)"
                            if (maxTags !== 30) setMaxTags(30)
                        }
                    } else {
                        sidebar.style.top = "112px"
                        sidebar.style.height = "calc(100vh - 35px - 77px)"
                        if (maxTags !== 26) setMaxTags(26)
                    }
                }
            } else {
                sidebar.style.top = "0px"
                sidebar.style.height = "auto"
                if (maxTags !== 30) setMaxTags(30)
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
        if (!relative) {
            if (!hideTitlebar) {
                sidebar.style.top = "112px"
                sidebar.style.height = "calc(100vh - 35px - 77px)"
                if (maxTags !== 26) setMaxTags(26)
            } else {
                if (window.scrollY !== 0) {
                    if (hideNavbar && window.scrollY > 77) {
                        sidebar.style.top = "0px"
                        sidebar.style.height = "100vh"
                        if (maxTags !== 32) setMaxTags(32)
                    } else {
                        sidebar.style.top = "35px"
                        sidebar.style.height = "calc(100vh - 35px)"
                        if (maxTags !== 30) setMaxTags(30)
                    }
                } else {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 26) setMaxTags(26)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== 30) setMaxTags(30)
        }
    }, [hideTitlebar, relative])

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        if (!relative) {
            if (!hideNavbar) {
                if (!hideTitlebar) {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 26) setMaxTags(26)
                } else {
                    sidebar.style.top = "35px"
                    sidebar.style.height = "calc(100vh - 35px)"
                    if (maxTags !== 30) setMaxTags(30)
                }
                return
            }
            if (!hideSortbar) {
                if (sidebar.style.top === "0px") {
                    sidebar.style.top = "35px"
                    sidebar.style.height = "calc(100vh - 35px)"
                    if (maxTags !== 30) setMaxTags(30)
                }
            } else {
                if (sidebar.style.top === "35px") {
                    sidebar.style.top = "0px"
                    sidebar.style.height = "100vh"
                    if (maxTags !== 32) setMaxTags(32)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== 30) setMaxTags(30)
        }
    }, [hideSortbar, hideNavbar, hideTitlebar])

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

    const getSetAvatar = () => {
        if (theme.includes("magenta")) return setAvatarMagenta
        return setAvatar
    }

    const getAddTranslation = () => {
        if (theme.includes("magenta")) return addTranslationMagenta
        return addTranslation
    }

    const getReport = () => {
        if (theme.includes("magenta")) return reportMagenta
        return report
    }

    const getEdit = () => {
        if (theme.includes("magenta")) return editMagenta
        return edit
    }

    const getHistory = () => {
        if (theme.includes("magenta")) return historyMagenta
        return history
    }

    const getDeleteIcon = () => {
        if (theme.includes("magenta")) return deleteIconMagenta
        return deleteIcon
    }

    const generateTagJSX = () => {
        let jsx = [] as any
        let max = tags.length > maxTags ? maxTags : tags.length
        for (let i = 0; i < max; i++) {
            jsx.push(
                <div className="sidebar-row">
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
        <div className={`sidebar ${hideSidebar ? "hide-sidebar" : ""} ${hideTitlebar ? "sidebar-top" : ""}
        ${relative ? "sidebar-relative" : ""}`} onMouseEnter={() => {setEnableDrag(false); setSidebarHover(true)}} onMouseLeave={() => {setEnableDrag(true); setSidebarHover(false)}}>
            <div className="sidebar-container">
            <div className="sidebar-content">
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

                {props.artist ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Artist</span>
                        </div>
                        <div className="sidebar-row">
                            <img className="sidebar-img" src={artistImg}/>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <span className="tag">Liely</span>
                                <span className="tag-count">{Math.floor(Math.random() * 1000)}</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Title:</span>
                            <span className="tag-alt">None</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Drawn:</span>
                            <span className="tag-alt">3-7-2018</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Source:</span>
                            <span className="tag-alt">Pixiv</span>
                        </div>
                    </div>
                : null}

                {props.characters ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Characters</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <span className="tag">klee</span>
                                <span className="tag-count">{Math.floor(Math.random() * 1000)}</span>
                            </span>
                        </div>
                    </div>
                : null}

                {props.series ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Series</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <span className="tag">genshin impact</span>
                                <span className="tag-count">{Math.floor(Math.random() * 1000)}</span>
                            </span>
                        </div>
                    </div>
                : null}

                <div className="sidebar-subcontainer">
                    {props.tags ? 
                        <div className="sidebar-row">
                            <span className="sidebar-title">Tags</span>
                        </div>
                    : null}
                    {generateTagJSX()}
                </div>

                {props.details ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Details</span>
                        </div>
                        <div className="sidebar-row">
                            <img className="sidebar-img" src={userImg}/>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Uploader:</span>
                            <span className="tag-alt">Tenpi</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Date:</span>
                            <span className="tag-alt">3-11-2022</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Rating:</span>
                            <span className="tag-alt">Safe</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Favorites:</span>
                            <span className="tag-alt">300</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Cuteness:</span>
                            <span className="tag-alt">700</span>
                        </div>
                    </div>
                : null}  

                {props.postID ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getSetAvatar()}/>
                                <span className="tag">Set Avatar</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getAddTranslation()}/>
                                <span className="tag">Add Translation</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getReport()}/>
                                <span className="tag">Report</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getEdit()}/>
                                <span className="tag-red">Edit</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getHistory()}/>
                                <span className="tag-red">History</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getDeleteIcon()}/>
                                <span className="tag-red">Delete</span>
                            </span>
                        </div>
                    </div>
                : null}
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