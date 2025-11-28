import React, {useEffect, useState, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {UnverifiedPost} from "../../types/Types"
import "./styles/modposts.less"

let pageAmount = 15

const ModPostEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [originalPosts, setOriginalPosts] = useState(new Map())
    const [updateVisiblePostFlag, setUpdateVisiblePostFlag] = useState(false)
    const [imagesRef, setImagesRef] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadInitial = async () => {
        const posts = await functions.http.get("/api/post-edits/list/unverified", null, session, setSessionFlag, true)
        const originals = await functions.http.get("/api/posts", {postIDs: posts.map((p) => p.originalID)}, session, setSessionFlag, true)
        for (const original of originals) {
            originalPosts.set(original.postID, original)
        }
        forceUpdate()
        return posts
    }

    const updateOffset = async (newOffset: number) => {
        let result = await functions.http.get("/api/post-edits/list/unverified", {offset: newOffset}, session, setSessionFlag, true)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItemLoader, setManagedPage} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, countKey: "postCount"})

    useEffect(() => {
        initItemLoader()
    }, [modState, session])

    useEffect(() => {
        if (modPage) setManagedPage(modPage)
    }, [])

    useEffect(() => {
        setModPage(page)
    }, [page])

    const updateVisiblePosts = () => {
        const newImagesRef = visibleItems.map(() => React.createRef<HTMLCanvasElement>())
        setImagesRef(newImagesRef)
    }

    useEffect(() => {
        if (updateVisiblePostFlag) {
            updateVisiblePosts()
            setUpdateVisiblePostFlag(false)
        }
    }, [visibleItems, updateVisiblePostFlag])

    const approvePost = async (postID: string, reason: string | null) => {
        await functions.http.post("/api/post/approve", {postID, reason}, session, setSessionFlag)
        await initItemLoader()
        setUpdateVisiblePostFlag(true)
    }

    const rejectPost = async (postID: string) => {
        await functions.http.post("/api/post/reject", {postID}, session, setSessionFlag)
        await initItemLoader()
        setUpdateVisiblePostFlag(true)
    }

    const loadImages = async () => {
        for (let i = 0; i < visibleItems.length; i++) {
            const post = visibleItems[i]
            const ref = imagesRef[i]
            if (post.fake) continue
            const img = functions.link.getUnverifiedThumbnailLink(post.images[0], "tiny", session, mobile)
            if (!ref.current) continue
            let src = img
            if (functions.file.isModel(img)) {
                src = await functions.model.modelImage(img, img)
            } else if (functions.file.isAudio(img)) {
                src = await functions.audio.songCover(img)
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
    }, [visibleItems])

    const calculateDiff = (addedTags: string[], removedTags: string[]) => {
        const addedTagsJSX = addedTags.map((tag: string) => <span className="tag-add">+{tag}</span>)
        const removedTagsJSX = removedTags.map((tag: string) => <span className="tag-remove">-{tag}</span>)
        if (![...addedTags, ...removedTags].length) return null
        return [...addedTagsJSX, ...removedTagsJSX]
    }

    const tagsDiff = (originalPost: UnverifiedPost, newPost: UnverifiedPost) => {
        if (!originalPost) return newPost.tags.join(" ")
        return calculateDiff(newPost.addedTags || [], newPost.removedTags || [])
    }

    const tagGroupsDiff = (originalPost: UnverifiedPost, newPost: UnverifiedPost) => {
        if (!originalPost) return newPost.tagGroups.map((g) => g.name).join(" ").trim()
        return calculateDiff(newPost.addedTagGroups || [], newPost.removedTagGroups || [])
    }

    const printImageSources = (originalPost: UnverifiedPost, newPost: UnverifiedPost) => {
        let imageSources = functions.compare.imageSourceChanges(originalPost, newPost)
        if (!imageSources) return "None"
        const entries = Object.entries(imageSources)
        return entries.map((entry, i) => {
            let [key, value] = entry
            let append = i !== entries.length - 1 ? ", " : ""
            return (
                <span className="mod-post-text">{key + " ➞ "}
                    {value ? <span className="mod-post-link" onClick={() => window.open(value, "_blank")}>
                        {functions.util.getSiteName(value, i18n) + append}
                    </span> : "none" + append}
                </span>
            )
        })
    }

    const printImageLinks = (originalPost: UnverifiedPost, newPost: UnverifiedPost) => {
        let imageLinks = functions.compare.imageLinkChanges(originalPost, newPost)
        if (!imageLinks) return "None"
        const entries = Object.entries(imageLinks)
        return entries.map((entry, i) => {
            let [key, value] = entry
            let append = i !== entries.length - 1 ? ", " : ""
            return (
                <span className="mod-post-text">{key + " ➞ "}
                    {value ? <span className="mod-post-link" onClick={() => window.open(value, "_blank")}>
                        {functions.util.getSiteName(value, i18n) + append}
                    </span> : "none" + append}
                </span>
            )
        })
    }

    const printMirrors = (newPost: UnverifiedPost) => {
        if (!newPost.mirrors) return "None"
        const mapped = Object.values(newPost.mirrors) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="mod-post-link" onClick={() => window.open(m, "_blank")}>{functions.util.getSiteName(m, i18n) + append}</span>
        })
    }

    const openPost = (postID: string | null, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    const diffJSX = (originalPost: UnverifiedPost, newPost: UnverifiedPost) => {
        let jsx = [] as React.ReactElement[]
        if (!originalPost) return []
        const changes = newPost.changes || {}
        let tagChanges = newPost.addedTags?.length || newPost.removedTags?.length
        let tagGroupChanges = newPost.addedTagGroups?.length || newPost.removedTagGroups?.length
        if (changes.images) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.images}:</span> {newPost.images.length}</span>)
        }
        if (changes.parentID !== undefined) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.parentID}:</span> <span className="mod-post-link" onClick={(event) => openPost(newPost.parentID, event)}>{newPost.parentID || i18n.labels.removed}</span></span>)
        }
        if (changes.type) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sidebar.type}:</span> {functions.util.toProperCase(newPost.type)}</span>)
        }
        if (changes.rating) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sidebar.rating}:</span> {functions.util.toProperCase(newPost.rating)}</span>)
        }
        if (changes.style) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sidebar.style}:</span> {functions.util.toProperCase(newPost.style)}</span>)
        }
        if (tagChanges) {
            if (tagsDiff(originalPost, newPost)) {
                jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.navbar.tags}:</span> {tagsDiff(originalPost, newPost)}</span>)
            }
        }
        if (tagGroupChanges) {
            if (tagGroupsDiff(originalPost, newPost)) {
                jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.tagGroups}:</span> {tagGroupsDiff(originalPost, newPost)}</span>)
            }
        }
        if (changes.title) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.title}:</span> {newPost.title || i18n.labels.none}</span>)
        }
        if (changes.englishTitle) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.englishTitle}:</span> {newPost.englishTitle || i18n.labels.none}</span>)
        }
        if (changes.artist) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.tag.artist}:</span> {newPost.artist || i18n.labels.unknown}</span>)
        }
        if (changes.posted) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sort.posted}:</span> {newPost.posted ? functions.date.formatDate(new Date(newPost.posted)) : i18n.labels.unknown}</span>)
        }
        if (changes.source) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.source}:</span> <span className="mod-post-link" onClick={() => window.open(newPost.source, "_blank")}>{functions.util.getSiteName(newPost.source, i18n)}</span></span>)
        }
        if (changes.userProfile) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.userProfile}:</span> <span className="mod-post-link" onClick={() => window.open(newPost.userProfile!, "_blank")}>{newPost.userProfile}</span></span>)
        }
        if (changes.imageSources) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.imageSources}:</span> {printImageSources(originalPost, newPost)}</span>)
        }
        if (changes.imageLinks) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.imageLinks}:</span> {printImageLinks(originalPost, newPost)}</span>)
        }
        if (changes.mirrors) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.mirrors}:</span> {printMirrors(newPost)}</span>)
        }
        if (changes.bookmarks) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sort.bookmarks}:</span> {newPost.bookmarks || "?"}</span>)
        }
        if (changes.sourceImageCount) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.imageCount}:</span> {newPost.sourceImageCount || "?"}</span>)
        }
        if (changes.pixivTags) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.pixivTags}:</span> {newPost.pixivTags?.join(", ") || i18n.labels.none}</span>)
        }
        if (changes.drawingTools) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.drawingTools}:</span> {newPost.drawingTools?.join(", ") || i18n.labels.none}</span>)
        }
        if (changes.buyLink) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.buyLink}:</span> {newPost.buyLink || i18n.labels.none}</span>)
        }
        if (changes.commentary) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.commentary}:</span> {newPost.commentary || i18n.labels.none}</span>)
        }
        if (changes.englishCommentary) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.englishCommentary}:</span> {newPost.englishCommentary || i18n.labels.none}</span>)
        }
        return jsx
    }

    const generatePostsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as UnverifiedPost[]
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">{i18n.labels.noData}</span>
                    </div>
                </div>
            )
        }
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i]
            if (!post) break
            if (post.fake) continue
            const originalPost = originalPosts.get(post.originalID)
            const imgClick = (event?: React.MouseEvent, middle?: boolean) => {
                if (middle) return window.open(`/unverified/post/${post.postID}`, "_blank")
                navigate(`/unverified/post/${post.postID}`)
            }
            const img = functions.link.getUnverifiedThumbnailLink(post.images[0], "tiny", session, mobile)
            let canvasImg = functions.file.isModel(img) || functions.file.isZip(img) || functions.file.isAudio(img)
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.file.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        !canvasImg ? <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/> :
                        <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></canvas>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${post.updater}`)}>{i18n.labels.editedBy}: {functions.util.toProperCase(post?.updater) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {post.reason || i18n.labels.none}</span>
                        {diffJSX(originalPost, post)}
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectPost(post.postID)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approvePost(post.postID, post.reason)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.approve}</span>
                        </div>
                    </div>
                </div>
            )
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
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