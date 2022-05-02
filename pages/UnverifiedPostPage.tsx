import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import PostImage from "../components/PostImage"
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
import ThirdParty from "../components/ThirdParty"
import Parent from "../components/Parent"
import NewTags from "../components/NewTags"
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext, MobileContext,
UnverifiedPostsContext, TagsContext, HeaderTextContext, SearchContext, SidebarTextContext, SessionContext, EnableDragContext} from "../Context"
import axios from "axios"
import permissions from "../structures/Permissions"
import "./styles/postpage.less"

interface Props {
    match?: any
}

const UnverifiedPostPage: React.FunctionComponent<Props> = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {unverifiedPosts, setUnverifiedPosts} = useContext(UnverifiedPostsContext)
    const {tags, setTags} = useContext(TagsContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [images, setImages] = useState([]) as any
    const [thirdPartyPosts, setThirdPartyPosts] = useState([]) as any
    const [parentPost, setParentPost] = useState(null) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [tagCategories, setTagCategories] = useState(null) as any
    const history = useHistory()
    const postID = Number(props?.match.params.id)

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
        document.title = "Moebooru: Unverified Post"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!permissions.isStaff(session)) {
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
                document.title = `Moebooru: ${title}`
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
            if (!post) post = await axios.get("/api/post/unverified", {params: {postID}, withCredentials: true}).then((r) => r.data)
            if (post) {
                const images = post.images.map((i: any) => functions.getUnverifiedImageLink(i.type, post.postID, i.filename))
                setImages(images)
                setImage(images[0])
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
    }, [postID, unverifiedPosts])

    const download = () => {
        setDownloadURLs([image])
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

    return (
        <>
        <DragAndDrop/>
        <TitleBar goBack={true}/>
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
                    {post ? <>
                    <PostImage img={image} comicPages={post.type === "comic" ? images : null}/>
                    <PostImageOptions noFavorite={true} img={image} post={post} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
                    </> : <>
                    <PostImage img={image}/>
                    <PostImageOptions noFavorite={true} img={image} download={download} next={next} previous={previous}/>
                    </>}
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