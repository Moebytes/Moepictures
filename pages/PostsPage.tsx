import React, {useEffect, useContext} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import ImageGrid from "../components/ImageGrid"
import Footer from "../components/Footer"
import DownloadDialog from "../dialogs/DownloadDialog"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, SquareContext, RelativeContext, HideTitlebarContext} from "../Context"

const PostsPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {square, setSquare} = useContext(SquareContext)
    const {relative, setRelative} = useContext(RelativeContext)

    useEffect(() => {
        setRelative(false)
        setHideNavbar(false)
        document.title = "Moebooru: Cutest Anime Art ♡"
        const savedTitlebar = localStorage.getItem("titlebar")
        if (savedTitlebar === "false") {
            setHideTitlebar(true)
            setHideNavbar(true)
        }
        const savedSidebar = localStorage.getItem("sidebar")
        if (savedSidebar === "false") setHideSidebar(true)
        const savedSquare = localStorage.getItem("square")
        if (savedSquare === "true") setSquare(true)
    }, [])

    return (
        <>
        <DragAndDrop/>
        <DownloadDialog/>
        <TitleBar text="Animated, With Audio, Loli"/>
        <NavBar/>
        <div className="body">
            <SideBar text="146 results."/>
            <div className="content">
                <SortBar/>
                <ImageGrid/>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PostsPage