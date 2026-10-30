/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import {useGetPostDeletionsInfiniteQuery, useGetPostDeletionsPageQuery, useInvalidatePost} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import TinyImage from "../image/TinyImage"
import ApproveIcon from "../../assets/svg/approve.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import functions from "../../functions/Functions"
import PageControls from "../../components/site/PageControls"
import {PostDeleteRequest} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModPostDeletions: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const navigate = useNavigate()
    const invalidatePost = useInvalidatePost()

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useGetPostDeletionsInfiniteQuery(
        {refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetPostDeletionsPageQuery(
        {offset: batchOffset, refreshKey},
        {skip: scroll}
    )

    const items = useMemo(() => {
        let result = scroll ? infiniteQuery.currentData?.pages.flat() ?? [] : pageQuery.currentData ?? []
        return result
    }, [scroll, infiniteQuery.currentData, pageQuery.currentData])

    const visibleItems = useMemo(() => {
        return scroll ? items : items.slice(pageOffset, pageOffset + pageAmount)
    }, [items, pageOffset, pageAmount, scroll])
    
    const totalCount = Number(items[0]?.requestCount ?? items.length)
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

    useEffect(() => {
        refreshItems()
    }, [modState, session])

    useEffect(() => {
        if (modPage && !location.search) setPage(modPage)
    }, [])

    useEffect(() => {
        setModPage(page)
    }, [page])

    useEffect(() => {
        if (updateVisibleRequestFlag) {
            setUpdateVisibleRequestFlag(false)
        }
    }, [visibleItems, updateVisibleRequestFlag])

    const deletePost = async (username: string, postID: string) => {
        await functions.http.delete("/api/post/delete", {postID}, session, setSessionFlag)
        invalidatePost(postID)
        await functions.http.post("/api/post/delete/request/fulfill", {username, postID, accepted: true}, session, setSessionFlag)
        invalidatePost(postID)
        await refreshItems()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, postID: string) => {
        await functions.http.post("/api/post/delete/request/fulfill", {username, postID, accepted: false}, session, setSessionFlag)
        invalidatePost(postID)
        await refreshItems()
        setUpdateVisibleRequestFlag(true)
    }

    const generatePostsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as PostDeleteRequest[]
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">{i18n.labels.noData}</span>
                    </div>
                </div>
            )
        }
        for (let i = 0; i < visible.length; i++) {
            const request = visible[i]
            if (!request) break
            if (request.fake) continue
            const imgClick = (event: React.MouseEvent) => {
                functions.post.openPost(request.post, event, navigate, session, setSessionFlag)
            }
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        <TinyImage className="historyrow-img" post={request.post} onClick={imgClick} height={mobile ? 70 : 110}/>
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.postID)}>
                            <RejectIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deletePost(request.username, request.postID)}>
                            <ApproveIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{i18n.buttons.approve}</span>
                        </div>
                    </div>
                </div>
            )
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    return (
        <div className="mod-posts">
            {generatePostsJSX()}
        </div>
    )
}

export default ModPostDeletions