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
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext,
ImagesContext} from "../Context"
import path from "path"
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
    const {images, setImages} = useContext(ImagesContext)
    const [img, setImg] = useState(`../assets/images/${props?.match.params.id}`)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        document.title = "Moebooru: Post"
    }, [])

    useEffect(() => {
        setImg(`../assets/images/${props?.match.params.id}`)
    }, [props?.match.params.id])

    const download = () => {
        setDownloadURLs([img])
        setDownloadFlag(true)
    }

    const next = () => {
        let currentIndex = images.findIndex((i: string) => path.basename(i) === props?.match.params.id)
        if (currentIndex !== -1) {
            currentIndex++
            if (images[currentIndex]) {
                const id = path.basename(images[currentIndex])
                history.push(`/post/${id}`)
            }
        }
    }

    const previous = () => {
        let currentIndex = images.findIndex((i: string) => path.basename(i) === props?.match.params.id)
        if (currentIndex !== -1) {
            currentIndex--
            if (images[currentIndex]) {
                const id = path.basename(images[currentIndex])
                history.push(`/post/${id}`)
            }
        }
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar artist="liely" characters="klee" series="genshin impact" tags="hi" details="tenpi" postID={props?.match.params.id}/>
            <div className="content">
                <div className="post-container">
                    <PostImage img={img}/>
                    <PostImageOptions download={download} next={next} previous={previous}/>
                    <CutenessMeter/>
                    <Commentary/>
                    <Comments/>
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default PostPage