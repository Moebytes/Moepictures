import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
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
import ReportCommentDialog from "../dialogs/ReportCommentDialog"
import ThirdParty from "../components/ThirdParty"
import Parent from "../components/Parent"
import MobileInfo from "../components/MobileInfo"
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext, MobileContext,
PostsContext, TagsContext, HeaderTextContext, PostFlagContext, RedirectContext, SidebarTextContext, SessionContext, EnableDragContext} from "../Context"
import axios from "axios"
import permissions from "../structures/Permissions"
import "./styles/postpage.less"
import jump from "../assets/images/jump.mp3"
import jumpImg from "../assets/images/jump.jpg"

interface Props {
    match?: any
}

const MP3Page: React.FunctionComponent<Props> = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {tags, setTags} = useContext(TagsContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const [images, setImages] = useState([]) as any
    const [thirdPartyPosts, setThirdPartyPosts] = useState([]) as any
    const [parentPost, setParentPost] = useState(null) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [tagCategories, setTagCategories] = useState(null) as any
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setSidebarText("")
        document.title = "Moebooru: Post"
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

    const updateThirdParty = async (source: any) => {
        if (post) {
            const thirdPartyPosts = await axios.get("/api/post/thirdparty", {params: {postID: post.postID}, withCredentials: true, cancelToken: source.token}).then((r) => r.data)
            if (thirdPartyPosts?.[0]) {
                setThirdPartyPosts(thirdPartyPosts)
            } else {
                setThirdPartyPosts([])
            }
        }
    }

    const updateParent = async (source: any) => {
        if (post) {
            const parentPost = await axios.get("/api/post/parent", {params: {postID: post.postID}, withCredentials: true, cancelToken: source.token}).then((r) => r.data)
            if (parentPost) {
                setParentPost(parentPost)
            } else {
                setParentPost(null)
            }
        }
    }

    useEffect(() => {
        const source = axios.CancelToken.source()
        const updatePost = async () => {
            if (post) {
                const title = post.translatedTitle ? functions.toProperCase(post.translatedTitle) : 
                              post.title ? post.title : "Post"
                document.title = `Moebooru: ${title}`
                if (title !== "Post") setHeaderText(title.replaceAll("-", " "))
            }
        }
        updatePost()
        updateThirdParty(source)
        updateParent(source)
        return () => source.cancel()
    }, [post])

    return (
        <>
        <DragAndDrop/>
        <EditCommentDialog/>
        <DeleteCommentDialog/>
        <ReportCommentDialog/>
        {post ? <DeletePostDialog post={post}/> : null}
        <TitleBar goBack={true}/>
        <NavBar/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar/>
            }
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {post ? <>
                    <PostSong audio={jump} coverImg={jumpImg} comicPages={post.type === "comic" ? images : null}/>
                    <PostImageOptions img={jumpImg} post={post} comicPages={post.type === "comic" ? images : null} download={() => null}/>
                    </> : null}
                    {mobile && post && tagCategories ? <MobileInfo post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : null}
                    {parentPost ? <Parent post={parentPost}/>: null}
                    {thirdPartyPosts.length ? <ThirdParty posts={thirdPartyPosts}/>: null}
                    {session.username && post ? <CutenessMeter post={post}/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.translatedCommentary}/> : null}
                    {post ? <Comments post={post}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default MP3Page