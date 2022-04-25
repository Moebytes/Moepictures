import React, {useEffect, useContext, useReducer} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import ImageGrid from "../components/ImageGrid"
import Footer from "../components/Footer"
import DownloadDialog from "../dialogs/DownloadDialog"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, SquareContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, MobileContext} from "../Context"

const PostsPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {square, setSquare} = useContext(SquareContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {mobile, setMobile} = useContext(MobileContext)

    useEffect(() => {
        setRelative(false)
        setHideNavbar(false)
        setHeaderText("")
        setSidebarText("")
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

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    return (
        <>
        <DragAndDrop/>
        <DownloadDialog/>
        <TitleBar reset={true}/>
        <NavBar/>
        <div className="body">
            <SideBar/>
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