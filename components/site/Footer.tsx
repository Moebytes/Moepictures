/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSearchActions, useThemeActions,
useLayoutActions} from "../../store"
import functions from "../../functions/Functions"
import TermsIcon from "../../assets/svg/terms.svg"
import ContactIcon from "../../assets/svg/contact.svg"
import BackToTopIcon from "../../assets/svg/back-to-top.svg"
import EnglishIcon from "../../assets/svg/english.svg"
import JapaneseIcon from "../../assets/svg/japanese.svg"
import logo from "../../assets/images/moebytes.png"
import "./styles/footer.less"

interface Props {
    noPadding?: boolean
}

const Footer: React.FunctionComponent<Props> = (props) => {
    const {language, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setLanguage} = useThemeActions()
    const {mobile} = useLayoutSelector()
    const {setSearch, setSearchFlag, setImageType, setRatingType, setStyleType, setSortType} = useSearchActions()
    const {setHideMobileNavbar} = useLayoutActions()
    const navigate = useNavigate()
    
    const goToTop = () => {
        window.scrollTo({top: 0, behavior: "smooth"})
    }

    const changeLanguage = () => {
        if (language === "ja") {
            setLanguage("en")
        } else {
            setLanguage("ja")
        }
    }

    const getLanguageText = () => {
        if (language === "ja") return "日本語"
        return "English"
    }

    const logoClick = () => {
        setSearch("")
        setImageType("all")
        setRatingType("all")
        setStyleType("all")
        setSortType("date")
        setSearchFlag(true)
        window.scrollTo(0, 0)
    }

    return (
        <>
        {!props.noPadding ? <div style={{height: "100%", pointerEvents: "none"}}></div> : null}
        <div className="footer">
            <div className="footer-row">
                <div className="footer-title-container" onClick={logoClick}>
                    {/* <img className="footer-logo" src={logo} draggable={false}/> */}
                    <span className="footer-title-a">M</span>
                    <span className="footer-title-b">o</span>
                    <span className="footer-title-a">e</span>
                    <span className="footer-title-b">p</span>
                    <span className="footer-title-a">i</span>
                    <span className="footer-title-b">c</span>
                    <span className="footer-title-a">t</span>
                    <span className="footer-title-b">u</span>
                    <span className="footer-title-a">r</span>
                    <span className="footer-title-b">e</span>
                    <span className="footer-title-a">s</span>
                </div>
                {!mobile ? <div className="footer-text-container">
                    <span className="footer-text">- {i18n.footer.bottom} -</span>
                </div> : null}
                <div className="footer-container">
                    <div className="footer-click-container" onClick={() => changeLanguage()}>
                        {language === "ja" ?
                        <JapaneseIcon className="footer-img" style={{height: "16px", marginRight: "5px"}}/> :
                        <EnglishIcon className="footer-img" style={{height: "16px", marginRight: "5px"}}/>}
                        <span className="footer-text">{getLanguageText()}</span>
                    </div>
                    <div className="footer-click-container" onClick={() => goToTop()}>
                        <BackToTopIcon className="footer-img"/>
                        <span className="footer-text">{i18n.footer.top}</span>
                    </div>
                </div>
            </div>
            {mobile ? <div className="footer-row" style={{marginTop: "3px"}}>
                <div className="footer-container">
                    <div className="footer-click-container-left" onClick={() => {navigate("/terms"); setHideMobileNavbar(true)}}>
                        <TermsIcon className="footer-img"/>
                        <span className="footer-text" >{i18n.navbar.terms}</span>
                    </div>
                    <div className="footer-click-container-left" onClick={() => {navigate("/contact"); setHideMobileNavbar(true)}}>
                        <ContactIcon className="footer-img"/>
                        <span className="footer-text" >{i18n.navbar.contact}</span>
                    </div>
                </div>
                <div className="footer-click-container" style={{cursor: "default"}}>
                    <span className="footer-text">- {i18n.footer.bottomMobile} -</span>
                </div>
            </div> : null}
        </div>
        </>
    )
}

export default Footer