import React, {useEffect, useContext, useState, useRef} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/purple/search.png"
import searchMagenta from "../assets/magenta/search.png"
import searchPurpleLight from "../assets/purple-light/search.png"
import searchMagentaLight from "../assets/magenta-light/search.png"
import sort from "../assets/purple/sort.png"
import CommentRow from "../components/CommentRow"
import sortMagenta from "../assets/magenta/sort.png"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, 
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext} from "../Context"
import "./styles/commentspage.less"
import axios from "axios"

const CommentsPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const [sortType, setSortType] = useState("date")
    const [comments, setComments] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleComments, setVisibleComments] = useState([]) as any
    const sortRef = useRef(null) as any

    const updateComments = async () => {
        const result = await axios.get("/api/commentsearch", {params: {sort: sortType, query: searchQuery}, withCredentials: true}).then((r) => r.data)
        setIndex(0)
        setVisibleComments([])
        setComments(result)
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Comments"
        updateComments()
    }, [])

    useEffect(() => {
        updateComments()
    }, [sortType])

    useEffect(() => {
        let currentIndex = index
        const newVisibleComments = visibleComments as any
        for (let i = 0; i < 10; i++) {
            if (!comments[currentIndex]) break
            newVisibleComments.push(comments[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleComments(newVisibleComments)
    }, [comments])

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!comments[currentIndex]) return
                const newComments = visibleComments as any
                for (let i = 0; i < 10; i++) {
                    if (!comments[currentIndex]) break
                    newComments.push(comments[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleComments(newComments)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const getSearchIcon = () => {
        if (theme === "purple") return search
        if (theme === "purple-light") return searchPurpleLight
        if (theme === "magenta") return searchMagenta
        if (theme === "magenta-light") return searchMagentaLight
        return search
    }

    const getSort = () => {
        if (theme.includes("magenta")) return sortMagenta
        return sort
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "date") offset = -35
        if (sortType === "reverse date") offset = -5
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="commentsort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="commentsort-img" src={getSort()}/>
                <span className="commentsort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateCommentsJSX = () => {
        const jsx = [] as any
        for (let i = 0; i < visibleComments.length; i++) {
            jsx.push(<CommentRow comment={visibleComments[i]} onDelete={updateComments}/>)
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
            <div className="content">
                <div className="comments-page">
                    <span className="comments-heading">Comments</span>
                    <div className="comments-row">
                        <div className="comment-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="comment-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateComments() : null}/>
                            <img className={!theme || theme === "purple" ? "comment-search-icon" : `comment-search-icon-${theme}`} src={getSearchIcon()} onClick={updateComments}/>
                        </div>
                        {getSortJSX()}
                        <div className={`comment-dropdown ${activeDropdown === "sort" ? "" : "hide-comment-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="comment-dropdown-row" onClick={() => setSortType("date")}>
                                <span className="comment-dropdown-text">Date</span>
                            </div>
                            <div className="comment-dropdown-row" onClick={() => setSortType("reverse date")}>
                                <span className="comment-dropdown-text">Reverse Date</span>
                            </div>
                        </div>
                    </div>
                    <table className="comments-container">
                        {generateCommentsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CommentsPage