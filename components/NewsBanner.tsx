import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {MobileContext, SessionContext, SessionFlagContext, NewsBannerContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import "./styles/newsbanner.less"

const NewsBanner: React.FunctionComponent = (props) => {
    const {mobile, setMobile} = useContext(MobileContext)
    let {newsBanner, setNewsBanner} = useContext(NewsBannerContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const history = useHistory()

    const updateBanner = async () => {
        const banner = await functions.get("/api/misc/banner", null, session, setSessionFlag)
        const bannerHideDate = localStorage.getItem("bannerHideDate")
        if (!bannerHideDate || new Date(bannerHideDate) <= new Date(banner.date)) {
            if (banner?.text) setNewsBanner(banner)
        }
    }

    useEffect(() => {
        if (!session.cookie) return
        updateBanner()
    }, [session])

    const closeBanner = async () => {
        localStorage.setItem("bannerHideDate", new Date().toISOString())
        setNewsBanner(null)
    }

    const openLink = () => {
        history.push(newsBanner.link)
        closeBanner()
    }

    if (newsBanner) {
        return (
            <div className="news-banner">
                {newsBanner.link ? 
                <span className="news-banner-link" onClick={openLink}>{newsBanner.text}</span> :
                <span className="news-banner-text">{newsBanner.text}</span>}
                <span className="news-banner-x" onClick={closeBanner}>x</span>
            </div>
        )
    }
    return null
}

export default NewsBanner