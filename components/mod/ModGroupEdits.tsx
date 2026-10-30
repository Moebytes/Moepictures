/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useReducer, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import {useGetGroupEditsInfiniteQuery, useGetGroupEditsPageQuery, useInvalidateGroup} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import ApproveIcon from "../../assets/svg/approve.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import TagDiffIcon from "../../assets/svg/tagdiff.svg"
import functions from "../../functions/Functions"
import PageControls from "../../components/site/PageControls"
import {Group, GroupEditRequest} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModGroupEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [oldGroups, setOldGroups] = useState(new Map<string, Group>())
    const [showOldGroups, setShowOldGroups] = useState([] as boolean[])
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

    const infiniteQuery = useGetGroupEditsInfiniteQuery(
        {refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetGroupEditsPageQuery(
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

    const onRefresh = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)

        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    useEffect(() => {
        const updateOriginals = async () => {
            const groups = await functions.http.get("/api/groups/list", {slugs: visibleItems.map((r) => r.group)}, session, setSessionFlag, true)
            for (const group of groups) {
                oldGroups.set(group.name, group)
            }
            forceUpdate()
        }
        updateOriginals()
    }, [visibleItems])

    useEffect(() => {
        onRefresh()
    }, [modState, session])

    useEffect(() => {
        if (modPage && !location.search) setPage(modPage)
    }, [])

    useEffect(() => {
        setModPage(page)
    }, [page])

    const editGroup = async (username: string, slug: string, name: string, description: string, reason: string | null) => {
        await functions.http.put("/api/group/edit", {username, slug, name, description, reason}, session, setSessionFlag)
        invalidateGroup(slug)
        await functions.http.post("/api/group/edit/request/fulfill", {username, slug, accepted: true}, session, setSessionFlag)
        invalidateGroup(slug)
        await onRefresh()
    }

    const rejectRequest = async (username: string, slug: string) => {
        await functions.http.post("/api/group/edit/request/fulfill", {username, slug, accepted: false}, session, setSessionFlag)
        invalidateGroup(slug)
        await onRefresh()
    }

    const diffJSX = (oldGroup: Group, newGroup: GroupEditRequest, showOldGroup: boolean) => {
        let jsx = [] as React.ReactElement[]
        let changes = newGroup.changes || {}
        const openGroup = (event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/group/${newGroup.group}`, "_blank")
            } else {
                navigate(`/group/${newGroup.group}`)
            }
        }
        if (changes.name) {
            if (showOldGroup && oldGroup) {
                jsx.push(<span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>{i18n.labels.oldName}: {oldGroup.name}</span>)
            } else {
                jsx.push(<span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>{i18n.labels.newName}: {newGroup.name}</span>)
            }
        }
        if (changes.description) {
            if (showOldGroup && oldGroup) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldDescription}: {oldGroup.description || i18n.labels.noDesc}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newDescription}: {newGroup.description || i18n.labels.noDesc}</span>)
            }
        }
        return jsx
    }

    const generateGroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as GroupEditRequest[]
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
            const oldGroup = oldGroups.get(request.name)
            const changeOldGroup = () => {
                const value = showOldGroups[i] || false 
                showOldGroups[i] = !value 
                setShowOldGroups(showOldGroups)
                forceUpdate()
            }
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    {showOldGroups[i] && oldGroup ?
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldGroup, request, showOldGroups[i])}
                    </div> :
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldGroup!, request, showOldGroups[i])}
                    </div>}
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => changeOldGroup()}>
                            <TagDiffIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{showOldGroups[i] ? i18n.buttons.new : i18n.buttons.old}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.group)}>
                            <RejectIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => editGroup(request.username, request.group, request.name, request.description, request.reason)}>
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

export default ModGroupEdits