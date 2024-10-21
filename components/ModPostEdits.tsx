import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SessionContext, SessionFlagContext, SearchFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"

const ModPostEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [unverifiedPosts, setUnverifiedPosts] = useState([]) as any
    const [originalPosts, setOriginalPosts] = useState(new Map())
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
        const posts = await functions.get("/api/post-edits/list/unverified", null, session, setSessionFlag)
        setEnded(false)
        setUnverifiedPosts(posts)
        const originals = await functions.get("/api/posts", {postIDs: posts.map((p: any) => p.originalID)}, session, setSessionFlag)
        for (const original of originals) {
            originalPosts.set(original.postID, original)
        }
        forceUpdate()
    }

    useEffect(() => {
        updatePosts()
    }, [session])

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
        await functions.post("/api/post/approve", {postID, reason}, session, setSessionFlag)
        await updatePosts()
        setUpdateVisiblePostFlag(true)
    }

    const rejectPost = async (postID: number) => {
        await functions.post("/api/post/reject", {postID}, session, setSessionFlag)
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
        const result = await functions.get("/api/post-edits/list/unverified", {offset: newOffset}, session, setSessionFlag)
        if (result?.length >= 100) {
            setOffset(newOffset)
            setUnverifiedPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
            const originals = await functions.get("/api/posts", {postIDs: result.map((p: any) => p.originalID)}, session, setSessionFlag)
            for (const original of originals) {
                originalPosts.set(original.postID, original)
            }
            forceUpdate()
        } else {
            if (result?.length) {
                setUnverifiedPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
                const originals = await functions.get("/api/posts", {postIDs: result.map((p: any) => p.originalID)}, session, setSessionFlag)
                for (const original of originals) {
                    originalPosts.set(original.postID, original)
                }
                forceUpdate()
            }
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

    const calculateDiff = (prevTags: string[], newTags: string[]) => {
        const addedTags = newTags.filter((tag: string) => !prevTags.includes(tag)).map((tag: string) => `+${tag}`)
        const removedTags = prevTags.filter((tag: string) => !newTags.includes(tag)).map((tag: string) =>`-${tag}`)
        const addedTagsJSX = addedTags.map((tag: string) => <span className="tag-add">{tag}</span>)
        const removedTagsJSX = removedTags.map((tag: string) => <span className="tag-remove">{tag}</span>)
        if (![...addedTags, ...removedTags].length) return null
        return [...addedTagsJSX, ...removedTagsJSX]
    }

    const tagsDiff = (originalPost: any, newPost: any) => {
        if (!originalPost) return newPost.tags.join(" ")
        return calculateDiff(originalPost.tags, newPost.tags)
    }

    const printMirrors = (newPost: any) => {
        if (!newPost.mirrors) return "None"
        const mapped = Object.values(newPost.mirrors) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="mod-post-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m) + append}</span>
        })
    }

    const diffJSX = (originalPost: any, newPost: any) => {
        let jsx = [] as React.ReactElement[]
        if (!originalPost) return []
        if (!originalPost || (originalPost?.images.length !== newPost.images.length)) {
            if (!originalPost && newPost.images.length <= 1) {
                // ignore condition
            } else {
                jsx.push(<span className="mod-post-text"><span className="mod-post-label">Images:</span> {newPost.images.length}</span>)
            }
        }
        if (!originalPost || (originalPost?.type !== newPost.type)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Type:</span> {functions.toProperCase(newPost.type)}</span>)
        }
        if (!originalPost || (originalPost?.restrict !== newPost.restrict)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Restrict:</span> {functions.toProperCase(newPost.restrict)}</span>)
        }
        if (!originalPost || (originalPost?.style !== newPost.style)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Style:</span> {functions.toProperCase(newPost.style)}</span>)
        }
        if (!originalPost || (originalPost?.tags !== newPost.tags)) {
            if (tagsDiff(originalPost, newPost)) {
                jsx.push(<span className="mod-post-text"><span className="mod-post-label">Tags:</span> {tagsDiff(originalPost, newPost)}</span>)
            }
        }
        if (!originalPost || (originalPost?.title !== newPost.title)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Title:</span> {newPost.title || "None"}</span>)
        }
        if (!originalPost || (originalPost?.translatedTitle !== newPost.translatedTitle)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Translated Title:</span> {newPost.translatedTitle || "None"}</span>)
        }
        if (!originalPost || (originalPost?.artist !== newPost.artist)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Artist:</span> {newPost.artist || "Unknown"}</span>)
        }
        if (!originalPost || (originalPost?.drawn !== newPost.drawn)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Drawn:</span> {newPost.drawn ? functions.formatDate(new Date(newPost.drawn)) : "Unknown"}</span>)
        }
        if (!originalPost || (originalPost?.link !== newPost.link)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Link:</span> <span className="mod-post-link" onClick={() => window.open(newPost.link, "_blank")}>{functions.getSiteName(newPost.link)}</span></span>)
        }
        if (!originalPost || (JSON.stringify(originalPost?.mirrors) !== JSON.stringify(newPost.mirrors))) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Mirrors:</span> {printMirrors(newPost)}</span>)
        }
        if (!originalPost || (originalPost?.bookmarks !== newPost.bookmarks)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Bookmarks:</span> {newPost.bookmarks || "?"}</span>)
        }
        if (!originalPost || (originalPost?.purchaseLink !== newPost.purchaseLink)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Buy Link:</span> {newPost.purchaseLink || "None"}</span>)
        }
        if (!originalPost || (originalPost?.commentary !== newPost.commentary)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Commentary:</span> {newPost.commentary || "None"}</span>)
        }
        if (!originalPost || (originalPost?.translatedCommentary !== newPost.translatedCommentary)) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">Translated Commentary:</span> {newPost.translatedCommentary || "None"}</span>)
        }
        return jsx
    }

    const generatePostsJSX = () => {
        let jsx = [] as any
        const posts = functions.removeDuplicates(visiblePosts)
        if (!posts.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">No data</span>
                    </div>
                </div>
            )
        }
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i] as any
            if (!post) break
            const originalPost = originalPosts.get(post.originalID)
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
                        <span className="mod-post-link" onClick={() => history.push(`/user/${post.updater}`)}>Edited By: {functions.toProperCase(post?.updater) || "deleted"}</span>
                        <span className="mod-post-text">Reason: {post.reason || "None provided."}</span>
                        {diffJSX(originalPost, post)}
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