import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import {useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions,  useThemeSelector,
useLayoutSelector, useFlagSelector, useCacheActions, useCacheSelector, useInteractionActions} from "../../store"
import permissions from "../../structures/Permissions"
import ReactCrop, {makeAspectCrop, centerCrop, PixelCrop, PercentCrop} from "react-image-crop"
import "./styles/setavatarpage.less"
import {TagCategories, PostSearch, GIFFrame, PostOrdered} from "../../types/Types"

interface Props {
    match: {params: {id: string, slug: string}}
}

const SetAvatarPage: React.FunctionComponent<Props> = (props) => {
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
    const history = useHistory()
    const postID = props.match.params.id
    const slug = props.match.params.slug

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
            history.push("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
        if (functions.isR18(post.rating)) {
            functions.replaceLocation("/403")
        }
        functions.processRedirects(post, postID, slug, history, session, setSessionFlag)
    }, [session, post])

    useEffect(() => {
        const updatePost = async () => {
            let post = posts.find((p) => p.postID === postID) as PostSearch | undefined
            let $401Error = false
            try {
                if (!post) post = await functions.get("/api/post", {postID}, session, setSessionFlag) as PostSearch | undefined
            } catch (e) {
                if (String(e).includes("401")) $401Error = true
            }
            if (post) {
                let images = [] as string[]
                if (session.upscaledImages) {
                    images = post.images.map((i) => functions.getImageLink(i.type, post.postID, i.order, i.upscaledFilename || i.filename))
                } else {
                    images = post.images.map((i) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                }
                setImages(images)
                const thumb = await functions.decryptThumb(images[0], session, undefined, true)
                setImage(thumb)
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                const groupCategories = await functions.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                if (!$401Error) functions.replaceLocation("/404")
            }
        }
        updatePost()
    }, [postID, posts, session])

    useEffect(() => {
        const updatePost = async () => {
            setPostFlag(false)
            let post = null as PostSearch | null
            let $401Error = false
            try {
                post = await functions.get("/api/post", {postID}, session, setSessionFlag) as PostSearch
            } catch (e) {
                if (String(e).includes("401")) $401Error = true
            }
            if (post) {
                let images = [] as string[]
                if (session.upscaledImages) {
                    images = post.images.map((i) => functions.getImageLink(i.type, post.postID, i.order, i.upscaledFilename || i.filename))
                } else {
                    images = post.images.map((i) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                }
                setImages(images) 
                const thumb = await functions.decryptThumb(images[0], session, undefined, true)
                setImage(thumb)
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                const groupCategories = await functions.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                if (!$401Error) functions.replaceLocation("/404")
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
            if (functions.isGIF(images[0])) {
                gifData = await functions.extractGIFFrames(arrayBuffer)
            } else if (functions.isWebP(images[0])) {
                gifData = await functions.extractAnimatedWebpFrames(arrayBuffer)
            }
            let frameArray = [] as Buffer[] 
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
                const cropped = await functions.crop(canvas.toDataURL("image/png"), 1, true, false)
                if (!firstURL) firstURL = await functions.crop(canvas.toDataURL("image/png"), 1, false, false)
                frameArray.push(cropped)
                delayArray.push(gifData[i].delay)
            }
            const {width, height} = await functions.imageDimensions(firstURL, session)
            const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
            const blob = new Blob([buffer])
            croppedURL = URL.createObjectURL(blob)
        } else {
            croppedURL = await functions.crop(url, 1, false, true)
        }
        return croppedURL
    }
      

    const setAvatar = async () => {
        if (!post) return
        const croppedURL = await getCroppedURL()
        if (!croppedURL) return
        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
        const bytes = new Uint8Array(arrayBuffer)
        await functions.post("/api/user/pfp", {postID, bytes: Object.values(bytes)}, session, setSessionFlag)
        setUserImg("")
        setSessionFlag(true)
        history.push(`/post/${post.postID}/${post.slug}`)
    }

    const download = async () => {
        const croppedURL = await getCroppedURL()
        if (!croppedURL) return
        let ext = isAnimated && permissions.isPremium(session) ? "gif" : "jpg"
        functions.download(`${postID}-crop.${ext}`, croppedURL)
    }

    const toggleScroll = (on: boolean) => {
        if (on) {
            document.body.style.overflowY = "visible"
        } else {
            document.body.style.overflowY = "hidden"
        }
    }

    useEffect(() => {
        const checkImage = async () => {
            if (functions.isGIF(images[0])) return setIsAnimated(true)
            if (functions.isWebP(images[0])) {
                const buffer = await fetch(image).then((r) => r.arrayBuffer())
                const animatedWebp = functions.isAnimatedWebp(buffer)
                if (animatedWebp) return setIsAnimated(true)
            }
            setIsAnimated(false)
        }
        checkImage()
    }, [image])

    const openPost = async (event: React.MouseEvent) => {
        functions.openPost(post, event, history, session, setSessionFlag)
    }


    return (
        <>
        <TitleBar goBack={true}/>
        <NavBar/>
        <div className="body">
            <SideBar post={post} artists={tagCategories?.artists} characters={tagCategories?.characters} 
            series={tagCategories?.series} tags={tagCategories?.tags} meta={tagCategories?.meta} 
            tagGroups={tagGroupCategories} noActions={true}/> : 
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    <div className="set-avatar">
                        <span className="set-avatar-title">{i18n.sidebar.setAvatar}</span>
                        <div className="set-avatar-container">
                            <ReactCrop className="set-avatar-crop" crop={crop} onChange={(crop, percentCrop) => {setCrop(percentCrop); setPixelCrop(crop); toggleScroll(false)}} keepSelection={true} minWidth={25} minHeight={25} aspect={1} onComplete={() => toggleScroll(true)}>
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