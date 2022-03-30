import React, {useEffect, useContext} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import ImageGrid from "../components/ImageGrid"
import Footer from "../components/Footer"
import DownloadDialog from "../dialogs/DownloadDialog"
import {HideNavbarContext, HideSidebarContext, SquareContext, RelativeContext} from "../App"

const PostsPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {square, setSquare} = useContext(SquareContext)
    const {relative, setRelative} = useContext(RelativeContext)

    useEffect(() => {
        setRelative(false)
        document.title = "Moebooru: Cutest Anime Art ♡"
        const savedNavbar = localStorage.getItem("navbar")
        if (savedNavbar === "false") setHideNavbar(true)
        const savedSidebar = localStorage.getItem("sidebar")
        if (savedSidebar === "false") setHideSidebar(true)
        const savedSquare = localStorage.getItem("square")
        if (savedSquare === "true") setSquare(true)
    }, [])

    return (
        <>
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