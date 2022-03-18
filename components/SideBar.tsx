import React, {useContext, useState} from "react"
import {ThemeContext, HideSidebarContext, HideNavbarContext} from "../App"
import search from "../assets/purple/search.png"
import searchImage from "../assets/purple/search-image.png"
import searchMagenta from "../assets/magenta/search.png"
import searchImageMagenta from "../assets/magenta/search-image.png"
import searchPurpleLight from "../assets/purple-light/search.png"
import searchImagePurpleLight from "../assets/purple-light/search-image.png"
import searchMagentaLight from "../assets/magenta-light/search.png"
import searchImageMagentaLight from "../assets/magenta-light/search-image.png"
import random from "../assets/purple/random.png"
import randomMagenta from "../assets/magenta/random.png"
import randomPurpleLight from "../assets/purple-light/random.png"
import randomMagentaLight from "../assets/magenta-light/random.png"
import terms from "../assets/purple/terms.png"
import termsMagenta from "../assets/magenta/terms.png"
import contact from "../assets/purple/contact.png"
import contactMagenta from "../assets/magenta/contact.png"
import code from "../assets/purple/code.png"
import codeMagenta from "../assets/magenta/code.png"
import "../styles/sidebar.less"

interface Props {
    text?: string
}

const SideBar: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)

    const getSearchIcon = () => {
        if (theme === "purple") return search
        if (theme === "purple-light") return searchPurpleLight
        if (theme === "magenta") return searchMagenta
        if (theme === "magenta-light") return searchMagentaLight
        return search
    }

    const getSearchImageIcon = () => {
        if (theme === "purple") return searchImage
        if (theme === "purple-light") return searchImagePurpleLight
        if (theme === "magenta") return searchImageMagenta
        if (theme === "magenta-light") return searchImageMagentaLight
        return searchImage
    }

    const getRandomIcon = () => {
        if (theme === "purple") return random
        if (theme === "purple-light") return randomPurpleLight
        if (theme === "magenta") return randomMagenta
        if (theme === "magenta-light") return randomMagentaLight
        return random
    }

    const getTermsIcon = () => {
        if (theme.includes("magenta")) return termsMagenta
        return terms
    }

    const getContactIcon = () => {
        if (theme.includes("magenta")) return contactMagenta
        return contact
    }

    const getCodeIcon = () => {
        if (theme.includes("magenta")) return codeMagenta
        return code
    }

    return (
        <div className={`sidebar ${hideSidebar ? "hide-sidebar" : ""} ${hideNavbar ? "sidebar-top" : ""}`}>
            <div className="sidebar-container">
                <div className="sidebar-text-container">
                    <span className="sidebar-text">{props.text}</span>
                </div>
                <div className="search-container">
                    <input className="search" type="search" spellCheck="false"/>
                    <img className={!theme || theme === "purple" ? "search-icon" : `search-icon-${theme}`} src={getSearchIcon()}/>
                    <img className={!theme || theme === "purple" ? "search-image-icon" : `search-image-icon-${theme}`} src={getSearchImageIcon()}/>
                </div>
                <div className="random-container">
                    <img className={!theme || theme === "purple" ? "random" : `random-${theme}`} src={getRandomIcon()}/>
                </div>
                <div className="tag-container">
                    <div className="tag-row">
                        <span className="tag-hover">
                            <span className="tag">Loli</span>
                            <span className="tag-count">4566</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Azur Lane</span>
                        <span className="tag-count">1567</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Animated</span>
                        <span className="tag-count">87564</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">With Audio</span>
                        <span className="tag-count">4543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">KanColle</span>
                        <span className="tag-count">4565</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Leggings</span>
                        <span className="tag-count">7654</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Stockings</span>
                        <span className="tag-count">8755</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Gabriel Dropout</span>
                        <span className="tag-count">76</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Kiniro Mosaic</span>
                        <span className="tag-count">886</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Umaru-Chan</span>
                        <span className="tag-count">885</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">GochiUsa</span>
                        <span className="tag-count">5473</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Sex</span>
                        <span className="tag-count">990</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        </span>
                        <span className="tag">Saliva</span>
                        <span className="tag-count">6545</span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Cum</span>
                        <span className="tag-count">43</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">School</span>
                        <span className="tag-count">788</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Music</span>
                        <span className="tag-count">643</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hibiki</span>
                        <span className="tag-count">998</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    <div className="tag-row">
                        <span className="tag-hover">
                        <span className="tag">Hot</span>
                        <span className="tag-count">6543</span>
                        </span>
                    </div>
                    {/*27 tags can fit*/}
                </div>
                <div className="sidebar-footer">
                    <span className="sidebar-footer-text">©{new Date().getFullYear()} Tenpi</span>
                    <img className="sidebar-footer-icon" src={getTermsIcon()}/>
                    <img className="sidebar-footer-icon" src={getContactIcon()}/>
                    <img className="sidebar-footer-icon" src={getCodeIcon()}/>
                </div>
            </div>
        </div>
    )
}

export default SideBar