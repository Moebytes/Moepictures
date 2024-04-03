import React, {useEffect, useContext, useState, useRef} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/icons/search.png"
import searchIconHover from "../assets/icons/search-hover.png"
import sort from "../assets/icons/sort.png"
import type from "../assets/icons/all.png"
import TagRow from "../components/TagRow"
import axios from "axios"
import AliasTagDialog from "../dialogs/AliasTagDialog"
import EditTagDialog from "../dialogs/EditTagDialog"
import DeleteTagDialog from "../dialogs/DeleteTagDialog"
import matureTags from "../json/mature-tags.json"
import permissions from "../structures/Permissions"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, MobileContext,
ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SessionContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import "./styles/tagspage.less"

const TagsPage: React.FunctionComponent = (props) => {
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
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [sortType, setSortType] = useState("posts")
    const [typeType, setTypeType] = useState("all")
    const [tags, setTags] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleTags, setVisibleTags] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const sortRef = useRef(null) as any
    const typeRef = useRef(null) as any

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTags = async () => {
        const result = await axios.get("/api/search/tags", {params: {sort: sortType, type: typeType, query: searchQuery}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleTags([])
        setTags(result)
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Tags"
        setTimeout(() => {
            updateTags()
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
        updateTags()
    }, [sortType, typeType])

    useEffect(() => {
        let currentIndex = index
        const newVisibleTags = visibleTags as any
        for (let i = 0; i < 15; i++) {
            if (!tags[currentIndex]) break
            newVisibleTags.push(tags[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleTags(functions.removeDuplicates(newVisibleTags))
    }, [tags])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/search/tags", {params: {sort: sortType, type: typeType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length >= 100) {
            setOffset(newOffset)
            setTags((prev: any) => functions.removeDuplicates([...prev, ...result]))
        } else {
            if (result?.length) setTags((prev: any) => functions.removeDuplicates([...prev, ...result]))
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!tags[currentIndex]) return updateOffset()
                const newVisibleTags = visibleTags as any
                for (let i = 0; i < 15; i++) {
                    if (!tags[currentIndex]) return updateOffset()
                    newVisibleTags.push(tags[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleTags(functions.removeDuplicates(newVisibleTags))
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
        if (sortType === "alphabetic") offset = -25
        if (sortType === "reverse alphabetic") offset = 0
        if (sortType === "posts") offset = -45
        if (sortType === "reverse posts") offset = -15
        if (sortType === "image") offset = -40
        if (sortType === "reverse image") offset = -10
        if (sortType === "aliases") offset = -40
        if (sortType === "reverse aliases") offset = -10
        return `${raw + offset}px`
    }

    const getTypeMargin = () => {
        const rect = typeRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (typeType === "all") offset = -35
        if (typeType === "artist") offset = -25
        if (typeType === "character") offset = -5
        if (typeType === "series") offset = -25
        if (typeType === "tag") offset = -33
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="tagsort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="tagsort-img" src={sort} style={{filter: getFilter()}}/>
                <span className="tagsort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const getTypeJSX = () => {
        return (
            <div className="tagsort-item" ref={typeRef} onClick={() => {setActiveDropdown(activeDropdown === "type" ? "none" : "type")}}>
                <img className="tagsort-img rotate" src={type} style={{filter: getFilter()}}/>
                <span className="tagsort-text">{functions.toProperCase(typeType)}</span>
            </div>
        )
    }

    const generateTagsJSX = () => {
        const jsx = [] as any
        const tags = functions.removeDuplicates(visibleTags) as any
        for (let i = 0; i < tags.length; i++) {
            if (!session.username) if (functions.arrayIncludes(tags[i].tag, matureTags)) continue
            if (!permissions.isStaff(session)) if (functions.arrayIncludes(tags[i].tag, matureTags)) continue
            jsx.push(<TagRow tag={tags[i]} onDelete={updateTags} onEdit={updateTags}/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <AliasTagDialog/>
        <EditTagDialog/>
        <DeleteTagDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="tags">
                    <span className="tags-heading">Tags</span>
                    <div className="tags-row">
                        <div className="tag-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="tag-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateTags() : null}/>
                            <img className="tag-search-icon" src={getSearchIcon()} style={{filter: getFilterSearch()}} onClick={updateTags} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {getSortJSX()}
                        <div className={`tag-dropdown ${activeDropdown === "sort" ? "" : "hide-tag-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="tag-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="tag-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="tag-dropdown-text">Reverse Alphabetic</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="tag-dropdown-text">Posts</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="tag-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("image")}>
                                <span className="tag-dropdown-text">Image</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse image")}>
                                <span className="tag-dropdown-text">Reverse Image</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("aliases")}>
                                <span className="tag-dropdown-text">Aliases</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse aliases")}>
                                <span className="tag-dropdown-text">Reverse Aliases</span>
                            </div>
                        </div>
                        {getTypeJSX()}
                        <div className={`tag-dropdown ${activeDropdown === "type" ? "" : "hide-tag-dropdown"}`} 
                        style={{marginRight: getTypeMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="tag-dropdown-row" onClick={() => setTypeType("all")}>
                                <span className="tag-dropdown-text">All</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setTypeType("artist")}>
                                <span className="tag-dropdown-text">Artist</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setTypeType("character")}>
                                <span className="tag-dropdown-text">Character</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setTypeType("series")}>
                                <span className="tag-dropdown-text">Series</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setTypeType("meta")}>
                                <span className="tag-dropdown-text">Meta</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setTypeType("tag")}>
                                <span className="tag-dropdown-text">Tag</span>
                            </div>
                        </div>
                    </div>
                    <table className="tags-container">
                        {generateTagsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TagsPage