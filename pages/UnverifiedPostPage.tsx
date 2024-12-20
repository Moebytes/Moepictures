import React, {useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import PostImage from "../components/PostImage"
import PostModel from "../components/PostModel"
import PostLive2D from "../components/PostLive2D"
import PostSong from "../components/PostSong"
import PostImageOptions from "../components/PostImageOptions"
import Commentary from "../components/Commentary"
import BuyLink from "../components/BuyLink"
import functions from "../structures/Functions"
import Carousel from "../components/Carousel"
import ParentDialog from "../dialogs/ParentDialog"
import TagEditDialog from "../dialogs/TagEditDialog"
import SourceEditDialog from "../dialogs/SourceEditDialog"
import UpscalePostDialog from "../dialogs/UpscalePostDialog"
import CompressPostDialog from "../dialogs/CompressPostDialog"
import SaveNoteDialog from "../dialogs/SaveNoteDialog"
import EditNoteDialog from "../dialogs/EditNoteDialog"
import Children from "../components/Children"
import Parent from "../components/Parent"
import NewTags from "../components/NewTags"
import MobileInfo from "../components/MobileInfo"
import {useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions,  useThemeSelector,
useLayoutSelector, useFlagSelector, useCacheActions, useCacheSelector, useInteractionActions} from "../store"
import permissions from "../structures/Permissions"
import "./styles/postpage.less"

interface Props {
    match?: any
}

const UnverifiedPostPage: React.FunctionComponent<Props> = (props) => {
    const {language} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {unverifiedPosts} = useCacheSelector()
    const {setTags} = useCacheActions()
    const {postFlag} = useFlagSelector()
    const {setPostFlag, setDownloadIDs, setDownloadFlag} = useFlagActions()
    const [images, setImages] = useState([]) as any
    const [childPosts, setChildPosts] = useState([]) as any
    const [parentPost, setParentPost] = useState(null) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [tagCategories, setTagCategories] = useState(null) as any
    const [order, setOrder] = useState(1)
    const history = useHistory()
    const postID = props?.match.params.id

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

    const updateChildren = async () => {
        if (post) {
            const childPosts = await functions.get("/api/post/children/unverified", {postID: post.postID}, session, setSessionFlag)
            if (childPosts?.[0]) {
                setChildPosts(childPosts)
            } else {
                setChildPosts([])
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
        updateChildren()
        updateParent()
    }, [post, session])

    useEffect(() => {
        const updateTitle = async () => {
            if (!post) return
            let title = ""
            if (language === "ja") {
                title = post.title ? post.title : "Post"
            } else {
                title = post.englishTitle ? functions.toProperCase(post.englishTitle) : 
                post.title ? post.title : "Post"
            }
            document.title = `${title}`
            if (title !== "Post") setHeaderText(title.replaceAll("-", " "))
        }
        updateTitle()
    }, [post, language])

    useEffect(() => {
        const updatePost = async () => {
            let post = unverifiedPosts.find((p: any) => p.postID === postID)
            if (!post?.tags) post = await functions.get("/api/post/unverified", {postID}, session, setSessionFlag)
            if (post) {
                /*
                const images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.order, i.filename))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }*/
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
        if (post) {
            let images = [] as string[]
            if (session.upscaledImages) {
                images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.order, i.upscaledFilename || i.filename))
            } else {
                images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.order, i.filename))
            }
            setImages(images)
            if (images[order-1]) {
                setImage(images[order-1])
            } else {
                setImage(images[0])
                setOrder(1)
            }
        }
    }, [post, order, session.upscaledImages])

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

    const originalPostJSX = () => {
        if (post?.originalID) {
            const click = (img: string, index: number) => {
                history.push(`/post/${post.originalID}`)
            }
            return (
                <div className="parent">
                    <div className="parent-title">Original Post</div>
                    <div className="parent-container">
                        <Carousel images={[image]} set={click} noKey={true}/>
                    </div>
                </div>
            )
        }
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
        } else if (post.type === "live2d") {
            return (
                <>
                <PostLive2D unverified={true} post={post} live2d={image} order={order}/>
                <PostImageOptions post={post} noFavorite={true} live2d={image} download={download} next={next} previous={previous}/>
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
        <ParentDialog/>
        <TagEditDialog/>
        <SourceEditDialog/>
        {post ? <UpscalePostDialog post={post}/> : null}
        {post ? <CompressPostDialog post={post}/> : null}
        {post ? <SaveNoteDialog post={post} unverified={true}/> : null}
        <EditNoteDialog/>
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
                    {originalPostJSX()}
                    {post ? <NewTags post={post}/> : null}
                    {parentPost ? <Parent post={parentPost}/>: null}
                    {childPosts.length ? <Children posts={childPosts}/>: null}
                    {post?.purchaseLink ? <BuyLink link={post.purchaseLink}/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.englishCommentary}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default UnverifiedPostPage