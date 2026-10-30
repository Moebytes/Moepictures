/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import {useGetUnverifiedNotesInfiniteQuery, useGetUnverifiedNotesPageQuery, useInvalidateNotes} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import ApproveIcon from "../../assets/svg/approve.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import functions from "../../functions/Functions"
import PageControls from "../../components/site/PageControls"
import {UnverifiedNoteSearch, Note} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModNotes: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const navigate = useNavigate()
    const invalidateNotes = useInvalidateNotes()

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useGetUnverifiedNotesInfiniteQuery(
        {refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetUnverifiedNotesPageQuery(
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
    
    const totalCount = Number(items[0]?.noteCount ?? items.length)
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

    const approveNote = async (postID: string, originalID: string, order: number, data: Note[], username: string) => {
        await functions.http.post("/api/note/approve", {postID, originalID, order, data, username}, session, setSessionFlag)
        invalidateNotes()
        await onRefresh()
    }

    const rejectNote = async (postID: string, originalID: string, order: number, data: Note[], username: string) => {
        await functions.http.post("/api/note/reject", {postID, originalID, order, data, username}, session, setSessionFlag)
        invalidateNotes()
        await onRefresh()
    }

    const noteDataJSX = (unverifiedNote: UnverifiedNoteSearch) => {
        let noteChanges = unverifiedNote.addedEntries?.length || unverifiedNote.removedEntries?.length
        if (!noteChanges) return null

        const replaceKey = (i: string) => i.replace("Character", functions.util.toProperCase(i18n.tag.character))
        const addedJSX = unverifiedNote.addedEntries.map((i: string) => <span className="tag-add">+{replaceKey(i)}</span>)
        const removedJSX = unverifiedNote.removedEntries.map((i: string) => <span className="tag-remove">-{replaceKey(i)}</span>)

        if (![...addedJSX, ...removedJSX].length) return null
        return [...addedJSX, ...removedJSX]
    }

    const generateNotesJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as UnverifiedNoteSearch[]
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
            const noteGroup = visible[i]
            if (!noteGroup) break
            if (noteGroup.fake) continue
            const imgClick = (event?: React.MouseEvent, middle?: boolean) => {
                if (middle) return window.open(`/unverified/post/${noteGroup.postID}`, "_blank")
                navigate(`/unverified/post/${noteGroup.postID}`)
            }
            const img = functions.link.getUnverifiedThumbnailLink(noteGroup.post.images[0], "tiny", session, mobile)
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.file.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${noteGroup.updater}`)}>{i18n.sidebar.updater}: {functions.util.toProperCase(noteGroup?.updater) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {noteGroup.reason}</span>
                        {noteDataJSX(noteGroup)}
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectNote(noteGroup.postID, noteGroup.originalID, noteGroup.order, noteGroup.notes, noteGroup.updater)}>
                            <RejectIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approveNote(noteGroup.postID, noteGroup.originalID, noteGroup.order, noteGroup.notes, noteGroup.updater)}>
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
            {generateNotesJSX()}
        </div>
    )
}

export default ModNotes