import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
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
import searchIconHover from "../assets/purple/search-hover.png"
import searchMagentaHover from "../assets/magenta/search-hover.png"
import searchMagentaLightHover from "../assets/magenta-light/search-hover.png"
import searchPurpleLightHover from "../assets/purple-light/search-hover.png"
import sort from "../assets/purple/sort.png"
import CommentRow from "../components/CommentRow"
import sortMagenta from "../assets/magenta/sort.png"
import DeleteCommentDialog from "../dialogs/DeleteCommentDialog"
import EditCommentDialog from "../dialogs/EditCommentDialog"
import ReportCommentDialog from "../dialogs/ReportCommentDialog"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext,
CommentSearchFlagContext} from "../Context"
import permissions from "../structures/Permissions"
import "./styles/commentspage.less"
import axios from "axios"

const CommentsPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {commentSearchFlag, setCommentSearchFlag} = useContext(CommentSearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const [sortType, setSortType] = useState("date")
    const [comments, setComments] = useState([]) as any
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleComments, setVisibleComments] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const sortRef = useRef(null) as any

    const updateComments = async (query?: string) => {
        const result = await axios.get("/api/search/comments", {params: {sort: sortType, query: query ? query : searchQuery}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleComments([])
        setComments(result)
    }

    useEffect(() => {
        if (commentSearchFlag) {
            setTimeout(() => {
                setSearchQuery(commentSearchFlag)
                updateComments(commentSearchFlag)
                setCommentSearchFlag(null)
            }, 500)
        }
    }, [commentSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Comments"
        setTimeout(() => {
            updateComments()
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

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/search/comments", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length) {
            setOffset(newOffset)
            setComments((prev: any) => [...prev, ...result])
        } else {
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!comments[currentIndex]) return updateOffset()
                const newComments = visibleComments as any
                for (let i = 0; i < 10; i++) {
                    if (!comments[currentIndex]) return updateOffset()
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
        if (theme === "purple") return getSearchIconHover ? searchIconHover : search
        if (theme === "purple-light") return getSearchIconHover ? searchPurpleLightHover : searchPurpleLight
        if (theme === "magenta") return getSearchIconHover ? searchMagentaHover : searchMagenta
        if (theme === "magenta-light") return getSearchIconHover ? searchMagentaLightHover : searchMagentaLight
        return getSearchIconHover ? searchIconHover : search
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
            if (!session.username) if (visibleComments[i].post.restrict !== "safe") continue
            if (!permissions.isStaff(session)) if (visibleComments[i].post.restrict === "explicit") continue
            jsx.push(<CommentRow comment={visibleComments[i]} onDelete={updateComments} onEdit={updateComments}/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <EditCommentDialog/>
        <DeleteCommentDialog/>
        <ReportCommentDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="comments-page">
                    <span className="comments-heading">Comments</span>
                    <div className="comments-row">
                        <div className="comment-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="comment-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateComments() : null}/>
                            <img className="comment-search-icon" src={getSearchIcon()} onClick={() => updateComments()} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {getSortJSX()}
                        <div className={`comment-dropdown ${activeDropdown === "sort" ? "" : "hide-comment-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
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