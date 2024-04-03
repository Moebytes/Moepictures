import React, {useEffect, useContext, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import PostImage from "../components/PostImage"
import PostModel from "../components/PostModel"
import PostSong from "../components/PostSong"
import PostImageOptions from "../components/PostImageOptions"
import CutenessMeter from "../components/CutenessMeter"
import Comments from "../components/Comments"
import Commentary from "../components/Commentary"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import Carousel from "../components/Carousel"
import DeletePostDialog from "../dialogs/DeletePostDialog"
import DeleteCommentDialog from "../dialogs/DeleteCommentDialog"
import EditCommentDialog from "../dialogs/EditCommentDialog"
import EditTranslationDialog from "../dialogs/EditTranslationDialog"
import SaveTranslationDialog from "../dialogs/SaveTranslationDialog"
import ReportCommentDialog from "../dialogs/ReportCommentDialog"
import QuickEditDialog from "../dialogs/QuickEditDialog"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import ThirdParty from "../components/ThirdParty"
import Parent from "../components/Parent"
import ArtistWorks from "../components/ArtistWorks"
import Related from "../components/Related"
import MobileInfo from "../components/MobileInfo"
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext, MobileContext, ReloadPostFlagContext,
PostsContext, TagsContext, HeaderTextContext, PostFlagContext, RedirectContext, SidebarTextContext, SessionContext, SessionFlagContext, EnableDragContext, TranslationModeContext} from "../Context"
import axios from "axios"
import permissions from "../structures/Permissions"
import "./styles/postpage.less"

let characterTag = ""

interface Props {
    match?: any
}

const PostPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {translationMode, setTranslationMode} = useContext(TranslationModeContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {tags, setTags} = useContext(TagsContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const {reloadPostFlag, setReloadPostFlag} = useContext(ReloadPostFlagContext)
    const [images, setImages] = useState([]) as any
    const [thirdPartyPosts, setThirdPartyPosts] = useState([]) as any
    const [artistPosts, setArtistPosts] = useState([]) as any
    const [relatedPosts, setRelatedPosts] = useState([]) as any
    const [parentPost, setParentPost] = useState(null) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [loaded, setLoaded] = useState(false)
    const [tagCategories, setTagCategories] = useState(null) as any
    const [order, setOrder] = useState(1)
    const history = useHistory()
    const postID = props?.match.params.id

    const refreshCache = async () => {
        axios.post(image, null, {withCredentials: true}).catch(() => null)
    }

    useEffect(() => {
        if (image) refreshCache()
    }, [image])

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setSidebarText("")
        setReloadPostFlag(true)
        document.title = "Moebooru: Post"
        const savedPost = localStorage.getItem("savedPost")
        const savedTags = localStorage.getItem("savedTags")
        const savedOrder = localStorage.getItem("order")
        if (savedPost) setPost(JSON.parse(savedPost))
        if (savedTags) setTagCategories(JSON.parse(savedTags))
        if (savedOrder) setTimeout(() => {setOrder(Number(savedOrder))}, 500)
        if (!posts?.length) {
            const savedPosts = localStorage.getItem("savedPosts")
            if (savedPosts) setPosts(JSON.parse(savedPosts))
        }
    }, [])

    useEffect(() => {
        localStorage.setItem("order", String(order))
    }, [order])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie || !post) return
        if (post.postID !== postID) return
        if (!session.username && post.restrict !== "safe") {
            setRedirect(`/post/${postID}`)
            history.push("/login")
            setSidebarText("Login required.")
        }
        if (post.restrict === "explicit") {
            if (!permissions.isStaff(session)) {
                history.push("/403")
            } else {
                setLoaded(true)
            }
        } else {
            setLoaded(true)
        }
    }, [session, post])

    const updateThirdParty = async () => {
        if (post) {
            const thirdPartyPosts = await axios.get("/api/post/thirdparty", {params: {postID: post.postID}, withCredentials: true}).then((r) => r.data)
            if (thirdPartyPosts?.[0]) {
                setThirdPartyPosts(thirdPartyPosts)
            } else {
                setThirdPartyPosts([])
            }
        }
    }

    const updateParent = async () => {
        if (post) {
            const parentPost = await axios.get("/api/post/parent", {params: {postID: post.postID}, withCredentials: true}).then((r) => r.data)
            if (parentPost) {
                setParentPost(parentPost)
            } else {
                setParentPost(null)
            }
        }
    }

    useEffect(() => {
        const updatePost = async () => {
            if (post) {
                const title = post.translatedTitle ? functions.toProperCase(post.translatedTitle) : 
                              post.title ? post.title : "Post"
                document.title = `Moebooru: ${title}`
                if (title !== "Post") setHeaderText(title.replaceAll("-", " "))
            }
        }
        updatePost()
        updateParent()
        updateThirdParty()
    }, [post])

    useEffect(() => {
        const updateArtistPosts = async () => {
            if (tagCategories?.artists?.[0]?.tag) {
                const artistPosts = await axios.get("/api/search/posts", {params: {query: tagCategories.artists[0].tag, type: "all", restrict: "all", style: "all", sort: "drawn", limit: 10000}, withCredentials: true}).then((r) => r.data)
                setArtistPosts(artistPosts)
            }
        }
        const updateRelatedPosts = async () => {
            if (!tagCategories?.characters?.[0].tag) return
            if (tagCategories.characters[0].tag !== characterTag) {
                const relatedPosts = await axios.get("/api/search/posts", {params: {query: tagCategories.characters[0].tag, type: post.type, restrict: post.restrict === "explicit" ? "explicit" : "all", style: post.style, sort: Math.random() > 0.5 ? "date" : "reverse date", limit: 200}, withCredentials: true}).then((r) => r.data)
                setRelatedPosts(relatedPosts)
                characterTag = tagCategories.characters[0].tag
            }
        }
        updateArtistPosts()
        updateRelatedPosts()
    }, [post, tagCategories])

    useEffect(() => {
        const updatePost = async () => {
            setLoaded(false)
            let post = posts.find((p: any) => p.postID === postID)
            try {
                if (!post) post = await axios.get("/api/post", {params: {postID}, withCredentials: true}).then((r) => r.data)
            } catch {
                return
            }
            if (post) {
                let images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                // images = await Promise.all(images.map((img: string) => functions.linkToBase64(img)))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImages(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTags([post])
                const categories = await functions.tagCategories(tags)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                if (!post.tags) {
                    try {
                        post = await axios.get("/api/post", {params: {postID}, withCredentials: true}).then((r) => r.data)
                        setPost(post)
                    } catch {
                        return
                    }
                }
                setSessionFlag(true)
            } else {
                history.push("/404")
            }
        }
        updatePost()
    }, [postID, posts, order])

    useEffect(() => {
        const updatePost = async () => {
            setLoaded(false)
            setPostFlag(false)
            let post = null as any
            try {
                post = await axios.get("/api/post", {params: {postID}, withCredentials: true}).then((r) => r.data)
            } catch {
                return
            }
            if (post) {
                let images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                // images = await Promise.all(images.map((img: string) => functions.linkToBase64(img)))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImages(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTags([post])
                const categories = await functions.tagCategories(tags)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                setSessionFlag(true)
            } else {
                history.push("/404")
            }
        }
        if (postFlag) updatePost()
    }, [postFlag, order])

    const download = () => {
        setDownloadURLs([image])
        setDownloadFlag(true)
    }

    const next = async () => {
        let currentIndex = posts.findIndex((p: any) => p.postID === postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (!session.username) {
                while (posts[currentIndex]?.restrict !== "safe") {
                    currentIndex++
                    if (currentIndex >= posts.length) break
                }
            }
            if (posts[currentIndex]) {
                const post = posts[currentIndex]
                if (post.fake) return
                history.push(`/post/${post.postID}`)
            }
        }
    }

    const previous = async () => {
        let currentIndex = posts.findIndex((p: any) => p.postID === postID)
        if (currentIndex !== -1) {
            currentIndex--
            if (!session.username) {
                while (posts[currentIndex]?.restrict !== "safe") {
                    currentIndex--
                    if (currentIndex <= -1) break
                }
            }
            if (posts[currentIndex]) {
                const post = posts[currentIndex]
                if (post.fake) return
                history.push(`/post/${post.postID}`)
            }
        }
    }

    const set = (image: string, index: number) => {
        setImage(image)
        setOrder(index + 1)
        forceUpdate()
    }

    const nsfwChecker = () => {
        if (!post) return false
        if (post.postID !== postID) return false
        if (post.restrict !== "safe") {
            if (loaded) return true 
            return false
        } else {
            return true
        }
    }

    const getPostJSX = () => {
        if (!post) return
        if (post.type === "model") {
            return (
                <>
                <PostModel post={post} model={image} order={order}/>
                <PostImageOptions post={post} model={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else if (post.type === "audio") {
            return (
                <>
                <PostSong post={post} audio={image} order={order}/>
                <PostImageOptions post={post} audio={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else {
            return (
                <>
                <PostImage post={post} img={image} comicPages={post.type === "comic" ? images : null} order={order}/>
                <PostImageOptions post={post} img={image} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
                </>
            )
        }
    }

    return (
        <>
        <DragAndDrop/>
        <CaptchaDialog/>
        <QuickEditDialog/>
        <EditCommentDialog/>
        <DeleteCommentDialog/>
        <ReportCommentDialog/>
        {post ? <DeletePostDialog post={post}/> : null}
        {post ? <SaveTranslationDialog post={post}/> : null}
        <EditTranslationDialog/>
        <TitleBar goBack={true}/>
        <NavBar goBack={true}/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar/>
            }
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {nsfwChecker() && images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set} index={order-1}/>
                    </div> : null}
                    {nsfwChecker() && post ? getPostJSX() : null}
                    {mobile && post && tagCategories ? <MobileInfo post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : null}
                    {parentPost ? <Parent post={parentPost}/>: null}
                    {thirdPartyPosts.length ? <ThirdParty posts={thirdPartyPosts}/> : null}
                    {artistPosts.length ? <ArtistWorks posts={artistPosts}/> : null}
                    {session.username && post ? <CutenessMeter post={post}/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.translatedCommentary}/> : null}
                    {relatedPosts.length ? <Related related={relatedPosts}/> : null}
                    {post ? <Comments post={post}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default PostPage