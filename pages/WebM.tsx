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
PostsContext, TagsContext, HeaderTextContext, SearchContext} from "../Context"
import paimon from "../assets/images/kleegif.webm"
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
    const [tagCategories, setTagCategories] = useState(null) as any
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        document.title = "Moebooru: Post"
    }, [])

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
            {post && tagCategories ? 
            <SideBar post={post} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar/>
            }
            <div className="content">
                <div className="post-container">
                    <PostImage img={paimon}/>
                    <PostImageOptions img={paimon} download={download} next={next} previous={previous}/>
                    <CutenessMeter/>
                    {post?.commentary ? <Commentary text={post.commentary}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default PostPage