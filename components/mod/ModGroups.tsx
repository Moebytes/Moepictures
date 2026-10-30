/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import {useGetGroupRequestsInfiniteQuery, useGetGroupRequestsPageQuery, useInvalidateGroup} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import TinyImage from "../image/TinyImage"
import ApproveIcon from "../../assets/svg/approve.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import functions from "../../functions/Functions"
import PageControls from "../../components/site/PageControls"
import {GroupPosts, GroupRequest} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModGroups: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [groups, setGroups] = useState([] as GroupPosts[])
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const navigate = useNavigate()
    const invalidateGroup = useInvalidateGroup()

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useGetGroupRequestsInfiniteQuery(
        {refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetGroupRequestsPageQuery(
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
        const updateOriginals = async () => {
            const groups = await functions.http.get("/api/groups/list", {slugs: visibleItems.map((r) => r.slug)}, session, setSessionFlag, true)
            setGroups(groups)
        }
        updateOriginals()
    }, [visibleItems])

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

    const addGroup = async (username: string, name: string, slug: string, requestID: string, postIDs: string[]) => {
        await functions.http.post("/api/group", {username, postIDs, name, remap: true}, session, setSessionFlag)
        invalidateGroup(name)
        await functions.http.post("/api/group/request/fulfill", {username, slug, requestID, accepted: true}, session, setSessionFlag)
        invalidateGroup(slug)
        await refreshItems()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, slug: string, requestID: string) => {
        await functions.http.post("/api/group/request/fulfill", {username, slug, requestID, accepted: false}, session, setSessionFlag)
        invalidateGroup(slug)
        await refreshItems()
        setUpdateVisibleRequestFlag(true)
    }

    const openPost = (postID: string, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    const postDiff = (addedPosts: string[], removedPosts: string[]) => {
        const addedPostsJSX = addedPosts.map((postID: string) => <span className="tag-add-clickable" onClick={(event) => openPost(postID, event)}>+{postID}</span>)
        const removedPostsJSX = removedPosts.map((postID: string) => <span className="tag-remove-clickable" onClick={(event) => openPost(postID, event)}>-{postID}</span>)
        if (![...addedPostsJSX, ...removedPostsJSX].length) return null
        return [...addedPostsJSX, ...removedPostsJSX]
    }

    const calcDifference = (request: GroupRequest) => {
        let oldGroup = groups.find((g) => g.slug === request.slug)
        let oldPosts = oldGroup?.posts.map((p) => p.postID) ?? []
        let newPosts = request.posts.map((p) => p.postID)

        const addedPosts = newPosts.filter((id) => !oldPosts.includes(id))
        const removedPosts = oldPosts.filter((id) => !newPosts.includes(id))

        return {addedPosts, removedPosts}
    }

    const generateGroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as GroupRequest[]
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
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
                functions.post.openPost(request.posts[0], event, navigate, session, setSessionFlag)
            }
            const groupClick = (event: React.MouseEvent, middle?: boolean) => {
                if (!request.exists) return
                if (middle) return window.open(`/group/${request.slug}`, "_blank")
                navigate(`/group/${request.slug}`)
            }
            const {addedPosts, removedPosts} = calcDifference(request)
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        <TinyImage className="historyrow-img" post={request.posts[0]} onClick={imgClick} height={mobile ? 70 : 110}/>
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        <span className="mod-post-link" onClick={groupClick} onAuxClick={(event) => groupClick(event, true)}>{i18n.labels.groupName}: {request.name}</span>
                        <span className="mod-post-text"><span className="mod-post-text">{i18n.sort.posts}: </span>{postDiff(addedPosts, removedPosts)}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.slug, request.requestID)}>
                            <RejectIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => addGroup(request.username, request.name, request.slug, request.requestID, request.postIDs)}>
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
            {generateGroupsJSX()}
        </div>
    )
}

export default ModGroups