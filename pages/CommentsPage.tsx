import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/icons/search.png"
import searchIconHover from "../assets/icons/search-hover.png"
import sort from "../assets/icons/sort.png"
import CommentRow from "../components/CommentRow"
import DeleteCommentDialog from "../dialogs/DeleteCommentDialog"
import EditCommentDialog from "../dialogs/EditCommentDialog"
import ReportCommentDialog from "../dialogs/ReportCommentDialog"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext,
CommentSearchFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext, ScrollContext, CommentsPageContext,
PageFlagContext, ShowPageDialogContext} from "../Context"
import permissions from "../structures/Permissions"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import "./styles/commentspage.less"
import axios from "axios"

const CommentsPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
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
    const {commentsPage, setCommentsPage} = useContext(CommentsPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
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
    const [queryPage, setQueryPage] = useState(1)
    const [commentID, setCommentID] = useState(0)
    const [commentJumpFlag, setCommentJumpFlag] = useState(false)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const commentParam = new URLSearchParams(window.location.search).get("comment")
        const onDOMLoaded = () => {
            const savedPage = localStorage.getItem("commentsPage")
            if (savedPage) setCommentsPage(Number(savedPage))
            if (queryParam) setCommentSearchFlag(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setCommentsPage(Number(pageParam))
            }
            if (commentParam) {
                setCommentID(Number(commentParam))
                setCommentJumpFlag(true)
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (comments && commentID && commentJumpFlag) {
            setTimeout(() => {
                onCommentJump(commentID)
                setCommentJumpFlag(false)
            }, 200)
        }
    }, [comments, commentJumpFlag, commentID])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

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
            }, 200)
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
        updateComments()
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

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateComments = () => {
            let currentIndex = index
            const newVisibleComments = visibleComments as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!comments[currentIndex]) break
                newVisibleComments.push(comments[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleComments(functions.removeDuplicates(newVisibleComments))
        }
        if (scroll) updateComments()
    }, [scroll, comments])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (commentsPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (comments[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await axios.get("/api/search/comments", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        let hasMore = result?.length >= 100
        const cleanComments = comments.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanComments.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, commentCount: cleanComments[0]?.commentCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setComments(result)
            } else {
                setComments((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setComments(result)
                } else {
                    setComments((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!comments[currentIndex]) return updateOffset()
                const newVisibleComments = visibleComments as any
                for (let i = 0; i < 15; i++) {
                    if (!comments[currentIndex]) return updateOffset()
                    newVisibleComments.push(comments[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleComments(functions.removeDuplicates(newVisibleComments))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleComments, index])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleComments([])
            setCommentsPage(1)
            updateComments()
        }
    }, [scroll])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (commentsPage - 1) * getPageAmount()
            if (comments[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(comments[0]?.commentCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = comments[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, comments, commentsPage, ended])

    useEffect(() => {
        if (searchQuery) {
            scroll ? history.replace(`${location.pathname}?query=${searchQuery}${commentID ? `&comment=${commentID}` : ""}`) : history.replace(`${location.pathname}?query=${searchQuery}&page=${commentsPage}${commentID ? `&comment=${commentID}` : ""}`)
        } else {
            if (!scroll) history.replace(`${location.pathname}?page=${commentsPage}${commentID ? `&comment=${commentID}` : ""}`)
        }
    }, [scroll, searchQuery, commentsPage, commentID])

    const onCommentJump = (commentID: number) => {
        let index = -1
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].commentID === String(commentID)) {
                index = i
                break
            }
        }
        if (index > -1) {
            const pageNumber = Math.ceil(index / getPageAmount())
            goToPage(pageNumber, true)
            const element = document.querySelector(`[comment-id="${commentID}"]`)
            if (!element) return
            const position = element.getBoundingClientRect()
            const elementTop = position.top + window.scrollY
            window.scrollTo(0, elementTop - (window.innerHeight / 3))
            setCommentID(commentID)
        }
    }

    useEffect(() => {
        if (comments?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setCommentsPage(maxTagPage)
            }
        }
    }, [comments, commentsPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("commentsPage", String(commentsPage))
    }, [commentsPage])

    const maxPage = () => {
        if (!comments?.length) return 1
        if (Number.isNaN(Number(comments[0]?.commentCount))) return 10000
        return Math.ceil(Number(comments[0]?.commentCount) / getPageAmount())
    }

    const firstPage = () => {
        setCommentsPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = commentsPage - 1 
        if (newPage < 1) newPage = 1 
        setCommentsPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = commentsPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setCommentsPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setCommentsPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number, noScroll?: boolean) => {
        setCommentsPage(newPage)
        if (!noScroll) window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (commentsPage > maxPage() - 3) increment = -4
        if (commentsPage > maxPage() - 2) increment = -5
        if (commentsPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (commentsPage > maxPage() - 2) increment = -3
            if (commentsPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = commentsPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const getSearchIcon = () => {
        return getSearchIconHover ? searchIconHover : search
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
                <img className="commentsort-img" src={sort} style={{filter: getFilter()}}/>
                <span className="commentsort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateCommentsJSX = () => {
        const jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleComments) as any
        } else {
            const postOffset = (commentsPage - 1) * getPageAmount()
            visible = comments.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (!session.username) if (visible[i].post.restrict !== "safe") continue
            if (!permissions.isStaff(session)) if (visible[i].post.restrict === "explicit") continue
            jsx.push(<CommentRow key={visible[i].commentID} comment={visible[i]} onDelete={updateComments} onEdit={updateComments} onCommentJump={onCommentJump}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {commentsPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {commentsPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {commentsPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {commentsPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {<button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button>}
                </div>
            )
        }
        return jsx
    }

    const toggleScroll = () => {
        setScroll((prev: boolean) => {
            const newValue = !prev
            localStorage.setItem("scroll", `${newValue}`)
            return newValue
        })
    }

    return (
        <>
        <DragAndDrop/>
        <EditCommentDialog/>
        <DeleteCommentDialog/>
        <ReportCommentDialog/>
        <PageDialog/>
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
                            <img className="comment-search-icon" src={getSearchIcon()} style={{filter: getFilterSearch()}} onClick={() => updateComments()} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {getSortJSX()}
                        {!mobile ? <div className="commentsort-item" onClick={() => toggleScroll()}>
                            <img className="commentsort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="commentsort-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div> : null}
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