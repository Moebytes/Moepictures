import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import search from "../assets/icons/search.png"
import sort from "../assets/icons/sort.png"
import sortRev from "../assets/icons/sort-reverse.png"
import ArtistRow from "../components/ArtistRow"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions} from "../store"
import "./styles/itemspage.less"

let limit = 25
let replace = false
let pageAmount = 7

const ArtistsPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {activeDropdown} = useActiveSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setScroll} = useSearchActions()
    const {artistsPage} = usePageSelector()
    const {setArtistsPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const [sortType, setSortType] = useState("posts")
    const [sortReverse, setSortReverse] = useState(false)
    const [artists, setArtists] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleArtists, setVisibleArtists] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("artistsPage")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (savedPage) setArtistsPage(Number(savedPage))
            if (queryParam) updateArtists(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setArtistsPage(Number(pageParam))
            }
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setArtistsPage(Number(pageParam))
        }
        window.addEventListener("load", onDOMLoaded)
        window.addEventListener("popstate", updateStateChange)
        window.addEventListener("pushstate", updateStateChange)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
            window.removeEventListener("popstate", updateStateChange)
            window.removeEventListener("pushstate", updateStateChange)
        }
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
        const result = await functions.get("/api/search/artists", {sort: functions.parseSort(sortType, sortReverse), query, limit}, session, setSessionFlag)
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
        document.title = "Artists"
        updateArtists()
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
    }, [sortType, sortReverse, session])

    const getPageAmount = () => {
        return pageAmount
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
    }, [scroll, artists, session])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + limit
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
        let result = await functions.get("/api/search/artists", {sort: functions.parseSort(sortType, sortReverse), query: searchQuery, limit, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= limit
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
    }, [scroll, visibleArtists, index, sortType, sortReverse])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleArtists([])
            setArtistsPage(1)
            updateArtists()
        }
    }, [scroll, session])

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
    }, [scroll, artists, artistsPage, ended, sortType, sortReverse])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
        if (!scroll) searchParams.set("page", String(artistsPage))
        if (replace) {
            if (!scroll) history.replace(`${location.pathname}?${searchParams.toString()}`)
            replace = false
        } else {
            if (!scroll) history.push(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, searchQuery, artistsPage])

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
        if (mobile) buttonAmount = 3
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

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -25
        if (sortType === "cuteness") offset = -25
        if (sortType === "posts") offset = -30
        if (sortType === "alphabetic") offset = -10
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="itemsort-item" ref={sortRef}>
                <img className="itemsort-img" src={sortReverse ? sortRev : sort} style={{filter: getFilter()}} onClick={() => setSortReverse(!sortReverse)}/>
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{functions.toProperCase(sortType)}</span>
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
            jsx.push(<ArtistRow key={visible[i].tag} artist={visible[i]}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {artistsPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {artistsPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {artistsPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {artistsPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
        }
        return jsx
    }

    const toggleScroll = () => {
        const newValue = !scroll
        localStorage.setItem("scroll", `${newValue}`)
        setScroll(newValue)
    }

    return (
        <>
        <CaptchaDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">Artists</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateArtists() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateArtists()}>
                                <img src={search}/>
                            </button>
                        </div>
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            <img className="itemsort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="itemsort-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div> : null}
                        <div className={`item-dropdown ${activeDropdown === "sort" ? "" : "hide-item-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="item-dropdown-row" onClick={() => setSortType("random")}>
                                <span className="item-dropdown-text">Random</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="item-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="item-dropdown-text">Posts</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="item-dropdown-text">Cuteness</span>
                            </div>
                        </div>
                    </div>
                    <table className="items-container">
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