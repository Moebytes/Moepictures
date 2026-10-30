/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useReducer, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import {useGetTagEditsInfiniteQuery, useGetTagEditsPageQuery, useInvalidateTag} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import ApproveIcon from "../../assets/svg/approve.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import TagDiffIcon from "../../assets/svg/tagdiff.svg"
import functions from "../../functions/Functions"
import PageControls from "../../components/site/PageControls"
import {TagEditRequest, Tag} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModTagEdits: React.FunctionComponent = (props) => {
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
    const [oldTags, setOldTags] = useState(new Map<string, Tag>())
    const [showOldTags, setShowOldTags] = useState([] as boolean[])
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const navigate = useNavigate()
    const invalidateTag = useInvalidateTag()

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useGetTagEditsInfiniteQuery(
        {refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetTagEditsPageQuery(
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
            const tags = await functions.http.get("/api/tag/list", {tags: visibleItems.map((r) => r.tag)}, session, setSessionFlag, true)
            for (const tag of tags) {
                oldTags.set(tag.tag, tag)
            }
            forceUpdate()
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

    const editTag = async (request: TagEditRequest) => {
        let bytes = null as number[] | ["delete"] | null
        if (request.image) {
            if (request.image === "delete") {
                bytes = ["delete"]
            } else {
                const parts = request.image.split("/")
                const link = `${window.location.protocol}//${window.location.host}/unverified/${parts[0]}/${encodeURIComponent(parts[1])}`
                const arrayBuffer = await functions.http.getBuffer(link)
                bytes = Object.values(new Uint8Array(arrayBuffer))
            }
        }
        await functions.http.put("/api/tag/edit", {...request, tag: request.tag, key: request.key, image: bytes!, featuredPost: request.featuredPost?.postID, r18: request.r18!}, session, setSessionFlag)
        invalidateTag(request.tag)
        await functions.http.post("/api/tag/edit/request/fulfill", {username: request.username, tag: request.tag, image: request.image, accepted: true}, session, setSessionFlag)
        invalidateTag(request.tag)
        await refreshItems()
    }

    const rejectRequest = async (username: string, tag: string, image: string) => {
        await functions.http.post("/api/tag/edit/request/fulfill", {username, tag, image, accepted: false}, session, setSessionFlag)
        invalidateTag(tag)
        await refreshItems()
    }

    const diffJSX = (oldTag: Tag, newTag: TagEditRequest, showOldTag: boolean) => {
        let jsx = [] as React.ReactElement[]
        let changes = newTag.changes || {}
        const openTag = (event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/tag/${encodeURIComponent(newTag.tag)}`, "_blank")
            } else {
                navigate(`/tag/${encodeURIComponent(newTag.tag)}`)
            }
        }
        if (changes.tag) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.labels.oldTag}: {oldTag.tag}</span>)
            } else {
                jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.labels.newTag}: {newTag.key}</span>)
            }
        } else {
            jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.tag.tag}: {newTag.key}</span>)
        }
        if (changes.type) {
            if (showOldTag && oldTag) {
                jsx.push(<span className={`mod-post-text ${functions.tag.getTagColor(oldTag)}`}>{i18n.labels.oldCategory}: {oldTag.type}</span>)
            } else {
                jsx.push(<span className={`mod-post-text ${functions.tag.getTagColor(newTag)}`}>{i18n.labels.newCategory}: {newTag.type}</span>)
            }
        }
        if (changes.description) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldDescription}: {oldTag.description || i18n.labels.noDesc}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newDescription}: {newTag.description || i18n.labels.noDesc}</span>)
            }
        }
        if (changes.aliases) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldAliases}: {oldTag.aliases?.[0] ? oldTag.aliases.map((a) => a?.alias).join(", ") : i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newAliases}: {newTag.aliases?.[0] ? newTag.aliases.join(", ") : i18n.labels.none}</span>)
            }
        }
        if (changes.implications) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldImplications}: {oldTag.implications?.[0] ? oldTag.implications.map((i) => i?.implication).join(", ") : i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newImplications}: {newTag.implications?.[0] ? newTag.implications.join(", ") : i18n.labels.none}</span>)
            }
        }
        if (changes.pixivTags) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldPixivTags}: {oldTag.pixivTags?.[0] ? oldTag.pixivTags.join(", ") : i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newPixivTags}: {newTag.pixivTags?.[0] ? newTag.pixivTags.join(", ") : i18n.labels.none}</span>)
            }
        }
        if (changes.danbooruTag) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldDanbooruTag}: {oldTag.danbooruTag ?? i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newDanbooruTag}: {newTag.danbooruTag ?? i18n.labels.none}</span>)
            }
        }
        if (changes.website) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.website!, "_blank")}>{i18n.labels.oldWebsite}: {oldTag.website || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.website!, "_blank")}>{i18n.labels.newWebsite}: {newTag.website}</span>)
            }
        }
        if (changes.social) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.social!, "_blank")}>{i18n.labels.oldSocial}: {oldTag.social || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.social!, "_blank")}>{i18n.labels.newSocial}: {newTag.social}</span>)
            }
        }
        if (changes.twitter) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.twitter!, "_blank")}>{i18n.labels.oldTwitter}: {oldTag.twitter || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.twitter!, "_blank")}>{i18n.labels.newTwitter}: {newTag.twitter}</span>)
            }
        }
        if (changes.fandom) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.fandom!, "_blank")}>{i18n.labels.oldFandom}: {oldTag.fandom || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.fandom!, "_blank")}>{i18n.labels.newFandom}: {newTag.fandom}</span>)
            }
        }
        if (changes.wikipedia) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.wikipedia!, "_blank")}>{i18n.labels.oldWikipedia}: {oldTag.wikipedia || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.wikipedia!, "_blank")}>{i18n.labels.newWikipedia}: {newTag.wikipedia}</span>)
            }
        }
        if (changes.featuredPost) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldFeatured}: {oldTag.featuredPost?.postID}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newFeatured}: {newTag.featuredPost?.postID}</span>)
            }
        }
        if (changes.r18) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldR18}: {oldTag.r18 ? i18n.buttons.yes : i18n.buttons.no}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newR18}: {newTag.r18 ? i18n.buttons.yes : i18n.buttons.no}</span>)
            }
        }
        return jsx
    }

    const generateTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as TagEditRequest[]
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
            const oldTag = oldTags.get(request.tag)
            const changeOldTag = () => {
                const value = showOldTags[i] || false 
                showOldTags[i] = !value 
                setShowOldTags(showOldTags)
                forceUpdate()
            }
            let parts = request.image?.split("/") ?? null
            if (request.image === "delete") parts = null
            const img = parts ? `${window.location.protocol}//${window.location.host}/unverified/${parts[0]}/${encodeURIComponent(parts[1])}` : ""
            const oldImg = oldTag ? functions.link.getTagLink(oldTag) : ""
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    {showOldTags[i] && oldTag ? <>
                    {oldImg ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={oldImg}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldTag, request, showOldTags[i])}
                    </div>
                    </> : <>
                    {img ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldTag!, request, showOldTags[i])}
                    </div> </>}
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => changeOldTag()}>
                            <TagDiffIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{showOldTags[i] ? i18n.buttons.new : i18n.buttons.old}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag, request.image!)}>
                            <RejectIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => editTag(request)}>
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
            {generateTagsJSX()}
        </div>
    )
}

export default ModTagEdits