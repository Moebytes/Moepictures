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
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext, MobileContext,
PostsContext, TagsContext, HeaderTextContext, SearchContext, SidebarTextContext, SessionContext} from "../Context"
import axios from "axios"
import "./styles/postpage.less"

interface Props {
    match?: any
}

const PostPage: React.FunctionComponent<Props> = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {tags, setTags} = useContext(TagsContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [images, setImages] = useState([]) as any
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
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        }
    }, [mobile])

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
    }, [post])

    useEffect(() => {
        const updatePost = async () => {
            let post = posts.find((p: any) => p.postID === Number(props?.match.params.id))
            if (!post) post = await axios.get("/api/post", {params: {postID: props?.match.params.id}, withCredentials: true}).then((r) => r.data)
            if (post) {
                const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.filename))
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
    }, [props?.match.params.id, posts])

    const download = () => {
        setDownloadURLs([image])
        setDownloadFlag(true)
    }

    const next = () => {
        let currentIndex = posts.findIndex((p: any) => p.postID === Number(props?.match.params.id))
        if (currentIndex !== -1) {
            currentIndex++
            if (posts[currentIndex]) {
                const id = posts[currentIndex].postID
                history.push(`/post/${id}`)
            }
        }
    }

    const previous = () => {
        let currentIndex = posts.findIndex((p: any) => p.postID === Number(props?.match.params.id))
        if (currentIndex !== -1) {
            currentIndex--
            if (posts[currentIndex]) {
                const id = posts[currentIndex].postID
                history.push(`/post/${id}`)
            }
        }
    }

    const set = (image: string) => {
        setImage(image)
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar/>
            }
            <div className="content">
                <div className="post-container">
                    {images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set}/>
                    </div> : null}
                    {post ? 
                    <>
                    <PostImage img={image} comicPages={post.type === "comic" ? images : null}/>
                    <PostImageOptions img={image} post={post} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
                    </> : 
                    <>
                    <PostImage img={image}/>
                    <PostImageOptions img={image} download={download} next={next} previous={previous}/>
                    </>
                    }
                    {session.username ? <CutenessMeter/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.translatedCommentary}/> : null}
                    {post ?
                    <Comments post={post}/>
                    : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default PostPage