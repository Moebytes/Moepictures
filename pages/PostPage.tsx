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
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext,
PostsContext, TagsContext, HeaderTextContext} from "../Context"
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
    const [images, setImages] = useState([]) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        document.title = "Moebooru: Post"
    }, [])

    useEffect(() => {
        if (post) {
            const title = post.title ? post.title : "Post"
            document.title = `Moebooru: ${title}`
            setHeaderText(title)
        }
    }, [post])

    useEffect(() => {
        const updatePost = async () => {
            let post = posts.find((p: any) => p.postID === Number(props?.match.params.id))
            if (!post) post = await axios.get("/api/post", {params: {id: props?.match.params.id}}).then((r) => r.data)
            if (post) {
                const images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.filename))
                setImages(images)
                setImage(images[0])
                if (!tags.length) {
                    const tags = await functions.parseTags([post])
                    setTags(tags)
                }
                setPost(post)
            } else {
                history.push("/404")
            }
        }
        updatePost()
    }, [props?.match.params.id, posts])

    const download = () => {
        setDownloadURLs(images)
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
            <SideBar post={post}/>
            <div className="content">
                <div className="post-container">
                    {images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set}/>
                    </div> : null}
                    <PostImage img={image}/>
                    <PostImageOptions download={download} next={next} previous={previous}/>
                    <CutenessMeter/>
                    {post?.commentary ? <Commentary text={post.commentary}/> : null}
                    <Comments/>
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default PostPage