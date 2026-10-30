/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useEffectEvent, useState, useRef, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useCacheActions, useLayoutSelector, useSearchSelector, useSessionSelector, useThemeSelector,
useActiveSelector, usePageActions} from "../../store"
import {useRelatedPostsInfiniteQuery} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import {TrackablePromise} from "../../structures/TrackablePromise"
import functions from "../../functions/Functions"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import SquareIcon from "../../assets/svg/square.svg"
import SizeIcon from "../../assets/svg/size.svg"
import GridImage from "../image/GridImage"
import GridAnimation from "../image/GridAnimation"
import GridVideo from "../image/GridVideo"
import GridSong from "../image/GridSong"
import GridModel from "../image/GridModel"
import GridLive2D from "../image/GridLive2D"
import PageControls from "../../components/site/PageControls"
import {PostHistory, PostSearch, PostSearchParams} from "../../types/Types"
import "./styles/related.less"

let limit = 100
let pageAmount = 15

interface Props {
    tag: string
    post?: PostSearch | PostHistory | null
    count?: number
    fallback?: string[]
    onLoaded?: () => void
}

const Related: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {setNavigationPosts} = useCacheActions()
    const {ratingType, square, showChildren, scroll, sizeType} = useSearchSelector()
    const {setSearch, setSearchFlag, setSquare, setSizeType} = useSearchActions()
    const {session} = useSessionSelector()
    const {settingsLoaded} = useActiveSelector()
    const {setRelatedPage} = usePageActions()
    const [sizeDropdown, setSizeDropdown] = useState(false)
    const [allImagesLoaded, setAllImagesLoaded] = useState(false)
    const location = useLocation()
    const {setScroll} = useSearchActions()
    const [page, setPage] = useState(() => props.count ? getPageNumber(location.search) : 1)
    const [query, setQuery] = useState(() => props.count ? new URLSearchParams(location.search).get("query") ?? "" : "")
    const [startOffset, setStartOffset] = useState((page - 1) * pageAmount)
    const sizeRef = useRef<HTMLImageElement>(null)
    const visiblePromisesRef = useRef<TrackablePromise<void>[]>([])
    const imagePromises = useRef(new Map<string, TrackablePromise<void>>())
    const navigate = useNavigate()

    usePageURL(page, setPage, query, setQuery, Boolean(props.count))

    let rating = props.post?.rating || (functions.post.isR18(ratingType) ? ratingType : "all")

    const relatedParams: PostSearchParams = {
        type: props.post?.type || "all",
        rating: functions.post.isR18(rating) ? rating : "all",
        style: functions.post.isSketch(props.post?.style || "all") ? "all+s" : "all",
        sort: props.count ? "date" : "random",
        showChildren
    }

    const searchTags = useMemo(() => {
        return [...new Set([props.tag, ...(props.fallback ?? [])].filter(Boolean))]
    }, [props.tag, props.fallback])

    const hidden = !settingsLoaded || !searchTags.length || (!props.count && Boolean(session.username) && !session.showRelated) ||
        ((props.post?.type === "model" || props.post?.type === "live2d") && Boolean(session.liveModelPreview))
    
    const relatedQuery = useRelatedPostsInfiniteQuery(
        {...relatedParams, query: searchTags[0], fallback: searchTags.slice(1), postID: props.post?.postID},
        {skip: hidden, initialPageParam: {offset: startOffset, limit}}
    )

    const items = useMemo(() => {
        const posts = relatedQuery.currentData?.pages.flatMap((page) => page.posts) ?? []
        return [...new Map(posts.map((post) => [post.postID, post])).values()]
    }, [relatedQuery.currentData])

    const firstOffset = relatedQuery.currentData?.pageParams[0].offset ?? startOffset

    const visibleItems = useMemo(() => {
        if (scroll) return items
        const start = (page - 1) * pageAmount - firstOffset
        if (start < 0) return []
        return items.slice(start, start + pageAmount)
    }, [items, page, scroll, firstOffset])

    const firstPage = relatedQuery.currentData?.pages[0]
    const totalCount = firstPage?.totalCount ?? 0
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    const loadMore = useEffectEvent(() => {
        if (relatedQuery.hasNextPage && !relatedQuery.isFetching) relatedQuery.fetchNextPage()
    })

    useEffect(() => {
        if (!scroll) return
        const onScroll = () => {
            if (functions.dom.scrolledToBottom()) loadMore()
        }
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [scroll])

    useEffect(() => {
        if (scroll || relatedQuery.isFetching || !relatedQuery.currentData) return
        const start = (page - 1) * pageAmount
        if (start < firstOffset && relatedQuery.hasPreviousPage) {
            relatedQuery.fetchPreviousPage()
        } else if (start + pageAmount > firstOffset + items.length) {
            loadMore()
        }
    }, [scroll, page, firstOffset, items.length, relatedQuery.isFetching, relatedQuery.currentData])

    const toggleScroll = () => setScroll(!scroll)

    useEffect(() => {
        if (props.count) setRelatedPage(page)
    }, [page, props.count])

    const getSizeMargin = () => {
        const rect = sizeRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "150px"
        const raw = window.innerWidth - rect.x
        let offset = -50
        if (sizeType === "tiny") offset += -15
        if (sizeType === "small") offset += -10
        if (sizeType === "medium") offset += -5
        if (sizeType === "large") offset += -10
        if (sizeType === "massive") offset += -5
        if (props.count) offset -= 20
        return `${raw + offset}px`
    }

    const getMarginLeft = () => {
        return mobile ? 5 : 15
    }

    const getMarginBottom = () => {
        return mobile ? 10 : 30
    }

    const getSquareSize = () => {
        if (sizeType === "tiny") {
            return mobile ? 110 : 130
        } else if (sizeType === "small") {
            return mobile ? 160 : 170
        } else if (sizeType === "medium") {
            return mobile ? 160 : 220
        } else if (sizeType === "large") {
            return mobile ? 360 : 380
        } else if (sizeType === "massive") {
            return mobile ? 460 : 480
        }
    }

    const getSize = () => {
        if (square) return getSquareSize()
        if (sizeType === "tiny") {
            return mobile ? 110 : 130
        } else if (sizeType === "small") {
            return mobile ? 150 : 180
        } else if (sizeType === "medium") {
            return mobile ? 220 : 250
        } else if (sizeType === "large") {
            return mobile ? 270 : 400
        } else if (sizeType === "massive") {
            return mobile ? 400 : 500
        }
    }

    useEffect(() => {
        if (scroll) return setAllImagesLoaded(true)
        if (!visiblePromisesRef.current.length) return
        setAllImagesLoaded(false)
        let active = true
        const promises = [...visiblePromisesRef.current]
        const poll = async () => {
            const notFulfilled = () => promises.some((promise) => promise.state === "pending")
            let timer = 0
            while (active && notFulfilled()) {
                await functions.timeout(50)
                timer += 50
                if (timer >= 1000) break
            }
            await functions.timeout(100)
            if (!active) return
            setAllImagesLoaded(true)
            props.onLoaded?.()
        }
        poll()
        return () => {
            active = false
        }
    }, [scroll, visibleItems])

    const generateImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as PostSearch[]
        const visibleIDs = new Set(visible.map((post) => post.postID))
        for (const id of imagePromises.current.keys()) {
            if (!visibleIDs.has(id)) imagePromises.current.delete(id)
        }
        visiblePromisesRef.current.splice(0, visiblePromisesRef.current.length)
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i]
            if (post.fake) continue
            if (!session.username) if (post.rating !== functions.r13()) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(post.rating)) continue

            let promise = imagePromises.current.get(post.postID)
            if (!promise) {
                promise = new TrackablePromise<void>()
                imagePromises.current.set(post.postID, promise)
            }
            visiblePromisesRef.current.push(promise)

            const image = post.images[0]
            const thumb = functions.link.getThumbnailLink(image, "medium", session, mobile)
            const liveThumb = functions.link.getThumbnailLink(image, "medium", session, mobile, true)
            const images = post.images.map((image) => functions.link.getImageLink(image, session.upscaledImages))
            if (post.type === "model") {
                jsx.push(<GridModel key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} model={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "live2d") {
                jsx.push(<GridLive2D key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} live2d={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "audio") {
                jsx.push(<GridSong key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} audio={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "video") {
                jsx.push(<GridVideo key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} live={liveThumb}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} video={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "animation") {
                jsx.push(<GridAnimation key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} live={liveThumb}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} anim={images[0]} post={post} onLoad={promise.resolve}/>)
            } else {
                jsx.push(<GridImage key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} live={liveThumb}
                    comicPages={post.type === "comic" ? images : null} onLoad={promise.resolve}/>)
            }
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    const searchTag = (event: React.MouseEvent) => {
        if (!props.tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${props.tag}`, "_blank")
        } else {
            navigate("/posts")
            setSearch(props.tag)
            setSearchFlag(true)
        }
    }

    const getImages = () => {
        return visibleItems.map((post) => functions.link.getThumbnailLink(post.images[0], "tiny", session, mobile))
    }

    const click = (img: string, index: number) => {
        const post = visibleItems[index]
        navigate(`/post/${post.postID}/${post.slug}`)
        setNavigationPosts(visibleItems)
    }

    let marginLeft = mobile ? 20 : 200
    let paddingLeft = props.count ? 0 : mobile ? 20 : 40

    if (!items.length) return null

    return (
        <div className="related" style={{paddingLeft: `${paddingLeft}px`, marginBottom: "10px"}}>
            {props.count ?
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="tag-label" onClick={searchTag} onAuxClick={searchTag}>{i18n.sort.posts}
                </span><span className="tag-label-alt">{props.count}</span>
                {scroll ? 
                <ScrollIcon className="related-icon" onClick={toggleScroll}/> :
                <PagesIcon className="related-icon" onClick={toggleScroll}/>}
                <SquareIcon className="related-icon" onClick={() => setSquare(!square)}/>
                <SizeIcon className="related-icon" ref={sizeRef} onClick={() => setSizeDropdown((prev) => !prev)}/>
            </div> :
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="related-title">{i18n.post.related}</span>
                {scroll ? 
                <ScrollIcon className="related-icon" onClick={toggleScroll}/> :
                <PagesIcon className="related-icon" onClick={toggleScroll}/>}
                <SquareIcon className="related-icon" onClick={() => setSquare(!square)}/>
                <SizeIcon className="related-icon" ref={sizeRef} onClick={() => setSizeDropdown((prev) => !prev)}/>
            </div>}
            <div className="related-container" style={{visibility: allImagesLoaded ? "visible" : "hidden", width: "98%", justifyContent: items.length < 5 ? "flex-start" : "space-evenly"}}>
                {generateImagesJSX()}
                {/* <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200} unlimited={true}/> */}
            </div>
            <div className={`related-dropdown ${sizeDropdown ? "" : "hide-related-dropdown"}`} 
            style={{marginRight: getSizeMargin(), top: `50px`}} onClick={() => setSizeDropdown(false)}>
                <div className="related-dropdown-row" onClick={() => setSizeType("tiny")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.tiny}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("small")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.small}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("medium")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.medium}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("large")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.large}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("massive")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.massive}</span>
                </div>
            </div>
        </div>
    )
}

export default Related