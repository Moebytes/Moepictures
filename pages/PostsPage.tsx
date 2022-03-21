import React, {useEffect, useContext} from "react"
import TitleBar from "./TitleBar"
import NavBar from "./NavBar"
import SideBar from "./SideBar"
import SortBar from "./SortBar"
import ImageGrid from "./ImageGrid"
import Footer from "./Footer"
import {HideNavbarContext, HideSidebarContext, SquareContext} from "../App"

const PostsPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {square, setSquare} = useContext(SquareContext)

    useEffect(() => {
        document.title = "Moebooru: Cutest Anime Art on the Internet ♡"
        const savedNavbar = localStorage.getItem("navbar")
        if (savedNavbar === "false") setHideNavbar(true)
        const savedSidebar = localStorage.getItem("sidebar")
        if (savedSidebar === "false") setHideSidebar(true)
        const savedSquare = localStorage.getItem("square")
        if (savedSquare === "true") setSquare(true)
    }, [])

    return (
        <>
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