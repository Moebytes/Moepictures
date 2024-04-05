import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/icons/search.png"
import searchIconHover from "../assets/icons/search-hover.png"
import sort from "../assets/icons/sort.png"
import SeriesRow from "../components/SeriesRow"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import axios from "axios"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, MobileContext,
ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext, ScrollContext,
ShowPageDialogContext, PageFlagContext, SeriesPageContext} from "../Context"
import "./styles/seriespage.less"

const SeriesPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {seriesPage, setSeriesPage} = useContext(SeriesPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [sortType, setSortType] = useState("posts")
    const [series, setSeries] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleSeries, setVisibleSeries] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("seriesPage")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (savedPage) setSeriesPage(Number(savedPage))
            if (queryParam) updateSeries(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setSeriesPage(Number(pageParam))
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateSeries = async (queryOverride?: string) => {
        let query = queryOverride ? queryOverride : searchQuery
        const result = await axios.get("/api/search/series", {params: {sort: sortType, query}, withCredentials: true}).then((r) => r.data)
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
        updateSeries()
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


    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateSeries = () => {
            let currentIndex = index
            const newVisibleSeries = visibleSeries as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!series[currentIndex]) break
                newVisibleSeries.push(series[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleSeries(functions.removeDuplicates(newVisibleSeries))
        }
        if (scroll) updateSeries()
    }, [scroll, series])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (seriesPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (series[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await axios.get("/api/search/series", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        let hasMore = result?.length >= 100
        const cleanSeries = series.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanSeries.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, tagCount: cleanSeries[0]?.tagCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setSeries(result)
            } else {
                setSeries((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setSeries(result)
                } else {
                    setSeries((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!series[currentIndex]) return updateOffset()
                const newVisibleSeries = visibleSeries as any
                for (let i = 0; i < 15; i++) {
                    if (!series[currentIndex]) return updateOffset()
                    newVisibleSeries.push(series[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleSeries(functions.removeDuplicates(newVisibleSeries))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleSeries, index])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleSeries([])
            setSeriesPage(1)
            updateSeries()
        }
    }, [scroll])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (seriesPage - 1) * getPageAmount()
            if (series[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(series[0]?.tagCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = series[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, series, seriesPage, ended])

    useEffect(() => {
        if (searchQuery) {
            scroll ? history.replace(`${location.pathname}?query=${searchQuery}`) : history.replace(`${location.pathname}?query=${searchQuery}&page=${seriesPage}`)
        } else {
            if (!scroll) history.replace(`${location.pathname}?page=${seriesPage}`)
        }
    }, [scroll, searchQuery, seriesPage])

    useEffect(() => {
        if (series?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setSeriesPage(maxTagPage)
            }
        }
    }, [series, seriesPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("seriesPage", String(seriesPage))
    }, [seriesPage])

    const maxPage = () => {
        if (!series?.length) return 1
        if (Number.isNaN(Number(series[0]?.tagCount))) return 10000
        return Math.ceil(Number(series[0]?.tagCount) / getPageAmount())
    }

    const firstPage = () => {
        setSeriesPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = seriesPage - 1 
        if (newPage < 1) newPage = 1 
        setSeriesPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = seriesPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setSeriesPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setSeriesPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setSeriesPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (seriesPage > maxPage() - 3) increment = -4
        if (seriesPage > maxPage() - 2) increment = -5
        if (seriesPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (seriesPage > maxPage() - 2) increment = -3
            if (seriesPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = seriesPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const getSearchIcon = () => {
        return getSearchIconHover ? searchIconHover : search
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
                <img className="seriesort-img" src={sort} style={{filter: getFilter()}}/>
                <span className="seriesort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateSeriesJSX = () => {
        const jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleSeries) as any
        } else {
            const postOffset = (seriesPage - 1) * getPageAmount()
            visible = series.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (visible[i].tag === "no-series") continue
            if (visible[i].tag === "unknown-series") continue
            jsx.push(<SeriesRow series={visible[i]}/>)
        }
        if (!scroll) {
            jsx.push(
                <div className="page-container">
                    {seriesPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {seriesPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {seriesPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {seriesPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {<button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button>}
                </div>
            )
        }
        return jsx
    }

    const toggleScroll = () => {
        setScroll((prev: boolean) => {
            const newValue = !prev
            localStorage.setItem("scroll", `${newValue}`)
            return newValue
        })
    }

    return (
        <>
        <DragAndDrop/>
        <PageDialog/>
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
                            <img className="series-search-icon" src={getSearchIcon()} style={{filter: getFilterSearch()}} onClick={() => updateSeries()} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {getSortJSX()}
                        {!mobile ? <div className="seriesort-item" onClick={() => toggleScroll()}>
                            <img className="seriesort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="seriesort-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div> : null}
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