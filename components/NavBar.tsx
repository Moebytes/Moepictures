import React, {useContext, useState, useEffect} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {useHistory} from "react-router-dom"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import eyedropper from "../assets/purple/eyedropper.png"
import light from "../assets/purple/light.png"
import logoutIcon from "../assets/purple/logout.png"
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
import search2 from "../assets/purple/search2.png"
import axios from "axios"
import functions from "../structures/Functions"
import {ThemeContext, HideNavbarContext, HideSortbarContext, HideSidebarContext, EnableDragContext,  HideMobileNavbarContext, MobileContext,
RelativeContext, HideTitlebarContext, SearchContext, SearchFlagContext, SessionContext, SessionFlagContext, UserImgContext} from "../Context"
import "./styles/navbar.less"

const NavBar: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {userImg, setUserImg} = useContext(UserImgContext)
    const {hideMobileNavbar, setHideMobileNavbar} = useContext(HideMobileNavbarContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [showMiniTitle, setShowMiniTitle] = useState(false)
    const [marginR, setMarginR] = useState("70px")
    const history = useHistory()

    useEffect(() => {
        setShowMiniTitle(false)
    }, [])

    useEffect(() => {
        const scrollHandler = () => {
            if (hideTitlebar) {
                if (window.scrollY < 77) {
                    setShowMiniTitle(false)
                } else {
                    setShowMiniTitle(true)
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
        if (!hideTitlebar) {
                setShowMiniTitle(false)
        } else {
            if (window.scrollY > 77) {
                setShowMiniTitle(true)
            }
        }
    }, [hideTitlebar])

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

    const getFavicon = () => {
        if (theme.includes("magenta")) return faviconMagenta 
        return favicon
    }

    const logout = async () => {
        await axios.post("/api/logout", null, {withCredentials: true})
        setSessionFlag(true)
        history.go(0)
    }

    /* JS Media Queries */
    useEffect(() => {
        const query1 = (query: any) => {
            if (query.matches) {
                let marginR = showMiniTitle ? "40px" : "50px"
                setMarginR(marginR)
            } else {
                let marginR = showMiniTitle ? "45px" : "70px"
                setMarginR(marginR)
            }
        }
        const media = window.matchMedia("(max-width: 1200px)")
        media.addEventListener("change", query1)
        query1(media)
    }, [])

    if (mobile) {
        const getMobileMargin = () => {
            return hideMobileNavbar ? `-${document.querySelector(".mobile-navbar")?.clientHeight}px` : "0px"
        }
        return (
            <div className={`mobile-navbar ${hideMobileNavbar ? "hide-mobile-navbar" : ""}`} style={{marginTop: getMobileMargin()}}>
                <div className="mobile-nav-text-container">
                    {session.username ? 
                    <div className="mobile-nav-user-container">
                        <img className="mobile-nav-user-img" src={userImg}/>
                        <span className="mobile-nav-text mobile-nav-user-text" onClick={() => history.push("/profile")}>{session.username}</span>
                        <img className="mobile-nav-logout-img" src={logoutIcon} onClick={logout}/>
                    </div> :
                    <span className="mobile-nav-text mobile-nav-user-text" onClick={() => history.push("/login")}>Login</span>}
                    <span className="mobile-nav-text" onClick={() => history.push("/posts")}>Posts</span>
                    <span className="mobile-nav-text" onClick={() => history.push("/comments")}>Comments</span>
                    <span className="mobile-nav-text" onClick={() => history.push("/artists")}>Artists</span>
                    <span className="mobile-nav-text" onClick={() => history.push("/characters")}>Characters</span>
                    <span className="mobile-nav-text" onClick={() => history.push("/series")}>Series</span>
                    <span className="mobile-nav-text" onClick={() => history.push("/tags")}>Tags</span>
                    <span className="mobile-nav-text" onClick={() => history.push("/help")}>Help</span>
                </div>
                <div className="mobile-nav-color-container">
                    <img className="mobile-nav-color" src={getEyeDropper()} onClick={colorChange}/>
                    <img className="mobile-nav-color" src={getLight()} onClick={lightChange}/>
                </div>
            </div>
        )
    } else {
        return (
            <div className={`navbar ${hideTitlebar ? "translate-navbar" : ""} ${hideSortbar && hideTitlebar && hideSidebar ? "hide-navbar" : ""} ${hideSortbar && hideNavbar && showMiniTitle ? "hide-navbar" : ""}
            ${relative ? "navbar-relative" : ""}`} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                {showMiniTitle && !relative ? 
                    <Link to="/" className="nav-mini-title-container">
                        <span className="nav-mini-title-a">M</span>
                        <span className="nav-mini-title-b">o</span>
                        <span className="nav-mini-title-a">e</span>
                        <span className="nav-mini-title-b">b</span>
                        <span className="nav-mini-title-a">o</span>
                        <span className="nav-mini-title-b">o</span>
                        <span className="nav-mini-title-a">r</span>
                        <span className="nav-mini-title-b">u</span>
                        <img className="nav-mini-img" src={getFavicon()}/>
                    </Link>
                : null}
                <div className="nav-text-container">
                    {session.username ? 
                    <div className="nav-user-container" style={{marginRight: marginR}}>
                        {!showMiniTitle || relative ? <img className="nav-user-img" src={userImg}/> : null}
                        <span className="nav-text nav-user-text" onClick={() => history.push("/profile")}>{session.username}</span>
                        <img className="nav-logout-img" src={logoutIcon} onClick={logout}/>
                    </div> :
                    <span style={{marginRight: marginR}} className="nav-text nav-user-text" onClick={() => history.push("/login")}>Login</span>}
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/posts")}>Posts</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/comments")}>Comments</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/artists")}>Artists</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/characters")}>Characters</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/series")}>Series</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/tags")}>Tags</span>
                    <span style={{marginRight: "0px"}} className="nav-text" onClick={() => history.push("/help")}>Help</span>
                </div>
                <div className="nav-color-container">
                    <div className={`nav-search-container ${!hideSidebar ? "hide-nav-search" : ""}`}>
                        <img className="nav-search-icon" src={search2} onClick={() => setSearchFlag(true)}/>
                        <input className="nav-search" type="search" spellCheck={false} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? setSearchFlag(true) : null}/>
                    </div>
                    <img className="nav-color" src={getEyeDropper()} onClick={colorChange}/>
                    <img className="nav-color" src={getLight()} onClick={lightChange}/>
                </div>
            </div>
        )
    }
}

export default NavBar