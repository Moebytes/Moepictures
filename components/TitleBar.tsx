import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import favicon from "../assets/icons/favicon.png"
import favicon2 from "../assets/icons/favicon2.png"
import favicon3 from "../assets/icons/favicon3.png"
import favicon4 from "../assets/icons/favicon4.png"
import {useThemeSelector, useThemeActions, useLayoutSelector, useSearchActions, useSearchSelector, 
useInteractionActions, useLayoutActions, useActiveSelector, useInteractionSelector, useCacheSelector, 
useCacheActions, useFlagSelector, useActiveActions, useFlagActions} from "../store"
import functions from "../structures/Functions"
import hamburger from "../assets/icons/hamburger.png"
import lockIcon from "../assets/icons/lock-red.png"
import privateIcon from "../assets/icons/private.png"
import "./styles/titlebar.less"

const darkColorList = {
    "--selection": "#6c69fc",
    "--background": "#09071c",
    "--background2": "#080622",
    "--titlebarBG": "#090420",
    "--titleTextA": "#6814ff",
    "--titleTextB": "#4214ff",
    "--titlebarText": "#431dff",
    "--navbarBG": "#0b0322",
    "--navbarText": "#3a1cff",
    "--sidebarBG": "#0a041e",
    "--sidebarSearchFocus": "#2908e0",
    "--sidebarSearchBG": "#0e0631",
    "--tagReadColor": "rgba(98, 31, 255, 0.5)",
    "--tagColor": "#641fff",
    "--sortbarBG": "rgba(11, 3, 34, 0.95)",
    "--tooltipBG": "rgba(11, 3, 34, 0.85)",
    "--sortbarText": "#3538fc",
    "--imageBorder": "#0a0f7f",
    "--inputBorder": "#0d0325",
    "--text": "#5a56ff",
    "--text-alt": "#8b4dff",
    "--inputBG": "#050020",
    "--footerBG": "#0b0322",
    "--drop-color1": "rgba(59, 13, 165, 0.7)",
    "--drop-color2": "rgba(86, 26, 226, 0.9)",
    "--bubbleBG": "rgba(89, 43, 255, 0.8)",
    "--binary": "#000000",
    "--selectBorder": "#6710e6",
    "--progressText": "#ffffff",
    "--progressBG": "#000000",
    "--audioPlayerColor": "#130737",
    "--buttonBG": "#ff11af",
    "--previewBG": "#4a44ff",
    "--editBG": "#347bff",
    "--r18BGColor": "#5603033d",
}

const lightColorList = {
    "--selection": "#e0e0ff",
    "--background": "#ffffff",
    "--background2": "#f9f9ff",
    "--titlebarBG": "#c2c2ff",
    "--titleTextA": "#745dff",
    "--titleTextB": "#5d60ff",
    "--titlebarText": "#7e66ff",
    "--navbarBG": "#c2c2ff",
    "--navbarText": "#6c47ff",
    "--sidebarBG": "#cfcfff",
    "--sidebarSearchFocus": "#8581ff",
    "--sidebarSearchBG": "#dbdaff",
    "--tagReadColor": "rgba(154, 87, 255, 0.5)",
    "--tagColor": "#9957ff",
    "--sortbarBG": "rgba(240, 240, 255, 0.3)",
    "--tooltipBG": "rgba(240, 240, 255, 0.5)",
    "--sortbarText": "#6d77ff",
    "--imageBorder": "#7fa0ff",
    "--inputBorder": "#7fa0ff",
    "--text": "#7b6dff",
    "--text-alt": "#cb7cff",
    "--inputBG": "#f4f2ff",
    "--footerBG": "#ffffff",
    "--drop-color1": "rgba(153, 112, 250, 0.7)",
    "--drop-color2": "rgba(158, 124, 252, 0.9)",
    "--bubbleBG": "rgba(202, 171, 255, 0.8)",
    "--binary": "#ffffff",
    "--selectBorder": "#8373ff",
    "--progressText": "#000000",
    "--progressBG": "#ffffff",
    "--audioPlayerColor": "#fbfaff",
    "--buttonBG": "#ff92ff",
    "--previewBG": "#b2d0ff",
    "--editBG": "#afe6ff",
    "--r18BGColor": "#e206444a",
}

interface Props {
    reset?: boolean
    goBack?: boolean
    post?: any
    historyID?: string
    noteID?: string
}

