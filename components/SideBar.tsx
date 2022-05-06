import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideSortbarContext, EnableDragContext, MobileContext, UnverifiedPostsContext,
RelativeContext, HideTitlebarContext, SidebarHoverContext, SearchContext, SearchFlagContext, PostsContext, ShowDeletePostDialogContext,
TagsContext, RandomFlagContext, ImageSearchFlagContext, SidebarTextContext, SessionContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
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
import randomMobile from "../assets/purple/random-mobile.png"
import randomMobileMagenta from "../assets/magenta/random-mobile.png"
import randomMobilePurpleLight from "../assets/purple-light/random-mobile.png"
import randomMobileMagentaLight from "../assets/magenta-light/random-mobile.png"
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
import rejectRed from "../assets/purple/reject-red.png"
import approveGreen from "../assets/purple/approve-green.png"
import pack from "../package.json"
import functions from "../structures/Functions"
import axios from "axios"
import TagHover from "./TagHover"
import SearchSuggestions from "./SearchSuggestions"
import adminCrown from "../assets/purple/admin-crown.png"
import modCrown from "../assets/purple/mod-crown.png"
import "./styles/sidebar.less"

interface Props {
    post?: any
    artists?: any 
    characters?: any 
    series?: any
    tags?: any
    unverified?: boolean
}

