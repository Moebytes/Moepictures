import React, {useEffect, useState, useRef} from "react"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import search from "../../assets/svg/search.svg"
import sort from "../../assets/svg/sort.svg"
import sortRev from "../../assets/svg/sort-reverse.svg"
import scrollIcon from "../../assets/svg/scroll.svg"
import pageIcon from "../../assets/svg/pages.svg"
import ThreadRow from "../../components/search/ThreadRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchSelector, usePageSelector, useFlagSelector,
useThreadDialogActions, useThreadDialogSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {ThreadSearch, CommentSort} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 100
let pageAmount = 50

const ForumPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {activeDropdown} = useActiveSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {forumPage} = usePageSelector()
    const {setForumPage} = usePageActions()
    const {threadSearchFlag} = useFlagSelector()
    const {setThreadSearchFlag} = useFlagActions()
    const {showNewThreadDialog} = useThreadDialogSelector()
    const {setShowNewThreadDialog} = useThreadDialogActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const sortRef = useRef<HTMLDivElement>(null)

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})
    const getFilterSearch = functions.color.filter({theme, siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
    }, [])

    useEffect(() => {
        document.title = i18n.navbar.forum
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async (query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        const result = await functions.http.get("/api/search/threads", {sort, query}, session, setSessionFlag)
        return result
    }

    const updateOffset = async (offset: number, query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        let result = await functions.http.get("/api/search/threads", {sort, query, offset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, searchQuery, setSearchQuery, initItems, setManagedPage,
        toggleScroll} = usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "threadCount"})

    useEffect(() => {
        if (threadSearchFlag) {
            setTimeout(() => {
                setSearchQuery(threadSearchFlag)
                initItems(threadSearchFlag)
                setThreadSearchFlag(null)
            }, 500)
        }
    }, [threadSearchFlag])

    useEffect(() => {
        initItems()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (forumPage) setManagedPage(forumPage)
    }, [])

    useEffect(() => {
        setForumPage(page)
    }, [page])

    const newThreadDialog = () => {
        setShowNewThreadDialog(!showNewThreadDialog)
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -15
        if (sortType === "date") offset = -20
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="itemsort-item" ref={sortRef}>
                <img className="itemsort-img" src={sortReverse ? getIcon(sortRev) : getIcon(sort)} style={{filter}} onClick={() => setSortReverse(!sortReverse)}/>
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{i18n.sort[sortType]}</span>
            </div>
        )
    }

    const generateThreadsJSX = () => {
        const jsx = [] as React.ReactElement[]
        jsx.push(<ThreadRow key={"0"} titlePage={true}/>)
        let visible = visibleItems as ThreadSearch[]
        for (let i = 0; i < visible?.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<ThreadRow thread={visible[i]} onDelete={initItems} onEdit={initItems}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    const getNewThreadButton = () => {
        if (session.banned) return null
        const style = {marginLeft: mobile ? "0px" : "15px", marginTop: mobile ? "10px" : "0px", justifyContent: "flex-start"}
        if (session.username) {
            return (
                <div className="item-button-container" style={style} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <button className="item-button" onClick={() => newThreadDialog()}>{i18n.buttons.new}</button>
                </div> 
            )
        }
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">{i18n.navbar.forum}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItems() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch}} onClick={() => initItems()}>
                                <img src={search}/>
                            </button>
                        </div>
                        {!mobile ? getNewThreadButton() : null}
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            <img className="itemsort-img" src={scroll ? getIcon(scrollIcon) : getIcon(pageIcon)} style={{filter}}/>
                            <span className="itemsort-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div> : null}
                        <div className={`item-dropdown ${activeDropdown === "sort" ? "" : "hide-item-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "220px" : "190px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="item-dropdown-row" onClick={() => setSortType("random")}>
                                <span className="item-dropdown-text">{i18n.sort.random}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("date")}>
                                <span className="item-dropdown-text">{i18n.sort.date}</span>
                            </div>
                        </div>
                    </div>
                    {mobile ? <div className="item-row">{getNewThreadButton()}</div> : null}
                    <div className="items-container">
                        {generateThreadsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ForumPage