import React, {useEffect, useContext, useState} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, RelativeContext} from "../App"
import "./styles/commentspage.less"

const CommentsPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        setRelative(true)
        document.title = "Moebooru: Comments"
    }, [])


    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="comments-page">
                    <span className="comments-page-heading">Comments</span>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CommentsPage