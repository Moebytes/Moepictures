import React, {useEffect, useContext, useState} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import PostImage from "../components/PostImage"
import PostImageOptions from "../components/PostImageOptions"
import CutenessMeter from "../components/CutenessMeter"
import Comments from "../components/Comments"
import Commentary from "../components/Commentary"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext} from "../Context"
import satania from "../assets/images/gif2.gif"
import "./styles/postpage.less"

interface Props {
    match?: any
}

const PostPage: React.FunctionComponent<Props> = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const [img, setImg] = useState(satania)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        document.title = "Moebooru: Post"
    }, [])

    const download = () => {
        setDownloadURLs([img])
        setDownloadFlag(true)
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar artist="liely" characters="klee" series="genshin impact" tags="hi" details="tenpi" postID={1}/>
            <div className="content">
                <div className="post-container">
                    <PostImage img={img}/>
                    <PostImageOptions download={download}/>
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