/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import SortBar from "../../components/site/SortBar"
import ImageGrid from "../../components/search/ImageGrid"
import Footer from "../../components/site/Footer"
import TagBanner from "../../components/banner/TagBanner"
import functions from "../../functions/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useLayoutActions, 
useActiveActions, useLayoutSelector} from "../../store"

let scrollTimer = null as any
let lastPos = 0

const PostsPage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setRelative} = useLayoutActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setMobileScrolling} = useInteractionActions()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const [imagesLoaded, setImagesLoaded] = useState(false)

    useEffect(() => {
        setRelative(false)
        setHideNavbar(false)
        setHeaderText("")
        setSidebarText("")
        return () => {
            setMobileScrolling(false)
        }
    }, [])

    useEffect(() => {
        functions.dom.changeTitle("", i18n)
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
        const handleMouseMove = (event: MouseEvent) => {
            if (window.scrollY < 5) return setMobileScrolling(false)
            const amt = 180
            if (event.clientY < amt) {
                setMobileScrolling(false)
            }
        }
        const handleTouchEnd = (event: TouchEvent) => {
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
        <TitleBar reset={true}/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <SortBar/>
                {tagBannerJSX()}
                <ImageGrid imagesLoaded={imagesLoaded} setImagesLoaded={setImagesLoaded}/>
                <Footer noPadding={true}/>
            </div>
        </div>
        </>
    )
}

export default PostsPage