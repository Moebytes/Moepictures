import React, {useContext, useEffect, useState} from "react"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideTitlebarContext,
SearchContext, SearchFlagContext, ImageTypeContext, RestrictTypeContext, StyleTypeContext, SortTypeContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import terms from "../assets/purple/terms.png"
import termsMagenta from "../assets/magenta/terms.png"
import termsPurpleLight from "../assets/purple-light/terms.png"
import termsMagentaLight from "../assets/magenta-light/terms.png"
import contact from "../assets/purple/contact.png"
import contactMagenta from "../assets/magenta/contact.png"
import contactPurpleLight from "../assets/purple-light/contact.png"
import contactMagentaLight from "../assets/magenta-light/contact.png"
import code from "../assets/purple/code.png"
import codeMagenta from "../assets/magenta/code.png"
import codePurpleLight from "../assets/purple-light/code.png"
import codeMagentaLight from "../assets/magenta-light/code.png"
import backToTop from "../assets/purple/backtotop.png"
import backToTopMagenta from "../assets/magenta/backtotop.png"
import backToTopPurpleLight from "../assets/purple-light/backtotop.png"
import backToTopMagentaLight from "../assets/magenta-light/backtotop.png"
import pack from "../package.json"
import "./styles/footer.less"

const Footer: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {imageType, setImageType} = useContext(ImageTypeContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {styleType, setStyleType} = useContext(StyleTypeContext)
    const {sortType, setSortType} = useContext(SortTypeContext)

    const getTermsIcon = () => {
        if (theme === "purple") return terms
        if (theme === "purple-light") return termsPurpleLight
        if (theme === "magenta") return termsMagenta
        if (theme === "magenta-light") return termsMagentaLight
        return terms
    }

    const getContactIcon = () => {
        if (theme === "purple") return contact
        if (theme === "purple-light") return contactPurpleLight
        if (theme === "magenta") return contactMagenta
        if (theme === "magenta-light") return contactMagentaLight
        return contact
    }

    const getCodeIcon = () => {
        if (theme === "purple") return code
        if (theme === "purple-light") return codePurpleLight
        if (theme === "magenta") return codeMagenta
        if (theme === "magenta-light") return codeMagentaLight
        return code
    }

    const getBackToTop = () => {
        if (theme === "purple") return backToTop
        if (theme === "purple-light") return backToTopPurpleLight
        if (theme === "magenta") return backToTopMagenta
        if (theme === "magenta-light") return backToTopMagentaLight
        return backToTop
    }

    const goToTop = () => {
        window.scrollTo({top: 0, behavior: "smooth"})
    }

    const footerClick = () => {
        setSearch("")
        setImageType("all")
        setRestrictType("all")
        setStyleType("all")
        setSortType("date")
        setSearchFlag(true)
        window.scrollTo(0, 0)
    }

    return (
        <div className="footer">
            <div className="footer-title-container" onClick={footerClick}>
                    <span className="footer-title-a">M</span>
                    <span className="footer-title-b">o</span>
                    <span className="footer-title-a">e</span>
                    <span className="footer-title-b">b</span>
                    <span className="footer-title-a">o</span>
                    <span className="footer-title-b">o</span>
                    <span className="footer-title-a">r</span>
                    <span className="footer-title-b">u</span>
            </div>
            <div className="footer-text-container">
                <span className="footer-text">- This is the bottom of the page -</span>
            </div>
            <div className="footer-back-to-top" onClick={() => goToTop()}>
                <img className="footer-img" src={getBackToTop()}/>
                <span className="footer-text">Back to top</span>
            </div>
        </div>
    )
}

export default Footer