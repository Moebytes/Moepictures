/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useInteractionActions,
useLayoutActions, useActiveActions, useLayoutSelector} from "../../store"
import functions from "../../functions/Functions"
import AppStoreIcon from "../../assets/icons/app-store.svg"
import GooglePlayIcon from "../../assets/icons/google-play.svg"
import mobileImg from "../../assets/images/mobileapp.jpg"
import "./styles/helppage.less"

const MobileAppPage: React.FunctionComponent = () => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {mobile} = useLayoutSelector()

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        functions.dom.changeTitle(i18n.mobileApp.title, i18n)
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const openLink = (url: string) => {
        window.open(url, "_blank")
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="help">
                    <div className="help-container">
                        <div className="help-row">
                            <span className="help-heading">{i18n.mobileApp.title}</span>
                        </div>
                        <span className="help-text">
                            {i18n.mobileApp.line1}<br/><br/>

                            {i18n.mobileApp.line2}
                        </span>
                        <div className="help-img-container">
                            <img className="help-img" src={mobileImg}/>
                        </div>
                        <div className="help-row" style={{display: "flex", gap: "20px"}}>
                            <AppStoreIcon className="app-icon" onClick={() => openLink("https://apps.apple.com/us/app/moepictures/id6762224302")}/>
                            <GooglePlayIcon className="app-icon" onClick={() => openLink("https://play.google.com/store/apps/details?id=com.moebytes.moepictures")}/>
                        </div>
                    </div> 
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default MobileAppPage