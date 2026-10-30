/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo, useCallback} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions, useSearchSelector,
usePageSelector, useFlagSelector, useMiscDialogActions, useSearchDialogActions, useSearchDialogSelector,
usePostDialogActions, usePostDialogSelector} from "../../store"
import {usePostHistoryInfiniteQuery, usePostHistoryPageQuery,
useTagHistoryInfiniteQuery, useTagHistoryPageQuery,
useNoteHistoryInfiniteQuery, useNoteHistoryPageQuery,
useGroupHistoryInfiniteQuery, useGroupHistoryPageQuery,
useAliasHistoryInfiniteQuery, useAliasHistoryPageQuery,
useSearchHistoryInfiniteQuery, useSearchHistoryPageQuery,
useDeletedHistoryInfiniteQuery, useDeletedHistoryPageQuery} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import PostHistoryRow from "../../components/history/PostHistoryRow"
import TagHistoryRow from "../../components/history/TagHistoryRow"
import NoteHistoryRow from "../../components/history/NoteHistoryRow"
import GroupHistoryRow from "../../components/history/GroupHistoryRow"
import SearchHistoryRow from "../../components/history/SearchHistoryRow"
import AliasHistoryRow from "../../components/history/AliasHistoryRow"
import DeletedPostRow from "../../components/history/DeletedPostRow"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import SearchIcon from "../../assets/svg/search.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import PostIcon from "../../assets/svg/post.svg"
import TagIcon from "../../assets/svg/tag-shaded.svg"
import NoteIcon from "../../assets/svg/note.svg"
import GroupIcon from "../../assets/svg/group.svg"
import AliasIcon from "../../assets/svg/all.svg"
import permissions from "../../structures/Permissions"
import PageControls from "../../components/site/PageControls"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import {History, PostHistory, TagHistory, NoteHistory, GroupHistory, SearchHistory, AliasHistorySearch, DeletedPost} from "../../types/Types"
import "./styles/historypage.less"

let limit = 100
let pageAmount = 15