const TitleBar: React.FunctionComponent<Props> = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setTheme, setSiteHue, setSiteSaturation, setSiteLightness} = useThemeActions()
    const {mobile, relative, hideTitlebar, hideMobileNavbar} = useLayoutSelector()
    const {setHideMobileNavbar, setRelative, setHideTitlebar} = useLayoutActions()
    const {search, ratingType, autoSearch} = useSearchSelector()
    const {setSearch, setSearchFlag, setImageType, setRatingType, setStyleType, setSortType} = useSearchActions()
    const {scrollY, mobileScrolling} = useInteractionSelector()
    const {setEnableDrag, setScrollY, setMobileScrolling} = useInteractionActions()
    const {headerFlag} = useFlagSelector()
    const {setHeaderFlag} = useFlagActions()
    const {visiblePosts} = useCacheSelector()
    const {setVisiblePosts} = useCacheActions()
    const {activeGroup, activeFavgroup, headerText} = useActiveSelector()
    const {setHeaderText} = useActiveActions()
    const history = useHistory()

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) setTheme(savedTheme)
        const savedHue = localStorage.getItem("siteHue")
        const savedSaturation = localStorage.getItem("siteSaturation")
        const savedLightness = localStorage.getItem("siteLightness")
        if (savedHue) setSiteHue(Number(savedHue))
        if (savedSaturation) setSiteSaturation(Number(savedSaturation))
        if (savedLightness) setSiteLightness(Number(savedLightness))
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        const colorList = theme.includes("light") ? lightColorList : darkColorList
        let targetLightness = siteLightness
        if (theme.includes("light") && siteLightness > 50) targetLightness = 50
        let noRotation = [
            "--buttonBG",
            "--previewBG",
            "--r18BGColor"
        ]
        for (let i = 0; i < Object.keys(colorList).length; i++) {
            const key = Object.keys(colorList)[i]
            const color = Object.values(colorList)[i]
            if (noRotation.includes(key)) {
                document.documentElement.style.setProperty(key, color)
            } else {
                document.documentElement.style.setProperty(key, functions.rotateColor(color, siteHue, siteSaturation, targetLightness))
            }
        }
        localStorage.setItem("siteHue", String(siteHue))
        localStorage.setItem("siteSaturation", String(siteSaturation))
        localStorage.setItem("siteLightness", String(siteLightness))
    }, [theme, siteHue, siteSaturation, siteLightness])

    useEffect(() => {
        if (headerFlag) {
            setHeaderFlag(false)
            const text = functions.toProperCase(search.trim().split(/ +/g).map((t: string) => {
                if (t.startsWith("+-")) return `+-${t.replaceAll("+-", " ").trim()}`
                if (t.startsWith("-")) return `-${t.replaceAll("-", " ").trim()}`
                return t.replaceAll("-", " ")
            }).join(", "))
            document.title = `${text}`
            setHeaderText(text)
        }
    }, [headerFlag])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const toggleMobileNavbar = () => {
        setHideMobileNavbar(!hideMobileNavbar)
    }

    const titleClick = (event: any) => {
        if (mobile && (history.location.pathname === "/" || history.location.pathname === "/posts")) if (event.clientY < 180) return
        if (props.reset) {
            setSearch("")
            setImageType("all")
            setRatingType("all")
            setStyleType("all")
            setSortType("date")
            setSearchFlag(true)
            history.push("/posts")
            window.scrollTo(0, 0)
            setScrollY(null)
        } else {
            const saved = visiblePosts
            const savedScrollY = scrollY
            history.push("/posts")
            setVisiblePosts(saved)
            if (savedScrollY) window.scrollTo(0, savedScrollY)
        }
    }

    useEffect(() => {
        if (mobile) {
            setHideTitlebar(false)
            setHideMobileNavbar(true)
            setRelative(false)
        } else {
            setMobileScrolling(false)
        }
    }, [mobile])

    const getFavicon = () => {
        if (typeof window === "undefined") return favicon
        if (siteHue >= 240) {
            functions.changeFavicon(favicon2)
            return favicon2
        } else if (siteHue >= 160) {
            functions.changeFavicon(favicon)
            return favicon
        } else if (siteHue >= 100) {
            functions.changeFavicon(favicon3)
            return favicon3
        } else {
            functions.changeFavicon(favicon4)
            return favicon4
        }
    }

    return (
        <div className={`titlebar ${hideTitlebar ? "hide-titlebar" : ""} ${relative ? "titlebar-relative" : ""} ${mobileScrolling ? "hide-mobile-titlebar" : ""}`} onMouseEnter={() => setEnableDrag(false)}>
            {mobile ?
            <div className="titlebar-hamburger-container">
                <img className="titlebar-hamburger" src={hamburger} onClick={toggleMobileNavbar} style={{filter: getFilter()}}/>
            </div>
            : null}
            <div onClick={titleClick} className="titlebar-logo-container">
                <span className="titlebar-hover">
                    <div className="titlebar-text-container">
                            <span className="titlebar-text-a">M</span>
                            <span className="titlebar-text-b">o</span>
                            <span className="titlebar-text-a">e</span>
                            <span className="titlebar-text-b">p</span>
                            <span className="titlebar-text-a">i</span>
                            <span className="titlebar-text-b">c</span>
                            <span className="titlebar-text-a">t</span>
                            <span className="titlebar-text-b">u</span>
                            <span className="titlebar-text-a">r</span>
                            <span className="titlebar-text-b">e</span>
                            <span className="titlebar-text-a">s</span>
                    </div>
                    <div className="titlebar-image-container">
                        <img className="titlebar-img" src={getFavicon()}/>
                    </div>
                </span>
            </div>
            {!mobile ? 
            <div className="titlebar-search-text-container">
                {props.post?.private ? <img draggable={false} className="titlebar-search-icon" src={privateIcon}/> : null}
                {props.post?.locked ? <img draggable={false} className="titlebar-search-icon" src={lockIcon}/> : null}
                <span className={`titlebar-search-text ${props.post?.hidden ? "strikethrough" : ""}`}>
                    {props.historyID ? <span style={{color: "var(--historyColor)", marginRight: "10px"}}>{`[${i18n.sidebar.history}: ${props.historyID}]`}</span> : null}
                    {props.noteID ? <span style={{color: "var(--noteColor)", marginRight: "10px"}}>{`[${i18n.labels.note}: ${props.noteID}]`}</span> : null}
                    {functions.isR18(ratingType) ? <span style={{color: "var(--r18Color)", marginRight: "10px"}}>[R18]</span> : null}
                    {activeGroup ? <span style={{color: "var(--text-strong)", marginRight: "10px"}}>[{activeGroup}]</span> : null}
                    {activeFavgroup ? <span style={{color: "var(--text-strong)", marginRight: "10px"}}>[{activeFavgroup.name}]</span> : null}
                    {autoSearch ? <span style={{color: "var(--premiumColor)", marginRight: "10px"}}>[{i18n.labels.autoSearch}]</span> : null}
                    {headerText}
                </span>
            </div> : null}
        </div>
    )
}

export default TitleBar