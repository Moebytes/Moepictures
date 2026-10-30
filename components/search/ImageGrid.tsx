/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState, useEffectEvent, useMemo} from "react"
import {getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useLayoutSelector, useSearchSelector, useActiveSelector, useFlagActions,
useInteractionActions, useCacheActions, useFlagSelector, useActiveActions,
useMiscDialogActions, useSessionSelector, useSessionActions, usePageActions} from "../../store"
import {useSearchPostsInfiniteQuery, useSearchPostsPageQuery} from "../../api"
import {useLocation, useNavigate} from "react-router-dom"
import {TrackablePromise} from "../../structures/TrackablePromise"
import GridImage from "../image/GridImage"
import GridAnimation from "../image/GridAnimation"
import GridVideo from "../image/GridVideo"
import GridModel from "../image/GridModel"
import GridSong from "../image/GridSong"
import GridLive2D from "../image/GridLive2D"
import noresults from "../../assets/images/noresults.png"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import PageControls from "../../components/site/PageControls"
import LoadingSpinner from "./LoadingSpinner"
import {PostSearch} from "../../types/Types"
import "./styles/imagegrid.less"

interface Ref {
    shouldWait: () => Promise<boolean>
    load: () => Promise<void>
    update: () => Promise<void>
}

interface Props {
    imagesLoaded: boolean
    setImagesLoaded: (value: boolean) => void
}

let interval = null as any
let reloadTimer = null as any
let reloadedPost = false
let skipRender = false
let limit = 100

let initialResultLoad = typeof window !== "undefined" &&
    window.sessionStorage.getItem("initialResultLoad") === "true"

const setInitialResultLoad = (setLoaded: (value: boolean) => void) => {
    initialResultLoad = true
    if (typeof window !== "undefined") window.sessionStorage.setItem("initialResultLoad", "true")
    setLoaded(true)
}

