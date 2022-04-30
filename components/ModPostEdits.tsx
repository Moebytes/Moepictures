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

const ModPostEdits: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {unverifiedPosts, setUnverifiedPosts} = useContext(UnverifiedPostsContext)
    const [index, setIndex] = useState(0)
    const [visiblePosts, setVisiblePosts] = useState([]) as any
    const history = useHistory()

    const updatePosts = async () => {
        const posts = await axios.get("/api/post-edits/list/unverified", {withCredentials: true}).then((r) => r.data)
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
        setVisiblePosts(newVisiblePosts)
    }, [unverifiedPosts])

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!unverifiedPosts[currentIndex]) return
                const newPosts = visiblePosts as any
                for (let i = 0; i < 10; i++) {
                    if (!unverifiedPosts[currentIndex]) break
                    newPosts.push(unverifiedPosts[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisiblePosts(newPosts)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const generatePostsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < visiblePosts.length; i++) {
            const post = unverifiedPosts[i]
            if (!post) break
            const imgClick = () => {
                history.push(`/unverified/post/${post.postID}`)
            }
            const img = functions.getUnverifiedImageLink(post.images[0].type, post.postID, post.images[0].filename)
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick}></video> :
                        <img className="mod-post-img" src={img} onClick={imgClick}/>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${post.updater}`)}>Edited By: {functions.toProperCase(post.updater || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {post.reason || "None provided."}</span>
                        <span className="mod-post-text">Tags: {post.tags.length}</span>
                        <span className="mod-post-text">New Tags: {post.newTags}</span>
                        <span className="mod-post-text">Updated Date: {functions.prettyDate(new Date(post.updatedDate))}</span>
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

export default ModPostEdits