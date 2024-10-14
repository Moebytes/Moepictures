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
UnverifiedPostsContext, TagsContext, HeaderTextContext, PostFlagContext, SidebarTextContext, SessionContext, EnableDragContext, SessionFlagContext} from "../Context"
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
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const [images, setImages] = useState([]) as any
    const [thirdPartyPosts, setThirdPartyPosts] = useState([]) as any
    const [parentPost, setParentPost] = useState(null) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [tagCategories, setTagCategories] = useState(null) as any
    const [order, setOrder] = useState(1)
    const history = useHistory()
    const postID = props?.match.params.id

    useEffect(() => {
        if (image) functions.refreshCache(image)
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
        if (!permissions.isMod(session)) {
            functions.replaceLocation("/403")
        }
    }, [session])

    const updateThirdParty = async () => {
        if (post) {
            const thirdPartyPosts = await functions.get("/api/post/thirdparty/unverified", {postID: post.postID}, session, setSessionFlag)
            if (thirdPartyPosts?.[0]) {
                setThirdPartyPosts(thirdPartyPosts)
            } else {
                setThirdPartyPosts([])
            }
        }
    }

    const updateParent = async () => {
        if (post) {
            const parentPost = await functions.get("/api/post/parent/unverified", {postID: post.postID}, session, setSessionFlag)
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
    }, [post, session])

    useEffect(() => {
        const updatePost = async () => {
            let post = unverifiedPosts.find((p: any) => p.postID === postID)
            if (!post?.tags) post = await functions.get("/api/post/unverified", {postID}, session, setSessionFlag)
            if (post) {
                const images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.order, i.filename))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTagsUnverified([post])
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                functions.replaceLocation("/404")
            }
        }
        updatePost()
    }, [postID, unverifiedPosts, order, session])

    useEffect(() => {
        const updatePost = async () => {
            setPostFlag(false)
            let post = await functions.get("/api/post/unverified", {postID}, session, setSessionFlag)
            if (post) {
                const images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.order, i.filename))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTagsUnverified([post])
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
            } else {
                functions.replaceLocation("/404")
            }
        }
        if (postFlag) updatePost()
    }, [postFlag, order, session])

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

    const set = (image: string, index: number) => {
        setImage(image)
        setOrder(index + 1)
    }

    const getPostJSX = () => {
        if (!post) return
        if (post.type === "model") {
            return (
                <>
                <PostModel unverified={true} post={post} model={image} order={order}/>
                <PostImageOptions post={post} noFavorite={true} model={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else if (post.type === "audio") {
            return (
                <>
                <PostSong unverified={true} post={post} audio={image} order={order}/>
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
                <PostImage unverified={true} post={post} img={img} comicPages={post.type === "comic" ? images : null} order={order}/>
                <PostImageOptions post={post} noFavorite={true} img={img} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
                </>
            )
        }
    }

    return (
        <>
        <QuickEditDialog/>
        {post ? <TitleBar post={post} goBack={true}/> : <TitleBar goBack={true}/>}
        <NavBar/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar unverified={true} post={post} order={order} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar unverified={true}/>
            }
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set} index={order-1}/>
                    </div> : null}
                    {post ? getPostJSX() : null}
                    {mobile && post && tagCategories ? <MobileInfo post={post} order={order} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : null}
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