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
import searchIconHover from "../assets/purple/search-hover.png"
import searchMagentaHover from "../assets/magenta/search-hover.png"
import searchMagentaLightHover from "../assets/magenta-light/search-hover.png"
import searchPurpleLightHover from "../assets/purple-light/search-hover.png"
import sort from "../assets/purple/sort.png"
import SeriesRow from "../components/SeriesRow"
import sortMagenta from "../assets/magenta/sort.png"
import axios from "axios"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, MobileContext,
ActiveDropdownContext, HeaderTextContext, SidebarTextContext} from "../Context"
import "./styles/seriespage.less"

const SeriesPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [sortType, setSortType] = useState("posts")
    const [series, setSeries] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleSeries, setVisibleSeries] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const sortRef = useRef(null) as any

    const updateSeries = async () => {
        const result = await axios.get("/api/search/series", {params: {sort: sortType, query: searchQuery}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleSeries([])
        setSeries(result)
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Series"
        setTimeout(() => {
            updateSeries()
        }, 200)
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateSeries()
    }, [sortType])

    useEffect(() => {
        let currentIndex = index
        const newVisibleSeries = visibleSeries as any
        for (let i = 0; i < 10; i++) {
            if (!series[currentIndex]) break
            newVisibleSeries.push(series[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleSeries(functions.removeDuplicates(newVisibleSeries))
    }, [series])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/search/series", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length >= 100) {
            setOffset(newOffset)
            setSeries((prev: any) => functions.removeDuplicates([...prev, ...result]))
        } else {
            if (result?.length) setSeries((prev: any) => functions.removeDuplicates([...prev, ...result]))
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!series[currentIndex]) return updateOffset()
                const newVisibleSeries = visibleSeries as any
                for (let i = 0; i < 10; i++) {
                    if (!series[currentIndex]) return updateOffset()
                    newVisibleSeries.push(series[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleSeries(functions.removeDuplicates(newVisibleSeries))
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const getSearchIcon = () => {
        if (theme === "purple") return getSearchIconHover ? searchIconHover : search
        if (theme === "purple-light") return getSearchIconHover ? searchPurpleLightHover : searchPurpleLight
        if (theme === "magenta") return getSearchIconHover ? searchMagentaHover : searchMagenta
        if (theme === "magenta-light") return getSearchIconHover ? searchMagentaLightHover : searchMagentaLight
        return getSearchIconHover ? searchIconHover : search
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
        const series = functions.removeDuplicates(visibleSeries) as any
        for (let i = 0; i < series.length; i++) {
            if (series[i].tag === "no-series") continue
            if (series[i].tag === "unknown-series") continue
            jsx.push(<SeriesRow series={series[i]}/>)
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
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="series">
                    <span className="series-heading">Series</span>
                    <div className="series-row">
                        <div className="series-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="series-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateSeries() : null}/>
                            <img className="series-search-icon" src={getSearchIcon()} onClick={updateSeries}/>
                        </div>
                        {getSortJSX()}
                        <div className={`series-dropdown ${activeDropdown === "sort" ? "" : "hide-series-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="series-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="series-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="series-dropdown-text">Reverse Alphabetic</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="series-dropdown-text">Posts</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="series-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="series-dropdown-text">Cuteness</span>
                            </div>
                            <div className="series-dropdown-row" onClick={() => setSortType("reverse cuteness")}>
                                <span className="series-dropdown-text">Reverse Cuteness</span>
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