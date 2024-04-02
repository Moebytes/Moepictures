import React, {useEffect, useContext, useState, useRef} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/purple/search.png"
import searchIconHover from "../assets/purple/search-hover.png"
import sort from "../assets/purple/sort.png"
import CharacterRow from "../components/CharacterRow"
import axios from "axios"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, MobileContext,
HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext} from "../Context"
import "./styles/characterspage.less"

const CharactersPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [sortType, setSortType] = useState("posts")
    const [characters, setCharacters] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleCharacters, setVisibleCharacters] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const sortRef = useRef(null) as any

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateCharacters = async () => {
        const result = await axios.get("/api/search/characters", {params: {sort: sortType, query: searchQuery}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleCharacters([])
        setCharacters(result)
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Characters"
        setTimeout(() => {
            updateCharacters()
        }, 200)
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateCharacters()
    }, [sortType])

    useEffect(() => {
        let currentIndex = index
        const newVisibleCharacters = visibleCharacters as any
        for (let i = 0; i < 10; i++) {
            if (!characters[currentIndex]) break
            newVisibleCharacters.push(characters[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleCharacters(functions.removeDuplicates(newVisibleCharacters))
    }, [characters])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 10
        const result = await axios.get("/api/search/characters", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length >= 10) {
            setOffset(newOffset)
            setCharacters((prev: any) => functions.removeDuplicates([...prev, ...result]))
        } else {
            if (result?.length) setCharacters((prev: any) => functions.removeDuplicates([...prev, ...result]))
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!characters[currentIndex]) return updateOffset()
                const newVisibleCharacters = visibleCharacters as any
                for (let i = 0; i < 10; i++) {
                    if (!characters[currentIndex]) return updateOffset()
                    newVisibleCharacters.push(characters[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleCharacters(functions.removeDuplicates(newVisibleCharacters))
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const getSearchIcon = () => {
        return getSearchIconHover ? searchIconHover : search
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "cuteness") offset = -40
        if (sortType === "reverse cuteness") offset = -10
        if (sortType === "posts") offset = -45
        if (sortType === "reverse posts") offset = -15
        if (sortType === "alphabetic") offset = -25
        if (sortType === "reverse alphabetic") offset = 0
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="charactersort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="charactersort-img" src={sort} style={{filter: getFilter()}}/>
                <span className="charactersort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateCharactersJSX = () => {
        const jsx = [] as any
        const characters = functions.removeDuplicates(visibleCharacters) as any
        for (let i = 0; i < characters.length; i++) {
            if (characters[i].tag === "original") continue
            if (characters[i].tag === "unknown-character") continue
            jsx.push(<CharacterRow character={characters[i]}/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="characters">
                    <span className="characters-heading">Characters</span>
                    <div className="characters-row">
                        <div className="character-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="character-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateCharacters() : null}/>
                            <img className="character-search-icon" src={getSearchIcon()} style={{filter: getFilterSearch()}} onClick={updateCharacters} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {getSortJSX()}
                        <div className={`character-dropdown ${activeDropdown === "sort" ? "" : "hide-character-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="character-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="character-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="character-dropdown-text">Reverse Alphabetic</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="character-dropdown-text">Posts</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="character-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="character-dropdown-text">Cuteness</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("reverse cuteness")}>
                                <span className="character-dropdown-text">Reverse Cuteness</span>
                            </div>
                        </div>
                    </div>
                    <table className="characters-container">
                        {generateCharactersJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CharactersPage