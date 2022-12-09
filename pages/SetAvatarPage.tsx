import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, MobileContext, UserImgContext, SessionFlagContext,
PostsContext, TagsContext, PostFlagContext, RedirectContext, SidebarTextContext, SessionContext, EnableDragContext} from "../Context"
import axios from "axios"
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
    const ref = useRef<HTMLImageElement>(null)
    const previewRef = useRef<HTMLCanvasElement>(null)
    const history = useHistory()
    const postID = Number(props?.match.params.id)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setSidebarText("")
        document.title = "Moebooru: Set Avatar"
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
            if (!permissions.isStaff(session)) {
                history.push("/403")
            }
        }
    }, [session, post])

    useEffect(() => {
        const source = axios.CancelToken.source()
        const updatePost = async () => {
            let post = posts.find((p: any) => p.postID === postID)
            if (!post) post = await axios.get("/api/post", {params: {postID}, withCredentials: true, cancelToken: source.token}).then((r) => r.data)
            if (post) {
                const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.filename))
                setImages(images)
                if (functions.isVideo(images[0])) {
                    const thumb = await functions.videoThumbnail(images[0])
                    setImage(thumb)
                } else {
                    setImage(images[0])
                }
                const tags = await functions.parseTags([post])
                const categories = await functions.tagCategories(tags)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                history.push("/404")
            }
        }
        updatePost()
        return () => source.cancel()
    }, [postID, posts])

    useEffect(() => {
        const source = axios.CancelToken.source()
        const updatePost = async () => {
            setPostFlag(false)
            let post = await axios.get("/api/post", {params: {postID}, withCredentials: true, cancelToken: source.token}).then((r) => r.data)
            if (post) {
                const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.filename))
                setImages(images) 
                if (functions.isVideo(images[0])) {
                    const thumb = await functions.videoThumbnail(images[0])
                    setImage(thumb)
                } else {
                    setImage(images[0])
                }
                const tags = await functions.parseTags([post])
                const categories = await functions.tagCategories(tags)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                history.push("/404")
            }
        }
        if (postFlag) updatePost()
        return () => source.cancel()
    }, [postFlag])

    useEffect(() => {
        if (!previewRef.current || !ref.current) return
        const image = ref.current
        const canvas = previewRef.current
        drawCanvas(image, canvas, pixelCrop)
    }, [pixelCrop])

    const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const {width, height} = event.currentTarget
        const newCrop = centerCrop(makeAspectCrop({unit: "%", width: 50} as any, 1, width, height), width, height)
        setCrop(newCrop as any)
        const x = newCrop.x / 100 * width
        const y = newCrop.y / 100 * height
        const pixelWidth = newCrop.width / 100 * width
        const pixelHeight = newCrop.height / 100 * height
        setPixelCrop({unit: "px", x, y, width: pixelWidth, height: pixelHeight, aspect: 1})
    }

    const drawCanvas = (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: any)  => {
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height
        const pixelRatio = window.devicePixelRatio
        canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
        canvas.height = Math.floor(crop.height * scaleY * pixelRatio)
        ctx.scale(pixelRatio, pixelRatio)
        ctx.imageSmoothingQuality = "high"
        const cropX = crop.x * scaleX
        const cropY = crop.y * scaleY
        ctx.save()
        ctx.translate(-cropX, -cropY)
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight)
        ctx.restore()
    }
      

    const setAvatar = async () => {
        if (!previewRef.current) return
        const url = previewRef.current.toDataURL()
        let croppedURL = ""
        if (functions.isGIF(image)) {
            const gifData = await functions.extractGIFFrames(image)
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
                drawCanvas(image, canvas, pixelCrop)
                const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                if (!firstURL) firstURL = await functions.crop(canvas.toDataURL(), 1)
                frameArray.push(cropped)
                delayArray.push(gifData[i].delay)
            }
            const {width, height} = await functions.imageDimensions(firstURL)
            const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
            const blob = new Blob([buffer])
            croppedURL = URL.createObjectURL(blob)
        } else {
            croppedURL = await functions.crop(url, 1)
        }
        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
        const bytes = Object.values(new Uint8Array(arrayBuffer))
        await axios.post("/api/user/updatepfp", bytes, {withCredentials: true})
        setUserImg("")
        setSessionFlag(true)
        history.push(`/post/${postID}`)
    }

    const toggleScroll = (on: boolean) => {
        if (on) {
            document.body.style.overflowY = "visible"
        } else {
            document.body.style.overflowY = "hidden"
        }
    }

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
                                <img className="set-avatar-image" src={image} onLoad={onImageLoad} ref={ref}/>
                            </ReactCrop>
                            <div className="set-avatar-preview-container">
                                <canvas className="set-avatar-preview" ref={previewRef}></canvas>
                                <div className="set-avatar-button-container">
                                    <button className="set-avatar-button" onClick={() => history.push(`/post/${postID}`)}>Cancel</button>
                                    <button className="set-avatar-button" onClick={() => setAvatar()}>Set Avatar</button>
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