import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, MobileContext, UserImgContext, SessionFlagContext,
PostsContext, TagsContext, PostFlagContext, RedirectContext, SidebarTextContext, SessionContext, EnableDragContext} from "../Context"
import permissions from "../structures/Permissions"
import ReactCrop, {makeAspectCrop, centerCrop} from "react-image-crop"
import "./styles/setavatarpage.less"

interface Props {
    match?: any
}

const SetAvatarPage: React.FunctionComponent<Props> = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {tags, setTags} = useContext(TagsContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {userImg, setUserImg} = useContext(UserImgContext)
    const [images, setImages] = useState([]) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [tagCategories, setTagCategories] = useState(null) as any
    const [crop, setCrop] = useState({unit: "%", x: 25, y: 25, width: 50, height: 50, aspect: 1})
    const [pixelCrop, setPixelCrop] = useState({unit: "px", x: 0, y: 0, width: 100, height: 100, aspect: 1})
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isAnimated, setIsAnimated] = useState(false)
    const ref = useRef<any>(null)
    const previewRef = useRef<HTMLCanvasElement>(null)
    const history = useHistory()
    const postID = props?.match.params.id

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setSidebarText("")
        document.title = "Set Avatar"
        const savedPost = localStorage.getItem("savedPost")
        const savedTags = localStorage.getItem("savedTags")
        if (savedPost) setPost(JSON.parse(savedPost))
        if (savedTags) setTagCategories(JSON.parse(savedTags))
        if (!posts?.length) {
            const savedPosts = localStorage.getItem("savedPosts")
            if (savedPosts) setPosts(JSON.parse(savedPosts))
        }
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie || !post) return
        if (!session.username && post.restrict !== "safe") {
            setRedirect(`/set-avatar/${postID}`)
            history.push("/login")
            setSidebarText("Login required.")
        }
        if (post.restrict === "explicit") {
            if (!session.showR18) {
                history.push("/403")
            }
        }
    }, [session, post])

    useEffect(() => {
        const updatePost = async () => {
            let post = posts.find((p: any) => p.postID === postID)
            let $401Error = false
            try {
                if (!post) post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            } catch (e) {
                if (String(e).includes("401")) $401Error = true
            }
            if (post) {
                let images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                // images = await Promise.all(images.map((img: string) => functions.linkToBase64(img)))
                setImages(images)
                if (functions.isVideo(images[0])) {
                    const thumb = await functions.videoThumbnail(images[0])
                    setImage(thumb)
                } else {
                    setImage(images[0])
                }
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                if (!$401Error) history.push("/404")
            }
        }
        updatePost()
    }, [postID, posts, session])

    useEffect(() => {
        const updatePost = async () => {
            setPostFlag(false)
            let post = null as any
            let $401Error = false
            try {
                post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            } catch (e) {
                if (String(e).includes("401")) $401Error = true
            }
            if (post) {
                let images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                // images = await Promise.all(images.map((img: string) => functions.linkToBase64(img)))
                setImages(images) 
                if (functions.isVideo(images[0])) {
                    const thumb = await functions.videoThumbnail(images[0])
                    setImage(thumb)
                } else {
                    setImage(images[0])
                }
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                if (!$401Error) history.push("/404")
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
        const newCrop = centerCrop(makeAspectCrop({unit: "%", width: 50} as any, 1, width, height), width, height)
        setCrop(newCrop as any)
        const x = newCrop.x / 100 * width
        const y = newCrop.y / 100 * height
        const pixelWidth = newCrop.width / 100 * width
        const pixelHeight = newCrop.height / 100 * height
        setPixelCrop({unit: "px", x, y, width: pixelWidth, height: pixelHeight, aspect: 1})
    }

    useEffect(() => {
        if (imageLoaded) {
            onImageLoad()
        }
    }, [imageLoaded])

    const drawCanvas = (image: any, canvas: HTMLCanvasElement, crop: any)  => {
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

    const loadImage = async () => {
        if (!ref.current) return
        if (isAnimated) return
        let src = image
        if (functions.isImage(src)) {
            src = await cryptoFunctions.decryptedLink(src)
        } else if (functions.isModel(src)) {
            src = await functions.modelImage(src)
        } else if (functions.isAudio(src)) {
            src = await functions.songCover(src)
        }
        const img = document.createElement("img")
        img.src = src 
        img.onload = () => {
            if (!ref.current) return
            const refCtx = ref.current.getContext("2d")
            ref.current.width = img.width
            ref.current.height = img.height
            refCtx?.drawImage(img, 0, 0, img.width, img.height)
            setImageLoaded(true)
        }
    }

    useEffect(() => {
        setImageLoaded(false)
        loadImage()
    }, [image])

    const getCroppedURL = async () => {
        if (!previewRef.current) return
        const url = previewRef.current.toDataURL("image/jpeg")
        let croppedURL = ""
        if (isAnimated && permissions.isPremium(session)) {
            let gifData = null as any
            if (functions.isGIF(image)) {
                gifData = await functions.extractGIFFrames(image)
            } else if (functions.isWebP(image)) {
                gifData = await functions.extractAnimatedWebpFrames(image)
            }
            let frameArray = [] as any 
            let delayArray = [] as any
            let firstURL = null as any
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
            const {width, height} = await functions.imageDimensions(firstURL)
            const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
            const blob = new Blob([buffer])
            croppedURL = URL.createObjectURL(blob)
        } else {
            croppedURL = await functions.crop(url, 1, false, true)
        }
        return croppedURL
    }
      

    const setAvatar = async () => {
        const croppedURL = await getCroppedURL()
        if (!croppedURL) return
        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
        const bytes = Object.values(new Uint8Array(arrayBuffer))
        await functions.post("/api/user/pfp", {postID, bytes}, session, setSessionFlag)
        setUserImg("")
        setSessionFlag(true)
        history.push(`/post/${postID}`)
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
            if (functions.isGIF(image)) return setIsAnimated(true)
            if (functions.isWebP(image)) {
                const buffer = await fetch(image).then((r) => r.arrayBuffer())
                const animatedWebp = await functions.isAnimatedWebp(buffer)
                if (animatedWebp) return setIsAnimated(true)
            }
            setIsAnimated(false)
        }
        checkImage()
    }, [image])

    return (
        <>
        <DragAndDrop/>
        <TitleBar goBack={true}/>
        <NavBar/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags} noActions={true}/> : 
            <SideBar/>
            }
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    <div className="set-avatar">
                        <span className="set-avatar-title">Set Avatar</span>
                        <div className="set-avatar-container">
                            <ReactCrop className="set-avatar-crop" crop={crop as any} onChange={(crop, percentCrop) => {setCrop(percentCrop as any); setPixelCrop(crop as any); toggleScroll(false)}} keepSelection={true} minWidth={25} minHeight={25} aspect={1} onComplete={() => toggleScroll(true)}>
                                {isAnimated ? <img className="set-avatar-image" src={image} onLoad={onImageLoad} ref={ref}/> : 
                                <canvas className="set-avatar-image" ref={ref}></canvas>}
                            </ReactCrop>
                            <div className="set-avatar-preview-container">
                                <canvas className="set-avatar-preview" ref={previewRef}></canvas>
                                <div className="set-avatar-button-container">
                                    <button className="set-avatar-button" onClick={() => history.push(`/post/${postID}`)}>Cancel</button>
                                    <button className="set-avatar-button" onClick={() => setAvatar()}>Set Avatar</button>
                                </div>
                                <div className="set-avatar-button-container">
                                    <button className="set-avatar-button" onClick={() => download()}>Download</button>
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