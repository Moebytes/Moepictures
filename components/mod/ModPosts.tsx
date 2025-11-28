import React, {useEffect, useState} from "react"
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

const ModPosts: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [updateVisiblePostFlag, setUpdateVisiblePostFlag] = useState(false)
    const [imagesRef, setImagesRef] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadInitial = async () => {
        const posts = await functions.http.get("/api/post/list/unverified", null, session, setSessionFlag, true)
        return posts
    }

    const updateOffset = async (newOffset: number) => {
        let result = await functions.http.get("/api/post/list/unverified", {offset: newOffset}, session, setSessionFlag, true)
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

    const approvePost = async (postID: string) => {
        await functions.http.post("/api/post/approve", {postID}, session, setSessionFlag)
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
            const img = functions.link.getUnverifiedThumbnailLink(post.images[0], "tiny", session, mobile)
            if (!ref.current) continue
            let src = img
            if (functions.file.isModel(img)) {
                src = await functions.model.modelImage(img, img)
            } else if (await functions.file.isLive2D(img)) {
                src = await functions.model.live2dScreenshot(img)
            } else if (await functions.file.isUgoira(img)) {
                src = await functions.video.ugoiraThumbnail(img)
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

    const openPost = (postID: string | null, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
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
            const imgClick = (event?: React.MouseEvent, middle?: boolean) => {
                if (middle) return window.open(`/unverified/post/${post.postID}`, "_blank")
                navigate(`/unverified/post/${post.postID}`)
            }
            const img = functions.link.getUnverifiedThumbnailLink(post.images[0], "tiny", session, mobile)
            let canvasImg = functions.file.isModel(img) || functions.file.isZip(img) || functions.file.isAudio(img)
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

export default ModPosts