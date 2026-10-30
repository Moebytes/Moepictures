/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {usePostHistoryInfiniteQuery, usePostHistoryPageQuery} from "../../api"
import {useSearchActions, useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions,
useSearchSelector, useActiveActions, useFlagActions, useLayoutSelector, useThemeSelector} from "../../store"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import PostHistoryRow from "../../components/history/PostHistoryRow"
import PageControls from "../../components/site/PageControls"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import {PostHistory} from "../../types/Types"
import "./styles/historypage.less"

let limit = 100
let pageAmount = 15

interface Props {
    all?: boolean
}

const PostHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const navigate = useNavigate()
    const {id: postID, slug, username} = useParams() as {id: string, slug: string, username?: string}
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
            setRedirect(postID ? `/post/history/${postID}/${slug}` : "/post/history")
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
        functions.dom.changeTitle(i18n.history.post, i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const processRedirects = async () => {
        if (!postID || !session.cookie) return
        const postObject = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
        if (postObject) functions.post.processRedirects(postObject, postID, slug, navigate, session, setSessionFlag)
    }

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = usePostHistoryInfiniteQuery(
        {query, ...(props.all ? {} : {postID, username}), refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = usePostHistoryPageQuery(
        {query, ...(props.all ? {} : {postID, username}),
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
            let result = [] as PostHistory[]
            if (!result.length) {
                const postObject = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
                if (!postObject) return
                const uploader = await functions.http.get("/api/user", {username: postObject.uploader}, session, setSessionFlag)
                if (!uploader) return
                const historyObject = postObject as unknown as PostHistory
                historyObject.date = postObject.uploadDate
                historyObject.user = {...uploader}
                historyObject.images = postObject.images.map((i) => functions.link.getThumbnailLink(i, "medium", session, mobile))
                let categories = await functions.tag.tagCategories(postObject.tags, session, setSessionFlag)
                historyObject.artists = categories.artists.map((a) => a.tag)
                historyObject.characters = categories.characters.map((c) => c.tag)
                historyObject.series = categories.series.map((s) => s.tag)
                historyObject.tags = [...categories.tags.map((t) => t.tag), ...categories.meta.map((m) => m.tag)]
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
        processRedirects()
    }, [postID, session])

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as PostHistory[]
        if (!session.showR18) {
            visible = visible.filter((item) => !functions.post.isR18(item.rating))
        }
        let current = visible[0]
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            let previous = visible[i + 1] as PostHistory | null
            if (current.postID !== visible[i].postID) {
                current = visible[i]
                currentIndex = i
            }
            if (previous?.postID !== current.postID) previous = null
            if (username && !functions.compare.hasHistoryChanges(visible[i])) continue
            jsx.push(<PostHistoryRow key={i} historyIndex={i+1} postHistory={visible[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={onRefresh} onEdit={onRefresh} imageHeight={username ? undefined : 300}/>)
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
                    <span className="history-heading">{username ? `${functions.util.toProperCase(username)}'s ${i18n.history.post}` : i18n.history.post}</span>
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

export default PostHistoryPage