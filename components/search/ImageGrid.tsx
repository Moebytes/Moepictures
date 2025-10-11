import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSearchActions, useSearchSelector, useInteractionSelector, 
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
import "./styles/imagegrid.less"
import {PostSearch} from "../../types/Types"

interface Ref {
    shouldWait: () => Promise<boolean>
    load: () => Promise<void>
    update: () => Promise<void>
}

let interval = null as any
let reloadedPost = false
let replace = true
let manualHistoryChange = false
let init = true
let limit = 100

const ImageGrid: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {search, searchFlag, scroll, imageType, ratingType, styleType, sortType, sortReverse, sizeType, 
    pageMultiplier, autoSearch, showChildren, favSearch} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {posts, visiblePosts} = useCacheSelector()
    const {setPosts, setVisiblePosts} = useCacheActions()
    const [index, setIndex] = useState(0)
    const {scrollY} = useInteractionSelector()
    const {setScrollY, setEnableDrag, setMobileScrolling} = useInteractionActions()
    const {setSidebarText} = useActiveActions()
    const {randomFlag, imageSearchFlag, pageFlag, reloadPostFlag, saveSearchFlag} = useFlagSelector()
    const {setRandomFlag, setImageSearchFlag, setPostAmount, setHeaderFlag, setPageFlag, setSaveSearchFlag} = useFlagActions()
    const {setPremiumRequired, setShowPageDialog} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {page} = usePageSelector()
    const {setPage} = usePageActions()
    const [loaded, setLoaded] = useState(false)
    const [noResults, setNoResults] = useState(false)
    const [isRandomSearch, setIsRandomSearch] = useState(false)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [updatePostFlag, setUpdatePostFlag] = useState(false)
    const [postsRef, setPostsRef] = useState([] as React.RefObject<Ref | null>[])
    const [reupdateFlag, setReupdateFlag] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const [initData, setInitData] = useState({searchFlag, imageType, ratingType, styleType, sortType, sortReverse})
    const [allImagesLoaded, setAllImagesLoaded] = useState(true)
    const [removeSaveSearchFlag, setRemoveSaveSearchFlag] = useState(false)
    const visiblePromisesRef = useRef<TrackablePromise<void>[]>([])
    const navigate = useNavigate()
    const location = useLocation()

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
        const loadAmount = mobile ? functions.render.getImagesPerRowMobile(sizeType) : functions.render.getImagesPerRow(sizeType)
        return loadAmount * 5
    }

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

    const searchPosts = async (query?: string) => {
        if (searchFlag) setSearchFlag(false)
        saveSearchSkip()
        if (!query) query = search
        if (query?.includes(" ") && !saveSearchFlag) {
            query = await functions.native.parseSpaceEnabledSearch(query, session, setSessionFlag)
        }
        let tags = query?.trim().split(/ +/g).filter(Boolean) || []
        if (tags.length > 3) {
            if (!session.username) {
                setSearch("")
                setSidebarText("Login required.")
                return navigate("/login")
            }
            if (!permissions.isPremium(session)) return setPremiumRequired("tags")
        }
        if (query?.startsWith("history:")) {
            if (!session.username) {
                setSearch("")
                setSidebarText("Login required.")
                return navigate("/login")
            }
            if (!permissions.isPremium(session)) return setPremiumRequired(true)
        }
        setNoResults(false)
        setEnded(false)
        setIndex(0)
        setVisiblePosts([])
        setSearch(query ?? "")
        const result = await functions.http.get("/api/search/posts", {query, type: imageType, rating: ratingType, style: styleType, 
        sort: functions.validation.parseSort(sortType, sortReverse), showChildren, limit, favoriteMode: favSearch}, session, setSessionFlag)
        setHeaderFlag(true)
        setPosts(result)
        setIsRandomSearch(false)
        setUpdatePostFlag(true)
        if (!loaded) setLoaded(true)
        if (!result.length) setNoResults(true)
        if (!search) {
            document.title = i18n.title
        }
    }

    const randomPosts = async (query?: string) => {
        setRandomFlag(false)
        const result = await functions.http.get("/api/search/posts", {query, type: imageType, rating: ratingType, style: styleType, 
        sort: "random", showChildren, limit, favoriteMode: favSearch}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisiblePosts([])
        setPosts(result)
        setIsRandomSearch(true)
        setUpdatePostFlag(true)
        document.title = "Random"
    }

    useEffect(() => {
        if (!scroll) updateOffset()
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = async () => {
            setTimeout(() => {
                if (!scrollY) {
                    const elements = Array.from(document.querySelectorAll(".sortbar-text")) as HTMLElement[]
                    const img = document.querySelector(".image")
                    if (!img && !elements?.[0]) {
                        searchPosts()
                    } else {
                        let counter = 0
                        for (let i = 0; i < elements.length; i++) {
                            if (elements[i]?.innerText?.toLowerCase() === "all") counter++
                            if (elements[i]?.innerText?.toLowerCase() === "random") counter++
                        }
                        if (!img && counter >= 4) randomPosts()
                    }
                } else {
                    setScrollY(0)
                }
            }, 2000)
            if (queryParam) searchPosts(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setPage(Number(pageParam))
            }
        }
        const updateStateChange = (event: Event) => {
            replace = true
            const queryParam = new URLSearchParams(window.location.search).get("query")
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (queryParam) {
                setSearch(queryParam)
                setSearchFlag(true)
            }
            if (pageParam) setPageFlag(Number(pageParam))
            if (event.type === "popstate") {
                if (manualHistoryChange) {
                    manualHistoryChange = false
                    return
                }
                manualHistoryChange = true
                window.history.go(-1)
            } else if (event.type === "pushstate") {
                if (manualHistoryChange) {
                    manualHistoryChange = false
                    return
                }
                manualHistoryChange = true
                window.history.go(2)
            }
        }
        window.addEventListener("load", onDOMLoaded)
        window.addEventListener("popstate", updateStateChange)
        window.addEventListener("pushstate", updateStateChange)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
            window.removeEventListener("popstate", updateStateChange)
            window.removeEventListener("pushstate", updateStateChange)
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
        //window.scrollTo(0, 0)
        setTimeout(() => {
            setMobileScrolling(false)
            //functions.jumpToTop()
        }, 100)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisiblePosts([])
            setPage(1)
            setSearchFlag(true)
        }
    }, [scroll])

    useEffect(() => {
        const updatePageOffset = () => {
            const postOffset = (page - 1) * getPageAmount()
            if (posts[postOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const postAmount = Number(posts[0]?.postCount)
            let maximum = postOffset + getPageAmount()
            if (maximum > postAmount) maximum = postAmount
            const maxPost = posts[maximum - 1]
            if (!maxPost) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [session, scroll, page, pageMultiplier, ended, noResults, sizeType, 
        imageType, ratingType, styleType, sortType, sortReverse, showChildren,
        favSearch])

    useEffect(() => {
        if (searchFlag) searchPosts()
    }, [searchFlag])

    useEffect(() => {
        if (reloadedPost) {
            setTimeout(() => {
                reloadedPost = false
                const savedPage = localStorage.getItem("page")
                if (savedPage) setPage(Number(savedPage))
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
                    const loadParam = new URLSearchParams(window.location.search).get("loaded")
                    if (loadParam) init = false
                    if (init) {
                        return init = false
                    } else {
                        updateSearch()
                    }
                }
        }
        const updateSearch = async () => {
            setPage(1)
            searchPosts()
        }
        if (loaded) {
            updateSearch()
        } else {
            checkLoaded()
        }
    }, [searchFlag, imageType, ratingType, styleType, sortType, sortReverse, scroll, loaded])

    useEffect(() => {
        if (reloadedPost) return
        if (loaded) {
            if (page === 1) {
                searchPosts()
            } else {
                updateOffset()
            }
        }
    }, [pageMultiplier, showChildren, favSearch, loaded])

    useEffect(() => {
        if (reloadPostFlag) reloadedPost = true
    }, [reloadPostFlag])

    useEffect(() => {
        if (randomFlag) {
            setPage(1)
            randomPosts(search)
        }
    }, [session, randomFlag, search])

    useEffect(() => {
        if (imageSearchFlag) {
            reloadedPost = true
            setEnded(false)
            setIndex(0)
            setVisiblePosts([])
            setPage(1)
            setPosts(imageSearchFlag)
            setUpdatePostFlag(true)
            document.title = "Image Search"
            setImageSearchFlag(null)
        }
    }, [imageSearchFlag])

    useEffect(() => {
        setPostAmount(index)
    }, [index])

    useEffect(() => {
        const updatePosts = async () => {
            let currentIndex = 0
            const newVisiblePosts = [] as PostSearch[]
            for (let i = 0; i < getPageAmount(); i++) {
                if (!posts[currentIndex]) break
                const post = posts[currentIndex] as PostSearch
                currentIndex++
                newVisiblePosts.push(post)
            }
            setIndex(currentIndex)
            setVisiblePosts(functions.util.removeDuplicates(newVisiblePosts))
            setUpdatePostFlag(false)
        }
        if (updatePostFlag) updatePosts()
    }, [updatePostFlag, pageMultiplier])

    useEffect(() => {
        let resultCount = Number(posts[0]?.postCount)
        if (Number.isNaN(resultCount)) resultCount = posts.length
        setSidebarText(`${resultCount === 1 ? `1 ${i18n.sidebar.result}` : `${resultCount || 0} ${i18n.sidebar.results}`}`)
    }, [posts, i18n])

    const updateOffset = async () => {
        if (noResults) return
        if (ended) return
        let newOffset = offset + limit
        let padded = false
        if (!scroll) {
            newOffset = (page - 1) * getPageAmount()
            if (newOffset === 0) {
                if (posts[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = null as unknown as PostSearch[]
        if (isRandomSearch) {
            result = await functions.http.get("/api/search/posts", {type: imageType, rating: ratingType, style: styleType, 
            sort: "random", showChildren, limit, favoriteMode: favSearch, offset: newOffset}, session, setSessionFlag)
        } else {
            let query = search
            if (query.includes(" ") && !saveSearchFlag) {
                query = await functions.native.parseSpaceEnabledSearch(query, session, setSessionFlag)
            }
            result = await functions.http.get("/api/search/posts", {query, type: imageType, rating: ratingType, style: styleType, 
            sort: functions.validation.parseSort(sortType, sortReverse), showChildren, limit, favoriteMode: favSearch, offset: newOffset}, session, setSessionFlag)
        }
        let hasMore = result?.length >= limit
        const cleanPosts = posts.filter((p) => !p.fake)
        if (!scroll) {
            if (cleanPosts.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, postCount: cleanPosts[0]?.postCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setPosts(result)
            } else {
                setPosts(functions.util.removeDuplicates([...posts, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setPosts(result)
                } else {
                    setPosts(functions.util.removeDuplicates([...posts, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const updatePosts = async () => {
            if (!loaded) return
            if (visiblePosts.length < getPageAmount()) {
                let currentIndex = index
                const newVisiblePosts = structuredClone(visiblePosts)
                const max = getPageAmount() - visiblePosts.length 
                for (let i = 0; i < max; i++) {
                    if (!posts[currentIndex]) return updateOffset()
                    const post = posts[currentIndex] as PostSearch
                    currentIndex++
                    newVisiblePosts.push(post)
                }
                setIndex(currentIndex)
                setVisiblePosts(functions.util.removeDuplicates(newVisiblePosts))
            }
        }
        if (scroll) updatePosts()
    }, [session, sizeType, scroll, pageMultiplier, sizeType, imageType, 
        ratingType, styleType, sortType, sortReverse, showChildren, favSearch])

    useEffect(() => {
        const scrollHandler = async () => {
            if (!loaded) return
            if (functions.dom.scrolledToBottom()) {
                let currentIndex = index
                if (!posts[currentIndex]) return updateOffset()
                const newVisiblePosts = structuredClone(visiblePosts)
                for (let i = 0; i < getLoadAmount(); i++) {
                    if (!posts[currentIndex]) return updateOffset()
                    const post = posts[currentIndex] as PostSearch
                    currentIndex++
                    newVisiblePosts.push(post)
                }
                setIndex(currentIndex)
                setVisiblePosts(functions.util.removeDuplicates(newVisiblePosts))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [session, posts, visiblePosts, ended, noResults, offset, scroll, sizeType, imageType, 
        ratingType, styleType, sortType, sortReverse, pageMultiplier, showChildren, favSearch])

    useEffect(() => {
        if (loaded) {
            const searchParams = new URLSearchParams(window.location.search)
            searchParams.delete("loaded")
            navigate(`${location.pathname}?${searchParams.toString()}`, {replace: true})
        }
    }, [loaded])

    useEffect(() => {
        if (manualHistoryChange) return
        const searchParams = new URLSearchParams(window.location.search)
        if (search) searchParams.set("query", search)
        if (!scroll) searchParams.set("page", String(page))
        if (!searchParams.toString()) return
        if (replace) {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`, {replace: true})
            replace = false
        } else {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, search, page])

    const maxPage = () => {
        if (!posts?.length) return 1
        if (Number.isNaN(Number(posts[0]?.postCount))) return 10000
        return Math.ceil(Number(posts[0]?.postCount) / getPageAmount())
    }

    useEffect(() => {
        if (posts?.length) {
            const newPostsRef = posts.map(() => React.createRef<Ref>())
            setPostsRef(newPostsRef)
            const maxPostPage = maxPage()
            if (maxPostPage === 1) return
            if (queryPage > maxPostPage) {
                setQueryPage(maxPostPage)
                setPage(maxPostPage)
            }
        }
    }, [posts, page, queryPage, pageMultiplier])

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
    }, [visiblePosts, postsRef, session])

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
            for (const post of posts) {
                const image = post.images?.[0]
                if (!image) continue
                const thumbnail = functions.link.getThumbnailLink(image, sizeType, session, mobile)
                functions.crypto.decryptThumb(thumbnail, session, `${thumbnail}-${sizeType}`)
            }
        }
        populateCache()
    }, [posts, sizeType, pageMultiplier, session])

    const firstPage = () => {
        setPage(1)
        window.scroll(0, 0)
        setTimeout(() => {
            setMobileScrolling(false)
            //functions.jumpToTop()
        }, 100)
    }

    const previousPage = () => {
        let newPage = page - 1 
        if (newPage < 1) newPage = 1 
        setPage(newPage)
        window.scroll(0, 0)
        setTimeout(() => {
            setMobileScrolling(false)
            //functions.jumpToTop()
        }, 100)
    }

    const nextPage = () => {
        let newPage = page + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setPage(newPage)
        window.scroll(0, 0)
        setTimeout(() => {
            setMobileScrolling(false)
            //functions.jumpToTop()
        }, 100)
    }

    const lastPage = () => {
        setPage(maxPage())
        window.scroll(0, 0)
        setTimeout(() => {
            setMobileScrolling(false)
            //functions.jumpToTop()
        }, 100)
    }

    const goToPage = (newPage: number) => {
        if (newPage < 1) newPage = 1
        if (newPage > maxPage()) newPage = maxPage()
        setPage(newPage)
    }

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

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
    }, [scroll, visiblePosts, page])

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (page > maxPage() - 3) increment = -4
        if (page > maxPage() - 2) increment = -5
        if (page > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (page > maxPage() - 2) increment = -3
            if (page > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = page + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const generateImagesJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = [] as PostSearch[]
        if (scroll) {
            visible = functions.util.removeDuplicates(visiblePosts)
        } else {
            const postOffset = (page - 1) * getPageAmount()
            visible = posts.slice(postOffset, postOffset + getPageAmount()) as PostSearch[]
        }

        visiblePromisesRef.current.splice(0, visiblePromisesRef.current.length)
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i]
            if (post.fake) continue
            // if (!showChildren) if (post.parentID) continue
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
        if (!jsx.length && noResults) {
            jsx.push(
                <div className="noresults-container">
                    <img className="noresults" src={noresults}/>
                </div>
            )
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {page <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {page <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {page >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {page >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
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