const SideBar: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {sidebarHover, setSidebarHover} = useContext(SidebarHoverContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {unverifiedPosts, setUnverifiedPosts} = useContext(UnverifiedPostsContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {tags, setTags} = useContext(TagsContext)
    const {randomFlag, setRandomFlag} = useContext(RandomFlagContext)
    const {imageSearchFlag, setImageSearchFlag} = useContext(ImageSearchFlagContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {showDeletePostDialog, setShowDeletePostDialog} = useContext(ShowDeletePostDialogContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const [maxTags, setMaxTags] = useState(23)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const history = useHistory()

    const updateTags = async () => {
        const tags = await functions.parseTags(posts)
        setTags(tags)
    }

    const getFavicon = () => {
        if (theme.includes("magenta")) return faviconMagenta 
        return favicon
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await axios.get("/api/user", {params: {username: props.post.uploader}, withCredentials: true}).then((r) => r.data)
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image) : getFavicon())
            if (uploader?.role) setUploaderRole(uploader.role)
            const updater = await axios.get("/api/user", {params: {username: props.post.updater}, withCredentials: true}).then((r) => r.data)
            if (updater?.role) setUpdaterRole(updater.role)
        }
    }

    useEffect(() => {
        updateTags()
        updateUserImg()
    }, [])

    useEffect(() => {
        updateUserImg()
    }, [props.post])

    useEffect(() => {
        updateTags()
    }, [posts])

    useEffect(() => {
        const scrollHandler = () => {
            const sidebar = document.querySelector(".sidebar") as HTMLElement
            const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
            if (!sidebar && !mobileSidebar) return
            if (mobile) {
                mobileSidebar.style.top = "0px"
                mobileSidebar.style.height = "auto"
                return
            }
            if (!sidebar) return
            if (!relative) {
                if (!hideTitlebar) {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 23) setMaxTags(23)
                } else {
                    if (window.scrollY !== 0) {
                        if (hideNavbar && window.scrollY > 77) {
                            sidebar.style.top = "0px"
                            sidebar.style.height = "100vh"
                            if (maxTags !== 29) setMaxTags(29)
                        } else {
                            sidebar.style.top = "35px"
                            sidebar.style.height = "calc(100vh - 35px)"
                            if (maxTags !== 27) setMaxTags(27)
                        }
                    } else {
                        sidebar.style.top = "112px"
                        sidebar.style.height = "calc(100vh - 35px - 77px)"
                        if (maxTags !== 23) setMaxTags(23)
                    }
                }
            } else {
                sidebar.style.top = "0px"
                sidebar.style.height = "auto"
                if (maxTags !== 29) setMaxTags(29)
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
        const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
        if (!sidebar && !mobileSidebar) return
        if (mobile) {
            mobileSidebar.style.top = "0px"
            mobileSidebar.style.height = "auto"
            return
        }
        if (!sidebar) return
        if (!relative) {
            if (!hideTitlebar) {
                sidebar.style.top = "112px"
                sidebar.style.height = "calc(100vh - 35px - 77px)"
                if (maxTags !== 23) setMaxTags(23)
            } else {
                if (window.scrollY !== 0) {
                    if (hideNavbar && window.scrollY > 77) {
                        sidebar.style.top = "0px"
                        sidebar.style.height = "100vh"
                        if (maxTags !== 29) setMaxTags(29)
                    } else {
                        sidebar.style.top = "35px"
                        sidebar.style.height = "calc(100vh - 35px)"
                        if (maxTags !== 27) setMaxTags(27)
                    }
                } else {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 23) setMaxTags(23)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== 29) setMaxTags(29)
        }
    }, [hideTitlebar, relative, mobile])

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
        if (!sidebar && !mobileSidebar) return
        if (mobile) {
            mobileSidebar.style.top = "0px"
            mobileSidebar.style.height = "auto"
            return
        }
        if (!sidebar) return
        if (!relative) {
            if (!hideNavbar) {
                if (!hideTitlebar) {
                    sidebar.style.top = "112px"
                    sidebar.style.height = "calc(100vh - 35px - 77px)"
                    if (maxTags !== 23) setMaxTags(23)
                } else {
                    sidebar.style.top = "35px"
                    sidebar.style.height = "calc(100vh - 35px)"
                    if (maxTags !== 27) setMaxTags(27)
                }
                return
            }
            if (!hideSortbar) {
                if (sidebar.style.top === "0px") {
                    sidebar.style.top = "35px"
                    sidebar.style.height = "calc(100vh - 35px)"
                    if (maxTags !== 27) setMaxTags(27)
                }
            } else {
                if (sidebar.style.top === "35px") {
                    sidebar.style.top = "0px"
                    sidebar.style.height = "100vh"
                    if (maxTags !== 29) setMaxTags(29)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== 29) setMaxTags(29)
        }
    }, [hideSortbar, hideNavbar, hideTitlebar, mobile])

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

    const getRandomMobileIcon = () => {
        if (theme === "purple") return randomMobile
        if (theme === "purple-light") return randomMobilePurpleLight
        if (theme === "magenta") return randomMobileMagenta
        if (theme === "magenta-light") return randomMobileMagentaLight
        return randomMobile
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

    const generateArtistsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.artists.length; i++) {
            if (!props.artists[i]) break
            const link = functions.getTagLink("artist", props.artists[i].image)
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.artists[i].tag)
                setSearchFlag(true)
            }
            jsx.push(<>
                    {link ?
                    <div className="sidebar-row">
                        <img className="sidebar-img" src={link}/>
                    </div> : null}
                    <div className="sidebar-row">
                        <span className="tag-hover" onClick={() => tagClick()}>
                            <span className="tag">{props.artists[i].tag.replaceAll("-", " ")}</span>
                            <span className="tag-count">{props.artists[i].count}</span>
                        </span>
                    </div>
                </>)
        }
        return jsx
    }

    const generateCharactersJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.characters.length; i++) {
            if (!props.characters[i]) break
            const link = functions.getTagLink("character", props.characters[i].image)
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.characters[i].tag)
                setSearchFlag(true)
            }
            jsx.push(<>
                {link ?
                <div className="sidebar-row">
                    <img className="sidebar-img" src={link}/>
                </div> : null}
                <div className="sidebar-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{props.characters[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{props.characters[i].count}</span>
                    </span>
                </div> </>
                )
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.series.length; i++) {
            if (!props.series[i]) break
            const link = functions.getTagLink("series", props.series[i].image)
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.series[i].tag)
                setSearchFlag(true)
            }
            jsx.push(<>
                {link ?
                <div className="sidebar-row">
                    <img className="sidebar-img" src={link}/>
                </div> : null}
                <div className="sidebar-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{props.series[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{props.series[i].count}</span>
                    </span>
                </div> </>
                )
        }
        return jsx
    }

    const generateTagJSX = () => {
        let jsx = [] as any
        let currentTags = props.tags ? props.tags : tags
        let max = currentTags.length > maxTags ? maxTags : currentTags.length
        for (let i = 0; i < max; i++) {
            if (!currentTags[i]) break
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(currentTags[i].tag)
                setSearchFlag(true)
            }
            jsx.push(
                <div className="sidebar-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{currentTags[i].tag.replaceAll("-", " ")}</span>
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
            if (domain.toLowerCase() === "yande") return "Yandere"
            return functions.toProperCase(domain)
        }
        return "Unknown"
    }

    const triggerSearch = () => {
        history.push(`/posts`)
        setSearchFlag(true)
    }

    const randomSearch = () => {
        history.push(`/posts`)
        setRandomFlag(true)
    }

    const imageSearch = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const result = await functions.imageSearch(file)
        setImageSearchFlag(result)
        history.push("/posts")
        event.target.value = ""
    }

    const deletePost = async () => {
        setShowDeletePostDialog((prev: boolean) => !prev)
    }

    const editPost = async () => {
        if (props.unverified) return history.push(`/unverified/edit-post/${props.post.postID}`)
        history.push(`/edit-post/${props.post.postID}`)
    }

    const modNext = () => {
        let currentIndex = unverifiedPosts.findIndex((p: any) => p.postID === props.post.postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                history.push(`/unverified/post/${id}`)
            }
        }
        history.push(`/mod-queue`)
    }

    const approvePost = async () => {
        await axios.post("/api/post/approve", {postID: props.post.postID}, {withCredentials: true})
        modNext()
    }

    const rejectPost = async () => {
        await axios.post("/api/post/reject", {postID: props.post.postID}, {withCredentials: true})
        modNext()
    }

    if (mobile) return (
        <>
        <SearchSuggestions active={suggestionsActive}/>
        <div className={`mobile-sidebar ${relative ? "mobile-sidebar-relative" : ""}`}>
            <div className="mobile-search-container">
                <input className="mobile-search" type="search" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? triggerSearch() : null} onFocus={() => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                <img style={{height: "40px"}} className={!theme || theme === "purple" ? "search-icon" : `search-icon-${theme}`} src={getSearchIcon()} onClick={() => triggerSearch()}/>
                <label style={{display: "flex", width: "max-content", height: "max-content"}} htmlFor="image-search">
                    <img style={{height: "40px"}} className={!theme || theme === "purple" ? "search-image-icon" : `search-image-icon-${theme}`} src={getSearchImageIcon()}/>
                </label>
                <input id="image-search" type="file" onChange={(event) => imageSearch(event)}/>
                <img style={{height: "40px"}} className={!theme || theme === "purple" ? "random-mobile" : `random-mobile-${theme}`} src={getRandomMobileIcon()} onClick={randomSearch}/>
            </div>
        </div>
        </>
    )

    const generateUsernameJSX = (type?: string) => {
        let username = type === "uploader" ? props.post.uploader : props.post.updater 
        const role = type === "uploader" ? uploaderRole : updaterRole
        if (role === "admin") {
            return (
                <div className="sidebar-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                     <span className="tag-alt admin-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="sidebar-user-label" src={adminCrown}/>
                </div>
            )
        } else if (role === "mod") {
            return (
                <div className="sidebar-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                    <span className="tag-alt mod-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="sidebar-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="tag-alt-link" onClick={() => username ? history.push(`/user/${username}`) : null}>{functions.toProperCase(username) || "deleted"}</span>
    }


    return (
        <>
        <SearchSuggestions active={suggestionsActive}/>
        <div className={`sidebar ${hideSidebar ? "hide-sidebar" : ""} ${hideTitlebar ? "sidebar-top" : ""}
        ${relative ? "sidebar-relative" : ""}`} onMouseEnter={() => {setEnableDrag(false); setSidebarHover(true)}} onMouseLeave={() => {setSidebarHover(false)}}>
            <div className="sidebar-container">
            <div className="sidebar-content">
                {sidebarText ?
                <div className="sidebar-text-container">
                    <span className="sidebar-text">{sidebarText}</span>
                </div> : null}
                <div className="search-container" onMouseEnter={() => setEnableDrag(false)}>
                    <input className="search" type="search" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? triggerSearch() : null} onFocus={() => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                    <img className={!theme || theme === "purple" ? "search-icon" : `search-icon-${theme}`} src={getSearchIcon()} onClick={() => triggerSearch()}/>
                    <label style={{display: "flex", width: "max-content", height: "max-content"}} htmlFor="image-search">
                        <img className={!theme || theme === "purple" ? "search-image-icon" : `search-image-icon-${theme}`} src={getSearchImageIcon()}/>
                    </label>
                    <input id="image-search" type="file" onChange={(event) => imageSearch(event)}/>
                </div>
                <div className="random-container">
                    <img className={!theme || theme === "purple" ? "random" : `random-${theme}`} src={getRandomIcon()} onClick={randomSearch}/>
                </div>

                {props.artists ?
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{props.artists.length > 1 ? "Artists" : "Artist"}</span>
                        </div>
                        {generateArtistsJSX()}
                        <div className="sidebar-row">
                            <span className="tag">Title:</span>
                            <span className="tag-alt">{props.post.title || "None"}</span>
                        </div>
                        {props.post.translatedTitle ? 
                        <div className="sidebar-row">
                            <span className="tag">Translated:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.translatedTitle)}</span>
                        </div>
                        : null}
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

                {props.characters ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{props.characters.length > 1 ? "Characters" : "Character"}</span>
                        </div>
                        {generateCharactersJSX()}
                    </div>
                : null}

                {props.series ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Series</span>
                        </div>
                        {generateSeriesJSX()}
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

                {props.post ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Details</span>
                        </div>
                        <div className="sidebar-row">
                            <img className="sidebar-img" src={uploaderImage}/>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Uploader:</span>
                            {generateUsernameJSX("uploader")}
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Uploaded:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.uploadDate))}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Updater:</span>
                            {generateUsernameJSX("updater")}
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Updated:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.updatedDate))}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Type:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.type)}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Restrict:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.restrict)}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Style:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.style)}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Favorites:</span>
                            <span className="tag-alt">{props.post.favoriteCount || 0}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Cuteness:</span>
                            <span className="tag-alt">{props.post.cutenessAvg || 500}</span>
                        </div>
                    </div>
                : null}  

                {props.post && session.username ? 
                    <div className="sidebar-subcontainer">
                        {/* <div className="sidebar-row">
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
                        </div> */}
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={editPost}>
                                <img className="sidebar-icon" src={getEdit()}/>
                                <span className="tag-red">Edit</span>
                            </span>
                        </div>
                        {props.unverified ? <>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={approvePost}>
                                <img className="sidebar-icon" src={approveGreen}/>
                                <span className="tag-green">Approve</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={rejectPost}>
                                <img className="sidebar-icon" src={rejectRed}/>
                                <span className="tag-red">Reject</span>
                            </span>
                        </div>
                        </> : null}
                        {/* <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getHistory()}/>
                                <span className="tag-red">History</span>
                            </span>
                        </div> */}
                        {!props.unverified ?
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={deletePost}>
                                <img className="sidebar-icon" src={getDeleteIcon()}/>
                                <span className="tag-red">Delete</span>
                            </span>
                        </div> : null}
                    </div>
                : null}
            </div>

            <div className="sidebar-footer">
                    <span className="sidebar-footer-text">©{new Date().getFullYear()} Pripy</span>
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
        </>
    )
}

export default SideBar