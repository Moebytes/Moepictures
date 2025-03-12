import React, {useEffect, useState, useReducer} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import PostImage from "../../components/image/PostImage"
import PostModel from "../../components/image/PostModel"
import PostLive2D from "../../components/image/PostLive2D"
import PostSong from "../../components/image/PostSong"
import PostImageOptions from "../../components/post/PostImageOptions"
import Commentary from "../../components/post/Commentary"
import BuyLink from "../../components/post/BuyLink"
import functions from "../../structures/Functions"
import Carousel from "../../components/site/Carousel"
import Children from "../../components/post/Children"
import Parent from "../../components/post/Parent"
import NewTags from "../../components/post/NewTags"
import MobileInfo from "../../components/site/MobileInfo"
import {useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions,  useThemeSelector,
useLayoutSelector, useFlagSelector, useCacheActions, useCacheSelector, useInteractionActions} from "../../store"
import permissions from "../../structures/Permissions"
import "./styles/postpage.less"
import {TagCategories, UnverifiedPost, ChildPost, TagGroupCategory} from "../../types/Types"

const UnverifiedPostPage: React.FunctionComponent = () => {
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
    const [images, setImages] = useState([] as string[])
    const [childPosts, setChildPosts] = useState([] as ChildPost[])
    const [parentPost, setParentPost] = useState(null as ChildPost | null)
    const [image, setImage] = useState("")
    const [post, setPost] = useState(null as UnverifiedPost | null)
    const [tagCategories, setTagCategories] = useState(null as TagCategories | null)
    const [tagGroupCategories, setTagGroupCategories] = useState([] as TagGroupCategory[])
    const [order, setOrder] = useState(1)
    const navigate = useNavigate()
    const {id: postID} = useParams() as {id: string}

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
        if (!session.cookie || !post) return
        if (post.uploader !== session.username && !permissions.isMod(session)) {
            functions.replaceLocation("/403")
        }
    }, [post, session])

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
            let post = unverifiedPosts.find((p) => p.postID === postID)
            if (!post?.tags) post = await functions.get("/api/post/unverified", {postID}, session, setSessionFlag).catch(() => undefined)
            if (post) {
                const tags = await functions.parseTagsUnverified([post])
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                const groupCategories = await functions.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
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
                images = post.images.map((image) => functions.getUnverifiedImageLink(image, true))
            } else {
                images = post.images.map((image) => functions.getUnverifiedImageLink(image))
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
            let post = await functions.get("/api/post/unverified", {postID}, session, setSessionFlag).catch(() => null)
            if (post) {
                const images = post.images.map((image) => functions.getUnverifiedImageLink(image))
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTagsUnverified([post])
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                const groupCategories = await functions.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
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
        let currentIndex = unverifiedPosts.findIndex((p) => p.postID === postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                navigate(`/unverified/post/${id}`)
            }
        }
    }

    const previous = () => {
        let currentIndex = unverifiedPosts.findIndex((p) => p.postID === postID)
        if (currentIndex !== -1) {
            currentIndex--
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                navigate(`/unverified/post/${id}`)
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
                navigate(`/post/${post.originalID}/${post.slug}`)
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
                img = functions.appendURLParams(img, {upscaled: session.upscaledImages})
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
        <TitleBar post={post} unverified={true} goBack={true}/>
        <NavBar/>
        <div className="body">
            <SideBar unverified={true} post={post} order={order} artists={tagCategories?.artists} characters={tagCategories?.characters} 
            series={tagCategories?.series} tags={tagCategories?.tags} meta={tagCategories?.meta} tagGroups={tagGroupCategories}/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set} index={order-1}/>
                    </div> : null}
                    {post ? getPostJSX() : null}
                    {mobile && post && tagCategories ? <MobileInfo post={post} order={order} 
                    artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} 
                    tags={tagCategories.tags} meta={tagCategories.meta} tagGroups={tagGroupCategories}/> : null}
                    {originalPostJSX()}
                    {post ? <NewTags post={post}/> : null}
                    {parentPost ? <Parent post={parentPost}/>: null}
                    {childPosts.length ? <Children posts={childPosts}/>: null}
                    {post?.buyLink ? <BuyLink link={post.buyLink}/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.englishCommentary}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default UnverifiedPostPage