/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import permissions from "../../structures/Permissions"
import functions from "../../functions/Functions"
import TermsIcon from "../../assets/svg/terms.svg"
import PrivacyIcon from "../../assets/svg/privacy.svg"
import {useThemeSelector, useInteractionActions, useLayoutActions, 
useActiveActions, useLayoutSelector} from "../../store"
import "./styles/tospage.less"

const TermsPage: React.FunctionComponent = (props) => {
    const {siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {mobile} = useLayoutSelector()
    const [onPrivacy, setOnPrivacy] = useState(false)

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
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (onPrivacy) {
            document.title = i18n.terms.privacy.title
        } else {
            document.title = i18n.terms.tos.title
        }
    }, [onPrivacy, i18n])
    
    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="terms-container">
                    <div className="terms">
                        <div className="terms-title-container">
                            <TermsIcon className="terms-img"/>
                            <span className="terms-title">{i18n.terms.tos.title}</span>
                        </div>
                        <div className="terms-text">
                            {i18n.terms.tos.lastUpdated}<br/><br/>

                            {i18n.terms.tos.header1}<br/><br/>

                            {i18n.terms.tos.header2}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.ageRestriction.title}
                            </span><br/><br/>

                            {i18n.terms.tos.ageRestriction.line1}<br/><br/>

                            <span className="terms-text-alt">{i18n.sortbar.rating.cute}</span>
                            {i18n.terms.tos.ageRestriction.cuteRating}<br/><br/>
                            <span className="terms-text-alt">{i18n.sortbar.rating.sexy}</span>
                            {i18n.terms.tos.ageRestriction.sexyRating}<br/><br/>
                            <span className="terms-text-alt">{i18n.sortbar.rating.erotic}</span>
                            {i18n.terms.tos.ageRestriction.eroticRating}<br/><br/>

                            {i18n.terms.tos.ageRestriction.line2}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.animeOnly.title}
                            </span><br/><br/>

                            {i18n.terms.tos.animeOnly.line1}{" "}
                            {i18n.terms.tos.animeOnly.line2}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.spam.title}
                            </span><br/><br/>

                            {i18n.terms.tos.spam.line1}{" "}
                            {i18n.terms.tos.spam.line2}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.harassment.title}
                            </span><br/><br/>

                            {i18n.terms.tos.harassment.line1}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.vandalism.title}
                            </span><br/><br/>

                            {i18n.terms.tos.vandalism.line1}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.userContent.title}
                            </span><br/><br/>

                            {i18n.terms.tos.userContent.line1}{" "}
                            {i18n.terms.tos.userContent.line2}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.copyrightDMCA.title}
                            </span><br/><br/>

                            {i18n.terms.tos.copyrightDMCA.line1}<br/><br/>

                            {i18n.terms.tos.copyrightDMCA.line2}<br/>
                            <span className="terms-text-alt">
                                {i18n.terms.tos.copyrightDMCA.bullet1}<br/>
                                {i18n.terms.tos.copyrightDMCA.bullet2}<br/>
                            </span><br/>
                            {i18n.terms.tos.copyrightDMCA.line3}<br/>
                            <span className="terms-text-alt">
                                {i18n.terms.tos.copyrightDMCA.bullet3}<br/>
                                {i18n.terms.tos.copyrightDMCA.bullet4}<br/>
                                {i18n.terms.tos.copyrightDMCA.bullet5}<br/>
                            </span><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.scraping.title}
                            </span><br/><br/>

                            {i18n.terms.tos.scraping.line1}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.maliciousActivity.title}
                            </span><br/><br/>

                            {i18n.terms.tos.maliciousActivity.line1}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.accounts.title}
                            </span><br/><br/>

                            {i18n.terms.tos.accounts.line1}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.premiumSubscriptions.title}
                            </span><br/><br/>

                            {i18n.terms.tos.premiumSubscriptions.line1}<br/><br/>
                            {i18n.terms.tos.premiumSubscriptions.line2}<br/><br/>
                            {i18n.terms.tos.premiumSubscriptions.line3}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.accountTermination.title}
                            </span><br/><br/>

                            {i18n.terms.tos.accountTermination.line1}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.liability.title}
                            </span><br/><br/>

                            {i18n.terms.tos.liability.line1}<br/><br/>

                            <span className="terms-text-alt">
                            {i18n.terms.tos.changes.title}
                            </span><br/><br/>

                            {i18n.terms.tos.changes.line1}<br/><br/>
                        </div>
                    </div>
                    <div className="privacy" id="privacy" onMouseOver={() => setOnPrivacy(true)} onMouseLeave={() => setOnPrivacy(false)}>
                        <div className="privacy-title-container">
                            <PrivacyIcon className="privacy-img"/>
                            <span className="privacy-title">{i18n.terms.privacy.title}</span>
                        </div>
                        <div className="privacy-text">
                            {i18n.terms.tos.lastUpdated}<br/><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.accountRelated.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.accountRelated.line1}<br/><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.submittedContent.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.submittedContent.line1}<br/><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.cookies.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.cookies.line1}<br/><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.subscriptionRelated.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.subscriptionRelated.line1}<br/><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.informationUse.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.informationUse.line1}<br/>
                            <span className="privacy-text-alt">
                                {i18n.terms.privacy.informationUse.bullet1}<br/>
                                {i18n.terms.privacy.informationUse.bullet2}<br/>
                                {i18n.terms.privacy.informationUse.bullet3}<br/>
                                {i18n.terms.privacy.informationUse.bullet4}<br/>
                            </span><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.sharingInformation.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.sharingInformation.line1}<br/>
                            <span className="privacy-text-alt">
                                {i18n.terms.privacy.sharingInformation.bullet1}<br/>
                                {i18n.terms.privacy.sharingInformation.bullet2}<br/>
                                {i18n.terms.privacy.sharingInformation.bullet3}<br/>
                            </span><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.accountDeletion.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.accountDeletion.line1}<br/><br/>

                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.changes.title}
                            </span><br/><br/>

                            {i18n.terms.privacy.changes.line1}<br/>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TermsPage