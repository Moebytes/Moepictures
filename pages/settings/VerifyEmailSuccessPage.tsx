import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import Footer from "../../components/site/Footer"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import functions from "../../structures/Functions"
import {useThemeSelector, useInteractionActions, useLayoutActions, useActiveActions, useLayoutSelector} from "../../store"
import "./styles/sitepage.less"
import session from "express-session"

const VerifyEmailSuccessPage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {mobile} = useLayoutSelector()
    const navigate = useNavigate()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
    }, [])

    useEffect(() => {
        document.title = i18n.pages.verifyEmailSuccess.pageTitle
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">{i18n.pages.verifyEmailSuccess.title}</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.verifyEmailSuccess.heading}</span>
                    </div>
                    <div className="sitepage-button-container" style={{justifyContent: "flex-start"}}>
                        <button className="sitepage-button" onClick={() => navigate("/posts")}>{i18n.buttons.ok}</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default VerifyEmailSuccessPage