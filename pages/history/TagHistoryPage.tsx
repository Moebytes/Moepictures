/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useTagHistoryInfiniteQuery, useTagHistoryPageQuery} from "../../api"
import {useSearchActions, useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions,
useSearchSelector, useActiveActions, useFlagActions, useLayoutSelector, useThemeSelector} from "../../store"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import TagHistoryRow from "../../components/history/TagHistoryRow"
import PageControls from "../../components/site/PageControls"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import {TagHistory} from "../../types/Types"
import "./styles/historypage.less"

let limit = 100
let pageAmount = 15

interface Props {
    all?: boolean
}

const TagHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {scroll} = useSearchSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const navigate = useNavigate()
    const {tag, username} = useParams() as {tag: string, username?: string}
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(tag ? `/tag/history/${tag}` : "/tag/history")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
    }, [session])

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
        functions.dom.changeTitle(i18n.history.tag, i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useTagHistoryInfiniteQuery(
        {query, ...(props.all ? {} : {tag, username}), refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useTagHistoryPageQuery(
        {query, ...(props.all ? {} : {tag, username}),
        offset: batchOffset, limit: batchSize, refreshKey},
        {skip: scroll}
    )

    const [fallbackItems, setItems] = useState<any[]>([])

    const items = useMemo(() => {
        let result = scroll ? infiniteQuery.currentData?.pages.flat() ?? [] : pageQuery.currentData ?? []
        if (!result.length) result = fallbackItems
        return result
    }, [scroll, infiniteQuery.currentData, pageQuery.currentData, fallbackItems])

    const visibleItems = useMemo(() => {
        return scroll ? items : items.slice(pageOffset, pageOffset + pageAmount)
    }, [items, pageOffset, pageAmount, scroll])

    const isLoading = (scroll ? infiniteQuery.isFetching : pageQuery.isFetching) && visibleItems.length === 0
    const totalCount = Number(items[0]?.historyCount ?? items.length)
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    const isUpdating = scroll ? infiniteQuery.isFetching : pageQuery.isFetching
    const isSuccess = scroll ? infiniteQuery.isSuccess : pageQuery.isSuccess

    const historyItems = items

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

    const onRefresh = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)
        setItems([])
        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    useEffect(() => {
        if (!isSuccess || isUpdating || historyItems.length || props.all || page !== 1) return
        let active = true
        const fallback = async () => {
            let result = [] as TagHistory[]
            if (!result.length) {
                const tagObject = await functions.http.get("/api/tag", {tag}, session, setSessionFlag)
                if (!tagObject) return
                const creator = await functions.http.get("/api/user", {username: tagObject.creator}, session, setSessionFlag)
                if (!creator) return
                const historyObject = tagObject as unknown as TagHistory
                if (!tagObject.createDate && !tagObject.creator) {
                    const oldestPost = await functions.http.get("/api/search/posts", {query: tag, type: "all", rating: "all", style: "all", sort: "reverse date", limit: 1}, session, setSessionFlag)
                    tagObject.createDate = oldestPost[0].uploadDate
                    tagObject.creator = oldestPost[0].uploader
                }
                historyObject.date = tagObject.createDate 
                historyObject.user = {...creator}
                historyObject.key = tag
                historyObject.aliases = tagObject.aliases.map((alias) => alias?.alias || "")
                historyObject.implications = tagObject.implications.map((implication) => implication?.implication || "")
                result = [historyObject]
            }

            if (active) setItems(result)
        }
        fallback()
        return () => {
            active = false
        }
    }, [historyItems, isSuccess, isUpdating, props.all, page])

    useEffect(() => {
        onRefresh()
    }, [tag, session])

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as TagHistory[]
        if (!session.showR18) {
            visible = visible.filter((item) => !item.r18)
        }
        let current = visible[0]
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            let previous = visible[i + 1] as TagHistory | null
            if (current.tag !== visible[i].tag) {
                current = visible[i]
                currentIndex = i
            }
            if (previous?.tag !== current.tag) previous = null
            if (username && !functions.compare.hasHistoryChanges(visible[i])) continue
            jsx.push(<TagHistoryRow key={i} historyIndex={i+1} tagHistory={visible[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={onRefresh} onEdit={onRefresh}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/>)
        }
        return jsx
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <span className="history-heading">{username ? `${functions.util.toProperCase(username)}'s ${i18n.history.tag}` : i18n.history.tag}</span>
                    {isLoading && <LoadingSpinner/>}
                    <div className="history-container">
                        {generateRevisionsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TagHistoryPage