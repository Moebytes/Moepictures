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
import betaImg from "../../assets/images/beta.png"
import functions from "../../functions/Functions"
import "./styles/helppage.less"

const BetaTestPage: React.FunctionComponent = () => {
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
        functions.dom.changeTitle("Beta Test", i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile)
    }, [mobile])

    const openLink = (url: string) => {
        window.open(url, "_blank", "noreferrer")
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
                            <span className="help-heading">Beta Test</span>
                        </div>
                        <div className="help-img-container">
                            <img className="help-img" src={betaImg}/>
                        </div>
                        <span className="help-text">
                            Thanks for your interest in participating in the beta test for the Moepictures mobile app!<br/><br/>

                            Moepictures is an image board dedicated to cute anime artworks in the moe style.<br/><br/>

                            Only the Android beta test is mandatory by Google, and you must keep the app installed for at least 
                            14 days. But if you have an iOS device you are still welcome to test on it and provide feedback! There 
                            is no time commitment for the iOS version.<br/><br/>

                            <span className="help-alt">Beta Instructions</span><br/><br/>

                            - Use the app normally and make sure things work as expected.<br/>
                            - Ensure that no UI elements are inaccessible on your device.<br/>
                            - You may create an account and test account related features.<br/>
                            - You may make a test purchase and ensure you unlocked premium features.<br/><br/>

                            <span className="help-alt">Android</span><br/><br/>

                            You must keep the app installed for 14 days or I won't be able to pass the requirements.<br/><br/>

                            Join our Google group: <a className="help-link" onClick={() => openLink("https://groups.google.com/g/moepics")}>https://groups.google.com/g/moepics</a><br/>
                            Join the beta test: <a className="help-link" onClick={() => openLink("https://play.google.com/apps/testing/com.moebytes.moepictures")}>https://play.google.com/apps/testing/com.moebytes.moepictures</a><br/>
                            Download from the Play Store: <a className="help-link" onClick={() => openLink("https://play.google.com/store/apps/details?id=com.moebytes.moepictures")}>https://play.google.com/store/apps/details?id=com.moebytes.moepictures</a><br/><br/>

                            Sending Feedback: You can post a review, this is only for the testing purposes and won't be displayed when the app is public. 
                            You can also email us at <span style={{marginRight: "10px"}} className="help-alt">moepictures.moe@gmail.com.</span><br/><br/>

                            <span className="help-alt">iOS</span><br/><br/>

                            Download TestFlight: <a className="help-link" onClick={() => openLink("https://apps.apple.com/us/app/testflight/id899247664")}>https://apps.apple.com/us/app/testflight/id899247664</a><br/>
                            Join the beta test: <a className="help-link" onClick={() => openLink("https://testflight.apple.com/join/nnwQGSxB")}>https://testflight.apple.com/join/nnwQGSxB</a><br/><br/>

                            Sending Feedback: You can use the "Send Feedback" button or email us at <span style={{marginRight: "10px"}} className="help-alt">moepictures.moe@gmail.com.</span><br/><br/>

                            Thanks for your help!
                        </span>
                    </div> 
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default BetaTestPage