import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useFlagActions, usePageActions,
useSearchSelector, useFlagSelector, usePageSelector, useMiscDialogActions, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import {UnverifiedPost} from "../../types/Types"
import "./styles/modposts.less"

const ModPosts: React.FunctionComponent = (props) => {
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
    const [unverifiedPosts, setUnverifiedPosts] = useState([] as UnverifiedPost[])
    const [index, setIndex] = useState(0)
    const [visiblePosts, setVisiblePosts] = useState([] as UnverifiedPost[])
    const [updateVisiblePostFlag, setUpdateVisiblePostFlag] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [imagesRef, setImagesRef] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updatePosts = async () => {
        const posts = await functions.http.get("/api/post/list/unverified", null, session, setSessionFlag)
        setEnded(false)
        setUnverifiedPosts(posts)
    }

    useEffect(() => {
        updatePosts()
    }, [session])

    const updateVisiblePosts = () => {
        const newVisiblePosts = [] as UnverifiedPost[]
        for (let i = 0; i < index; i++) {
            if (!unverifiedPosts[i]) break
            newVisiblePosts.push(unverifiedPosts[i])
        }
        setVisiblePosts(functions.util.removeDuplicates(newVisiblePosts))
        const newImagesRef = newVisiblePosts.map(() => React.createRef<HTMLCanvasElement>())
        setImagesRef(newImagesRef)
    }

    useEffect(() => {
        if (updateVisiblePostFlag) {
            updateVisiblePosts()
            setUpdateVisiblePostFlag(false)
        }
    }, [unverifiedPosts, index, updateVisiblePostFlag])

    const approvePost = async (postID: string) => {
        await functions.http.post("/api/post/approve", {postID}, session, setSessionFlag)
        await updatePosts()
        setUpdateVisiblePostFlag(true)
    }

    const rejectPost = async (postID: string) => {
        await functions.http.post("/api/post/reject", {postID}, session, setSessionFlag)
        await updatePosts()
        setUpdateVisiblePostFlag(true)
    }

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updatePosts = () => {
            let currentIndex = index
            const newVisiblePosts = visiblePosts
            for (let i = 0; i < 10; i++) {
                if (!unverifiedPosts[currentIndex]) break
                newVisiblePosts.push(unverifiedPosts[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisiblePosts(functions.util.removeDuplicates(newVisiblePosts))
            const newImagesRef = newVisiblePosts.map(() => React.createRef<HTMLCanvasElement>())
            setImagesRef(newImagesRef)
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
        let result = await functions.http.get("/api/post/list/unverified", {offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanHistory = unverifiedPosts.filter((t) => !t.fake)
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
                setUnverifiedPosts((prev) => functions.util.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setUnverifiedPosts(result)
                } else {
                    setUnverifiedPosts((prev) => functions.util.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.dom.scrolledToBottom()) {
                let currentIndex = index
                if (!unverifiedPosts[currentIndex]) return updateOffset()
                const newPosts = visiblePosts
                for (let i = 0; i < 10; i++) {
                    if (!unverifiedPosts[currentIndex]) return updateOffset()
                    newPosts.push(unverifiedPosts[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisiblePosts(functions.util.removeDuplicates(newPosts))
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
        const jsx = [] as React.ReactElement[]
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
            const img = functions.link.getUnverifiedThumbnailLink(post.images[0], "tiny", session, mobile)
            if (!ref.current) continue
            let src = img
            if (functions.file.isModel(img)) {
                src = await functions.model.modelImage(img, img)
            } else if (functions.file.isLive2D(img)) {
                src = await functions.model.live2dScreenshot(img)
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
    }, [visiblePosts])

    useEffect(() => {
        if (!scroll) {
            const offset = (modPage - 1) * getPageAmount()
            let visiblePosts = unverifiedPosts.slice(offset, offset + getPageAmount())
            setVisiblePosts(visiblePosts)
            const newImagesRef = visiblePosts.map(() => React.createRef<HTMLCanvasElement>())
            setImagesRef(newImagesRef)
        }
    }, [scroll, modPage, unverifiedPosts])

    const openPost = (postID: string | null, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    const generatePostsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = [] as UnverifiedPost[]
        if (scroll) {
            visible = functions.util.removeDuplicates(visiblePosts)
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
            const post = visible[i]
            if (!post) break
            if (post.fake) continue
            const imgClick = (event?: React.MouseEvent, middle?: boolean) => {
                if (middle) return window.open(`/unverified/post/${post.postID}`, "_blank")
                navigate(`/unverified/post/${post.postID}`)
            }
            const img = functions.link.getUnverifiedThumbnailLink(post.images[0], "tiny", session, mobile)
            let canvasImg = functions.file.isModel(img) || functions.file.isLive2D(img) || functions.file.isAudio(img)
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} key={i}>
                    <div className="mod-post-text-container">
                        <div className="mod-post-img-container">
                            {functions.file.isVideo(img) ? 
                            <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                            !canvasImg ? <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/> :
                            <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></canvas>}
                        </div>
                    </div>
                    <div className="mod-post-text-container">
                        {post.appealed ? 
                        <div className="mod-post-text-container-row" style={{padding: "10px", paddingBottom: "0px"}}>
                            <span className="mod-post-link" onClick={() => navigate(`/user/${post.appealer}`)}>{i18n.labels.appealer}: {functions.util.toProperCase(post.appealer || "") || i18n.user.deleted}</span>
                            <span className="mod-post-text" style={{marginLeft: "10px"}}>{i18n.labels.reason}: {post.appealReason || i18n.labels.none}</span>
                        </div> : null}
                        <div className="mod-post-text-container-row">
                            <div className="mod-post-text-column">
                                <span className="mod-post-link" onClick={() => navigate(`/user/${post.uploader}`)}>{i18n.sidebar.uploader}: {functions.util.toProperCase(post?.uploader) || i18n.user.deleted}</span>
                                {post.parentID ? <span className="mod-post-link" onClick={(event) => openPost(post.parentID, event)}>{i18n.labels.parentID}: {post.parentID}</span> : null}
                                <span className="mod-post-text">{i18n.tag.artist}: {functions.util.toProperCase(post.artist || i18n.labels.none)}</span>
                                <span className="mod-post-text">{i18n.navbar.tags}: {post.tags?.length}</span>
                                <span className="mod-post-text">{i18n.labels.newTags}: {post.newTags || 0}</span>
                            </div>
                            <div className="mod-post-text-column">
                                <span className="mod-post-text">{i18n.labels.source}: {post.source ? i18n.buttons.yes : i18n.buttons.no}</span>
                                <span className="mod-post-text">{i18n.labels.similarPosts}: {post.duplicates ? i18n.buttons.yes : i18n.buttons.no}</span>
                                <span className="mod-post-text">{i18n.labels.resolution}: {post.images[0].width}x{post.images[0].height}</span>
                                <span className="mod-post-text">{i18n.labels.size}: {post.images.length}→{functions.util.readableFileSize(post.images.reduce((acc, obj) => acc + obj.size, 0))}</span>
                            </div>
                            <div className="mod-post-text-column">
                                <span className="mod-post-text">{i18n.labels.upscaled}: {post.hasUpscaled ? i18n.buttons.yes : i18n.buttons.no}</span>
                                <span className="mod-post-text">{i18n.sidebar.type}: {post.type}</span>
                                <span className="mod-post-text">{i18n.sidebar.rating}: {post.rating}</span>
                                <span className="mod-post-text">{i18n.sidebar.style}: {post.style}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectPost(post.postID)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approvePost(post.postID)}>
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

export default ModPosts