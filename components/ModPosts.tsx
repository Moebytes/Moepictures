import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, UnverifiedPostsContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/purple/approve.png"
import approveMagenta from "../assets/magenta/approve.png"
import reject from "../assets/purple/reject.png"
import rejectMagenta from "../assets/magenta/reject.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"
import axios from "axios"

const ModPosts: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [unverifiedPosts, setUnverifiedPosts] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visiblePosts, setVisiblePosts] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const history = useHistory()

    const updatePosts = async () => {
        const posts = await axios.get("/api/post/list/unverified", {withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setUnverifiedPosts(posts)
    }

    useEffect(() => {
        updatePosts()
    }, [])

    const getApprove = () => {
        if (theme.includes("magenta")) return approveMagenta
        return approve
    }

    const getReject = () => {
        if (theme.includes("magenta")) return rejectMagenta
        return reject
    }

    const approvePost = async (postID: number) => {
        await axios.post("/api/post/approve", {postID}, {withCredentials: true})
        updatePosts()
    }

    const rejectPost = async (postID: number) => {
        await axios.post("/api/post/reject", {postID}, {withCredentials: true})
        updatePosts()
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
    }, [unverifiedPosts])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/post/list/unverified", {params: {offset: newOffset}, withCredentials: true}).then((r) => r.data)
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

    const generatePostsJSX = () => {
        let jsx = [] as any
        const posts = functions.removeDuplicates(visiblePosts)
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i] as any
            if (!post) break
            const imgClick = () => {
                history.push(`/unverified/post/${post.postID}`)
            }
            const img = functions.getUnverifiedThumbnailLink(post.images[0].type, post.postID, post.images[0].filename, "tiny")
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick}></video> :
                        <img className="mod-post-img" src={img} onClick={imgClick}/>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${post.uploader}`)}>Uploader: {functions.toProperCase(post.uploader || "Deleted")}</span>
                        <span className="mod-post-text">Artist: {functions.toProperCase(post.artist || "None")} {post.thirdParty ? "(TP)" : ""}</span>
                        <span className="mod-post-text">Tags: {post.tags?.length}</span>
                        <span className="mod-post-text">New Tags: {post.newTags || 0}</span>
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">Source: {post.link ? "yes" : "no"}</span>
                        <span className="mod-post-text">Similar Posts: {post.duplicates ? "yes" : "no"}</span>
                        <span className="mod-post-text">Resolution: {post.images[0].width}x{post.images[0].height}</span>
                        <span className="mod-post-text">Size: {post.images.length}→{functions.readableFileSize(post.images.reduce((acc: any, obj: any) => acc + obj.size, 0))}</span>
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">Type: {post.type}</span>
                        <span className="mod-post-text">Restrict: {post.restrict}</span>
                        <span className="mod-post-text">Style: {post.style}</span>
                        <span className="mod-post-text">Upload Date: {functions.prettyDate(new Date(post.uploadDate))}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectPost(post.postID)}>
                            <img className="mod-post-options-img" src={getReject()}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approvePost(post.postID)}>
                            <img className="mod-post-options-img" src={getApprove()}/>
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

export default ModPosts