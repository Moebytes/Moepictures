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
import AndroidAPKIcon from "../../assets/icons/androidapk.svg"
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
        document.title = i18n.mobileApp.title
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const downloadApp = () => {
        functions.dom.download("Moepictures.apk", "https://github.com/Moebytes/Moepictures-App/releases/download/v0.9/Moepictures.apk")
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
                        <div className="help-row">
                            <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
                                <span className="help-text">
                                    {i18n.mobileApp.download}
                                </span>
                                <AndroidAPKIcon className="apk" onClick={downloadApp}/>
                            </div>
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