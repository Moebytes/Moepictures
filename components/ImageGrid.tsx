import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useHistory, useLocation} from "react-router-dom"
import {ThemeContext, SizeTypeContext, PostAmountContext, PostsContext, ImageTypeContext, EnableDragContext,
RestrictTypeContext, StyleTypeContext, SortTypeContext, SearchContext, SearchFlagContext, HeaderFlagContext,
RandomFlagContext, ImageSearchFlagContext, SidebarTextContext, MobileContext, SessionContext, VisiblePostsContext,
ScrollYContext, ScrollContext, PageContext, AutoSearchContext, ShowPageDialogContext, PageFlagContext, ReloadPostFlagContext} from "../Context"
import GridImage from "./GridImage"
import GridModel from "./GridModel"
import GridSong from "./GridSong"
import noresults from "../assets/misc/noresults.png"
import axios from "axios"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import path from "path"
import "./styles/imagegrid.less"

let timeout = null as any
let reloadedPost = false

interface Props {
    location?: any
}

const ImageGrid: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {postAmount, setPostAmount} = useContext(PostAmountContext)
    const {posts, setPosts} = useContext(PostsContext) as any
    const [index, setIndex] = useState(0)
    const {visiblePosts, setVisiblePosts} = useContext(VisiblePostsContext)
    const {scrollY, setScrollY} = useContext(ScrollYContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {imageType, setImageType} = useContext(ImageTypeContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {styleType, setStyleType} = useContext(StyleTypeContext)
    const {sortType, setSortType} = useContext(SortTypeContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {randomFlag, setRandomFlag} = useContext(RandomFlagContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {imageSearchFlag, setImageSearchFlag} = useContext(ImageSearchFlagContext)
    const {headerFlag, setHeaderFlag} = useContext(HeaderFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const [loaded, setLoaded] = useState(false)
    const [noResults, setNoResults] = useState(false)
    const [isRandomSearch, setIsRandomSearch] = useState(false)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [updatePostFlag, setUpdatePostFlag] = useState(false)
    const {page, setPage} = useContext(PageContext)
    const {autoSearch, setAutoSearch} = useContext(AutoSearchContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {reloadPostFlag, setReloadPostFlag} = useContext(ReloadPostFlagContext)
    const [postsRef, setPostsRef] = useState([]) as any
    const [reupdateFlag, setReupdateFlag] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const history = useHistory()
    const location = useLocation()

    const getPageAmount = () => {
        let loadAmount = 60
        if (sizeType === "tiny") loadAmount = 60
        if (sizeType === "small") loadAmount = 40
        if (sizeType === "medium") loadAmount = 25
        if (sizeType === "large") loadAmount = 20
        if (sizeType === "massive") loadAmount = 15
        return loadAmount * 2
    }

    const getLoadAmount = () => {
        const loadAmount = mobile ? functions.getImagesPerRowMobile(sizeType) : functions.getImagesPerRow(sizeType)
        return loadAmount * 10
    }

    const searchPosts = async (query?: string) => {
        if (searchFlag) setSearchFlag(false)
        setNoResults(false)
        setEnded(false)
        setIndex(0)
        setVisiblePosts([])
        if (!query) query = await functions.parseSpaceEnabledSearch(search)
        setSearch(query)
        const result = await axios.get("/api/search/posts", {params: {query, type: imageType, restrict: restrictType, style: styleType, sort: sortType, limit: 1000}, withCredentials: true}).then((r) => r.data)
        setHeaderFlag(true)
        setPosts(result)
        setIsRandomSearch(false)
        setUpdatePostFlag(true)
        if (!result.length) setNoResults(true)
        if (!search) {
            document.title = "Moebooru: Cutest Anime Art ♥"
        }
    }

    const randomPosts = async () => {
        setRandomFlag(false)
        setSearch("")
        const result = await axios.get("/api/search/random", {params: {type: imageType, restrict: restrictType, style: styleType, limit: 1000}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisiblePosts([])
        setPosts(result)
        setIsRandomSearch(true)
        setUpdatePostFlag(true)
        document.title = "Moebooru: Random"
    }

    useEffect(() => {
        if (!loaded) setLoaded(true)
        if (searchFlag) searchPosts()
        if (!scroll) updateOffset()
        const savedPosts = localStorage.getItem("savedPosts")
        if (savedPosts) setPosts(JSON.parse(savedPosts))
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (!scrollY) {
                const elements = document.querySelectorAll(".sortbar-text") as any
                const img = document.querySelector(".image")
                if (!img && !elements?.[0]) {
                    searchPosts()
                } else {
                    let counter = 0
                    for (let i = 0; i < elements.length; i++) {
                        if (elements[i]?.innerText?.toLowerCase() === "all") counter++
                        if (elements[i]?.innerText?.toLowerCase() === "date") counter++
                    }
                    if (!img && counter >= 4) randomPosts()
                }
            } else {
                setScrollY(null)
            }
            const savedPage = localStorage.getItem("page")
            if (savedPage) setPage(Number(savedPage))
            if (queryParam) searchPosts(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setPage(Number(pageParam))
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        clearTimeout(timeout)
        const searchLoop = async () => {
            if (!autoSearch) return
            await randomPosts()
            timeout = setTimeout(() => {
                searchLoop()
            }, 3000)
        }
        searchLoop()
    }, [autoSearch])

    useEffect(() => {
        window.scrollTo(0, 0)
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
    }, [scroll, page, ended, noResults, sizeType, imageType, restrictType, styleType])

    useEffect(() => {
        if (reloadedPost) {
            reloadedPost = false
            const savedPage = localStorage.getItem("page")
            if (savedPage) setPage(Number(savedPage))
            return
        }
        if (loaded) {
            setPage(1)
            searchPosts()
        }
    }, [searchFlag, imageType, restrictType, styleType, sortType, scroll])

    useEffect(() => {
        if (reloadPostFlag) reloadedPost = true
    }, [reloadPostFlag])

    useEffect(() => {
        if (randomFlag) {
            setPage(1)
            randomPosts()
        }
    }, [randomFlag])

    useEffect(() => {
        if (imageSearchFlag) {
            setEnded(false)
            setIndex(0)
            setVisiblePosts([])
            setPage(1)
            setPosts(imageSearchFlag)
            setUpdatePostFlag(true)
            document.title = "Moebooru: Image Search"
            setImageSearchFlag(null)
        }
    }, [imageSearchFlag])

    useEffect(() => {
        setPostAmount(index)
    }, [index])

    useEffect(() => {
        const updatePosts = async () => {
            let currentIndex = 0
            const newVisiblePosts = [] as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!posts[currentIndex]) break
                const post = posts[currentIndex]
                currentIndex++
                newVisiblePosts.push(post)
            }
            setIndex(currentIndex)
            setVisiblePosts(functions.removeDuplicates(newVisiblePosts))
            const resultCount = Number(posts[0]?.postCount)
            setSidebarText(`${resultCount === 1 ? `1 result.` : `${resultCount || 0} results.`}`)
            localStorage.setItem("savedPosts", JSON.stringify(posts))
            setUpdatePostFlag(false)
        }
        if (updatePostFlag) updatePosts()
    }, [updatePostFlag])

    const updateOffset = async () => {
        if (noResults) return
        if (ended) return
        let newOffset = offset + 1000
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
        let result = null as any
        if (isRandomSearch) {
            result = await axios.get("/api/search/random", {params: {type: imageType, restrict: restrictType, style: styleType, limit: 1000, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        } else {
            const query = await functions.parseSpaceEnabledSearch(search)
            result = await axios.get("/api/search/posts", {params: {query, type: imageType, restrict: restrictType, style: styleType, sort: sortType, limit: 1000, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        }
        let hasMore = result?.length >= 1000
        const cleanPosts = posts.filter((p: any) => !p.fake)
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
                setPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setPosts(result)
                } else {
                    setPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
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
                const newVisiblePosts = visiblePosts as any
                const max = getPageAmount() - visiblePosts.length 
                for (let i = 0; i < max; i++) {
                    if (!posts[currentIndex]) return updateOffset()
                    const post = posts[currentIndex]
                    currentIndex++
                    newVisiblePosts.push(post)
                }
                setIndex(currentIndex)
                setVisiblePosts(functions.removeDuplicates(newVisiblePosts))
            }
        }
        if (scroll) updatePosts()
    }, [sizeType, scroll, sizeType, imageType, restrictType, styleType])

    useEffect(() => {
        const scrollHandler = async () => {
            if (!loaded) return
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!posts[currentIndex]) return updateOffset()
                const newVisiblePosts = visiblePosts as any
                for (let i = 0; i < getLoadAmount(); i++) {
                    if (!posts[currentIndex]) return updateOffset()
                    const post = posts[currentIndex]
                    currentIndex++
                    newVisiblePosts.push(post)
                }
                setIndex(currentIndex)
                setVisiblePosts(functions.removeDuplicates(newVisiblePosts))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [posts, visiblePosts, ended, noResults, offset, scroll, sizeType, imageType, restrictType, styleType])

    useEffect(() => {
        if (search) {
            scroll ? history.replace(`${location.pathname}?query=${search}`) : history.replace(`${location.pathname}?query=${search}&page=${page}`)
        } else {
            if (!scroll) history.replace(`${location.pathname}?page=${page}`)
        }
    }, [scroll, search, page])

    const maxPage = () => {
        if (!posts?.length) return 1
        if (Number.isNaN(Number(posts[0]?.postCount))) return 10000
        return Math.ceil(Number(posts[0]?.postCount) / getPageAmount())
    }

    useEffect(() => {
        if (posts?.length) {
            const newPostsRef = posts.map(() => React.createRef()) as any
            setPostsRef(newPostsRef)
            const maxPostPage = maxPage()
            if (maxPostPage === 1) return
            if (queryPage > maxPostPage) {
                setQueryPage(maxPostPage)
                setPage(maxPostPage)
            }
        }
    }, [posts, page, queryPage])

    useEffect(() => {
        const loadImages = async () => {
            for (let i = 0; i < postsRef.length; i++) {
                if (!postsRef[i].current) continue
                const shouldWait = await postsRef[i].current?.shouldWait?.()
                if (shouldWait) {
                    await postsRef[i].current?.load?.()
                } else {
                    postsRef[i].current?.load?.()
                }
            }
        }
        loadImages()
    }, [postsRef])

    useEffect(() => {
        if (reupdateFlag) {
            const updateImages = async () => {
                for (let i = 0; i < postsRef.length; i++) {
                    if (!postsRef[i].current) continue
                    const shouldWait = await postsRef[i].current?.shouldWait?.()
                    if (shouldWait) {
                        await postsRef[i].current?.update?.()
                    } else {
                        postsRef[i].current?.update?.()
                    }
                }
            }
            updateImages()
            setReupdateFlag(false)
        }
    }, [reupdateFlag])

    const firstPage = () => {
        setPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = page - 1 
        if (newPage < 1) newPage = 1 
        setPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = page + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setPage(newPage)
        window.scrollTo(0, 0)
    }

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("page", String(page))
    }, [page])

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
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
        const jsx = [] as any
        let visible = []
        if (scroll) {
            visible = functions.removeDuplicates(visiblePosts)
        } else {
            const postOffset = (page - 1) * getPageAmount()
            visible = posts.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i] as any
            if (post.fake) continue
            if (post.thirdParty) continue
            if (!session.username) if (post.restrict !== "safe") continue
            if (restrictType !== "explicit") if (post.restrict === "explicit") continue
            if (!permissions.isStaff(session)) if (post.restrict === "explicit") continue
            const image = post.images[0]
            if (!image) continue
            const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
            if (post.type === "model") {
                jsx.push(<GridModel key={post.postID} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} id={post.postID} model={functions.getThumbnailLink(image.type, post.postID, image.order, image.filename, sizeType)} post={post}/>)
            } else if (post.type === "audio") {
                jsx.push(<GridSong key={post.postID} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} id={post.postID} audio={functions.getThumbnailLink(image.type, post.postID, image.order, image.filename, sizeType)} post={post}/>)
            } else {
                jsx.push(<GridImage key={post.postID} ref={postsRef[i]} reupdate={() => setReupdateFlag(true)} id={post.postID} img={functions.getThumbnailLink(image.type, post.postID, image.order, image.filename, sizeType)} comicPages={post.type === "comic" ? images : null} post={post}/>)
            }
        }
        if (!jsx.length && noResults) {
            jsx.push(
                <div className="noresults-container">
                    <img className="noresults" src={noresults}/>
                </div>
            )
        } else if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {page <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {page <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {page >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {page >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {<button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button>}
                </div>
            )
        }
        return jsx
    }

    return (
        <div className="imagegrid" style={{marginTop: mobile ? "10px" : "0px"}} onMouseEnter={() => setEnableDrag(true)}>
            <div className="image-container">
                {generateImagesJSX()}
            </div>
        </div>
    )
}

export default ImageGrid