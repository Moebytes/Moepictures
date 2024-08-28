import React, {useEffect, useContext, useReducer, useState} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import ImageGrid from "../components/ImageGrid"
import Footer from "../components/Footer"
import DownloadDialog from "../dialogs/DownloadDialog"
import PageDialog from "../dialogs/PageDialog"
import DragAndDrop from "../components/DragAndDrop"
import ToolTip from "../components/ToolTip"
import TagBanner from "../components/TagBanner"
import BulkQuickEditDialog from "../dialogs/BulkQuickEditDialog"
import {HideNavbarContext, HideSidebarContext, SquareContext, RelativeContext, HideTitlebarContext, 
HeaderTextContext, SidebarTextContext, MobileContext, MobileScrollingContext, SessionContext} from "../Context"

let scrollTimer = null as any
let lastPos = 0

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
    const {session, setSession} = useContext(SessionContext)
    const {mobileScrolling, setMobileScrolling} = useContext(MobileScrollingContext)
    const [clicked, setClicked] = useState(false)

    useEffect(() => {
        setRelative(false)
        setHideNavbar(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Cutest Anime Art ♡"
        const savedTitlebar = localStorage.getItem("titlebar")
        if (savedTitlebar === "false") {
            setHideTitlebar(true)
            setHideNavbar(true)
        }
        const savedSidebar = localStorage.getItem("sidebar")
        if (savedSidebar === "false") setHideSidebar(true)
        const savedSquare = localStorage.getItem("square")
        if (savedSquare === "true") setSquare(true)

        return () => {
            setMobileScrolling(false)
        }
    }, [])

    useEffect(() => {
        const scrollHandler = () => {
            const currentScroll = window.scrollY
            if (currentScroll < 5) return setMobileScrolling(false)
            clearTimeout(scrollTimer)
            scrollTimer = setTimeout(() => {
                lastPos = currentScroll
            }, 500)
            if (Math.abs(currentScroll - lastPos) > 200) setMobileScrolling(true)
        }
        const handleMouseMove = (event: any) => {
            if (window.scrollY < 5) return setMobileScrolling(false)
            const amt = 180
            if (event.clientY < amt) {
                setMobileScrolling(false)
            }
        }
        const handleTouchEnd = (event: any) => {
            if (window.scrollY < 5) return setMobileScrolling(false)
            const amt = 180
            if (event.touches[0].clientY < amt) {
                event.preventDefault()
                event.stopPropagation()
                setMobileScrolling(false)
            }
        }
        if (mobile) {
            window.addEventListener("scroll", scrollHandler)
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("touchend", handleTouchEnd)
        } else {
            setRelative(false)
        }
        return () => {
            window.removeEventListener("scroll", scrollHandler)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("touchend", handleTouchEnd)
        }
    }, [mobile])

    const tagBannerJSX = () => {
        if (!session?.username) return <TagBanner/>
        return session.showTagBanner ? <TagBanner/> : null
    }

    return (
        <>
        <DragAndDrop/>
        <BulkQuickEditDialog/>
        <PageDialog/>
        <DownloadDialog/>
        <TitleBar reset={true}/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <ToolTip/>
                <SortBar/>
                {tagBannerJSX()}
                <ImageGrid/>
                <Footer noPadding={true}/>
            </div>
        </div>
        </>
    )
}

export default PostsPage