/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions, useSearchSelector,
usePageSelector, useFlagSelector} from "../../store"
import {useGetForumPostsInfiniteQuery, useGetForumPostsPageQuery} from "../../api"
import {useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import ForumPostRow from "../../components/search/ForumPostRow"
import PageControls from "../../components/site/PageControls"
import {CommentSort, ForumPostSearch} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 100
let pageAmount = 50

const ForumPostsPage: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {forumPostsPage} = usePageSelector()
    const {setForumPostsPage} = usePageActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const {forumPostSearchFlag} = useFlagSelector()
    const {setForumPostSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const {username} = useParams() as {username: string}
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
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
        functions.dom.changeTitle(`${functions.util.toProperCase(username)}'s ${i18n.user.forumPosts}`, i18n)
    }, [i18n, username])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useGetForumPostsInfiniteQuery(
        {query, username, sort: functions.validation.parseSort(sortType, sortReverse), refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetForumPostsPageQuery(
        {query, username, sort: functions.validation.parseSort(sortType, sortReverse),
        offset: batchOffset, refreshKey},
        {skip: scroll}
    )

    const items = useMemo(() => {
        let result = scroll ? infiniteQuery.currentData?.pages.flat() ?? [] : pageQuery.currentData ?? []
        return result
    }, [scroll, infiniteQuery.currentData, pageQuery.currentData])

    const visibleItems = useMemo(() => {
        return scroll ? items : items.slice(pageOffset, pageOffset + pageAmount)
    }, [items, pageOffset, pageAmount, scroll])
    
    const totalCount = Number(items[0]?.postCount ?? items.length)
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

    const onRefresh = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)

        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    useEffect(() => {
        if (forumPostSearchFlag) {
            setTimeout(() => {
                setSearchQuery(forumPostSearchFlag)
                onRefresh(forumPostSearchFlag)
                setForumPostSearchFlag(null)
            }, 200)
        }
    }, [forumPostSearchFlag])

    useEffect(() => {
        onRefresh()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (forumPostsPage && !location.search) setPage(forumPostsPage)
    }, [])

    useEffect(() => {
        setForumPostsPage(page)
    }, [page])

    const generateForumPostsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as ForumPostSearch[]
        for (let i = 0; i < visible.length; i++) {
            const forumPost = visible[i]
            if (forumPost.fake) continue
            if (!functions.post.isR18(ratingType)) if (forumPost.r18) continue
            jsx.push(<ForumPostRow forumPost={forumPost} onDelete={onRefresh} onEdit={onRefresh}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
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
                <div className="items">
                    <span className="items-heading">{`${functions.util.toProperCase(username)}'s ${i18n.user.forumPosts}`}</span>
                    <div className="items-container">
                        {generateForumPostsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ForumPostsPage