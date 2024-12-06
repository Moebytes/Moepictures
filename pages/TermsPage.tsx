import React, {useEffect, useState} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import tos from "../assets/icons/tos.png"
import privacy from "../assets/icons/privacy.png"
import functions from "../structures/Functions"
import {useThemeSelector, useInteractionActions, useLayoutActions, 
useActiveActions, useLayoutSelector} from "../store"
import "./styles/tospage.less"

const TermsPage: React.FunctionComponent = (props) => {
    const {siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {mobile} = useLayoutSelector()
    const [onPrivacy, setOnPrivacy] = useState(false)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

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
            <div className="content" onMouseEnter={() => setEnableDrag(false)}>
                <div className="terms-container">
                    <div className="terms">
                        <div className="terms-title-container">
                            <img className="terms-img" src={tos} style={{filter: getFilter()}}/>
                            <span className="terms-title">{i18n.terms.tos.title}</span>
                        </div>
                        <div className="terms-text">
                            {i18n.terms.tos.lastUpdated}<br/><br/>

                            {i18n.terms.tos.header}<br/><br/>

                            {i18n.terms.tos.accessToSite.title}<br/>
                            <span className="terms-text-alt">
                            {i18n.terms.tos.accessToSite.line1}<br/>
                            {i18n.terms.tos.accessToSite.line2}<br/><br/>
                            </span>

                            {i18n.terms.tos.prohibitedActions.title}<br/>
                            {i18n.terms.tos.prohibitedActions.header}<br/>
                            <span className="terms-text-alt">
                            {i18n.terms.tos.prohibitedActions.line1}<br/>
                            {i18n.terms.tos.prohibitedActions.line2}<br/>
                            {i18n.terms.tos.prohibitedActions.line3}<br/>
                            {i18n.terms.tos.prohibitedActions.line4}<br/>
                            {i18n.terms.tos.prohibitedActions.line5}<br/>
                            {i18n.terms.tos.prohibitedActions.line6}<br/>
                            {i18n.terms.tos.prohibitedActions.line7}<br/>
                            {i18n.terms.tos.prohibitedActions.line8}<br/>
                            {i18n.terms.tos.prohibitedActions.line9}<br/><br/>
                            </span>

                            {i18n.terms.tos.userContent.title}<br/>
                            <span className="terms-text-alt">
                            {i18n.terms.tos.userContent.line1}<br/>
                            {i18n.terms.tos.userContent.line2}<br/><br/>
                            </span>

                            {i18n.terms.tos.copyrightTakedown.title}<br/>
                            {i18n.terms.tos.copyrightTakedown.header}<br/>
                            <span className="terms-text-alt">
                            {i18n.terms.tos.copyrightTakedown.line1}<br/>
                            {i18n.terms.tos.copyrightTakedown.line2}<br/>
                            </span>
                            {i18n.terms.tos.copyrightTakedown.proofHeader}<br/>
                            <span className="terms-text-alt">
                            {i18n.terms.tos.copyrightTakedown.proof1}<br/>
                            {i18n.terms.tos.copyrightTakedown.proof2}<br/>
                            {i18n.terms.tos.copyrightTakedown.proof3}<br/>
                            </span>
                            {i18n.terms.tos.copyrightTakedown.goText}<br/><br/>

                            {i18n.terms.tos.aiPolicy.title}<br/>
                            <span className="terms-text-alt">
                            {i18n.terms.tos.aiPolicy.line1}<br/>
                            {i18n.terms.tos.aiPolicy.line2}<br/>
                            {i18n.terms.tos.aiPolicy.line3}<br/><br/>
                            </span>

                            {i18n.terms.tos.accountUpgrades.title}<br/>
                            <span className="terms-text-alt">
                            {i18n.terms.tos.accountUpgrades.line1}<br/>
                            {i18n.terms.tos.accountUpgrades.line2}<br/><br/>
                            </span>

                            {i18n.terms.tos.liability.title}<br/>
                            {i18n.terms.tos.liability.header}<br/><br/>

                            {i18n.terms.tos.changesToTerms.title}<br/>
                            {i18n.terms.tos.changesToTerms.header}
                        </div>
                    </div>
                    <div className="privacy" id="privacy" onMouseOver={() => setOnPrivacy(true)} onMouseLeave={() => setOnPrivacy(false)}>
                        <div className="privacy-title-container">
                            <img className="privacy-img" src={privacy} style={{filter: getFilter()}}/>
                            <span className="privacy-title">{i18n.terms.privacy.title}</span>
                        </div>
                        <div className="privacy-text">
                            {i18n.terms.tos.lastUpdated}<br/><br/>

                            {i18n.terms.privacy.header}<br/><br/>

                            {i18n.terms.privacy.collectedInformation.title}<br/>
                            {i18n.terms.privacy.collectedInformation.header}<br/><br/>

                            <span className="privacy-text-alt">{i18n.terms.privacy.collectedInformation.accountInfo}</span>
                            {i18n.terms.privacy.collectedInformation.accountInfoLine}<br/><br/>

                            <span className="privacy-text-alt">{i18n.terms.privacy.collectedInformation.contentSubmitted}</span>
                            {i18n.terms.privacy.collectedInformation.contentSubmittedLine}<br/><br/>

                            <span className="privacy-text-alt">{i18n.terms.privacy.collectedInformation.actionsTaken}</span>
                            {i18n.terms.privacy.collectedInformation.actionsTakenLine}<br/><br/>

                            <span className="privacy-text-alt">{i18n.terms.privacy.collectedInformation.cookies}</span>
                            {i18n.terms.privacy.collectedInformation.cookiesLine}<br/><br/>

                            {i18n.terms.privacy.howInfoIsUsed.title}<br/>
                            {i18n.terms.privacy.howInfoIsUsed.header}<br/>
                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.howInfoIsUsed.line1}<br/>
                            {i18n.terms.privacy.howInfoIsUsed.line2}<br/>
                            {i18n.terms.privacy.howInfoIsUsed.line3}<br/><br/>
                            </span>

                            {i18n.terms.privacy.doNotShare.title}<br/>
                            <span className="privacy-text-alt">
                            {i18n.terms.privacy.doNotShare.line1}<br/>
                            {i18n.terms.privacy.doNotShare.line2}<br/>
                            {i18n.terms.privacy.doNotShare.line3}<br/><br/>
                            </span>

                            {i18n.terms.privacy.controllingInformation.title}<br/>
                            <span className="privacy-text-alt">{i18n.terms.privacy.controllingInformation.changingInfo}</span>
                            {i18n.terms.privacy.controllingInformation.changingInfoLine}<br/><br/>

                            <span className="privacy-text-alt">{i18n.terms.privacy.controllingInformation.deletingAccount}</span>
                            {i18n.terms.privacy.controllingInformation.deletingAccountLine}<br/><br/>

                            {i18n.terms.privacy.changesToPolicy.title}<br/>
                            {i18n.terms.privacy.changesToPolicy.header}
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