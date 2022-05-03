import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SizeTypeContext, PostAmountContext, PostsContext, ImageTypeContext, EnableDragContext,
RestrictTypeContext, StyleTypeContext, SortTypeContext, SearchContext, SearchFlagContext, HeaderFlagContext,
RandomFlagContext, ImageSearchFlagContext, SidebarTextContext, MobileContext, SessionContext, VisiblePostsContext,
ScrollYContext} from "../Context"
import GridImage from "./GridImage"
import noresults from "../assets/misc/noresults.png"
import axios from "axios"
import functions from "../structures/Functions"
import path from "path"
import "./styles/imagegrid.less"

const ImageGrid: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {postAmount, setPostAmount} = useContext(PostAmountContext)
    const {posts, setPosts} = useContext(PostsContext) as any
    const [index, setIndex] = useState(0)
    const {visiblePosts, setVisiblePosts} = useContext(VisiblePostsContext)
    const {scrollY, setScrollY} = useContext(ScrollYContext)
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
    const history = useHistory()

    const getInitLoadAmount = () => {
        if (mobile) return 3
        if (sizeType === "tiny") return 45
        if (sizeType === "small") return 28
        if (sizeType === "medium") return 15
        if (sizeType === "large") return 12
        if (sizeType === "massive") return 6
        return 45
    }

    const getLoadAmount = () => {
        return mobile ? functions.getImagesPerRowMobile(sizeType) : functions.getImagesPerRow(sizeType)
    }

    const searchPosts = async () => {
        if (searchFlag) setSearchFlag(false)
        setNoResults(false)
        setEnded(false)
        setIndex(0)
        setVisiblePosts([])
        const query = await functions.parseSpaceEnabledSearch(search)
        setSearch(query)
        const result = await axios.get("/api/search/posts", {params: {query, type: imageType, restrict: restrictType, style: styleType, sort: sortType}, withCredentials: true}).then((r) => r.data)
        setHeaderFlag(true)
        setPosts(result)
        setIsRandomSearch(false)
        if (!result.length) setNoResults(true)
        if (!search) {
            document.title = "Moebooru: Cutest Anime Art ♡"
        }
    }

    useEffect(() => {
        if (!loaded) setLoaded(true)
        if (searchFlag) searchPosts()
        if (!scrollY) {
            setTimeout(() => {
                const elements = document.querySelectorAll(".sortbar-text") as any
                const img = document.querySelector(".image")
                if (!img && !elements?.[0]) return searchPosts()
                let counter = 0
                for (let i = 0; i < elements.length; i++) {
                    if (elements[i]?.innerText?.toLowerCase() === "all") counter++
                    if (elements[i]?.innerText?.toLowerCase() === "date") counter++
                }
                if (!img && counter >= 4) searchPosts()
            }, 300)
        } else {
            setScrollY(null)
        }
    }, [])
    
    useEffect(() => {
        let timeout = null as any
        clearTimeout(timeout)
        if (!noResults && !ended && !visiblePosts.length && loaded) {
            timeout = setTimeout(() => {
                // searchPosts()
            }, 100)
        }
        return () => {
            clearTimeout(timeout)
        }
    }, [visiblePosts, noResults, ended, loaded])

    useEffect(() => {
        if (loaded) searchPosts()
    }, [searchFlag, imageType, restrictType, styleType, sortType])

    useEffect(() => {
        const randomPosts = async () => {
            setRandomFlag(false)
            setSearch("")
            const result = await axios.get("/api/search/random", {params: {type: imageType, restrict: restrictType, style: styleType}, withCredentials: true}).then((r) => r.data)
            setEnded(false)
            setIndex(0)
            setVisiblePosts([])
            setPosts(result)
            setIsRandomSearch(true)
            document.title = "Moebooru: Random"
        }
        if (randomFlag) randomPosts()
    }, [randomFlag])

    useEffect(() => {
        if (imageSearchFlag) {
            setEnded(false)
            setIndex(0)
            setVisiblePosts([])
            setPosts(imageSearchFlag)
            document.title = "Moebooru: Image Search"
            setImageSearchFlag(null)
        }
    }, [imageSearchFlag])

    useEffect(() => {
        setPostAmount(index)
    }, [index])

    useEffect(() => {
        const updatePosts = async () => {
            let currentIndex = index
            const newVisiblePosts = visiblePosts as any
            for (let i = 0; i < getInitLoadAmount(); i++) {
                if (!posts[currentIndex]) break
                const post = posts[currentIndex]
                currentIndex++
                newVisiblePosts.push(post)
            }
            setIndex(currentIndex)
            setVisiblePosts(functions.removeDuplicates(newVisiblePosts))
            setSidebarText(`${Number(posts[0]?.postCount) === 1 ? `1 result.` : `${posts[0]?.postCount || 0} results.`}`)
            localStorage.setItem("savedPosts", JSON.stringify(posts))
        }
        updatePosts()
    }, [posts])

    const updateOffset = async () => {
        if (noResults) return
        if (ended) return
        const newOffset = offset + 100
        let result = null as any
        if (isRandomSearch) {
            result = await axios.get("/api/search/random", {params: {type: imageType, restrict: restrictType, style: styleType, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        } else {
            const query = await functions.parseSpaceEnabledSearch(search)
            result = await axios.get("/api/search/posts", {params: {query, type: imageType, restrict: restrictType, style: styleType, sort: sortType, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        }
        if (result?.length >= 100) {
            setOffset(newOffset)
            setPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
        } else {
            if (result?.length) setPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
            setEnded(true)
        }
    }

    useEffect(() => {
        const updatePosts = async () => {
            if (!loaded) return
            if (visiblePosts.length < getInitLoadAmount()) {
                let currentIndex = index
                const newVisiblePosts = visiblePosts as any
                const max = getInitLoadAmount() - visiblePosts.length 
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
        updatePosts()
    }, [sizeType])

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
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [posts, visiblePosts, ended, noResults, offset])


    const generateImagesJSX = () => {
        const jsx = [] as any
        const posts = functions.removeDuplicates(visiblePosts)
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i] as any
            if (post.thirdParty) continue
            if (!session.username) if (post.restrict !== "safe") continue
            const image = post.images[0]
            if (!image) continue
            const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.filename))
            jsx.push(<GridImage key={post.postID} id={post.postID} img={functions.getImageLink(image.type, post.postID, image.filename)} comicPages={post.type === "comic" ? images : null} post={post}/>)
        }
        if (!jsx.length && noResults) {
            jsx.push(
                <div className="noresults-container">
                    <img className="noresults" src={noresults}/>
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