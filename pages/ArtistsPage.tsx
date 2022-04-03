import React, {useEffect, useContext, useState, useRef} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/purple/search.png"
import searchMagenta from "../assets/magenta/search.png"
import searchPurpleLight from "../assets/purple-light/search.png"
import searchMagentaLight from "../assets/magenta-light/search.png"
import sort from "../assets/purple/sort.png"
import ArtistRow from "../components/ArtistRow"
import sortMagenta from "../assets/magenta/sort.png"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, ActiveDropdownContext} from "../Context"
import "./styles/artistspage.less"

const ArtistsPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const [sortType, setSortType] = useState("cuteness")
    const sortRef = useRef(null) as any

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        document.title = "Moebooru: Artists"
    }, [])

    const getSearchIcon = () => {
        if (theme === "purple") return search
        if (theme === "purple-light") return searchPurpleLight
        if (theme === "magenta") return searchMagenta
        if (theme === "magenta-light") return searchMagentaLight
        return search
    }

    const getSort = () => {
        if (theme.includes("magenta")) return sortMagenta
        return sort
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "cuteness") offset = -40
        if (sortType === "reverse cuteness") offset = -10
        if (sortType === "posts") offset = -45
        if (sortType === "reverse posts") offset = -15
        if (sortType === "alphabetic") offset = -25
        if (sortType === "reverse alphabetic") offset = 0
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="artistsort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="artistsort-img" src={getSort()}/>
                <span className="artistsort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateArtistsJSX = () => {
        const jsx = [] as any 
        for (let i = 0; i < 20; i++) {
            jsx.push(<ArtistRow/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="artists">
                    <span className="artists-heading">Artists</span>
                    <div className="artists-row">
                        <div className="artist-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="artist-search" type="search" spellCheck="false"/>
                            <img className={!theme || theme === "purple" ? "artist-search-icon" : `artist-search-icon-${theme}`} src={getSearchIcon()}/>
                        </div>
                        {getSortJSX()}
                        <div className={`artist-dropdown ${activeDropdown === "sort" ? "" : "hide-artist-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="artist-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="artist-dropdown-text">Cuteness</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("reverse cuteness")}>
                                <span className="artist-dropdown-text">Reverse Cuteness</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="artist-dropdown-text">Posts</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="artist-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="artist-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="artist-dropdown-text">Reverse Alphabetic</span>
                            </div>
                        </div>
                    </div>
                    <table className="artists-container">
                        {generateArtistsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ArtistsPage