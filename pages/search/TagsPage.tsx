/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions, useActiveSelector,
useSearchSelector, usePageSelector, useFlagSelector, useTagDialogActions} from "../../store"
import {useSearchTagsInfiniteQuery, useSearchTagsPageQuery} from "../../api"
import {useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import SearchIcon from "../../assets/svg/search.svg"
import SortIcon from "../../assets/svg/sort.svg"
import SortReverseIcon from "../../assets/svg/sort-reverse.svg"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import TypeIcon from "../../assets/svg/all.svg"
import TagRow from "../../components/search/TagRow"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import PageControls from "../../components/site/PageControls"
import {TagSearch, TagSort, TagType} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 200
let pageAmount = 50

const TagsPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {activeDropdown} = useActiveSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll, ratingType} = useSearchSelector()
    const {tagsPage} = usePageSelector()
    const {setTagsPage} = usePageActions()
    const {setMassImplyDialog, setBlockedTagsDialog} = useTagDialogActions()
    const {tagSearchFlag} = useFlagSelector()
    const {setTagSearchFlag} = useFlagActions()
    const [sortType, setSortType] = useState("posts" as TagSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [typeType, setTypeType] = useState("all" as TagType)
    const location = useLocation()
    const {setScroll} = useSearchActions()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const sortRef = useRef<HTMLDivElement>(null)
    const typeRef = useRef<HTMLDivElement>(null)

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
        functions.dom.changeTitle(i18n.navbar.tags, i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useSearchTagsInfiniteQuery(
        {query, sort: functions.validation.parseSort(sortType, sortReverse), type: typeType, refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useSearchTagsPageQuery(
        {query, sort: functions.validation.parseSort(sortType, sortReverse), type: typeType,
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
    const totalCount = Number(items[0]?.tagCount ?? items.length)
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
        if (tagSearchFlag !== null) {
            refreshItems(tagSearchFlag)
            setTagSearchFlag(null)
        }
    }, [tagSearchFlag])

    useEffect(() => {
        refreshItems()
    }, [sortType, sortReverse, typeType, session])

    useEffect(() => {
        if (tagsPage && !location.search) setPage(tagsPage)
    }, [])

    useEffect(() => {
        setTagsPage(page)
    }, [page])

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -15
        if (sortType === "date") offset = -30
        if (sortType === "alphabetic") offset = -10
        if (sortType === "posts") offset = -30
        if (sortType === "image") offset = -25
        if (sortType === "aliases") offset = -25
        if (mobile) offset += 12
        return `${raw + offset}px`
    }

    const getTypeMargin = () => {
        const rect = typeRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (typeType === "all") offset = -35
        if (typeType === "artist") offset = -25
        if (typeType === "character") offset = -5
        if (typeType === "series") offset = -25
        if (typeType === "tag") offset = -33
        if (mobile) offset += 7
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

    const getTypeJSX = () => {
        return (
            <div className="itemsort-item" ref={typeRef} onClick={() => {setActiveDropdown(activeDropdown === "type" ? "none" : "type")}}>
                <TypeIcon className="itemsort-img rotate"/>
                {!mobile ? <span className="itemsort-text">{i18n.tag[typeType]}</span> : null}
            </div>
        )
    }

    const generateTagsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as TagSearch[]
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (!session.username) if (visible[i].r18) continue
            if (!functions.post.isR18(ratingType)) if (visible[i].r18) continue
            jsx.push(<TagRow key={visible[i].tag} tag={visible[i]} onDelete={refreshItems} onEdit={refreshItems}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    const massImplyDialog = () => {
        setMassImplyDialog(true)
    }

    const blockedTagsDialog = () => {
        setBlockedTagsDialog(true)
    }

    const getMassImplyButton = () => {
        const style = {marginLeft: mobile ? "0px" : "15px", marginTop: mobile ? "10px" : "0px", justifyContent: "flex-start"}
        if (session.username) {
            return (
                <div className="item-button-container" style={style} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <button className="item-button" onClick={() => massImplyDialog()}>{i18n.dialogs.massImply.title}</button>
                </div>
            )
        }
    }

    const getBlockedTagsButton = () => {
        const style = {marginLeft: mobile ? "0px" : "15px", marginTop: mobile ? "10px" : "0px", justifyContent: "flex-start"}
        if (session.username) {
            return (
                <div className="item-button-container" style={style} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <button className="item-button" onClick={() => blockedTagsDialog()}>＋</button>
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
                    <span className="items-heading">{i18n.navbar.tags}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} style={{width: mobile ? "170px" : "230px"}}
                            onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? refreshItems() : null}/>
                            <button className="item-search-button" onClick={() => refreshItems()}>
                                <SearchIcon className="item-search-button-icon"/>
                            </button>
                        </div>
                        {!mobile && permissions.isAdmin(session) ? getMassImplyButton() : null}
                        {!mobile && permissions.isAdmin(session) ? getBlockedTagsButton() : null}
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
                            <div className="item-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="item-dropdown-text">{i18n.sort.alphabetic}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="item-dropdown-text">{i18n.sort.posts}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("image")}>
                                <span className="item-dropdown-text">{i18n.sort.image}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("aliases")}>
                                <span className="item-dropdown-text">{i18n.sort.aliases}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("length")}>
                                <span className="item-dropdown-text">{i18n.sort.length}</span>
                            </div>
                        </div>
                        {getTypeJSX()}
                        <div className={`item-dropdown ${activeDropdown === "type" ? "" : "hide-item-dropdown"}`} 
                        style={{marginRight: getTypeMargin(), top: mobile ? "220px" : "190px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="item-dropdown-row" onClick={() => setTypeType("all")}>
                                <span className="item-dropdown-text">{i18n.tag.all}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("artist")}>
                                <span className="item-dropdown-text">{i18n.tag.artist}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("character")}>
                                <span className="item-dropdown-text">{i18n.tag.character}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("series")}>
                                <span className="item-dropdown-text">{i18n.tag.series}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("meta")}>
                                <span className="item-dropdown-text">{i18n.tag.meta}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("appearance")}>
                                <span className="item-dropdown-text">{i18n.tag.appearance}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("outfit")}>
                                <span className="item-dropdown-text">{i18n.tag.outfit}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("accessory")}>
                                <span className="item-dropdown-text">{i18n.tag.accessory}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("action")}>
                                <span className="item-dropdown-text">{i18n.tag.action}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("scenery")}>
                                <span className="item-dropdown-text">{i18n.tag.scenery}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setTypeType("tag")}>
                                <span className="item-dropdown-text">{i18n.tag.tag}</span>
                            </div>
                        </div>
                    </div>
                    {mobile && permissions.isAdmin(session) ? 
                    <div className="item-row" style={{display: "flex", flexDirection: "row", gap: "10px"}}>
                        {getMassImplyButton()}
                        {getBlockedTagsButton()}
                    </div> : null}
                    {isLoading && <LoadingSpinner/>}
                    <div className="items-container" style={{marginTop: "15px"}}>
                        {generateTagsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TagsPage