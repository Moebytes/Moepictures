import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import {ThemeContext, HideNavbarContext, EnableDragContext, RelativeContext, HideTitlebarContext, HeaderFlagContext,
SearchContext, SearchFlagContext, ImageTypeContext, RestrictTypeContext, StyleTypeContext, SortTypeContext,
HeaderTextContext, HideMobileNavbarContext, MobileContext, VisiblePostsContext, ScrollYContext, MobileScrollingContext} from "../Context"
import functions from "../structures/Functions"
import hamburger from "../assets/purple/hamburger.png"
import hamburgerMagenta from "../assets/magenta/hamburger.png"
import "./styles/titlebar.less"

interface Props {
    reset?: boolean
    goBack?: boolean
}

const TitleBar: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {imageType, setImageType} = useContext(ImageTypeContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {styleType, setStyleType} = useContext(StyleTypeContext)
    const {sortType, setSortType} = useContext(SortTypeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {mobileScrolling, setMobileScrolling} = useContext(MobileScrollingContext)
    const {hideMobileNavbar, setHideMobileNavbar} = useContext(HideMobileNavbarContext)
    const {headerFlag, setHeaderFlag} = useContext(HeaderFlagContext)
    const {visiblePosts, setVisiblePosts} = useContext(VisiblePostsContext)
    const {scrollY, setScrollY} = useContext(ScrollYContext)
    const history = useHistory()

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) setTheme(savedTheme)
    }, [])

    useEffect(() => {
        if (headerFlag) {
            setHeaderFlag(false)
            const text = functions.toProperCase(search.trim().split(/ +/g).map((t: string) => {
                if (t.startsWith("-")) return `-${t.replaceAll("-", " ").trim()}`
                return t.replaceAll("-", " ")
            }).join(", "))
            document.title = `Moebooru: ${text}`
            setHeaderText(text)
        }
    }, [headerFlag])

    const getImg = () => {
        if (theme.includes("magenta")) return faviconMagenta
        return favicon
    }

    const getBurger = () => {
        if (theme.includes("magenta")) return hamburgerMagenta
        return hamburger
    }

    const toggleMobileNavbar = () => {
        setHideMobileNavbar((prev: boolean) => !prev)
    }

    const titleClick = (event: any) => {
        if (mobile && (history.location.pathname === "/" || history.location.pathname === "/posts")) if (event.clientY < 180) return
        if (props.reset) {
            setSearch("")
            setImageType("all")
            setRestrictType("all")
            setStyleType("all")
            setSortType("date")
            setSearchFlag(true)
            history.push("/posts")
            window.scrollTo(0, 0)
            setScrollY(null)
        } else {
            const saved = visiblePosts
            const savedScrollY = scrollY
            history.push("/posts")
            setVisiblePosts(saved)
            if (savedScrollY) window.scrollTo(0, savedScrollY)
        }
    }

    useEffect(() => {
        if (mobile) {
            setHideTitlebar(false)
            setRelative(false)
        }
    }, [mobile])

    return (
        <div className={`titlebar ${hideTitlebar ? "hide-titlebar" : ""} ${relative ? "titlebar-relative" : ""} ${mobileScrolling ? "hide-mobile-titlebar" : ""}`} onMouseEnter={() => setEnableDrag(false)}>
            {mobile ?
            <div className="titlebar-hamburger-container">
                <img className="titlebar-hamburger" src={getBurger()} onClick={toggleMobileNavbar}/>
            </div>
            : null}
            <div onClick={titleClick} className="titlebar-logo-container">
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
                    <div className="titlebar-image-container">
                        <img className="titlebar-img" src={getImg()}/>
                    </div>
                </span>
            </div>
            {!mobile ? 
            <div className="titlebar-search-text-container">
                <span className="titlebar-search-text">{headerText}</span>
            </div> : null}
        </div>
    )
}

export default TitleBar