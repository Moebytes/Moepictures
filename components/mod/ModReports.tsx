/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector, useCacheSelector} from "../../store"
import {useSearchReportsInfiniteQuery, useSearchReportsPageQuery, useInvalidateComments, useInvalidateThreads} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import favicon from "../../assets/icons/favicon.png"
import ApproveIcon from "../../assets/svg/approve.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import functions from "../../functions/Functions"
import moeText from "../../moetext/MoeText"
import PageControls from "../../components/site/PageControls"
import {Report, ThreadReply, ThreadUser, UserComment} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

interface Props {
    request: Report
    updateReports?: () => void
}

const ReportRow: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {emojis} = useCacheSelector()
    const [hover, setHover] = useState(false)
    const [asset, setAsset] = useState(null as UserComment | ThreadUser | ThreadReply | null)
    const navigate = useNavigate()
    const invalidateComments = useInvalidateComments()
    const invalidateThreads = useInvalidateThreads()

    const updateAsset = async () => {
        if (props.request.type === "comment") {
            const asset = await functions.http.get("/api/comment", {commentID: props.request.id}, session, setSessionFlag, true)
            setAsset(asset as UserComment)
        } else if (props.request.type === "thread") {
            const asset = await functions.http.get("/api/thread", {threadID: props.request.id}, session, setSessionFlag, true)
            setAsset(asset as ThreadUser)
        } else if (props.request.type === "reply") {
            const asset = await functions.http.get("/api/reply", {replyID: props.request.id}, session, setSessionFlag, true)
            setAsset(asset as ThreadReply)
        }
    }

    useEffect(() => {
        updateAsset()
    }, [session])

    const openPost = (postID: string, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    const imgClick = (event: React.MouseEvent) => {
        if (!asset) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            if (props.request.type === "comment") {
                openPost((asset as UserComment).postID, event)
            } else if (props.request.type === "thread") {
                window.open(`/thread/${(asset as ThreadUser).threadID}`, "_blank")
            } else if (props.request.type === "reply") {
                window.open(`/thread/${(asset as ThreadReply).threadID}`, "_blank")
            }
        } else {
            if (props.request.type === "comment") {
                openPost((asset as UserComment).postID, event)
            } else if (props.request.type === "thread") {
                navigate(`/thread/${(asset as ThreadUser).threadID}`)
            } else if (props.request.type === "reply") {
                navigate(`/thread/${(asset as ThreadReply).threadID}`)
            }
        }
    }

    const approveRequest = async (username: string, id: string) => {
        if (props.request.type === "comment") {
            await functions.http.delete("/api/comment/delete", {commentID: props.request.id}, session, setSessionFlag)
            invalidateComments()
            await functions.http.post("/api/comment/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: true}, session, setSessionFlag)
            invalidateComments()
        } else if (props.request.type === "thread") {
            await functions.http.delete("/api/thread/delete", {threadID: props.request.id}, session, setSessionFlag)
            invalidateThreads()
            await functions.http.post("/api/thread/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: true}, session, setSessionFlag)
            invalidateThreads()
        } else if (props.request.type === "reply") {
            if (!asset) return
            await functions.http.delete("/api/reply/delete", {threadID: (asset as ThreadReply).threadID, replyID: props.request.id}, session, setSessionFlag)
            invalidateThreads()
            await functions.http.post("/api/reply/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: true}, session, setSessionFlag)
            invalidateThreads()
        }
        props.updateReports?.()
    }

    const rejectRequest = async (username: string, id: string) => {
        if (props.request.type === "comment") {
            await functions.http.post("/api/comment/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: false}, session, setSessionFlag)
            invalidateComments()
        } else if (props.request.type === "thread") {
            await functions.http.post("/api/thread/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: false}, session, setSessionFlag)
            invalidateThreads()
        } else if (props.request.type === "reply") {
            await functions.http.post("/api/reply/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: false}, session, setSessionFlag)
            invalidateThreads()
        }
        props.updateReports?.()
    }

    let img = ""
    let username = ""
    let textType = ""
    let text = [] as React.ReactElement[]
    let id = ""
    if (asset) {
        img = asset.image ? functions.link.getFolderLink("pfp", asset.image, asset.imageHash) : favicon
        username = (asset as UserComment).username ? (asset as UserComment).username : (asset as ThreadUser).creator
        if (props.request.type === "comment") {
            textType = `${i18n.labels.comment}: `
            text = moeText.renderCommentText((asset as UserComment).comment, emojis)
            id = (asset as UserComment).postID
        } else if (props.request.type === "thread") {
            textType = `${i18n.labels.thread}: `
            text = moeText.renderReplyText((asset as ThreadUser).title, emojis)
            id = (asset as ThreadUser).threadID
        } else if (props.request.type === "reply") {
            textType = `${i18n.buttons.reply}: `
            text = moeText.renderReplyText((asset as ThreadReply).content, emojis)
            id = (asset as ThreadReply).threadID
        }
    }

    return (
        <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="mod-post-img-container">
                <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={imgClick}/>
            </div>
            <div className="mod-post-text-column">
                <span className="mod-post-link" onClick={() => navigate(`/user/${props.request.reporter}`)}>{i18n.labels.requester}: {functions.util.toProperCase(props.request?.reporter) || i18n.user.deleted}</span>
                <span className="mod-post-text">{i18n.labels.reason}: {props.request.reason}</span>
                <span className="mod-post-link" onClick={() => navigate(`/user/${username}`)}>{i18n.roles.user}: {username}</span>
                <span className="mod-post-text">{textType}{text}</span>
            </div>
            <div className="mod-post-options">
                <div className="mod-post-options-container" onClick={() => rejectRequest(username, id)}>
                    <RejectIcon className="mod-post-options-img"/>
                    <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                </div>
                <div className="mod-post-options-container" onClick={() => approveRequest(username, id)}>
                    <ApproveIcon className="mod-post-options-img"/>
                    <span className="mod-post-options-text">{i18n.buttons.approve}</span>
                </div>
            </div>
        </div>
    )
}

const ModReports: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useSearchReportsInfiniteQuery(
        {refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useSearchReportsPageQuery(
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
    
    const totalCount = Number(items[0]?.reportCount ?? items.length)
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
        onRefresh()
    }, [modState, session])

    useEffect(() => {
        if (modPage && !location.search) setPage(modPage)
    }, [])

    useEffect(() => {
        setModPage(page)
    }, [page])

    const generateTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as Report[]
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} key={0}>
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
            jsx.push(<ReportRow key={request.id} request={request} updateReports={onRefresh}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    return (
        <div className="mod-posts">
            {generateTagsJSX()}
        </div>
    )
}

export default ModReports