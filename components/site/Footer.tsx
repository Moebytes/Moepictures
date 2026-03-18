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
import terms from "../../assets/svg/terms.svg"
import contact from "../../assets/svg/contact.svg"
import backToTop from "../../assets/svg/back-to-top.svg"
import english from "../../assets/svg/english.svg"
import japanese from "../../assets/svg/japanese.svg"
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

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

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

    const getLanguageIcon = () => {
        if (language === "ja") return functions.color.colorizeSVG(japanese, "--sortbarIcons")
        return functions.color.colorizeSVG(english, "--sortbarIcons")
    }

    const getLanguageText = () => {
        if (language === "ja") return "日本語"
        return "English"
    }

    const backToTopIcon = () => {
        return functions.color.colorizeSVG(backToTop, "--sortbarIcons")
    }

    const termsIcon = () => {
        return functions.color.colorizeSVG(terms, "--sortbarIcons")
    }

    const contactIcon = () => {
        return functions.color.colorizeSVG(contact, "--sortbarIcons")
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
                        <img className="footer-img" src={getLanguageIcon()} style={{height: "16px", marginRight: "5px", filter}}/>
                        <span className="footer-text">{getLanguageText()}</span>
                    </div>
                    <div className="footer-click-container" onClick={() => goToTop()}>
                        <img className="footer-img" src={backToTopIcon()} style={{filter}}/>
                        <span className="footer-text">{i18n.footer.top}</span>
                    </div>
                </div>
            </div>
            {mobile ? <div className="footer-row" style={{justifyContent: "center", marginTop: "3px"}}>
                <div className="footer-click-container" onClick={() => {navigate("/terms"); setHideMobileNavbar(true)}}>
                    <img className="footer-img" src={termsIcon()} style={{filter}}/>
                    <span className="footer-text" >{i18n.navbar.terms}</span>
                </div>
                <div className="footer-click-container" onClick={() => {navigate("/contact"); setHideMobileNavbar(true)}}>
                    <img className="footer-img" src={contactIcon()} style={{filter}}/>
                    <span className="footer-text" >{i18n.navbar.contact}</span>
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