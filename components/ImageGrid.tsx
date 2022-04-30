import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SizeTypeContext, PostAmountContext, PostsContext, ImageTypeContext, EnableDragContext,
RestrictTypeContext, StyleTypeContext, SortTypeContext, SearchContext, SearchFlagContext, HeaderFlagContext,
RandomFlagContext, ImageSearchFlagContext, SidebarTextContext, MobileContext} from "../Context"
import GridImage from "./GridImage"
import noresults from "../assets/misc/noresults.png"
import axios from "axios"
import functions from "../structures/Functions"
import path from "path"
import "./styles/imagegrid.less"

const ImageGrid: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {postAmount, setPostAmount} = useContext(PostAmountContext)
    const {posts, setPosts} = useContext(PostsContext) as any
    const [index, setIndex] = useState(0)
    const [visiblePosts, setVisiblePosts] = useState([]) as any
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
    const [loaded, setLoaded] = useState(false)
    const [noResults, setNoResults] = useState(false)
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
        setIndex(0)
        setVisiblePosts([])
        const query = await functions.parseSpaceEnabledSearch(search)
        setSearch(query)
        const result = await axios.get("/api/search/posts", {params: {query, type: imageType, restrict: restrictType, style: styleType, sort: sortType}, withCredentials: true}).then((r) => r.data)
        setHeaderFlag(true)
        setPosts(result)
        if (!result.length) setNoResults(true)
        if (!search) {
            document.title = "Moebooru: Cutest Anime Art ♡"
        }
    }

    useEffect(() => {
        if (!loaded) setLoaded(true)
        if (searchFlag) searchPosts()
    }, [])
    
    useEffect(() => {
        let timeout = null as any
        clearTimeout(timeout)
        if (!noResults && !visiblePosts.length) {
            timeout = setTimeout(() => {
                searchPosts()
            }, 100)
        }
        return () => {
            clearTimeout(timeout)
        }
    }, [visiblePosts])

    useEffect(() => {
        if (loaded) searchPosts()
    }, [searchFlag, imageType, restrictType, styleType, sortType])

    useEffect(() => {
        const randomPosts = async () => {
            setRandomFlag(false)
            setSearch("")
            const result = await axios.get("/api/search/random", {params: {type: imageType, restrict: restrictType, style: styleType}, withCredentials: true}).then((r) => r.data)
            setIndex(0)
            setVisiblePosts([])
            setPosts(result)
            document.title = "Moebooru: Random"
        }
        if (randomFlag) randomPosts()
    }, [randomFlag])

    useEffect(() => {
        if (imageSearchFlag) {
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
            setSidebarText(`${posts.length === 1 ? `${posts.length} result.` : `${posts.length} results.`}`)
        }
        updatePosts()
    }, [posts])

    useEffect(() => {
        const updatePosts = async () => {
            if (visiblePosts.length < getInitLoadAmount()) {
                let currentIndex = index
                const newVisiblePosts = visiblePosts as any
                const max = getInitLoadAmount() - visiblePosts.length 
                for (let i = 0; i < max; i++) {
                    if (!posts[currentIndex]) break
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
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!posts[currentIndex]) return
                const newVisiblePosts = visiblePosts as any
                for (let i = 0; i < getLoadAmount(); i++) {
                    if (!posts[currentIndex]) break
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
    })


    const generateImagesJSX = () => {
        const jsx = [] as any
        for (let i = 0; i < visiblePosts.length; i++) {
            const post = visiblePosts[i]
            if (post.thirdParty) continue
            const image = visiblePosts[i].images[0]
            if (!image) continue
            const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.filename))
            jsx.push(<GridImage key={post.postID} id={post.postID} img={functions.getImageLink(image.type, post.postID, image.filename)} comicPages={post.type === "comic" ? images : null}/>)
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