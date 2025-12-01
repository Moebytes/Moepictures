import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSearchActions, useSearchSelector, 
useFlagActions, useInteractionActions, useCacheActions, useCacheSelector, useFlagSelector, useActiveActions,
useMiscDialogActions, useSessionSelector, useSessionActions, usePageSelector, usePageActions} from "../../store"
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
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import "./styles/imagegrid.less"
import {PostSearch} from "../../types/Types"

interface Ref {
    shouldWait: () => Promise<boolean>
    load: () => Promise<void>
    update: () => Promise<void>
}

let interval = null as any
let reloadedPost = false
let init = true
let limit = 100

const ImageGrid: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {search, searchFlag, scroll, imageType, ratingType, styleType, sortType, sortReverse, sizeType, 
    pageMultiplier, autoSearch, showChildren, favSearch} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {setEnableDrag} = useInteractionActions()
    const {posts} = useCacheSelector()
    const {setPosts, setNavigationPosts, setVisiblePosts} = useCacheActions()
    const {setSidebarText, setActionBanner} = useActiveActions()
    const {page: postPage} = usePageSelector()
    const {setPage: setPostPage} = usePageActions()
    const {randomFlag, imageSearchFlag, reloadPostFlag, saveSearchFlag} = useFlagSelector()
    const {setRandomFlag, setImageSearchFlag, setPostAmount, setHeaderFlag, setSaveSearchFlag} = useFlagActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [loaded, setLoaded] = useState(false)
    const [noResults, setNoResults] = useState(false)
    const [isRandomSearch, setIsRandomSearch] = useState(false)
    const [postsRef, setPostsRef] = useState([] as React.RefObject<Ref | null>[])
    const [reupdateFlag, setReupdateFlag] = useState(false)
    const [initData, setInitData] = useState({searchFlag, imageType, ratingType, styleType, sortType, sortReverse})
    const [allImagesLoaded, setAllImagesLoaded] = useState(true)
    const [removeSaveSearchFlag, setRemoveSaveSearchFlag] = useState(false)
    const visiblePromisesRef = useRef<TrackablePromise<void>[]>([])
    const navigate = useNavigate()

    const getPageAmount = () => {
        let loadAmount = 36
        if (sizeType === "tiny") loadAmount = 36
        if (sizeType === "small") loadAmount = 21
        if (sizeType === "medium") loadAmount = 15
        if (sizeType === "large") loadAmount = 12
        if (sizeType === "massive") loadAmount = 6
        return loadAmount * pageMultiplier
    }

    const getLoadAmount = () => {
        const loadAmount = mobile ? functions.render.getImagesPerRowMobile(sizeType) 
            : functions.render.getImagesPerRow(sizeType)
        return loadAmount * 5
    }

    let pageAmount = scroll ? getLoadAmount() : getPageAmount()

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

    const loadInitial = async (query?: string) => {
        if (searchFlag) setSearchFlag(false)
        saveSearchSkip()
        if (!query) query = search
        if (query?.includes(" ") && !saveSearchFlag) {
            query = await functions.native.parseSpaceEnabledSearch(query, session, setSessionFlag)
        }
        let tags = query?.trim().split(/\s+/g).filter(Boolean) || []
        if (tags.length > 3) {
            if (!session.username) {
                setSearch("")
                setActionBanner("login-required")
                return []
            }
            if (!permissions.isPremium(session)) {
                setPremiumRequired("tags")
                return []
            }
        }
        if (query?.startsWith("history:")) {
            if (!session.username) {
                setSearch("")
                setActionBanner("login-required")
                return []
            }
            if (!permissions.isPremium(session)) {
                setPremiumRequired(true)
                return []
            }
        }
        setNoResults(false)
        const result = await functions.http.get("/api/search/posts", {query, type: imageType, rating: ratingType, style: styleType, 
        sort: functions.validation.parseSort(sortType, sortReverse), showChildren, limit, favoriteMode: favSearch}, session, setSessionFlag)
        setHeaderFlag(true)
        setIsRandomSearch(false)
        if (!loaded) setLoaded(true)
        if (!result.length) setNoResults(true)
        if (!search) document.title = i18n.title
        return result
    }

    const updateOffset = async (offset: number, query?: string) => {
        if (noResults) return []
        let result = [] as PostSearch[]
        if (isRandomSearch) {
            result = await functions.http.get("/api/search/posts", {type: imageType, rating: ratingType, style: styleType, 
            sort: "random", showChildren, limit, favoriteMode: favSearch, offset}, session, setSessionFlag)
        } else {
            if (!query) query = search
            if (query.includes(" ") && !saveSearchFlag) {
                query = await functions.native.parseSpaceEnabledSearch(query, session, setSessionFlag)
            }
            result = await functions.http.get("/api/search/posts", {query, type: imageType, rating: ratingType, style: styleType, 
            sort: functions.validation.parseSort(sortType, sortReverse), showChildren, limit, favoriteMode: favSearch, offset}, session, setSessionFlag)
        }
        return result
    }

    const {items, visibleItems, page, setPage, maxPage, setSearchQuery, initItems, restructureItems, totalCount, startIndex,
        setManagedPage, setManagedQuery, setManagedItems} = usePaginatedScroll({loadInitial, updateOffset, 
        pageAmount, limit, countKey: "postCount"})

    const randomPosts = async (query?: string) => {
        setRandomFlag(false)
        const result = await functions.http.get("/api/search/posts", {query, type: imageType, rating: ratingType, style: styleType, 
        sort: "random", showChildren, limit, favoriteMode: favSearch}, session, setSessionFlag)
        setIsRandomSearch(true)
        restructureItems(result)
        document.title = "Random"
    }

    useEffect(() => {
        if (postPage) setManagedPage(postPage)
        if (posts.length) setManagedItems(posts as PostSearch[])
        if (search) setManagedQuery(search)
    }, [])

    useEffect(() => {
        setPosts(items)
        setPostPage(page)
    }, [items, page])

    useEffect(() => {
        const onDOMLoaded = async () => {
            setTimeout(() => {
                if (!scrollY) {
                    const elements = Array.from(document.querySelectorAll(".sortbar-text")) as HTMLElement[]
                    const img = document.querySelector(".image")
                    if (!img && !elements?.[0]) {
                        initItems()
                    } else {
                        let counter = 0
                        for (let i = 0; i < elements.length; i++) {
                            if (elements[i]?.innerText?.toLowerCase() === "all") counter++
                            if (elements[i]?.innerText?.toLowerCase() === "random") counter++
                        }
                        if (!img && counter >= 4) randomPosts()
                    }
                }
            }, 2000)
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        window.clearInterval(interval)
        const searchLoop = async () => {
            if (!autoSearch) return
            await randomPosts(search)
        }
        if (autoSearch) {
            interval = window.setInterval(searchLoop, Math.floor(Number(session.autosearchInterval || 3000)))
        }
        return () => {
            window.clearInterval(interval)
        }
    }, [session, autoSearch, search])

    useEffect(() => {
        if (searchFlag) {
            setSearchQuery(search)
            initItems()
        }
    }, [search, searchFlag])

    useEffect(() => {
        if (reloadedPost) {
            setTimeout(() => {
                reloadedPost = false
            }, 500)
            return
        }
        const checkLoaded = () => {
            if (searchFlag !== initData.searchFlag ||
                imageType !== initData.imageType ||
                ratingType !== initData.ratingType ||
                styleType !== initData.styleType || 
                sortType !== initData.sortType ||
                sortReverse !== initData.sortReverse) {
                    if (init) {
                        return init = false
                    } else {
                        initItems()
                    }
                }
        }
        loaded ? initItems() : checkLoaded()
    }, [searchFlag, imageType, ratingType, styleType, sortType, sortReverse, 
        pageMultiplier, showChildren, favSearch, loaded])

    useEffect(() => {
        if (reloadPostFlag) reloadedPost = true
    }, [reloadPostFlag])

    useEffect(() => {
        if (randomFlag) randomPosts(search)
    }, [session, randomFlag, search])

    useEffect(() => {
        if (imageSearchFlag) {
            reloadedPost = true
            restructureItems(imageSearchFlag as PostSearch[])
            document.title = "Image Search"
            setImageSearchFlag(null)
        }
    }, [imageSearchFlag])

    useEffect(() => {
        setSidebarText(`${totalCount === 1 ? `1 ${i18n.sidebar.result}` : `${totalCount} ${i18n.sidebar.results}`}`)
        setNavigationPosts(items)
    }, [items, totalCount, i18n])

    useEffect(() => {
        setPostAmount(visibleItems.length)
        let visibleSlice = scroll ? items.slice(startIndex, visibleItems.length) 
            : items.slice(startIndex, startIndex + pageAmount)
        setVisiblePosts(visibleSlice)
    }, [items])

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
    }, [items, sizeType, pageMultiplier, session, mobile])

    useEffect(() => {
        if (scroll) return
        if (!visiblePromisesRef.current.length) return
        setAllImagesLoaded(false)
        const poll = async () => {
            const notFulfilled = () => {
                return visiblePromisesRef.current.filter((p) => p.state === "pending").length > 0
            }
            let timer = 0
            while (notFulfilled()) {
                await functions.timeout(50)
                timer += 50
                if (timer >= 1000) break
            }
            await functions.timeout(100)
            setAllImagesLoaded(true)
        }
        poll()
    }, [scroll, items, page])

    const generateImagesJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as PostSearch[]

        visiblePromisesRef.current.splice(0, visiblePromisesRef.current.length)
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i]
            if (post.fake) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(post.rating)) continue
            const image = post.images?.[0]
            if (!image) continue

            const promise = new TrackablePromise<void>()
            visiblePromisesRef.current.push(promise)

            const thumbnail = functions.link.getThumbnailLink(image, sizeType, session, mobile)
            const liveThumbnail = functions.link.getThumbnailLink(image, sizeType, session, mobile, true)
            const original = functions.link.getImageLink(image, session.upscaledImages)
            let img = functions.cache.getThumbCache(`${thumbnail}-${sizeType}`)
            let cached = img ? true : false
            if (!img) img = thumbnail
            if (post.type === "model") {
                jsx.push(<GridModel id={post.postID} img={img} model={original} post={post} ref={postsRef[i]} 
                    reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "live2d") {
                jsx.push(<GridLive2D id={post.postID} img={img} live2d={original} post={post} ref={postsRef[i]} 
                    reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "audio") {
                jsx.push(<GridSong id={post.postID} img={img} cached={cached} audio={original} post={post} 
                    ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "video") {
                jsx.push(<GridVideo id={post.postID} img={img} cached={cached} video={original} live={liveThumbnail} 
                    post={post} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else if (post.type === "animation") {
                jsx.push(<GridAnimation id={post.postID} img={img} cached={cached} anim={original} live={liveThumbnail} 
                    post={post} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            } else {
                const comicPages = post.type === "comic" ? post.images.map((image) => functions.link.getImageLink(image, session.upscaledImages)) : null
                jsx.push(<GridImage id={post.postID} img={img} cached={cached} original={original} live={liveThumbnail} 
                    comicPages={comicPages} post={post} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} onLoad={promise.resolve}/>)
            }
        }
        if (!jsx.length && noResults) {
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
        <div className="imagegrid" style={{marginTop: mobile ? "10px" : "0px"}} onMouseEnter={() => setEnableDrag(true)}>
            <div className="image-container" style={{visibility: allImagesLoaded ? "visible" : "hidden"}}>
                {generateImagesJSX()}
            </div>
        </div>
    )
}

export default ImageGrid