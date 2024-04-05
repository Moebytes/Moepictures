import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
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
import Thread from "../components/Thread"
import NewThreadDialog from "../dialogs/NewThreadDialog"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, 
SiteLightnessContext, SiteSaturationContext, ShowNewThreadDialogContext, ScrollContext, ForumPageContext, ShowPageDialogContext,
PageFlagContext} from "../Context"
import permissions from "../structures/Permissions"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import "./styles/forumpage.less"
import axios from "axios"

const ForumPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
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
    const {forumPage, setForumPage} = useContext(ForumPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {showNewThreadDialog, setShowNewThreadDialog} = useContext(ShowNewThreadDialogContext)
    const [threadSearchFlag, setThreadSearchFlag] = useState(null) as any
    const {session, setSession} = useContext(SessionContext)
    const [sortType, setSortType] = useState("date")
    const [threads, setThreads] = useState([]) as any
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleThreads, setVisibleThreads] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("forumPage")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (savedPage) setForumPage(Number(savedPage))
            if (queryParam) updateThreads(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setForumPage(Number(pageParam))
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

    const updateThreads = async (query?: string) => {
        const result = await axios.get("/api/search/threads", {params: {sort: sortType, query: query ? query : searchQuery}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleThreads([])
        setThreads(result)
    }

    useEffect(() => {
        if (threadSearchFlag) {
            setTimeout(() => {
                setSearchQuery(threadSearchFlag)
                updateThreads(threadSearchFlag)
                setThreadSearchFlag(null)
            }, 500)
        }
    }, [threadSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Forum"
        updateThreads()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateThreads()
    }, [sortType])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateThreads = () => {
            let currentIndex = index
            const newVisibleThreads = visibleThreads as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!threads[currentIndex]) break
                newVisibleThreads.push(threads[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleThreads(functions.removeDuplicates(newVisibleThreads))
        }
        if (scroll) updateThreads()
    }, [scroll, threads])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (forumPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (threads[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await axios.get("/api/search/threads", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        let hasMore = result?.length >= 100
        const cleanThreads = threads.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanThreads.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, threadCount: cleanThreads[0]?.threadCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setThreads(result)
            } else {
                setThreads((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setThreads(result)
                } else {
                    setThreads((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!threads[currentIndex]) return updateOffset()
                const newVisibleThreads = visibleThreads as any
                for (let i = 0; i < 15; i++) {
                    if (!threads[currentIndex]) return updateOffset()
                    newVisibleThreads.push(threads[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleThreads(functions.removeDuplicates(newVisibleThreads))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleThreads, index])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleThreads([])
            setForumPage(1)
            updateThreads()
        }
    }, [scroll])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (forumPage - 1) * getPageAmount()
            if (threads[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(threads[0]?.threadCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = threads[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, threads, forumPage, ended])

    useEffect(() => {
        if (searchQuery) {
            scroll ? history.replace(`${location.pathname}?query=${searchQuery}`) : history.replace(`${location.pathname}?query=${searchQuery}&page=${forumPage}`)
        } else {
            if (!scroll) history.replace(`${location.pathname}?page=${forumPage}`)
        }
    }, [scroll, searchQuery, forumPage])

    useEffect(() => {
        if (threads?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setForumPage(maxTagPage)
            }
        }
    }, [threads, forumPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("forumPage", String(forumPage))
    }, [forumPage])

    const maxPage = () => {
        if (!threads?.length) return 1
        if (Number.isNaN(Number(threads[0]?.threadCount))) return 10000
        return Math.ceil(Number(threads[0]?.threadCount) / getPageAmount())
    }

    const firstPage = () => {
        setForumPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = forumPage - 1 
        if (newPage < 1) newPage = 1 
        setForumPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = forumPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setForumPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setForumPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setForumPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (forumPage > maxPage() - 3) increment = -4
        if (forumPage > maxPage() - 2) increment = -5
        if (forumPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (forumPage > maxPage() - 2) increment = -3
            if (forumPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = forumPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const newThreadDialog = () => {
        setShowNewThreadDialog((prev: boolean) => !prev)
    }

    const getSearchIcon = () => {
        return getSearchIconHover ? searchIconHover : search
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "date") offset = -35
        if (sortType === "reverse date") offset = -5
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="forumsort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="forumsort-img" src={sort} style={{filter: getFilter()}}/>
                <span className="forumsort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateThreadsJSX = () => {
        const jsx = [] as any
        jsx.push(<Thread titlePage={true}/>)
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleThreads) as any
        } else {
            const postOffset = (forumPage - 1) * getPageAmount()
            visible = threads.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<Thread key={visible[i].threadID} thread={visible[i]} onDelete={updateThreads} onEdit={updateThreads}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {forumPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {forumPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {forumPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {forumPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
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

    const getNewThreadButton = () => {
        const style = {marginLeft: mobile ? "0px" : "15px", marginTop: mobile ? "10px" : "0px"}
        if (session.username) {
            return (
                <div className="forum-button-container" style={style} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <button className="forum-button" onClick={() => newThreadDialog()}>New</button>
                </div> 
            )
        }
    }

    return (
        <>
        <DragAndDrop/>
        <NewThreadDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="forum">
                    <span className="forum-heading">Forum</span>
                    <div className="forum-row">
                        <div className="forum-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="forum-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateThreads() : null}/>
                            <img className="forum-search-icon" src={getSearchIcon()} style={{filter: getFilterSearch()}} onClick={() => updateThreads()} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {!mobile ? getNewThreadButton() : null}
                        {getSortJSX()}
                        {!mobile ? <div className="forumsort-item" onClick={() => toggleScroll()}>
                            <img className="forumsort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="forumsort-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div> : null}
                        <div className={`forum-dropdown ${activeDropdown === "sort" ? "" : "hide-forum-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="forum-dropdown-row" onClick={() => setSortType("date")}>
                                <span className="forum-dropdown-text">Date</span>
                            </div>
                            <div className="forum-dropdown-row" onClick={() => setSortType("reverse date")}>
                                <span className="forum-dropdown-text">Reverse Date</span>
                            </div>
                        </div>
                    </div>
                    {mobile ? <div className="forum-row">{getNewThreadButton()}</div> : null}
                    <table className="forum-container">
                        {generateThreadsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ForumPage