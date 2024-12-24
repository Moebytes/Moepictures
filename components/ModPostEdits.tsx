import React, {useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useFlagActions, usePageActions,
useSearchSelector, useFlagSelector, usePageSelector, useMiscDialogActions, useActiveSelector} from "../store"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"

const ModPostEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [unverifiedPosts, setUnverifiedPosts] = useState([]) as any
    const [originalPosts, setOriginalPosts] = useState(new Map())
    const [index, setIndex] = useState(0)
    const [visiblePosts, setVisiblePosts] = useState([]) as any
    const [updateVisiblePostFlag, setUpdateVisiblePostFlag] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
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

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updatePosts = () => {
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
        }
        if (scroll) updatePosts()
    }, [unverifiedPosts, scroll])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (modPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (modPage[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.get("/api/post-edits/list/unverified", {offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanHistory = unverifiedPosts.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanHistory.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, postCount: cleanHistory[0]?.postCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setUnverifiedPosts(result)
            } else {
                setUnverifiedPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
            const originals = await functions.get("/api/posts", {postIDs: result.map((p: any) => p.originalID)}, session, setSessionFlag)
            for (const original of originals) {
                originalPosts.set(original.postID, original)
            }
            forceUpdate()
        } else {
            if (result?.length) {
                if (padded) {
                    setUnverifiedPosts(result)
                } else {
                    setUnverifiedPosts((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
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
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, index, visiblePosts, modState, session])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisiblePosts([])
            setModPage(1)
            updatePosts()
        }
    }, [scroll, modPage, modState, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [modState])

    useEffect(() => {
        const updatePageOffset = () => {
            const modOffset = (modPage - 1) * getPageAmount()
            if (unverifiedPosts[modOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const modAmount = Number(unverifiedPosts[0]?.postCount)
            let maximum = modOffset + getPageAmount()
            if (maximum > modAmount) maximum = modAmount
            const maxTag = unverifiedPosts[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, unverifiedPosts, modPage, ended])

    useEffect(() => {
        if (unverifiedPosts?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setModPage(maxTagPage)
            }
        }
    }, [unverifiedPosts, modPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!unverifiedPosts?.length) return 1
        if (Number.isNaN(Number(unverifiedPosts[0]?.postCount))) return 10000
        return Math.ceil(Number(unverifiedPosts[0]?.postCount) / getPageAmount())
    }

    const firstPage = () => {
        setModPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = modPage - 1 
        if (newPage < 1) newPage = 1 
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = modPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setModPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (modPage > maxPage() - 3) increment = -4
        if (modPage > maxPage() - 2) increment = -5
        if (modPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (modPage > maxPage() - 2) increment = -3
            if (modPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = modPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const loadImages = async () => {
        for (let i = 0; i < visiblePosts.length; i++) {
            const post = visiblePosts[i]
            const ref = imagesRef[i]
            if (post.fake) continue
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

    useEffect(() => {
        if (!scroll) {
            const offset = (modPage - 1) * getPageAmount()
            let visiblePosts = unverifiedPosts.slice(offset, offset + getPageAmount())
            setVisiblePosts(visiblePosts)
            const newImagesRef = visiblePosts.map(() => React.createRef()) as any
            setImagesRef(newImagesRef)
        }
    }, [scroll, modPage, unverifiedPosts])

    const calculateDiff = (addedTags: string[], removedTags: string[]) => {
        const addedTagsJSX = addedTags.map((tag: string) => <span className="tag-add">+{tag}</span>)
        const removedTagsJSX = removedTags.map((tag: string) => <span className="tag-remove">-{tag}</span>)
        if (![...addedTags, ...removedTags].length) return null
        return [...addedTagsJSX, ...removedTagsJSX]
    }

    const tagsDiff = (originalPost: any, newPost: any) => {
        if (!originalPost) return newPost.tags.join(" ")
        return calculateDiff(newPost.addedTags, newPost.removedTags)
    }

    const printMirrors = (newPost: any) => {
        if (!newPost.mirrors) return "None"
        const mapped = Object.values(newPost.mirrors) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="mod-post-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m, i18n) + append}</span>
        })
    }

    const diffJSX = (originalPost: any, newPost: any) => {
        let jsx = [] as React.ReactElement[]
        if (!originalPost) return []
        const changes = newPost.changes || {}
        let tagChanges = newPost.addedTags?.length || newPost.removedTags?.length
        if (changes.images) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.images}:</span> {newPost.images.length}</span>)
        }
        if (changes.parentID !== undefined) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.parentID}:</span> <span className="mod-post-link" onClick={() => newPost.parentID ? history.push(`/post/${newPost.parentID}`) : null}>{newPost.parentID || i18n.labels.removed}</span></span>)
        }
        if (changes.type) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sidebar.type}:</span> {functions.toProperCase(newPost.type)}</span>)
        }
        if (changes.rating) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sidebar.rating}:</span> {functions.toProperCase(newPost.rating)}</span>)
        }
        if (changes.style) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sidebar.style}:</span> {functions.toProperCase(newPost.style)}</span>)
        }
        if (tagChanges) {
            if (tagsDiff(originalPost, newPost)) {
                jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.navbar.tags}:</span> {tagsDiff(originalPost, newPost)}</span>)
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
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sort.posted}:</span> {newPost.posted ? functions.formatDate(new Date(newPost.posted)) : i18n.labels.unknown}</span>)
        }
        if (changes.source) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.source}:</span> <span className="mod-post-link" onClick={() => window.open(newPost.source, "_blank")}>{functions.getSiteName(newPost.source, i18n)}</span></span>)
        }
        if (changes.mirrors) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.labels.mirrors}:</span> {printMirrors(newPost)}</span>)
        }
        if (changes.bookmarks) {
            jsx.push(<span className="mod-post-text"><span className="mod-post-label">{i18n.sort.bookmarks}:</span> {newPost.bookmarks || "?"}</span>)
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
        let jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visiblePosts) as any
        } else {
            const offset = (modPage - 1) * getPageAmount()
            visible = unverifiedPosts.slice(offset, offset + getPageAmount())
        }
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
            const post = visible[i] as any
            if (!post) break
            if (post.fake) continue
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
                        <span className="mod-post-link" onClick={() => history.push(`/user/${post.updater}`)}>{i18n.labels.editedBy}: {functions.toProperCase(post?.updater) || i18n.user.deleted}</span>
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
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {modPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {modPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {modPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {modPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
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