import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/icons/search.png"
import searchIconHover from "../assets/icons/search-hover.png"
import sort from "../assets/icons/sort.png"
import ForumThread from "../components/ForumThread"
import NewThreadDialog from "../dialogs/NewThreadDialog"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, 
SiteLightnessContext, SiteSaturationContext, ShowNewThreadDialogContext} from "../Context"
import permissions from "../structures/Permissions"
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
    const sortRef = useRef(null) as any

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
        setTimeout(() => {
            updateThreads()
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
        updateThreads()
    }, [sortType])

    useEffect(() => {
        let currentIndex = index
        const newVisibleThreads = visibleThreads as any
        for (let i = 0; i < 10; i++) {
            if (!threads[currentIndex]) break
            newVisibleThreads.push(threads[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleThreads(newVisibleThreads)
    }, [threads])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/search/threads", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length) {
            setOffset(newOffset)
            setThreads((prev: any) => [...prev, ...result])
        } else {
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!threads[currentIndex]) return updateOffset()
                const newThreads = visibleThreads as any
                for (let i = 0; i < 10; i++) {
                    if (!threads[currentIndex]) return updateOffset()
                    newThreads.push(threads[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleThreads(newThreads)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

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
        jsx.push(<ForumThread titlePage={true}/>)
        for (let i = 0; i < visibleThreads.length; i++) {
            jsx.push(<ForumThread thread={visibleThreads[i]} onDelete={updateThreads} onEdit={updateThreads}/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <NewThreadDialog/>
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
                        {session.username ?
                        <div className="forum-button-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <button className="forum-button" onClick={() => newThreadDialog()}>New</button>
                        </div> : null}
                        {getSortJSX()}
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