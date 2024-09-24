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
import QuickEditDialog from "../dialogs/QuickEditDialog"
import ThirdParty from "../components/ThirdParty"
import Parent from "../components/Parent"
import NewTags from "../components/NewTags"
import MobileInfo from "../components/MobileInfo"
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadIDsContext, HideTitlebarContext, MobileContext,
UnverifiedPostsContext, TagsContext, HeaderTextContext, PostFlagContext, SidebarTextContext, SessionContext, EnableDragContext} from "../Context"
import axios from "axios"
import permissions from "../structures/Permissions"
import "./styles/postpage.less"

interface Props {
    match?: any
}

const UnverifiedPostPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadIDs, setDownloadIDs} = useContext(DownloadIDsContext)
    const {unverifiedPosts, setUnverifiedPosts} = useContext(UnverifiedPostsContext)
    const {tags, setTags} = useContext(TagsContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const [images, setImages] = useState([]) as any
    const [thirdPartyPosts, setThirdPartyPosts] = useState([]) as any
    const [parentPost, setParentPost] = useState(null) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [tagCategories, setTagCategories] = useState(null) as any
    const history = useHistory()
    const postID = props?.match.params.id

    const refreshCache = async () => {
        try {
            await axios.post(image, null, {withCredentials: true})
        } catch {
            // ignore
        }
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
        document.title = "Unverified Post"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!permissions.isElevated(session)) {
            history.push("/403")
        }
    }, [session])

    const updateThirdParty = async () => {
        if (post) {
            const thirdPartyPosts = await axios.get("/api/post/thirdparty/unverified", {params: {postID: post.postID}, withCredentials: true}).then((r) => r.data)
            if (thirdPartyPosts?.[0]) {
                setThirdPartyPosts(thirdPartyPosts)
            } else {
                setThirdPartyPosts([])
            }
        }
    }

    const updateParent = async () => {
        if (post) {
            const parentPost = await axios.get("/api/post/parent/unverified", {params: {postID: post.postID}, withCredentials: true}).then((r) => r.data)
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
                document.title = `${title}`
                if (title !== "Post") setHeaderText(title.replaceAll("-", " "))
            }
        }
        updatePost()
        updateThirdParty()
        updateParent()
    }, [post])

    useEffect(() => {
        const updatePost = async () => {
            let post = unverifiedPosts.find((p: any) => p.postID === postID)
            if (!post?.tags) post = await axios.get("/api/post/unverified", {params: {postID}, withCredentials: true}).then((r) => r.data)
            if (post) {
                const images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.order, i.filename))
                setImages(images)
                setImage(images[0])
                const tags = await functions.parseTagsUnverified([post])
                const categories = await functions.tagCategories(tags)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                history.push("/404")
            }
        }
        updatePost()
    }, [postID, unverifiedPosts])

    useEffect(() => {
        const updatePost = async () => {
            setPostFlag(false)
            let post = await axios.get("/api/post/unverified", {params: {postID}, withCredentials: true}).then((r) => r.data)
            if (post) {
                const images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.order, i.filename))
                setImages(images)
                setImage(images[0])
                const tags = await functions.parseTagsUnverified([post])
                const categories = await functions.tagCategories(tags)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                history.push("/404")
            }
        }
        if (postFlag) updatePost()
    }, [postFlag])

    const download = () => {
        setDownloadIDs([postID])
        setDownloadFlag(true)
    }

    const next = () => {
        let currentIndex = unverifiedPosts.findIndex((p: any) => p.postID === postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                history.push(`/unverified/post/${id}`)
            }
        }
    }

    const previous = () => {
        let currentIndex = unverifiedPosts.findIndex((p: any) => p.postID === postID)
        if (currentIndex !== -1) {
            currentIndex--
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                history.push(`/unverified/post/${id}`)
            }
        }
    }

    const set = (image: string) => {
        setImage(image)
    }

    const getPostJSX = () => {
        if (!post) return
        if (post.type === "model") {
            return (
                <>
                <PostModel unverified={true} post={post} model={image}/>
                <PostImageOptions post={post} noFavorite={true} model={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else if (post.type === "audio") {
            return (
                <>
                <PostSong unverified={true} post={post} audio={image}/>
                <PostImageOptions noFavorite={true} audio={image} post={post} download={download} next={next} previous={previous}/>
                </>
            )
        } else {
            let img = image
            if (session.cookie) {
                img += `?upscaled=${session.upscaledImages}`
            }
            return (
                <>
                <PostImage unverified={true} post={post} img={img} comicPages={post.type === "comic" ? images : null}/>
                <PostImageOptions post={post} noFavorite={true} img={img} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
                </>
            )
        }
    }

    return (
        <>
        <DragAndDrop/>
        <QuickEditDialog/>
        {post ? <TitleBar post={post} goBack={true}/> : <TitleBar goBack={true}/>}
        <NavBar/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar unverified={true} post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar unverified={true}/>
            }
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set}/>
                    </div> : null}
                    {post ? getPostJSX() : null}
                    {mobile && post && tagCategories ? <MobileInfo post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : null}
                    {post ? <NewTags post={post}/> : null}
                    {parentPost ? <Parent post={parentPost}/>: null}
                    {thirdPartyPosts.length ? <ThirdParty posts={thirdPartyPosts}/>: null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.translatedCommentary}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default UnverifiedPostPage