const ImageGrid: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile, hideSidebar} = useLayoutSelector()
    const {search, searchFlag, scroll, imageType, ratingType, styleType, sortType, sortReverse, sizeType, 
    pageMultiplier, autoSearch, showChildren, favSearch} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {setEnableDrag} = useInteractionActions()
    const {setPosts, setSearchState, setNavigationPosts, setVisiblePosts} = useCacheActions()
    const {settingsLoaded} = useActiveSelector()
    const {setSidebarText, setActionBanner} = useActiveActions()
    const {setPage: setPostPage} = usePageActions()
    const {randomFlag, imageSearchFlag, reloadPostFlag, saveSearchFlag} = useFlagSelector()
    const {setRandomFlag, setImageSearchFlag, setPostAmount, setHeaderFlag, setSaveSearchFlag} = useFlagActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const location = useLocation()
    const navigate = useNavigate()
    const query = new URLSearchParams(location.search).get("query") ?? ""
    const page = getPageNumber(location.search)
    const restoredSearch = useRef(location.state?.restoreSearch).current
    const restoredPosts = useRef<PostSearch[]>(location.state?.restorePosts ?? []).current
    const [restoreActive, setRestoreActive] = useState(Boolean(restoredSearch))
    const [noResults, setNoResults] = useState(false)
    const [afterFirstLoad, setAfterFirstLoad] = useState(false)
    const [initialResultsLoaded, setInitialResultsLoaded] = useState(initialResultLoad)
    const [isRandomSearch, setIsRandomSearch] = useState(restoredSearch?.mode === "random")
    const [postsRef, setPostsRef] = useState([] as React.RefObject<Ref | null>[])
    const [reupdateFlag, setReupdateFlag] = useState(false)
    const [removeSaveSearchFlag, setRemoveSaveSearchFlag] = useState(false)
    const [refreshKey, setRefreshKey] = useState(restoredSearch?.refreshKey ?? 0)
    const [overridePosts, setOverridePosts] = useState<PostSearch[] | null>(restoredSearch?.mode === "image" ? restoredPosts : null)
    const [randomResults, setRandomResults] = useState<PostSearch[]>(restoredSearch?.mode === "random" ? restoredPosts : [])
    const [scrollOffset, setScrollOffset] = useState(restoredSearch?.offset ?? 0)
    const [previousPosts, setPreviousPosts] = useState<PostSearch[]>([])
    const [totalCount, setTotalCount] = useState(Number(restoredSearch?.totalCount ?? 0))
    const randomLoading = useRef(false)
    const randomPage = useRef(page)
    const restoreInteraction = useRef(false)
    const previousQuery = useRef(query)
    const filtersLoaded = useRef(false)
    const filtersRef = useRef(JSON.stringify([imageType, ratingType, styleType, sortType, sortReverse, showChildren, favSearch]))
    const visiblePromisesRef = useRef<TrackablePromise<void>[]>([])
    const imagePromises = useRef(new Map<string, TrackablePromise<void>>())
    const loadingRef = useRef(true)
    const scrollRestored = useRef(false)
    const restoredSearchData = restoredSearch?.preparedQuery !== undefined ? 
        {query: restoredSearch.query, value: restoredSearch.preparedQuery} : null
    const [preparedSearch, setPreparedSearch] = useState<{query: string, value: string} | null>(restoredSearchData)
    const preparedQuery = preparedSearch?.query === query ? preparedSearch.value : null
    const [pendingSearch, setPendingSearch] = useState<string | null>(null)

    const setPage = (value: number) => {
        const params = new URLSearchParams(location.search)
        if (value > 1) params.set("page", String(value))
        else params.delete("page")
        const search = params.toString() ? `?${params}` : ""
        if (search !== location.search) navigate(`${location.pathname}${search}`, {state: location.state})
    }

    const getPageAmount = () => {
        let loadAmount = 36
        if (sizeType === "tiny") loadAmount = 36
        if (sizeType === "small") loadAmount = 21
        if (sizeType === "medium") loadAmount = 15
        if (sizeType === "large") loadAmount = 12
        if (sizeType === "massive") loadAmount = 6

        let multiplier = pageMultiplier
        if (typeof window !== "undefined") {
            // We need to access the multiplier early
            let savedMultiplier = Number(localStorage.getItem("pageMultiplier"))
            if (Number.isSafeInteger(savedMultiplier) && savedMultiplier > 0) multiplier = savedMultiplier
        }
        return loadAmount * Math.max(1, multiplier)
    }

    const getLoadAmount = () => {
        const loadAmount = mobile ? functions.render.getImagesPerRowMobile(sizeType) 
            : functions.render.getImagesPerRow(sizeType)
        return loadAmount * 5
    }

    const pageAmount = scroll ? getLoadAmount() : getPageAmount()

    const batchSize = Math.max(pageAmount, Math.floor(limit / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const canRestore = restoreActive && restoredSearch?.mode === "search" && 
        restoredSearch.query === query && (scroll || restoredSearch.offset === batchOffset)
    const restoring = restoreActive && restoredSearch?.query === query &&
        (canRestore || Boolean(overridePosts) || isRandomSearch)

    const saveSearchSkip = () => {
        if (saveSearchFlag) {
            if (removeSaveSearchFlag) {
                setSaveSearchFlag(false)
                setRemoveSaveSearchFlag(false)
            } else {
                setRemoveSaveSearchFlag(true)
            }
        }
    }

    useEffect(() => {
        if (restoring || (restoredSearch && preparedSearch?.query === query)) return
        let active = true
        setPreparedSearch(null)
        const prepareQuery = async () => {
            let value = query
            if (value.includes(" ") && !saveSearchFlag) {
                value = await functions.native.parseSpaceEnabledSearch(value, session, setSessionFlag)
            }
            if (!active) return
            if (value.startsWith("history:") && (!session.username || !permissions.isPremium(session))) {
                if (!session.username) {
                    setActionBanner("login-required")
                } else {
                    setPremiumRequired(true)
                }
                setNoResults(true)
                setAfterFirstLoad(true)
                setInitialResultLoad(setInitialResultsLoaded)
                return
            }
            setPreparedSearch({query, value})
        }
        prepareQuery()
        return () => {
            active = false
        }
    }, [query, session.username, session.role, saveSearchFlag, restoring])

    useEffect(() => {
        if (!searchFlag) setSearch(query)
    }, [query])

    useEffect(() => {
        if (previousQuery.current === query) return
        previousQuery.current = query
        setRestoreActive(false)
        setPreviousPosts([])
        setScrollOffset(0)
        setOverridePosts(null)
        setRandomResults([])
        setIsRandomSearch(false)
    }, [query])

    useEffect(() => {
        setPendingSearch(null)
    }, [location.search])

    const queryChanging = previousQuery.current !== query
    const submitting = pendingSearch !== null && pendingSearch !== location.search

    const infiniteQuery = useSearchPostsInfiniteQuery(
        {query: preparedQuery ?? "", type: imageType, rating: ratingType, style: styleType,
        sort: functions.validation.parseSort(sortType, sortReverse),
        showChildren, favoriteMode: favSearch, refreshKey, offset: previousPosts.length ? scrollOffset : 0},
        {skip: searchFlag || submitting || restoring || queryChanging || !scroll || 
        Boolean(overridePosts) || isRandomSearch || (!settingsLoaded || preparedQuery === null),
        initialPageParam: {offset: previousPosts.length ? scrollOffset : (page - 1) * pageAmount, limit}}
    )

    const pageQuery = useSearchPostsPageQuery(
        {query: preparedQuery ?? "", type: imageType, rating: ratingType, style: styleType,
        sort: functions.validation.parseSort(sortType, sortReverse),
        showChildren, favoriteMode: favSearch,
        offset: batchOffset, limit: batchSize, refreshKey},
        {skip: searchFlag || submitting || restoring || queryChanging || scroll || 
        Boolean(overridePosts) || isRandomSearch || (!settingsLoaded || preparedQuery === null)}
    )

    const items = useMemo(() => {
        let result = scroll ? infiniteQuery.currentData?.pages.flat() : pageQuery.currentData
        if (scroll && previousPosts.length) result = [...previousPosts, ...(result ?? [])]
        if (canRestore) result = restoredPosts
        if (isRandomSearch) result = randomResults
        if (overridePosts) result = overridePosts
        return result ?? []
    }, [scroll, infiniteQuery.currentData, pageQuery.currentData, canRestore, overridePosts, 
        isRandomSearch, randomResults, previousPosts])

    const visibleItems = useMemo(() => {
        if (scroll) return items
        if (overridePosts) return items.slice((page - 1) * pageAmount, page * pageAmount)
        if (isRandomSearch) return items.slice(0, pageAmount)
        return items.slice(pageOffset, pageOffset + pageAmount)
    }, [items, page, scroll, overridePosts, isRandomSearch, pageOffset, pageAmount])

    const resultsReady = Boolean(overridePosts) || isRandomSearch || canRestore ||
        Boolean(scroll ? infiniteQuery.currentData : pageQuery.currentData)

    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))
    const isUpdating = !restoring && (scroll ? infiniteQuery.isFetching : pageQuery.isFetching)
    const ended = !infiniteQuery.hasNextPage

    useEffect(() => {
        if (!resultsReady) return
        setTotalCount(overridePosts ? overridePosts.length : Number(items[0]?.postCount ?? items.length))
    }, [items, overridePosts, resultsReady])

    const loadMore = useEffectEvent(() => {
        if (restoring && !restoreInteraction.current) return
        if (overridePosts) return
        if (canRestore && !isRandomSearch) {
            if (restoredSearch.offset + restoredPosts.length >= totalCount) return
            setPreviousPosts(restoredPosts)
            setScrollOffset(restoredSearch.offset + restoredPosts.length)
            setRestoreActive(false)
            return
        }
        if (isRandomSearch) return randomPosts(undefined, false)
        if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) infiniteQuery.fetchNextPage()
    })

    useEffect(() => {
        const onInteraction = () => {restoreInteraction.current = true}
        window.addEventListener("wheel", onInteraction, {passive: true})
        window.addEventListener("touchmove", onInteraction, {passive: true})
        window.addEventListener("keydown", onInteraction)
        return () => {
            window.removeEventListener("wheel", onInteraction)
            window.removeEventListener("touchmove", onInteraction)
            window.removeEventListener("keydown", onInteraction)
        }
    }, [])

    useEffect(() => {
        if (!scroll) return
        const onScroll = () => {
            if (functions.dom.scrolledToBottom()) loadMore()
        }
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [scroll])

    const onRefresh = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : query
        const params = new URLSearchParams(location.search)
        if (reset || nextQuery !== query) params.delete("page")
        if (nextQuery.trim()) params.set("query", nextQuery)
        else params.delete("query")
        const nextSearch = params.toString() ? `?${params}` : ""
        if (nextSearch !== location.search) {
            setPendingSearch(nextSearch)
            navigate(`${location.pathname}${nextSearch}`, {state: {}})
        }
        setRestoreActive(false)
        setPreviousPosts([])
        setScrollOffset(0)
        setOverridePosts(null)
        setIsRandomSearch(false)
        setRandomResults([])
        setRefreshKey((prev) => prev + 1)
    }

    useEffect(() => {
        if (!resultsReady || isUpdating) return
        setInitialResultLoad(setInitialResultsLoaded)
        setHeaderFlag(true)
        setNoResults(visibleItems.length === 0)
        setAfterFirstLoad(true)
    }, [visibleItems, isUpdating, resultsReady])

    const randomPosts = async (query?: string, reset = true) => {
        if (randomLoading.current) return
        randomLoading.current = true
        setRandomFlag(false)
        setOverridePosts(null)
        try {
            const result = await functions.http.get("/api/search/posts", {query: query ?? preparedQuery ?? "",
                type: imageType, rating: ratingType, style: styleType, sort: "random", showChildren,
                limit: scroll ? limit : pageAmount, favoriteMode: favSearch}, session, setSessionFlag, true)
            setIsRandomSearch(true)
            setRandomResults((prev) => reset || !scroll ? result : [...prev, ...result])
        } finally {
            randomLoading.current = false
        }
    }

    useEffect(() => {
        if (randomPage.current === page) return
        randomPage.current = page
        if (isRandomSearch && !scroll) randomPosts()
    }, [page])

    useEffect(() => {
        if (!resultsReady) return
        setPosts(items)
        setPostPage(page)
        setSearchState({page, query, preparedQuery: preparedQuery ?? undefined, refreshKey,
            offset: overridePosts ? 0 : scroll && previousPosts.length ? restoredSearch.offset :
                scroll || isRandomSearch ? (page - 1) * pageAmount : batchOffset,
            totalCount: overridePosts ? overridePosts.length : Number(items[0]?.postCount ?? items.length),
            mode: overridePosts ? "image" : isRandomSearch ? "random" : "search"})
    }, [items, page, query, scroll, refreshKey, resultsReady, batchOffset, pageAmount, overridePosts, isRandomSearch])

    useEffect(() => {
        if (scrollRestored.current || !restoreActive || !resultsReady || !props.imagesLoaded) return
        const frame = requestAnimationFrame(() => {
            window.scrollTo(0, location.state?.restoreScrollY ?? 0)
            scrollRestored.current = true
        })
        return () => cancelAnimationFrame(frame)
    }, [restoreActive, resultsReady, props.imagesLoaded])

    useEffect(() => {
        const onDOMLoaded = async () => {
            const state = location.state
            if (state?.restoreSearch) return

            reloadTimer = setTimeout(() => {
                const img = document.querySelector(".image")
                if (!img) onRefresh(query)
            }, 3000)
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            clearTimeout(reloadTimer)
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        window.clearInterval(interval)
        const searchLoop = async () => {
            if (!autoSearch) return
            await randomPosts(query)
        }
        if (autoSearch && !restoring) {
            interval = window.setInterval(searchLoop, Math.floor(Number(session.autosearchInterval || 3000)))
        }
        return () => {
            window.clearInterval(interval)
        }
    }, [session, autoSearch, query, restoring])

    useEffect(() => {
        if (searchFlag) {
            setIsRandomSearch(false)
            setSearchFlag(false)
            saveSearchSkip()
            onRefresh(search, true)
        }
    }, [search, searchFlag])

    useEffect(() => {
        if (!settingsLoaded) return
        const filters = JSON.stringify([imageType, ratingType, styleType, sortType, sortReverse, showChildren, favSearch])
        const filtersChanged = filtersRef.current !== filters
        filtersRef.current = filters
        if (!filtersLoaded.current) {
            filtersLoaded.current = true
            return
        }
        if (!filtersChanged) return

        if (reloadedPost) {
            setTimeout(() => {
                reloadedPost = false
            }, 500)
            //return
        }
        onRefresh(query, filtersLoaded.current)
        filtersLoaded.current = true
    }, [settingsLoaded, imageType, ratingType, styleType, 
        sortType, sortReverse, showChildren, favSearch])

    useEffect(() => {
        if (reloadPostFlag) reloadedPost = true
    }, [reloadPostFlag])

    useEffect(() => {
        if (randomFlag) randomPosts(search)
    }, [session, randomFlag, search])

    useEffect(() => {
        if (imageSearchFlag) {
            reloadedPost = true
            setOverridePosts(imageSearchFlag as PostSearch[])
            setIsRandomSearch(false)
            setPage(1)
            setImageSearchFlag(null)
        }
    }, [imageSearchFlag])

    useEffect(() => {
        if (!resultsReady) return
        setSidebarText(`${totalCount === 1 ? `1 ${i18n.sidebar.result}` : `${totalCount} ${i18n.sidebar.results}`}`)
        setNavigationPosts(items)
    }, [items, totalCount, i18n, resultsReady])

    useEffect(() => {
        if (!resultsReady) return
        setPostAmount(visibleItems.length)
        setVisiblePosts(visibleItems)
    }, [visibleItems, resultsReady])

    useEffect(() => {
        if (items?.length) {
            const newPostsRef = items.map(() => React.createRef<Ref>())
            setPostsRef(newPostsRef)
        }
    }, [items])

    useEffect(() => {
        let cleanup = null as (() => void) | Promise<void> | void | null
        const loadImages = async () => {
            for (let i = 0; i < postsRef.length; i++) {
                if (!postsRef[i].current) continue
                const shouldWait = await postsRef[i].current?.shouldWait?.()
                if (shouldWait) {
                    cleanup = await postsRef[i].current?.load?.()
                } else {
                    cleanup = postsRef[i].current?.load?.()
                }
            }
        }
        loadImages()
        return () => {
            if (cleanup instanceof Function) cleanup()
        }
    }, [visibleItems, postsRef, session])

    useEffect(() => {
        let cleanup = null as (() => void) | Promise<void> | void | null
        if (reupdateFlag) {
            const updateImages = async () => {
                for (let i = 0; i < postsRef.length; i++) {
                    if (!postsRef[i].current) continue
                    const shouldWait = await postsRef[i].current?.shouldWait?.()
                    if (shouldWait) {
                        cleanup = await postsRef[i].current?.update?.()
                    } else {
                        cleanup = postsRef[i].current?.update?.()
                    }
                }
            }
            updateImages()
            setReupdateFlag(false)
        }
        return () => {
            if (cleanup instanceof Function) cleanup()
        }
    }, [reupdateFlag, session])

    useEffect(() => {
        const populateCache = () => {
            for (const post of items) {
                const image = post.images?.[0]
                if (!image) continue
                const thumbnail = functions.link.getThumbnailLink(image, sizeType, session, mobile)
                functions.crypto.decryptThumb(thumbnail, session, `${thumbnail}-${sizeType}`)
            }
        }
        populateCache()
    }, [items, sizeType, session, mobile])

    useEffect(() => {
        if (scroll) return props.setImagesLoaded(true)
        if (!visiblePromisesRef.current.length) return
        if (skipRender) {
            skipRender = false
            return
        }
        props.setImagesLoaded(false)
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
            if (active) props.setImagesLoaded(true)
        }
        poll()
        return () => {active = false}
    }, [scroll, visibleItems, page])

    const generateImagesJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as PostSearch[]

        const visibleIDs = new Set(visible.map((post) => post.postID))
        for (const id of imagePromises.current.keys()) {
            if (!visibleIDs.has(id)) imagePromises.current.delete(id)
        }
        visiblePromisesRef.current.splice(0, visiblePromisesRef.current.length)
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i]
            if (post.fake) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(post.rating)) continue
            const image = post.images?.[0]
            if (!image) continue

            let promise = imagePromises.current.get(post.postID)
            if (!promise) {
                promise = new TrackablePromise<void>()
                imagePromises.current.set(post.postID, promise)
            }
            visiblePromisesRef.current.push(promise)

            const thumbnail = functions.link.getThumbnailLink(image, sizeType, session, mobile)
            const liveThumbnail = functions.link.getThumbnailLink(image, sizeType, session, mobile, true)
            const original = functions.link.getImageLink(image, session.upscaledImages)
            let img = functions.cache.getThumbCache(`${thumbnail}-${sizeType}`)
            let cached = img ? true : false
            if (!img) img = thumbnail
            if (post.type === "model") {
                jsx.push(<GridModel key={post.postID} id={post.postID} img={img} model={original} post={post} ref={postsRef[i]}
                    reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "live2d") {
                jsx.push(<GridLive2D key={post.postID} id={post.postID} img={img} live2d={original} post={post} ref={postsRef[i]}
                    reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "audio") {
                jsx.push(<GridSong key={post.postID} id={post.postID} img={img} cached={cached} audio={original} post={post}
                    ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "video") {
                jsx.push(<GridVideo key={post.postID} id={post.postID} img={img} cached={cached} video={original} live={liveThumbnail}
                    post={post} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "animation") {
                jsx.push(<GridAnimation key={post.postID} id={post.postID} img={img} cached={cached} anim={original} live={liveThumbnail}
                    post={post} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else {
                const comicPages = post.type === "comic" ? post.images.map((image) => functions.link.getImageLink(image, session.upscaledImages)) : null
                jsx.push(<GridImage key={post.postID} id={post.postID} img={img} cached={cached} original={original} live={liveThumbnail}
                    comicPages={comicPages} post={post} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            }
        }
        loadingRef.current = false
        if (!jsx.length && !noResults && (!ended || isUpdating)) {
            loadingRef.current = true
        }
        if (!jsx.length && noResults && afterFirstLoad) {
            jsx.push(
                <div className="noresults-container">
                    <img className="noresults" src={noresults}/>
                </div>
            )
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    return (
        <div className="imagegrid" onMouseEnter={() => setEnableDrag(true)}
            style={{marginTop: mobile ? "10px" : "0px", maxWidth: hideSidebar ? "" : `calc(100vw - ${functions.dom.sidebarWidth()})`}}>
            <div className="image-outer-container">
                {(!initialResultsLoaded || loadingRef.current) && <LoadingSpinner/>}
                <div className="image-container" style={{visibility: props.imagesLoaded ? "visible" : "hidden"}}>
                {generateImagesJSX()}
                </div>
            </div>
        </div>
    )
}

export default ImageGrid