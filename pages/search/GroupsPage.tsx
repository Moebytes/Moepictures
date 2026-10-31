/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions, useActiveSelector,
useSearchSelector, usePageSelector, useFlagSelector} from "../../store"
import {useSearchGroupsInfiniteQuery, useSearchGroupsPageQuery} from "../../api"
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
import LoadingSpinner from "../../components/search/LoadingSpinner"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import GroupThumbnail from "../../components/search/GroupThumbnail"
import PageControls from "../../components/site/PageControls"
import {GroupSearch, GroupSort} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 100
let pageAmount = 25

const GroupsPage: React.FunctionComponent = (props) => {
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
    const {groupsPage} = usePageSelector()
    const {setGroupsPage} = usePageActions()
    const {groupSearchFlag} = useFlagSelector()
    const {setGroupSearchFlag} = useFlagActions()
    const [sortType, setSortType] = useState("date" as GroupSort)
    const [sortReverse, setSortReverse] = useState(false)
    const {ratingType} = useSearchSelector()
    const location = useLocation()
    const {setScroll} = useSearchActions()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const searchRef = useRef<HTMLInputElement>(null)
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const [suggestionPosition, setSuggestionPosition] = useState({x: 0, y: 0, width: 230})
    const sortRef = useRef<HTMLDivElement>(null)
    const refreshRef = useRef(false)

    usePageURL(page, setPage, query, setQuery)

    const showSuggestions = () => {
        const rect = searchRef.current?.getBoundingClientRect()
        if (rect) setSuggestionPosition({x: rect.left + window.scrollX, y: rect.bottom + window.scrollY, width: rect.width})
        setSuggestionsActive(true)
    }

    const selectSuggestion = (tag: string) => {
        const parts = searchQuery.split(/ +/g)
        parts[parts.length - 1] = functions.tag.appendSpecialCharacters(parts, tag)
        setSearchQuery(parts.join(" ") + " ")
        searchRef.current?.focus()
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
        functions.dom.changeTitle(i18n.sort.groups, i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useSearchGroupsInfiniteQuery(
        {query, sort: functions.validation.parseSort(sortType, sortReverse), 
        rating: functions.post.isR18(ratingType) ? functions.r18() : "all", refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useSearchGroupsPageQuery(
        {query, sort: functions.validation.parseSort(sortType, sortReverse), 
        rating: functions.post.isR18(ratingType) ? functions.r18() : "all",
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
    const totalCount = Number(items[0]?.groupCount ?? items.length)
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
        if (groupSearchFlag) {
            setTimeout(() => {
                setSearchQuery(groupSearchFlag)
                refreshItems(groupSearchFlag)
                setGroupSearchFlag(null)
            }, 200)
        }
    }, [groupSearchFlag])

    useEffect(() => {
        refreshItems()
    }, [sortType, sortReverse, ratingType, session])

    useEffect(() => {
        if (groupsPage && !location.search) setPage(groupsPage)
    }, [])

    useEffect(() => {
        setGroupsPage(page)
    }, [page])

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -15
        if (sortType === "date") offset = -20
        if (sortType === "posts") offset = -20
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

    const generateGroupsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as GroupSearch[]
        for (let i = 0; i < visible.length; i++) {
            const group = visible[i]
            if (group.fake) continue
            if (!session.username) if (group.rating !== functions.r13()) continue
            if (!session.username) if (group.posts[0].rating !== functions.r13()) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(group.rating)) continue
            jsx.push(<GroupThumbnail key={group.groupID} group={group}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return
        setTimeout(() => {
            if (!event.nativeEvent.defaultPrevented) {
                setSuggestionsActive(false)
                refreshItems()
            }
        }, 0)
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">{i18n.sort.groups}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input ref={searchRef} className="item-search" type="search" spellCheck="false" value={searchQuery}
                            onChange={(event) => {setSearchQuery(event.target.value); showSuggestions()}}
                            onFocus={showSuggestions} onBlur={() => setSuggestionsActive(false)}
                            onKeyDown={onKeyDown}/>
                            <SearchSuggestions active={suggestionsActive} text={searchQuery} {...suggestionPosition} click={selectSuggestion}/>
                            <button className="item-search-button" onClick={() => refreshItems()}>
                                <SearchIcon className="item-search-button-icon"/>
                            </button>
                        </div>
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
                            <div className="item-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="item-dropdown-text">{i18n.sort.posts}</span>
                            </div>
                        </div>
                    </div>
                    {isLoading && <LoadingSpinner/>}
                    <div className="items-row-container" style={{justifyContent: "space-evenly"}}>
                        {generateGroupsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default GroupsPage