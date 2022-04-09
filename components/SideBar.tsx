import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideSortbarContext, EnableDragContext, 
RelativeContext, HideTitlebarContext, SidebarHoverContext, SearchContext, SearchFlagContext, PostsContext,
TagsContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import searchIcon from "../assets/purple/search.png"
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
import historyIcon from "../assets/purple/history.png"
import historyMagenta from "../assets/magenta/history.png"
import deleteIcon from "../assets/purple/delete.png"
import deleteIconMagenta from "../assets/magenta/delete.png"
import pack from "../package.json"
import functions from "../structures/Functions"
import "./styles/sidebar.less"

interface Props {
    post?: any
    text?: any
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
    const {posts, setPosts} = useContext(PostsContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {tags, setTags} = useContext(TagsContext)
    const [maxTags, setMaxTags] = useState(23)
    const history = useHistory()

    const updateTags = async () => {
        const tags = await functions.parseTags(posts)
        setTags(tags)
    }

    useEffect(() => {
        updateTags()
    }, [])

    useEffect(() => {
        updateTags()
    }, [posts])

    useEffect(() => {
        const scrollHandler = () => {
            const sidebar = document.querySelector(".sidebar") as HTMLElement
            if (!sidebar) return
            if (!relative) {
                if (!hideTitlebar) {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 26) setMaxTags(23)
                } else {
                    if (window.scrollY !== 0) {
                        if (hideNavbar && window.scrollY > 77) {
                            sidebar.style.top = "0px"
                            sidebar.style.height = "100vh"
                            if (maxTags !== 30) setMaxTags(29)
                        } else {
                            sidebar.style.top = "35px"
                            sidebar.style.height = "calc(100vh - 35px)"
                            if (maxTags !== 30) setMaxTags(27)
                        }
                    } else {
                        sidebar.style.top = "112px"
                        sidebar.style.height = "calc(100vh - 35px - 77px)"
                        if (maxTags !== 26) setMaxTags(23)
                    }
                }
            } else {
                sidebar.style.top = "0px"
                sidebar.style.height = "auto"
                if (maxTags !== 30) setMaxTags(29)
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
        if (!sidebar) return
        if (!relative) {
            if (!hideTitlebar) {
                sidebar.style.top = "112px"
                sidebar.style.height = "calc(100vh - 35px - 77px)"
                if (maxTags !== 26) setMaxTags(23)
            } else {
                if (window.scrollY !== 0) {
                    if (hideNavbar && window.scrollY > 77) {
                        sidebar.style.top = "0px"
                        sidebar.style.height = "100vh"
                        if (maxTags !== 32) setMaxTags(29)
                    } else {
                        sidebar.style.top = "35px"
                        sidebar.style.height = "calc(100vh - 35px)"
                        if (maxTags !== 30) setMaxTags(27)
                    }
                } else {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 26) setMaxTags(23)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== 30) setMaxTags(29)
        }
    }, [hideTitlebar, relative])

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        if (!sidebar) return
        if (!relative) {
            if (!hideNavbar) {
                if (!hideTitlebar) {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 26) setMaxTags(23)
                } else {
                    sidebar.style.top = "35px"
                    sidebar.style.height = "calc(100vh - 35px)"
                    if (maxTags !== 30) setMaxTags(27)
                }
                return
            }
            if (!hideSortbar) {
                if (sidebar.style.top === "0px") {
                    sidebar.style.top = "35px"
                    sidebar.style.height = "calc(100vh - 35px)"
                    if (maxTags !== 30) setMaxTags(27)
                }
            } else {
                if (sidebar.style.top === "35px") {
                    sidebar.style.top = "0px"
                    sidebar.style.height = "100vh"
                    if (maxTags !== 32) setMaxTags(29)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== 30) setMaxTags(29)
        }
    }, [hideSortbar, hideNavbar, hideTitlebar])

    const getSearchIcon = () => {
        if (theme === "purple") return searchIcon
        if (theme === "purple-light") return searchPurpleLight
        if (theme === "magenta") return searchMagenta
        if (theme === "magenta-light") return searchMagentaLight
        return searchIcon
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
        return historyIcon
    }

    const getDeleteIcon = () => {
        if (theme.includes("magenta")) return deleteIconMagenta
        return deleteIcon
    }

    const generateTagJSX = () => {
        let jsx = [] as any
        let currentTags = props.post ? props.post.tags : tags
        let max = currentTags.length > maxTags ? maxTags : currentTags.length
        for (let i = 0; i < max; i++) {
            const tagClick = () => {
                setSearch(currentTags[i].tag)
                setSearchFlag(true)
                history.push(`/posts?query=${currentTags[i].tag}`)
            }
            jsx.push(
                <div className="sidebar-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{currentTags[i].tag}</span>
                        <span className="tag-count">{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    const getDomain = () => {
        if (props.post.link) {
            const domain = new URL(props.post.link).hostname.replace("www.", "")
            .split(".")?.[0] || ""
            return functions.toProperCase(domain)
        }
        return "Unknown"
    }

    const triggerSearch = () => {
        setSearchFlag(true)
        history.push(`/posts?query=${search}`)
    }

    return (
        <div className={`sidebar ${hideSidebar ? "hide-sidebar" : ""} ${hideTitlebar ? "sidebar-top" : ""}
        ${relative ? "sidebar-relative" : ""}`} onMouseEnter={() => {setEnableDrag(false); setSidebarHover(true)}} onMouseLeave={() => {setEnableDrag(true); setSidebarHover(false)}}>
            <div className="sidebar-container">
            <div className="sidebar-content">
                <div className="sidebar-text-container">
                    <span className="sidebar-text">{props.text ? props.text : `${posts.length} results.`}</span>
                </div>
                <div className="search-container">
                    <input className="search" type="search" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? triggerSearch() : null}/>
                    <img className={!theme || theme === "purple" ? "search-icon" : `search-icon-${theme}`} src={getSearchIcon()} onClick={() => triggerSearch()}/>
                    <img className={!theme || theme === "purple" ? "search-image-icon" : `search-image-icon-${theme}`} src={getSearchImageIcon()}/>
                </div>
                <div className="random-container">
                    <img className={!theme || theme === "purple" ? "random" : `random-${theme}`} src={getRandomIcon()}/>
                </div>

                {props.post ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Artist</span>
                        </div>
                        <div className="sidebar-row">
                            <img className="sidebar-img" src={artistImg}/>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <span className="tag">{}</span>
                                <span className="tag-count">{}</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Title:</span>
                            <span className="tag-alt">{props.post.title || "None"}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Drawn:</span>
                            <span className="tag-alt">{props.post.drawn ? functions.formatDate(new Date(props.post.drawn)) : "Unknown"}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Source:</span>
                            <span className="tag-alt-link" onClick={() => window.open(props.post.link, "_blank")}>{getDomain()}</span>
                        </div>
                    </div>
                : null}

                {props.post ? 
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

                {props.post ? 
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
                    {props.post ? 
                        <div className="sidebar-row">
                            <span className="sidebar-title">Tags</span>
                        </div>
                    : null}
                    {generateTagJSX()}
                </div>

                {props.post ? 
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
                            <span className="tag">Uploaded:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.uploaded))}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Updated:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.updated))}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Rating:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.restrict)}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Favorites:</span>
                            <span className="tag-alt">300</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Cuteness:</span>
                            <span className="tag-alt">{props.post.cuteness}</span>
                        </div>
                    </div>
                : null}  

                {props.post ? 
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