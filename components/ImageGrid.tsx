import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SizeTypeContext, PostAmountContext, PostsContext, ImageTypeContext,
RestrictTypeContext, StyleTypeContext, SortTypeContext, SearchContext, SearchFlagContext} from "../Context"
import GridImage from "./GridImage"
import axios from "axios"
import functions from "../structures/Functions"
import path from "path"
import "./styles/imagegrid.less"

const ImageGrid: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
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
    const history = useHistory()

    const getInitLoadAmount = () => {
        if (sizeType === "tiny") return 45
        if (sizeType === "small") return 28
        if (sizeType === "medium") return 15
        if (sizeType === "large") return 12
        if (sizeType === "massive") return 6
        return 45
    }

    const getLoadAmount = () => {
        return functions.getImagesPerRow(sizeType) * 2
    }

    useEffect(() => {
        if (searchFlag) setSearchFlag(false)
        axios.get("/api/search", {params: {query: search, type: imageType, restrict: restrictType, style: styleType, sort: sortType
        }}).then((result) => {
            console.log(result.data)
            setIndex(0)
            setVisiblePosts([])
            setPosts(result.data)
            history.push(`/posts?query=${search}`)
            if (!search) {
                history.push("/")
                document.title = "Moebooru: Cutest Anime Art ♡"
            }
        })
    }, [searchFlag, imageType, restrictType, styleType, sortType])

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
            setVisiblePosts(newVisiblePosts)
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
                setVisiblePosts(newVisiblePosts)
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
                setVisiblePosts(newVisiblePosts)
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
            const image = visiblePosts[i].images[0]
            if (!image) continue
            jsx.push(<GridImage key={i + 1} id={post.postID} img={functions.getImageLink(image.type, post.postID, image.filename)}/>)
        }
        return jsx
    }

    return (
        <div className="imagegrid">
            <div className="image-container" style={{justifyContent: `${sizeType === "massive" || sizeType === "large" ? "space-around" : "space-between"}`}}>
                {generateImagesJSX()}
            </div>
        </div>
    )
}

export default ImageGrid