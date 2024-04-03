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
import ArtistRow from "../components/ArtistRow"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import axios from "axios"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, MobileContext,
HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext, ScrollContext, ArtistsPageContext, ShowPageDialogContext, PageFlagContext} from "../Context"
import "./styles/artistspage.less"

const ArtistsPage: React.FunctionComponent = (props) => {
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
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {artistsPage, setArtistsPage} = useContext(ArtistsPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const [sortType, setSortType] = useState("posts")
    const [artists, setArtists] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleArtists, setVisibleArtists] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("artistsPage")
        if (savedPage) setTimeout(() => {setArtistsPage(Number(savedPage))}, 100)
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        setTimeout(() => {
            if (queryParam) updateArtists(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setArtistsPage(Number(pageParam))
            }
        }, 500)
    }, [])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateArtists = async (queryOverride?: string) => {
        let query = queryOverride ? queryOverride : searchQuery
        const result = await axios.get("/api/search/artists", {params: {sort: sortType, query}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleArtists([])
        setArtists(result)
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Artists"
        setTimeout(() => {
            updateArtists()
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
        updateArtists()
    }, [sortType])

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateArtists = () => {
            let currentIndex = index
            const newVisibleArtists = visibleArtists as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!artists[currentIndex]) break
                newVisibleArtists.push(artists[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleArtists(functions.removeDuplicates(newVisibleArtists))
        }
        if (scroll) updateArtists()
    }, [scroll, artists])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (artistsPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (artists[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await axios.get("/api/search/artists", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        let hasMore = result?.length >= 100
        const cleanArtists = artists.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanArtists.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, tagCount: cleanArtists[0]?.tagCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setArtists(result)
            } else {
                setArtists((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setArtists(result)
                } else {
                    setArtists((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!artists[currentIndex]) return updateOffset()
                const newVisibleArtists = visibleArtists as any
                for (let i = 0; i < 15; i++) {
                    if (!artists[currentIndex]) return updateOffset()
                    newVisibleArtists.push(artists[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleArtists(functions.removeDuplicates(newVisibleArtists))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleArtists, index])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleArtists([])
            setArtistsPage(1)
            updateArtists()
        }
    }, [scroll])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (artistsPage - 1) * getPageAmount()
            if (artists[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(artists[0]?.tagCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = artists[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, artists, artistsPage, ended])

    useEffect(() => {
        if (searchQuery) {
            scroll ? history.replace(`${location.pathname}?query=${searchQuery}`) : history.replace(`${location.pathname}?query=${searchQuery}&page=${artistsPage}`)
        } else {
            if (!scroll) history.replace(`${location.pathname}?page=${artistsPage}`)
        }
    }, [scroll, search, artistsPage])

    useEffect(() => {
        if (artists?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setArtistsPage(maxTagPage)
            }
        }
    }, [artists, artistsPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("artistsPage", String(artistsPage))
    }, [artistsPage])

    const maxPage = () => {
        if (!artists?.length) return 1
        if (Number.isNaN(Number(artists[0]?.tagCount))) return 10000
        return Math.ceil(Number(artists[0]?.tagCount) / getPageAmount())
    }

    const firstPage = () => {
        setArtistsPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = artistsPage - 1 
        if (newPage < 1) newPage = 1 
        setArtistsPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = artistsPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setArtistsPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setArtistsPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setArtistsPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 5
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (artistsPage > maxPage() - 3) increment = -4
        if (artistsPage > maxPage() - 2) increment = -5
        if (artistsPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (artistsPage > maxPage() - 2) increment = -3
            if (artistsPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = artistsPage + increment
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
            <div className="artistsort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="artistsort-img" src={sort} style={{filter: getFilter()}}/>
                <span className="artistsort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateArtistsJSX = () => {
        const jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleArtists) as any
        } else {
            const postOffset = (artistsPage - 1) * getPageAmount()
            visible = artists.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (visible[i].tag === "unknown-artist") continue
            jsx.push(<ArtistRow artist={visible[i]}/>)
        }
        if (!scroll) {
            jsx.push(
                <div className="page-container">
                    {artistsPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {artistsPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {artistsPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {artistsPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
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
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="artists">
                    <span className="artists-heading">Artists</span>
                    <div className="artists-row">
                        <div className="artist-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="artist-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateArtists() : null}/>
                            <img className="artist-search-icon" src={getSearchIcon()} style={{filter: getFilterSearch()}} onClick={() => updateArtists()} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {getSortJSX()}
                        <div className="artistsort-item" onClick={() => toggleScroll()}>
                            <img className="artistsort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="artistsort-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div>
                        <div className={`artist-dropdown ${activeDropdown === "sort" ? "" : "hide-artist-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="artist-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="artist-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="artist-dropdown-text">Reverse Alphabetic</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="artist-dropdown-text">Posts</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="artist-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="artist-dropdown-text">Cuteness</span>
                            </div>
                            <div className="artist-dropdown-row" onClick={() => setSortType("reverse cuteness")}>
                                <span className="artist-dropdown-text">Reverse Cuteness</span>
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