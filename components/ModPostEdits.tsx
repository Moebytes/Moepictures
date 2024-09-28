import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"
import axios from "axios"

const ModPostEdits: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [unverifiedPosts, setUnverifiedPosts] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visiblePosts, setVisiblePosts] = useState([]) as any
    const [updateVisiblePostFlag, setUpdateVisiblePostFlag] = useState(false)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [imagesRef, setImagesRef] = useState([]) as any
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updatePosts = async () => {
        const posts = await axios.get("/api/post-edits/list/unverified", {withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setUnverifiedPosts(posts)
    }

    useEffect(() => {
        updatePosts()
    }, [])

    const updateVisiblePosts = () => {
        const newVisiblePosts = [] as any
        for (let i = 0; i < index; i++) {
            if (!unverifiedPosts[i]) break
            newVisiblePosts.push(unverifiedPosts[i])
        }
        setVisiblePosts(functions.removeDuplicates(newVisiblePosts))
        const newImagesRef = newVisiblePosts.map(() => React.createRef()) as any
        setImagesRef(newImagesRef) as any
    }

    useEffect(() => {
        if (updateVisiblePostFlag) {
            updateVisiblePosts()
            setUpdateVisiblePostFlag(false)
        }
    }, [unverifiedPosts, index, updateVisiblePostFlag])

    const approvePost = async (postID: number, reason: string) => {
        await axios.post("/api/post/approve", {postID, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        await updatePosts()
        setUpdateVisiblePostFlag(true)
    }

    const rejectPost = async (postID: number) => {
        await axios.post("/api/post/reject", {postID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        await updatePosts()
        setUpdateVisiblePostFlag(true)
    }

    useEffect(() => {
        let currentIndex = index
        const newVisiblePosts = visiblePosts as any
        for (let i = 0; i < 10; i++) {
            if (!unverifiedPosts[currentIndex]) break
            newVisiblePosts.push(unverifiedPosts[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisiblePosts(functions.removeDuplicates(newVisiblePosts))
        const newImagesRef = newVisiblePosts.map(() => React.createRef()) as any
        setImagesRef(newImagesRef) as any
    }, [unverifiedPosts])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/post-edits/list/unverified", {params: {offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length >= 100) {
            setOffset(newOffset)
            setUnverifiedPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
        } else {
            if (result?.length) setUnverifiedPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!unverifiedPosts[currentIndex]) return updateOffset()
                const newPosts = visiblePosts as any
                for (let i = 0; i < 10; i++) {
                    if (!unverifiedPosts[currentIndex]) return updateOffset()
                    newPosts.push(unverifiedPosts[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisiblePosts(functions.removeDuplicates(newPosts))
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const loadImages = async () => {
        for (let i = 0; i < visiblePosts.length; i++) {
            const post = visiblePosts[i]
            const ref = imagesRef[i]
            const img = functions.getUnverifiedThumbnailLink(post.images[0].type, post.postID, post.images[0].order, post.images[0].filename, "tiny")
            if (functions.isGIF(img)) continue
            if (!ref.current) continue
            let src = img
            if (functions.isModel(img)) {
                src = await functions.modelImage(img)
            } else if (functions.isAudio(img)) {
                src = await functions.songCover(img)
            }
            const imgElement = document.createElement("img")
            imgElement.src = src 
            imgElement.onload = () => {
                if (!ref.current) return
                const refCtx = ref.current.getContext("2d")
                ref.current.width = imgElement.width
                ref.current.height = imgElement.height
                refCtx?.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height)
            }
        }
    }

    useEffect(() => {
        loadImages()
    }, [visiblePosts])

    const generatePostsJSX = () => {
        let jsx = [] as any
        const posts = functions.removeDuplicates(visiblePosts)
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i] as any
            if (!post) break
            const imgClick = (event?: any, middle?: boolean) => {
                if (middle) return window.open(`/unverified/post/${post.postID}`, "_blank")
                history.push(`/unverified/post/${post.postID}`)
            }
            const img = functions.getUnverifiedThumbnailLink(post.images[0].type, post.postID, post.images[0].order, post.images[0].filename, "tiny")
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        functions.isGIF(img) ? <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/> :
                        <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></canvas>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${post.updater}`)}>Edited By: {functions.toProperCase(post.updater || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {post.reason || "None provided."}</span>
                        <span className="mod-post-text">Tags: {post.tags?.length}</span>
                        <span className="mod-post-text">Upscaled: {post.hasUpscaled ? "yes" : "no"}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectPost(post.postID)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approvePost(post.postID, post.reason)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Approve</span>
                        </div>
                    </div>
                </div>
            )
        }
        return jsx
    }

    return (
        <div className="mod-posts">
            {generatePostsJSX()}
        </div>
    )
}

export default ModPostEdits