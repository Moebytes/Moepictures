import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import {ThemeContext, HideNavbarContext, EnableDragContext, RelativeContext, HideTitlebarContext,
SearchContext, SearchFlagContext, ImageTypeContext, RestrictTypeContext, StyleTypeContext, SortTypeContext,
HeaderTextContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/titlebar.less"

const TitleBar: React.FunctionComponent = (props) => {
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
    const history = useHistory()

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) setTheme(savedTheme)
    }, [])

    useEffect(() => {
        if (searchFlag) {
            const text = functions.toProperCase(search.trim().split(/ +/g).join(", "))
            document.title = `Moebooru: ${text}`
            setHeaderText(text)
        }
    }, [searchFlag, imageType, restrictType, styleType, sortType])

    const getImg = () => {
        if (theme.includes("magenta")) return faviconMagenta
        return favicon
    }

    const titleClick = () => {
        setSearch("")
        setImageType("all")
        setRestrictType("all")
        setStyleType("all")
        setSortType("date")
        setSearchFlag(true)
        history.push("/")
        window.scrollTo(0, 0)
    }

    return (
        <div className={`titlebar ${hideTitlebar ? "hide-titlebar" : ""} ${relative ? "titlebar-relative" : ""}`} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
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
            <div className="titlebar-search-text-container">
                <span className="titlebar-search-text">{headerText}</span>
            </div>
        </div>
    )
}

export default TitleBar