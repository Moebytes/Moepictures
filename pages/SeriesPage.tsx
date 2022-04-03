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
import SeriesRow from "../components/SeriesRow"
import sortMagenta from "../assets/magenta/sort.png"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, ActiveDropdownContext} from "../Context"
import "./styles/seriespage.less"

const SeriesPage: React.FunctionComponent = (props) => {
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
        document.title = "Moebooru: Series"
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
            <div className="seriesort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="seriesort-img" src={getSort()}/>
                <span className="seriesort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateSeriesJSX = () => {
        const jsx = [] as any 
        for (let i = 0; i < 20; i++) {
            jsx.push(<SeriesRow/>)
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
                <div className="series">
                    <span className="series-heading">Series</span>
                    <div className="series-row">
                        <div className="series-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="series-search" type="search" spellCheck="false"/>
                            <img className={!theme || theme === "purple" ? "series-search-icon" : `series-search-icon-${theme}`} src={getSearchIcon()}/>
                        </div>
                        {getSortJSX()}
                        <div className={`series-dropdown ${activeDropdown === "sort" ? "" : "hide-series-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="series-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="series-dropdown-text">Cuteness</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("reverse cuteness")}>
                                <span className="series-dropdown-text">Reverse Cuteness</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="series-dropdown-text">Posts</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="series-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="series-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="series-dropdown-text">Reverse Alphabetic</span>
                            </div>
                        </div>
                    </div>
                    <table className="series-container">
                        {generateSeriesJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default SeriesPage