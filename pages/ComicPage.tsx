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
import Carousel from "../components/Carousel"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, RelativeContext, DownloadFlagContext, DownloadURLsContext, HideTitlebarContext} from "../Context"
import page1 from "../assets/images/KarenComplex/001.jpg"
import page2 from "../assets/images/KarenComplex/002.jpg"
import page3 from "../assets/images/KarenComplex/003.jpg"
import page4 from "../assets/images/KarenComplex/004.jpg"
import page5 from "../assets/images/KarenComplex/005.jpg"
import page6 from "../assets/images/KarenComplex/006.jpg"
import page7 from "../assets/images/KarenComplex/007.jpg"
import page8 from "../assets/images/KarenComplex/008.jpg"
import page9 from "../assets/images/KarenComplex/009.jpg"
import page10 from "../assets/images/KarenComplex/010.jpg"
import page11 from "../assets/images/KarenComplex/011.jpg"
import page12 from "../assets/images/KarenComplex/012.jpg"
import page13 from "../assets/images/KarenComplex/013.jpg"
import page14 from "../assets/images/KarenComplex/014.jpg"
import page15 from "../assets/images/KarenComplex/015.jpg"
import page16 from "../assets/images/KarenComplex/016.jpg"
import page17 from "../assets/images/KarenComplex/017.jpg"
import page18 from "../assets/images/KarenComplex/018.jpg"
import page19 from "../assets/images/KarenComplex/019.jpg"
import page20 from "../assets/images/KarenComplex/020.jpg"
import page21 from "../assets/images/KarenComplex/021.jpg"
import page22 from "../assets/images/KarenComplex/022.jpg"
import page23 from "../assets/images/KarenComplex/023.jpg"
import page24 from "../assets/images/KarenComplex/024.jpg"
import page25 from "../assets/images/KarenComplex/025.jpg"
import page26 from "../assets/images/KarenComplex/026.jpg"
import page27 from "../assets/images/KarenComplex/027.jpg"
import page28 from "../assets/images/KarenComplex/028.jpg"
import page29 from "../assets/images/KarenComplex/029.jpg"
import page30 from "../assets/images/KarenComplex/030.jpg"
import "./styles/postpage.less"

interface Props {
    match?: any
}

const ComicPage: React.FunctionComponent<Props> = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const [img, setImg] = useState(page1)

    const pages = [page1, page2, page3, page4, page5,
                page6, page7, page8, page9, page10,
                page11, page12, page13, page14, page15,
                page16, page17, page18, page19, page20,
                page21, page22, page23, page24, page25,
                page26, page27, page28, page29, page30]

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

    const set = (image: string) => {
        setImg(image)
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
                    <div className="carousel-container">
                        <Carousel images={pages} set={set}/>
                    </div>
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

export default ComicPage