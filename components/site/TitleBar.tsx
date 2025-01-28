import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import favicon from "../../assets/icons/favicon.png"
import favicon2 from "../../assets/icons/favicon2.png"
import favicon3 from "../../assets/icons/favicon3.png"
import favicon4 from "../../assets/icons/favicon4.png"
import {useThemeSelector, useThemeActions, useLayoutSelector, useSearchActions, useSearchSelector, 
useInteractionActions, useLayoutActions, useActiveSelector, useInteractionSelector, useCacheSelector, 
useCacheActions, useFlagSelector, useActiveActions, useFlagActions, useFilterActions} from "../../store"
import functions from "../../structures/Functions"
import hamburger from "../../assets/icons/hamburger.png"
import lockIcon from "../../assets/icons/lock-red.png"
import privateIcon from "../../assets/icons/private.png"
import {PostFull, PostHistory, UnverifiedPost, Themes} from "../../types/Types"
import "./styles/titlebar.less"

interface Props {
    reset?: boolean
    goBack?: boolean
    post?: PostFull | PostHistory | UnverifiedPost | null
    historyID?: string | null
    noteID?: string | null
    unverified?: boolean
}

const TitleBar: React.FunctionComponent<Props> = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile, relative, hideTitlebar, hideMobileNavbar} = useLayoutSelector()
    const {setHideMobileNavbar, setRelative, setHideTitlebar} = useLayoutActions()
    const {setBrightness, setContrast, setHue, setSaturation, setLightness, setBlur, setSharpen, setPixelate, setSplatter} = useFilterActions()
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

    const titleClick = (event: React.MouseEvent) => {
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
            setScrollY(0)
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
                    {props.unverified && !props.post?.deleted ? <span style={{color: "var(--pendingColor)", marginRight: "10px"}}>[{i18n.labels.pending}]</span> : null}
                    {props.post?.deleted ? <span style={{color: "var(--deletedColor)", marginRight: "10px"}}>[{i18n.time.deleted} {functions.timeUntil(props.post.deletionDate, i18n)}]</span> : null}
                    {props.historyID ? <span style={{color: "var(--historyColor)", marginRight: "10px"}}>{`[${i18n.sidebar.history}: ${props.historyID}]`}</span> : null}
                    {props.noteID ? <span style={{color: "var(--noteColor)", marginRight: "10px"}}>{`[${i18n.labels.note}: ${props.noteID}]`}</span> : null}
                    {functions.isR18(ratingType) ? <span style={{color: "var(--r18Color)", marginRight: "10px"}}>[R18]</span> : null}
                    {activeGroup ? <span style={{color: "var(--text-strong)", marginRight: "10px"}}>[{activeGroup.name}]</span> : null}
                    {activeFavgroup ? <span style={{color: "var(--text-strong)", marginRight: "10px"}}>[{activeFavgroup.name}]</span> : null}
                    {autoSearch ? <span style={{color: "var(--premiumColor)", marginRight: "10px"}}>[{i18n.labels.autoSearch}]</span> : null}
                    {headerText}
                </span>
            </div> : null}
        </div>
    )
}

export default TitleBar