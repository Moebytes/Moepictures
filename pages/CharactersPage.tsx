import React, {useEffect, useContext, useState} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, RelativeContext} from "../App"
import "./styles/characterspage.less"

const CharactersPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        setRelative(true)
        document.title = "Moebooru: Characters"
    }, [])


    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="characters">
                    <span className="characters-heading">Characters</span>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CharactersPage