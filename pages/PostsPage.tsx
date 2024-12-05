import React, {useEffect, useContext, useReducer, useState} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import ImageGrid from "../components/ImageGrid"
import Footer from "../components/Footer"
import DownloadDialog from "../dialogs/DownloadDialog"
import PageDialog from "../dialogs/PageDialog"
import ToolTip from "../components/ToolTip"
import TagBanner from "../components/TagBanner"
import BulkFavgroupDialog from "../dialogs/BulkFavgroupDialog"
import BulkTagEditDialog from "../dialogs/BulkTagEditDialog"
import BulkDeleteDialog from "../dialogs/BulkDeleteDialog"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import SaveSearchDialog from "../dialogs/SaveSearchDialog"
import EditSaveSearchDialog from "../dialogs/EditSaveSearchDialog"
import DeleteAllSaveSearchDialog from "../dialogs/DeleteAllSaveSearchDialog"
import {useThemeSelector, useInteractionActions, useSessionSelector, useLayoutActions, 
useActiveActions, useLayoutSelector, useSearchActions} from "../store"

let scrollTimer = null as any
let lastPos = 0

const PostsPage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setMobileScrolling} = useInteractionActions()
    const {setSquare} = useSearchActions()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()

    useEffect(() => {
        setRelative(false)
        setHideNavbar(false)
        setHeaderText("")
        setSidebarText("")
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
        document.title = i18n.title
    }, [i18n])

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
        <CaptchaDialog/>
        <BulkTagEditDialog/>
        <BulkDeleteDialog/>
        <BulkFavgroupDialog/>
        <SaveSearchDialog/>
        <EditSaveSearchDialog/>
        <DeleteAllSaveSearchDialog/>
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