const HistoryPage: React.FunctionComponent = () => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setSearch, setScroll, setSearchFlag} = useSearchActions()
    const {historyPage} = usePageSelector()
    const {setHistoryPage} = usePageActions()
    const {historyFlag} = useFlagSelector()
    const {setHistoryFlag} = useFlagActions()
    const {showDeleteAllHistoryDialog} = useSearchDialogSelector()
    const {setShowDeleteAllHistoryDialog} = useSearchDialogActions()
    const {permaDeleteAllDialog} = usePostDialogSelector()
    const {setPermaDeleteAllDialog} = usePostDialogActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const [historyTab, setHistoryTab] = useState("")
    const [afterFirstLoad, setAfterFirstLoad] = useState(false)
    const [noResults, setNoResults] = useState(false)
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const navigate = useNavigate()

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        const typeParam = new URLSearchParams(window.location.search).get("type")
        if (typeParam) setHistoryTab(typeParam)
        const onDOMLoaded = () => {
            const savedTab = localStorage.getItem("historyTab")
            if (savedTab) setHistoryTab(savedTab)
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/history")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
        const typeParam = new URLSearchParams(window.location.search).get("type")
        if (!typeParam) setHistoryTab(permissions.isPremium(session) ? "search" : "post")
    }, [session])

    useEffect(() => {
        functions.dom.changeTitle(i18n.history[historyTab], i18n)
    }, [historyTab, i18n])

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
        setRelative(mobile ? true : false)
    }, [mobile])

    const transformHistory = useCallback((rows: any[]) => {
        return rows.map((r) => ({itemType: historyTab, ...r}))
    }, [historyTab])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const postInfiniteQuery = usePostHistoryInfiniteQuery(
        {query, refreshKey},
        {skip: !scroll || historyTab !== "post", initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )
    const postPageQuery = usePostHistoryPageQuery(
        {query, offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll || historyTab !== "post"}
    )

    const tagInfiniteQuery = useTagHistoryInfiniteQuery(
        {query, refreshKey},
        {skip: !scroll || historyTab !== "tag", initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const tagPageQuery = useTagHistoryPageQuery(
        {query, offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll || historyTab !== "tag"}
    )

    const noteInfiniteQuery = useNoteHistoryInfiniteQuery(
        {query, refreshKey},
        {skip: !scroll || historyTab !== "note", initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const notePageQuery = useNoteHistoryPageQuery(
        {query, offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll || historyTab !== "note"}
    )

    const groupInfiniteQuery = useGroupHistoryInfiniteQuery(
        {query, refreshKey},
        {skip: !scroll || historyTab !== "group", initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const groupPageQuery = useGroupHistoryPageQuery(
        {query, offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll || historyTab !== "group"}
    )

    const aliasInfiniteQuery = useAliasHistoryInfiniteQuery(
        {query, refreshKey},
        {skip: !scroll || historyTab !== "alias", initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const aliasPageQuery = useAliasHistoryPageQuery(
        {query, offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll || historyTab !== "alias"}
    )

    const searchInfiniteQuery = useSearchHistoryInfiniteQuery(
        {query, refreshKey},
        {skip: !scroll || historyTab !== "search", initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const searchPageQuery = useSearchHistoryPageQuery(
        {query, offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll || historyTab !== "search"}
    )

    const deleteInfiniteQuery = useDeletedHistoryInfiniteQuery(
        {query, refreshKey},
        {skip: !scroll || historyTab !== "delete", initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )
    
    const deletePageQuery = useDeletedHistoryPageQuery(
        {query, offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll || historyTab !== "delete"}
    )

    const infiniteQuery = {
        post: postInfiniteQuery,
        tag: tagInfiniteQuery,
        note: noteInfiniteQuery,
        group: groupInfiniteQuery,
        alias: aliasInfiniteQuery,
        search: searchInfiniteQuery,
        delete: deleteInfiniteQuery
    }[historyTab]

    const pageQuery = {
        post: postPageQuery,
        tag: tagPageQuery,
        note: notePageQuery,
        group: groupPageQuery,
        alias: aliasPageQuery,
        search: searchPageQuery,
        delete: deletePageQuery
    }[historyTab]

    const items = useMemo(() => {
        let result = scroll ? infiniteQuery?.currentData?.pages.flat() ?? [] : pageQuery?.currentData ?? []
        return transformHistory(result)
    }, [scroll, infiniteQuery?.currentData, pageQuery?.currentData, transformHistory])

    const visibleItems = useMemo(() => {
        return scroll ? items : items.slice(pageOffset, pageOffset + pageAmount)
    }, [items, pageOffset, pageAmount, scroll])
    
    const isLoading = (scroll ? infiniteQuery?.isFetching : pageQuery?.isFetching) && visibleItems.length === 0
    const totalCount = Number(items[0]?.historyCount ?? items.length)
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    const loadMore = useEffectEvent(() => {
        if (infiniteQuery?.hasNextPage && !infiniteQuery?.isFetchingNextPage) infiniteQuery.fetchNextPage()
    })

    useEffect(() => {
        if (!scroll) return
        const onScroll = () => {
            if (functions.dom.scrolledToBottom()) loadMore()
        }
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [scroll])

    const onRefresh = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)

        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    const toggleScroll = () => setScroll(!scroll)

    useEffect(() => {
        setAfterFirstLoad(true)
        setNoResults(visibleItems.length === 0)
    }, [visibleItems])

    const resetState = () => {
        setPage(1)
    }

    useEffect(() => {
        resetState()
        onRefresh()
    }, [session, historyTab])

    useEffect(() => {
        if (historyPage && !location.search) setPage(historyPage)
    }, [])

    useEffect(() => {
        setHistoryPage(page)
    }, [page])

    useEffect(() => {
        if (historyFlag) {
            onRefresh()
            setHistoryFlag(false)
        }
    }, [historyFlag, session])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (historyTab) searchParams.set("type", historyTab)
        let pathString = `${location.pathname}?${searchParams.toString()}`
        navigate(pathString, {replace: true})
    }, [scroll, historyTab])

    useEffect(() => {
        localStorage.setItem("historyTab", String(historyTab))
    }, [historyTab])

    const generateHistoryJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as History[]
        visible = visible.filter((i: any) => i.itemType === historyTab)
        if (!session.showR18) {
            visible = visible.filter((item) => historyTab === "tag" ||  historyTab === "alias" ? 
            !(item as TagHistory).r18 : !functions.post.isR18((item as PostHistory).rating))
        }
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (historyTab === "post") {
                let current = visible[0] as PostHistory
                let item = visible[i] as PostHistory
                let previous = visible[i + 1] as PostHistory | null
                if (current.postID !== item.postID) {
                    current = item
                    currentIndex = i
                }
                if (previous?.postID !== current.postID) previous = null
                if (!functions.compare.hasHistoryChanges(item)) continue
                jsx.push(<PostHistoryRow key={i} historyIndex={i+1} postHistory={item} 
                    previousHistory={previous} currentHistory={current} current={i === currentIndex}
                    onDelete={onRefresh} onEdit={onRefresh}/>)
            }

            if (historyTab === "tag") {
                let current = visible[0] as TagHistory
                let item = visible[i] as TagHistory
                let previous = visible[i + 1] as TagHistory | null
                if (current.tag !== item.tag) {
                    current = item
                    currentIndex = i
                }
                if (previous?.tag !== current.tag) previous = null
                if (!functions.compare.hasHistoryChanges(item)) continue
                jsx.push(<TagHistoryRow key={i} historyIndex={i+1} tagHistory={item} 
                    previousHistory={previous} currentHistory={current} current={i === currentIndex}
                    onDelete={onRefresh} onEdit={onRefresh}/>)
            }

            if (historyTab === "group") {
                let current = visible[0] as GroupHistory
                let item = visible[i] as GroupHistory
                let previous = visible[i + 1] as GroupHistory | null
                if (current.groupID !== item.groupID) {
                    current = item
                    currentIndex = i
                }
                if (previous?.groupID !== current.groupID) previous = null
                if (!functions.compare.hasHistoryChanges(item)) continue
                jsx.push(<GroupHistoryRow key={i} historyIndex={i+1} groupHistory={item} 
                    previousHistory={previous} currentHistory={current} current={i === currentIndex}
                    onDelete={onRefresh} onEdit={onRefresh}/>)
            }

            if (historyTab === "note") {
                let current = visible[0] as NoteHistory
                let item = visible[i] as NoteHistory
                let previous = visible[i + 1] as NoteHistory | null
                if (current.postID !== item.postID &&
                    current.order !== item.order) {
                    current = item
                    currentIndex = i
                }
                if (previous?.postID !== current.postID &&
                    previous?.order !== current.order) previous = null
                if (!functions.compare.hasHistoryChanges(item)) continue
                jsx.push(<NoteHistoryRow key={i} previousHistory={previous} noteHistory={item} 
                    onDelete={onRefresh} onEdit={onRefresh} current={i === currentIndex}/>)
            }

            if (historyTab === "alias") {
                jsx.push(<AliasHistoryRow key={i} history={visible[i] as AliasHistorySearch} onDelete={onRefresh} onEdit={onRefresh}/>)
            }

            if (historyTab === "search") {
                jsx.push(<SearchHistoryRow key={i} history={visible[i] as SearchHistory} onDelete={onRefresh}/>)
            }

            if (historyTab === "delete") {
                jsx.push(<DeletedPostRow key={i} post={visible[i] as DeletedPost} onDelete={onRefresh}/>)
            }
        }
        if (!scroll && !isLoading) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/>)
        }
        return jsx
    }

    const generateHeaderJSX = () => {
        if (historyTab === "post") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.post}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? onRefresh() : null}/>
                        <button className="history-search-button" onClick={() => onRefresh()}>
                            <SearchIcon className="history-search-button-icon"/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="history-img"/> :
                        <PagesIcon className="history-img"/>}
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "tag") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.tag}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? onRefresh() : null}/>
                        <button className="history-search-button" onClick={() => onRefresh()}>
                            <SearchIcon className="history-search-button-icon"/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="history-img"/> :
                        <PagesIcon className="history-img"/>}
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "group") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.group}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? onRefresh() : null}/>
                        <button className="history-search-button" onClick={() => onRefresh()}>
                            <SearchIcon className="history-search-button-icon"/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="history-img"/> :
                        <PagesIcon className="history-img"/>}
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "note") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.note}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? onRefresh() : null}/>
                        <button className="history-search-button" onClick={() => onRefresh()}>
                            <SearchIcon className="history-search-button-icon"/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="history-img"/> :
                        <PagesIcon className="history-img"/>}
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "alias") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.alias}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? onRefresh() : null}/>
                        <button className="history-search-button" onClick={() => onRefresh()}>
                            <SearchIcon className="history-search-button-icon"/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="history-img"/> :
                        <PagesIcon className="history-img"/>}
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "search") {
            return (
                <><div className="history-row">
                    <span className="history-heading" style={{cursor: "pointer"}} onClick={searchHistoryHeaderClick}>{i18n.history.search}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? onRefresh() : null}/>
                        <button className="history-search-button" onClick={() => onRefresh()}>
                            <SearchIcon className="history-search-button-icon"/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="history-img"/> :
                        <PagesIcon className="history-img"/>}
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                    <div className="history-item" onClick={() => setShowDeleteAllHistoryDialog(!showDeleteAllHistoryDialog)}>
                        <DeleteIcon className="history-img-red"/>
                        {!mobile ? <span className="history-opt-text">{i18n.buttons.deleteAll}</span> : null}
                    </div>
                </div></>
            )
        }
        if (historyTab === "delete") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.delete}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? onRefresh() : null}/>
                        <button className="history-search-button" onClick={() => onRefresh()}>
                            <SearchIcon className="history-search-button-icon"/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="history-img"/> :
                        <PagesIcon className="history-img"/>}
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                    <div className="history-item" onClick={() => setPermaDeleteAllDialog(!permaDeleteAllDialog)}>
                        <DeleteIcon className="history-img-red"/>
                        {!mobile ? <span className="history-opt-text">{i18n.buttons.deleteAll}</span> : null}
                    </div>
                </div></>
            )
        }
    }

    const searchHistoryClick = () => {
        if (permissions.isPremium(session)) {
            setHistoryTab("search")
        } else {
            setPremiumRequired(true)
        }
    }

    const searchHistoryHeaderClick = () => {
        navigate("/posts")
        setSearch(`history:${session.username}`)
        setSearchFlag(true)
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <div className="history-icons">
                        {historyTab === "search" ?
                        <SearchIcon className="history-icon-pink" onClick={searchHistoryClick}/> :
                        <SearchIcon className="history-icon" onClick={searchHistoryClick}/>}
                        {historyTab === "post" ?
                        <PostIcon className="history-icon-pink" onClick={() => setHistoryTab("post")}/> :
                        <PostIcon className="history-icon" onClick={() => setHistoryTab("post")}/>}
                        {historyTab === "tag" ?
                        <TagIcon className="history-icon-pink" onClick={() => setHistoryTab("tag")}/> :
                        <TagIcon className="history-icon" onClick={() => setHistoryTab("tag")}/>}
                        {historyTab === "group" ?
                        <GroupIcon className="history-icon-pink" onClick={() => setHistoryTab("group")}/> :
                        <GroupIcon className="history-icon" onClick={() => setHistoryTab("group")}/>}
                        {historyTab === "note" ?
                        <NoteIcon className="history-icon-pink" onClick={() => setHistoryTab("note")}/> :
                        <NoteIcon className="history-icon" onClick={() => setHistoryTab("note")}/>}
                        {historyTab === "alias" ?
                        <AliasIcon className="history-icon-pink" onClick={() => setHistoryTab("alias")}/> :
                        <AliasIcon className="history-icon" onClick={() => setHistoryTab("alias")}/>}
                        {permissions.isAdmin(session) ? (
                        historyTab === "delete" ?
                        <DeleteIcon className="history-icon-pink" onClick={() => setHistoryTab("delete")}/> :
                        <DeleteIcon className="history-icon" onClick={() => setHistoryTab("delete")}/>) : null}
                    </div>
                    {generateHeaderJSX()}
                    {isLoading && <LoadingSpinner/>}
                    <div className="history-container">
                        {generateHistoryJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default HistoryPage