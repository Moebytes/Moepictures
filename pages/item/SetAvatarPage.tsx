import React, {useEffect, useState, useRef} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import {useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions,  useThemeSelector,
useLayoutSelector, useFlagSelector, useCacheActions, useCacheSelector, useInteractionActions} from "../../store"
import permissions from "../../structures/Permissions"
import ReactCrop, {makeAspectCrop, centerCrop, PixelCrop, PercentCrop} from "react-image-crop"
import "./styles/setavatarpage.less"
import {TagCategories, PostSearch, GIFFrame, PostOrdered} from "../../types/Types"

const preventScroll = (event: Event) => event.preventDefault()

const SetAvatarPage: React.FunctionComponent = () => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag, setUserImg} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {posts, tagCategories, tagGroupCategories} = useCacheSelector()
    const {setPosts, setTags, setTagCategories, setTagGroupCategories} = useCacheActions()
    const {postFlag} = useFlagSelector()
    const {setRedirect, setPostFlag} = useFlagActions()
    const [images, setImages] = useState([] as string[])
    const [image, setImage] = useState("")
    const [post, setPost] = useState(null as PostSearch | null)
    const [crop, setCrop] = useState({unit: "%", x: 25, y: 25, width: 50, height: 50, aspect: 1} as PercentCrop)
    const [pixelCrop, setPixelCrop] = useState({unit: "px", x: 0, y: 0, width: 100, height: 100, aspect: 1} as PixelCrop)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isAnimated, setIsAnimated] = useState(false)
    const ref = useRef<HTMLImageElement>(null)
    const previewRef = useRef<HTMLCanvasElement>(null)
    const navigate = useNavigate()
    const {id: postID, slug} = useParams() as {id: string, slug: string}

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setSidebarText("")
        document.title = "Set Avatar"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie || !post) return
        if (!session.username && post.rating !== functions.r13()) {
            setRedirect(`/set-avatar/${postID}/${slug}`)
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
        if (functions.post.isR18(post.rating)) {
            functions.dom.replaceLocation("/403")
        }
        functions.post.processRedirects(post, postID, slug, navigate, session, setSessionFlag)
    }, [session, post])

    useEffect(() => {
        const updatePost = async () => {
            let post = posts.find((p) => p.postID === postID) as PostSearch | undefined
            let $401Error = false
            try {
                if (!post) post = await functions.http.get("/api/post", {postID}, session, setSessionFlag) as PostSearch | undefined
            } catch (e) {
                if (String(e).includes("401")) $401Error = true
            }
            if (post) {
                let images = [] as string[]
                if (session.upscaledImages) {
                    images = post.images.map((image) => functions.link.getImageLink(image, true))
                } else {
                    images = post.images.map((image) => functions.link.getImageLink(image))
                }
                setImages(images)
                const thumb = await functions.crypto.decryptThumb(images[0], session, undefined, true)
                setImage(thumb)
                const tags = await functions.tag.parseTags([post], session, setSessionFlag)
                const categories = await functions.tag.tagCategories(tags, session, setSessionFlag)
                const groupCategories = await functions.tag.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                if (!$401Error) functions.dom.replaceLocation("/404")
            }
        }
        updatePost()
    }, [postID, posts, session])

    useEffect(() => {
        const updatePost = async () => {
            let targetID = !Number.isNaN(Number(postFlag)) ? postFlag! : postID
            setPostFlag(null)
            let post = null as PostSearch | null
            let $401Error = false
            try {
                post = await functions.http.get("/api/post", {postID: targetID}, session, setSessionFlag) as PostSearch
            } catch (e) {
                if (String(e).includes("401")) $401Error = true
            }
            if (post) {
                let images = [] as string[]
                if (session.upscaledImages) {
                    images = post.images.map((image) => functions.link.getImageLink(image, true))
                } else {
                    images = post.images.map((image) => functions.link.getImageLink(image))
                }
                setImages(images) 
                const thumb = await functions.crypto.decryptThumb(images[0], session, undefined, true)
                setImage(thumb)
                const tags = await functions.tag.parseTags([post], session, setSessionFlag)
                const categories = await functions.tag.tagCategories(tags, session, setSessionFlag)
                const groupCategories = await functions.tag.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                if (!$401Error) functions.dom.replaceLocation("/404")
            }
        }
        if (postFlag) updatePost()
    }, [postFlag, session])

    useEffect(() => {
        if (!previewRef.current || !ref.current) return
        const image = ref.current
        const canvas = previewRef.current
        drawCanvas(image, canvas, crop)
    }, [crop])

    const onImageLoad = (event?: React.SyntheticEvent<HTMLImageElement>) => {
        if (!ref.current) return
        let width = ref.current.clientWidth
        let height = ref.current.clientHeight
        if (event) {
            width = event.currentTarget.width
            height = event.currentTarget.height
        }
        const newCrop = centerCrop(makeAspectCrop({unit: "%", width: 50}, 1, width, height), width, height)
        setCrop(newCrop as PercentCrop)
        const x = newCrop.x / 100 * width
        const y = newCrop.y / 100 * height
        const pixelWidth = newCrop.width / 100 * width
        const pixelHeight = newCrop.height / 100 * height
        setPixelCrop({unit: "px", x, y, width: pixelWidth, height: pixelHeight, aspect: 1} as unknown as PixelCrop)
    }

    const drawCanvas = (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PercentCrop)  => {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const naturalWidth = image.naturalWidth || image.width
        const naturalHeight = image.naturalHeight || image.height
    
        const cropX = (crop.x / 100) * naturalWidth
        const cropY = (crop.y / 100) * naturalHeight
        const cropWidth = (crop.width / 100) * naturalWidth
        const cropHeight = (crop.height / 100) * naturalHeight
    
        const pixelRatio = window.devicePixelRatio
        canvas.width = Math.floor(cropWidth * pixelRatio)
        canvas.height = Math.floor(cropHeight * pixelRatio)
    
        ctx.imageSmoothingQuality = "high"
        ctx.scale(pixelRatio, pixelRatio)
    
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
    }

    const getCroppedURL = async () => {
        if (!previewRef.current) return
        const url = previewRef.current.toDataURL("image/jpeg")
        let croppedURL = ""
        if (isAnimated && permissions.isPremium(session)) {
            let gifData = [] as GIFFrame[]
            const arrayBuffer = await fetch(image).then((r) => r.arrayBuffer())
            if (functions.file.isGIF(images[0])) {
                gifData = await functions.video.extractGIFFrames(arrayBuffer)
            } else if (functions.file.isWebP(images[0])) {
                gifData = await functions.video.extractAnimatedWebpFrames(arrayBuffer)
            }
            let frameArray = [] as ArrayBuffer[] 
            let delayArray = [] as number[]
            let firstURL = ""
            for (let i = 0; i < gifData.length; i++) {
                const frame = gifData[i].frame as HTMLCanvasElement
                const canvas = document.createElement("canvas")
                const image = document.createElement("img")
                image.src = frame.toDataURL()
                await new Promise<void>((resolve) => {
                    image.onload = () => resolve()
                })
                drawCanvas(image, canvas, crop)
                const cropped = await functions.image.crop(canvas.toDataURL("image/png"), 1, true, false)
                if (!firstURL) firstURL = await functions.image.crop(canvas.toDataURL("image/png"), 1, false, false)
                frameArray.push(cropped)
                delayArray.push(gifData[i].delay)
            }
            const {width, height} = await functions.image.imageDimensions(firstURL)
            const buffer = await functions.video.encodeGIF(frameArray, delayArray, width, height)
            const blob = new Blob([new Uint8Array(buffer)])
            croppedURL = URL.createObjectURL(blob)
        } else {
            croppedURL = await functions.image.crop(url, 1, false, true)
        }
        return croppedURL
    }
      

    const setAvatar = async () => {
        if (!post) return
        const croppedURL = await getCroppedURL()
        if (!croppedURL) return
        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
        const bytes = new Uint8Array(arrayBuffer)
        await functions.http.post("/api/user/pfp", {postID, bytes: Object.values(bytes)}, session, setSessionFlag)
        setUserImg("")
        setSessionFlag(true)
        navigate(`/post/${post.postID}/${post.slug}`)
    }

    const download = async () => {
        const croppedURL = await getCroppedURL()
        if (!croppedURL) return
        let ext = isAnimated && permissions.isPremium(session) ? "gif" : "jpg"
        functions.dom.download(`${postID}-crop.${ext}`, croppedURL)
    }

    const dragStart = () => {
        document.addEventListener("touchmove", preventScroll, {passive: false})
    }

    const dragEnd = () => {
        document.removeEventListener("touchmove", preventScroll)
    }

    const toggleScroll = (on: boolean) => {
        if (on) {
            document.body.style.overflowY = "auto"
        } else {
            document.body.style.overflowY = "hidden"
        }
    }

    useEffect(() => {
        const checkImage = async () => {
            if (functions.file.isGIF(images[0])) return setIsAnimated(true)
            if (functions.file.isWebP(images[0])) {
                const buffer = await fetch(image).then((r) => r.arrayBuffer())
                const animatedWebp = functions.file.isAnimatedWebp(buffer)
                if (animatedWebp) return setIsAnimated(true)
            }
            setIsAnimated(false)
        }
        checkImage()
    }, [image])

    const openPost = async (event: React.MouseEvent) => {
        functions.post.openPost(post, event, navigate, session, setSessionFlag)
    }


    return (
        <>
        <TitleBar goBack={true}/>
        <NavBar/>
        <div className="body">
            <SideBar post={post} artists={tagCategories?.artists} characters={tagCategories?.characters} 
            series={tagCategories?.series} tags={tagCategories?.tags} meta={tagCategories?.meta} 
            tagGroups={tagGroupCategories} noActions={true}/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    <div className="set-avatar">
                        <span className="set-avatar-title">{i18n.sidebar.setAvatar}</span>
                        <div className="set-avatar-container">
                            <ReactCrop className="set-avatar-crop" crop={crop} onChange={(crop, percentCrop) => {setCrop(percentCrop); setPixelCrop(crop); toggleScroll(false)}}
                            keepSelection={true} minWidth={25} minHeight={25} aspect={1} onComplete={() => toggleScroll(true)} onDragStart={dragStart} onDragEnd={dragEnd}>
                                <img className="set-avatar-image" src={image} onLoad={onImageLoad} ref={ref}/>
                            </ReactCrop>
                            <div className="set-avatar-preview-container">
                                <canvas className="set-avatar-preview" ref={previewRef}></canvas>
                                <div className="set-avatar-button-container">
                                    <button className="set-avatar-button" onClick={(event) => openPost(event)}>{i18n.buttons.cancel}</button>
                                    <button className="set-avatar-button" onClick={() => setAvatar()}>{i18n.sidebar.setAvatar}</button>
                                </div>
                                <div className="set-avatar-button-container">
                                    <button className="set-avatar-button" onClick={() => download()}>{i18n.buttons.download}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default SetAvatarPage