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
import TakedownPostDialog from "../dialogs/TakedownPostDialog"
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
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadIDsContext, HideTitlebarContext, MobileContext, ReloadPostFlagContext,
PostsContext, TagsContext, HeaderTextContext, PostFlagContext, RedirectContext, SidebarTextContext, SessionContext, SessionFlagContext, EnableDragContext, TranslationModeContext,
OrderContext} from "../Context"
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
    const {downloadIDs, setDownloadIDs} = useContext(DownloadIDsContext)
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
    const {order, setOrder} = useContext(OrderContext)
    const history = useHistory()
    const postID = props?.match.params.id

    const refreshCache = async () => {
        // axios.post(image, null, {withCredentials: true}).catch(() => null)
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
        document.title = "Post"
        const savedPost = localStorage.getItem("savedPost")
        const savedTags = localStorage.getItem("savedTags")
        if (savedPost) setPost(JSON.parse(savedPost))
        if (savedTags) setTagCategories(JSON.parse(savedTags))
        if (!posts?.length) {
            const savedPosts = localStorage.getItem("savedPosts")
            if (savedPosts) setPosts(JSON.parse(savedPosts))
        }
        const onDOMLoaded = () => {
            const savedOrder = localStorage.getItem("order")
            if (savedOrder) setOrder(Number(savedOrder))
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
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
        if (!session.username) {
            setRedirect(`/post/${postID}`)
        }
        if (!session.username && post.restrict !== "safe") {
            history.push("/login")
            setSidebarText("Login required.")
        }
        if (post.restrict === "explicit") {
            if (!session.showR18) {
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
            const thirdPartyPosts = await functions.get("/api/post/thirdparty", {postID: post.postID}, session, setSessionFlag).catch(() => [])
            if (thirdPartyPosts?.[0]) {
                setThirdPartyPosts(thirdPartyPosts)
            } else {
                setThirdPartyPosts([])
            }
        }
    }

    const updateParent = async () => {
        if (post) {
            const parentPost = await functions.get("/api/post/parent", {postID: post.postID}, session, setSessionFlag).catch(() => null)
            if (parentPost) {
                setParentPost(parentPost)
            } else {
                setParentPost(null)
            }
        }
    }

    const saveHistory = async () => {
        if (post && session.username) {
            await functions.post("/api/post/view", {postID: post.postID}, session, setSessionFlag)
        }
    }

    useEffect(() => {
        const updatePost = async () => {
            if (post) {
                const title = post.translatedTitle ? functions.toProperCase(post.translatedTitle) : 
                              post.title ? post.title : "Post"
                document.title = `${title}`
                if (title !== "Post") setHeaderText(title.replaceAll("-", " "))
            }
        }
        updatePost()
        updateParent()
        updateThirdParty()
        saveHistory()
    }, [post, session])

    useEffect(() => {
        if (!session.cookie) return
        const updateArtistPosts = async () => {
            if (tagCategories?.artists?.[0]?.tag) {
                try {
                    if (tagCategories.artists[0].tag === "unknown-artist") return
                    const artistPosts = await functions.get("/api/search/posts", {query: tagCategories.artists[0].tag, type: "all", restrict: "all", style: "all", sort: "drawn", limit: mobile ? 10 : 100}, session, setSessionFlag)
                    if (artistPosts?.length) setArtistPosts(artistPosts)
                } catch (err) {
                    console.log(err)
                }
            }
        }
        const updateRelatedPosts = async () => {
            if (!tagCategories?.characters?.[0]?.tag) return
            if (tagCategories?.characters?.[0]?.tag !== characterTag) {
                try {
                    const relatedPosts = await functions.get("/api/search/posts", {query: tagCategories.characters[0].tag, type: post.type, restrict: post.restrict === "explicit" ? "explicit" : "all", style: post.style, sort: Math.random() > 0.5 ? "date" : "reverse date", limit: mobile ? 10 : 30}, session, setSessionFlag)
                    if (relatedPosts?.length) setRelatedPosts(relatedPosts)
                    characterTag = tagCategories.characters[0].tag
                } catch (err) {
                    console.log(err)
                }
            }
        }
        if (session.showRelated) {
            updateArtistPosts()
            updateRelatedPosts()
        }
    }, [session, post, tagCategories])

    useEffect(() => {
        const updatePost = async () => {
            setLoaded(false)
            let post = posts.find((p: any) => p.postID === postID)
            try {
                if (!post) post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            } catch (err: any) {
                if (err.response?.status === 404) history.push("/404")
                if (err.response?.status === 403) history.push("/403")
                return
            }
            if (post) {
                let images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                // images = await Promise.all(images.map((img: string) => functions.linkToBase64(img)))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                if (!post.tags) {
                    try {
                        post = await functions.get("/api/post", {postID}, session, setSessionFlag)
                        setPost(post)
                    } catch (err: any) {
                        if (err.response?.status === 404) history.push("/404")
                        if (err.response?.status === 403) history.push("/403")
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
                post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            } catch (err: any) {
                if (err.response?.status === 404) history.push("/404")
                if (err.response?.status === 403) history.push("/403")
                return
            }
            if (post) {
                let images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                // images = await Promise.all(images.map((img: string) => functions.linkToBase64(img)))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                setSessionFlag(true)
            } else {
                history.push("/404")
            }
        }
        if (postFlag) updatePost()
    }, [postFlag, order, session])

    const download = () => {
        setDownloadIDs([postID])
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
            let img = image
            if (session.cookie) {
                img += `?upscaled=${session.upscaledImages}`
            }
            return (
                <>
                <PostImage post={post} img={img} comicPages={post.type === "comic" ? images : null} order={order}/>
                <PostImageOptions post={post} img={img} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
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
        {post ? <TakedownPostDialog post={post}/> : null}
        {post ? <SaveTranslationDialog post={post}/> : null}
        <EditTranslationDialog/>
        {post ? <TitleBar post={post} goBack={true}/> : <TitleBar goBack={true}/>}
        <NavBar goBack={true}/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar/>
            }
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {/*nsfwChecker() &&*/ images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set} index={order-1}/>
                    </div> : null}
                    {/*nsfwChecker() &&*/ post ? getPostJSX() : null}
                    {mobile && post && tagCategories ? <MobileInfo post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : null}
                    {parentPost ? <Parent post={parentPost}/>: null}
                    {thirdPartyPosts.length ? <ThirdParty posts={thirdPartyPosts}/> : null}
                    {session.username && !session.banned && post ? <CutenessMeter post={post}/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.translatedCommentary}/> : null}
                    {artistPosts.length ? <ArtistWorks posts={artistPosts}/> : null}
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