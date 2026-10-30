/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions, useActiveSelector,
useSearchSelector, usePageSelector, useFlagSelector, useThreadDialogActions, useThreadDialogSelector} from "../../store"
import {useSearchThreadsInfiniteQuery, useSearchThreadsPageQuery} from "../../api"
import {useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import SearchIcon from "../../assets/svg/search.svg"
import SortIcon from "../../assets/svg/sort.svg"
import SortReverseIcon from "../../assets/svg/sort-reverse.svg"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import ThreadRow from "../../components/search/ThreadRow"
import LoadingSpinner from "../../components/search/LoadingSpinner"
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
    const location = useLocation()
    const {setScroll} = useSearchActions()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const sortRef = useRef<HTMLDivElement>(null)
    const refreshRef = useRef(false)

    usePageURL(page, setPage, query, setQuery)

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
        functions.dom.changeTitle(i18n.navbar.forum, i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useSearchThreadsInfiniteQuery(
        {query, sort: functions.validation.parseSort(sortType, sortReverse), refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useSearchThreadsPageQuery(
        {query, sort: functions.validation.parseSort(sortType, sortReverse),
        offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll}
    )

    const items = useMemo(() => {
        let result = scroll ? infiniteQuery.currentData?.pages.flat() ?? [] : pageQuery.currentData ?? []
        return result
    }, [scroll, infiniteQuery.currentData, pageQuery.currentData])

    const visibleItems = useMemo(() => {
        return scroll ? items : items.slice(pageOffset, pageOffset + pageAmount)
    }, [items, pageOffset, pageAmount, scroll])
    
    const isLoading = (scroll ? infiniteQuery.isFetching : pageQuery.isFetching) && visibleItems.length === 0
    const totalCount = Number(items[0]?.threadCount ?? items.length)
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    const loadMore = useEffectEvent(() => {
        if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) infiniteQuery.fetchNextPage()
    })

    useEffect(() => {
        if (!scroll) return
        const onScroll = () => {
            if (functions.dom.scrolledToBottom()) loadMore()
        }
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [scroll])

    const refreshItems = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)

        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    const toggleScroll = () => setScroll(!scroll)

    useEffect(() => {
        if (threadSearchFlag) {
            setTimeout(() => {
                setSearchQuery(threadSearchFlag)
                refreshItems(threadSearchFlag)
                setThreadSearchFlag(null)
            }, 500)
        }
    }, [threadSearchFlag])

    useEffect(() => {
        refreshItems()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (forumPage && !location.search) setPage(forumPage)
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
                {sortReverse ?
                <SortReverseIcon className="itemsort-img" onClick={() => setSortReverse(!sortReverse)}/> :
                <SortIcon className="itemsort-img" onClick={() => setSortReverse(!sortReverse)}/>}
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
            jsx.push(<ThreadRow thread={visible[i]} onDelete={refreshItems} onEdit={refreshItems}/>)
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
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? refreshItems() : null}/>
                            <button className="item-search-button" onClick={() => refreshItems()}>
                                <SearchIcon className="item-search-button-icon"/>
                            </button>
                        </div>
                        {!mobile ? getNewThreadButton() : null}
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            {scroll ? 
                            <ScrollIcon className="itemsort-img"/> :
                            <PagesIcon className="itemsort-img"/>}
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
                    {isLoading && <LoadingSpinner/>}
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