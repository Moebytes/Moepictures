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
import Reply from "../components/Reply"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, 
SiteLightnessContext, SiteSaturationContext, ScrollContext, ThreadPageContext, ShowPageDialogContext, PageFlagContext,
DeleteThreadIDContext, DeleteThreadFlagContext, EditThreadIDContext, EditThreadFlagContext, EditThreadTitleContext,
EditThreadContentContext, QuoteTextContext, ReportThreadIDContext} from "../Context"
import permissions from "../structures/Permissions"
import jsxFunctions from "../structures/JSXFunctions"
import PageDialog from "../dialogs/PageDialog"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import lockIcon from "../assets/icons/lock.png"
import stickyIcon from "../assets/icons/sticky.png"
import lockOptIcon from "../assets/icons/lock-opt.png"
import stickyOptIcon from "../assets/icons/sticky-opt.png"
import unlockOptIcon from "../assets/icons/unlock-opt.png"
import unstickyOptIcon from "../assets/icons/unsticky-opt.png"
import editOptIcon from "../assets/icons/edit-opt.png"
import deleteOptIcon from "../assets/icons/delete-opt.png"
import quoteOptIcon from "../assets/icons/quote-opt.png"
import reportOptIcon from "../assets/icons/report-opt.png"
import EditThreadDialog from "../dialogs/EditThreadDialog"
import DeleteThreadDialog from "../dialogs/DeleteThreadDialog"
import ReportThreadDialog from "../dialogs/ReportThreadDialog"
import DeleteReplyDialog from "../dialogs/DeleteReplyDialog"
import EditReplyDialog from "../dialogs/EditReplyDialog"
import ReportReplyDialog from "../dialogs/ReportReplyDialog"
import favicon from "../assets/icons/favicon.png"
import "./styles/threadpage.less"
import axios from "axios"

interface Props {
    match?: any
}

const ThreadPage: React.FunctionComponent<Props> = (props) => {
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
    const {threadPage, setThreadPage} = useContext(ThreadPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {deleteThreadID, setDeleteThreadID} = useContext(DeleteThreadIDContext)
    const {deleteThreadFlag, setDeleteThreadFlag} = useContext(DeleteThreadFlagContext)
    const {editThreadID, setEditThreadID} = useContext(EditThreadIDContext)
    const {editThreadFlag, setEditThreadFlag} = useContext(EditThreadFlagContext)
    const {editThreadTitle, setEditThreadTitle} = useContext(EditThreadTitleContext)
    const {editThreadContent, setEditThreadContent} = useContext(EditThreadContentContext)
    const {reportThreadID, setReportThreadID} = useContext(ReportThreadIDContext)
    const [thread, setThread] = useState(null) as any
    const [replies, setReplies] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleReplies, setVisibleReplies] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const [replyID, setReplyID] = useState(-1)
    const [replyJumpFlag, setReplyJumpFlag] = useState(false)
    const [text, setText] = useState("")
    const [defaultIcon, setDefaultIcon] = useState(false)
    const [error, setError] = useState(false)
    const history = useHistory()
    const errorRef = useRef(null) as any
    const threadID = props?.match.params.id

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const replyParam = new URLSearchParams(window.location.search).get("reply")
        const onDOMLoaded = () => {
            const savedPage = localStorage.getItem("threadPage")
            if (savedPage && Number(savedPage) > 0) setThreadPage(Number(savedPage))
            if (pageParam && Number(pageParam) > 0) {
                setQueryPage(Number(pageParam))
                setThreadPage(Number(pageParam))
            }
            if (replyParam) {
                setReplyID(Number(replyParam))
                setReplyJumpFlag(true)
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (replies && replyID > -1 && replyJumpFlag) {
            setTimeout(() => {
                onReplyJump(replyID)
                setReplyJumpFlag(false)
            }, 200)
        }
    }, [replies, replyID, replyJumpFlag])

    const updateThread = async () => {
        const thread = await axios.get("/api/thread", {params: {threadID}, withCredentials: true}).then((r) => r.data)
        setThread(thread)
        document.title = `${thread.title}`
        setDefaultIcon(thread.image ? false : true)
    }

    const updateReplies = async () => {
        const result = await axios.get("/api/thread/replies", {params: {threadID}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleReplies([])
        setReplies(result)
    }

    useEffect(() => {
        updateThread()
        updateReplies()
    }, [threadID])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(true)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateReplies = () => {
            let currentIndex = index
            const newVisibleReplies = visibleReplies as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!replies[currentIndex]) break
                newVisibleReplies.push(replies[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleReplies(functions.removeDuplicates(newVisibleReplies))
        }
        if (scroll) updateReplies()
    }, [scroll, replies])

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!replies[currentIndex]) return
                const newVisibleReplies = visibleReplies as any
                for (let i = 0; i < 15; i++) {
                    if (!replies[currentIndex]) return
                    newVisibleReplies.push(replies[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleReplies(functions.removeDuplicates(newVisibleReplies))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleReplies, index])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleReplies([])
            setThreadPage(1)
            updateReplies()
        }
    }, [scroll])

    useEffect(() => {
        if (!scroll) {
            history.replace(`${location.pathname}?page=${threadPage}${replyID > -1 ? `&reply=${replyID}` : ""}`)
        } else {
            if (replyID > -1) history.replace(`${location.pathname}?reply=${replyID}`) 
        }
    }, [scroll, threadPage, replyID])

    useEffect(() => {
        if (replies?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setThreadPage(maxTagPage)
            }
        }
    }, [replies, threadPage, queryPage])

    const onReplyJump = (replyID: number) => {
        if (replyID === 0) {
            goToPage(1)
        } else {
            let index = -1
            for (let i = 0; i < replies.length; i++) {
                if (replies[i].replyID === String(replyID)) {
                    index = i 
                    break
                }
            }
            if (index > -1) {
                const pageNumber = Math.ceil(index / getPageAmount())
                goToPage(pageNumber, true)
                const element = document.querySelector(`[reply-id="${replyID}"]`)
                if (!element) return
                const position = element.getBoundingClientRect()
                const elementTop = position.top + window.scrollY
                window.scrollTo(0, elementTop - (window.innerHeight / 3))
                setReplyID(replyID)
            }
        }
    }

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("threadPage", String(threadPage))
    }, [threadPage])

    const maxPage = () => {
        if (!replies?.length) return 1
        if (Number.isNaN(Number(replies[0]?.replyCount))) return 10000
        return Math.ceil(Number(replies[0]?.replyCount) / getPageAmount())
    }

    const firstPage = () => {
        setThreadPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = threadPage - 1 
        if (newPage < 1) newPage = 1 
        setThreadPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = threadPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setThreadPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setThreadPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number, noScroll?: boolean) => {
        setThreadPage(newPage)
        if (!noScroll) window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (threadPage > maxPage() - 3) increment = -4
        if (threadPage > maxPage() - 2) increment = -5
        if (threadPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (threadPage > maxPage() - 2) increment = -3
            if (threadPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = threadPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        if (!scroll) {
            return (
                <div key="page-numbers" className="page-container">
                    {threadPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {threadPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {jsx}
                    {threadPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {threadPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
        }
    }

    const generateRepliesJSX = () => {
        const jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleReplies) as any
        } else {
            const postOffset = (threadPage - 1) * getPageAmount()
            visible = replies.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<Reply key={visible[i].replyID} reply={visible[i]} onDelete={updateReplies} onEdit={updateReplies} onReplyJump={onReplyJump}/>)
        }
        return jsx
    }

    const getCreatorPFP = () => {
        if (thread.image) {
            return functions.getTagLink("pfp", thread.image)
        } else {
            return favicon
        }
    }

    const creatorClick = (event: React.MouseEvent) => {
        if (!thread) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${thread.creator}`, "_blank")
        } else {
            history.push(`/user/${thread.creator}`)
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!thread.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${thread.imagePost}`, "_blank")
        } else {
            history.push(`/post/${thread.imagePost}`)
        }
    }

    const getCreatorJSX = () => {
        if (thread.role === "admin") {
            return (
                <div className="forum-thread-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                    <span className="forum-thread-user-text admin-color">{functions.toProperCase(thread.creator)}</span>
                    <img className="forum-thread-user-label" src={adminCrown}/>
                </div>
            )
        } else if (thread.role === "mod") {
            return (
                <div className="forum-thread-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="forum-thread-user-text mod-color">{functions.toProperCase(thread.creator)}</span>
                    <img className="forum-thread-user-label" src={modCrown}/>
                </div>
            )
        } else if (thread.role === "system") {
            return (
                <div className="forum-thread-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="forum-thread-user-text system-color">{functions.toProperCase(thread.creator)}</span>
                    <img className="forum-thread-user-label" src={systemCrown}/>
                </div>
            )
        }
        return <span className={`forum-thread-user-text ${thread.banned ? "banned" : ""}`} onClick={creatorClick} onAuxClick={creatorClick}>{functions.toProperCase(thread.creator)}</span>
    }

    const updateSticky = async () => {
        await axios.post("/api/thread/sticky", {threadID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true}).then((r) => r.data)
        updateThread()
    }

    const updateLocked = async () => {
        await axios.post("/api/thread/lock", {threadID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true}).then((r) => r.data)
        updateThread()
    }

    const editThread = async () => {
        await axios.put("/api/thread/edit", {threadID, title: editThreadTitle, content: editThreadContent}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        updateThread()
    }

    useEffect(() => {
        if (editThreadFlag && editThreadID === threadID) {
            editThread()
            setEditThreadFlag(false)
            setEditThreadID(null)
        }
    }, [editThreadFlag, editThreadID, editThreadTitle, editThreadContent])

    const editThreadDialog = () => {
        if (!thread) return
        setEditThreadContent(thread.content)
        setEditThreadTitle(thread.title)
        setEditThreadID(thread.threadID)
    }

    const deleteThread = async () => {
        await axios.delete("/api/thread/delete", {params: {threadID}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        history.push("/forum")
    }

    useEffect(() => {
        if (deleteThreadFlag && deleteThreadID === threadID) {
            deleteThread()
            setDeleteThreadFlag(false)
            setDeleteThreadID(null)
        }
    }, [deleteThreadFlag, deleteThreadID])

    const deleteThreadDialog = () => {
        if (!thread) return
        setDeleteThreadID(threadID)
    }

    const reportThreadDialog = () => {
        setReportThreadID(threadID)
    }

    const triggerQuote = () => {
        if (!thread) return
        const cleanReply = functions.parseComment(thread.content).filter((s: any) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[0] ${functions.toProperCase(thread.creator)} said:
            > ${cleanReply}
        `))
    }

    const getOptionsJSX = () => {
        if (!thread) return
        let jsx = [] as any
        if (permissions.isElevated(session)) {
            jsx.push(
                <>
                <img draggable={false} className="forum-thread-opt-icon" src={thread.sticky ? unstickyOptIcon : stickyOptIcon} onClick={updateSticky} style={{marginTop: "3px", filter: getFilter()}}/>
                <img draggable={false} className="forum-thread-opt-icon" src={thread.locked ? unlockOptIcon : lockOptIcon} onClick={updateLocked} style={{filter: getFilter()}}/>
                </>
            )
        }
        if (session.username && !session.banned) {
            jsx.push(
                <>
                <img draggable={false} className="forum-thread-opt-icon" src={quoteOptIcon} onClick={triggerQuote} style={{filter: getFilter()}}/>
                <img draggable={false} className="forum-thread-opt-icon" src={reportOptIcon} onClick={reportThreadDialog} style={{filter: getFilter()}}/>
                </>
            )
        }
        if (session.username === thread.creator || permissions.isElevated(session)) {
            jsx.push(
                <>
                <img draggable={false} className="forum-thread-opt-icon" src={editOptIcon} onClick={editThreadDialog} style={{filter: getFilter()}}/>
                <img draggable={false} className="forum-thread-opt-icon" src={deleteOptIcon} onClick={deleteThreadDialog} style={{filter: getFilter()}}/>
                </>
            )
        }
        return jsx
    }

    useEffect(() => {
        if (quoteText) {
            const prevText = text.trim() ? `${text.trim()}\n` : ""
            setText(`${prevText}${quoteText.trim()}`)
            setQuoteText(null)
            window.scrollTo(0, document.body.scrollHeight)
        }
    }, [quoteText])

    const reply = async () => {
        const badReply = functions.validateReply(text)
        if (badReply) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badReply
            await functions.timeout(2000)
            return setError(false)
        }
        await axios.post("/api/thread/reply", {threadID, content: text}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true}).then((r) => r.data)
        updateReplies()
        setText("")
    }

    const getReplyBoxJSX = () => {
        if (thread.locked) return (
            <div className="forum-thread-reply-box" style={{justifyContent: "flex-start"}}>
                <span className="forum-thread-validation" style={{fontSize: "20px", marginLeft: "15px"}}>This thread is locked.</span>
            </div>
        )
        if (session.banned) return (
            <div className="forum-thread-reply-box" style={{justifyContent: "flex-start"}}>
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: "15px"}}>You are banned. Cannot reply.</span>
            </div>
        )
        if (session.username) {
            return (
                <div className="forum-thread-reply-box">
                    <div className="forum-thread-input-container">
                        <div className="forum-thread-row-start" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea className="forum-thread-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="forum-thread-validation-container"><span className="forum-thread-validation" ref={errorRef}></span></div> : null}
                        <div className="forum-thread-button-container-left">
                            <button className="forum-thread-button" onClick={reply}>Reply</button>
                        </div>
                    </div>
                </div>
            )
        }
    }

    return (
        <>
        <DragAndDrop/> 
        <EditThreadDialog/>
        <DeleteThreadDialog/> 
        <ReportThreadDialog/>
        <EditReplyDialog/>
        <DeleteReplyDialog/>
        <ReportReplyDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(false)}>
                {thread ?
                <div className="forum-thread" onMouseEnter={() => setEnableDrag(false)}>
                    <div className="forum-thread-title-container">
                        {thread.sticky ? <img draggable={false} className="forum-thread-icon" src={stickyIcon}/> : null}
                        {thread.locked ? <img draggable={false} className="forum-thread-icon" src={lockIcon}/> : null}
                        <span className="forum-thread-title">{thread.title}</span>
                        {getOptionsJSX()}
                    </div>
                    <div className="forum-thread-main-post">
                        <div className="forum-thread-user-container">
                            {getCreatorJSX()}
                            <span className="forum-thread-date-text">{functions.timeAgo(thread.createDate)}</span>
                            <img draggable={false} className="forum-thread-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        </div>
                        <div className="forum-thread-text-container">
                            <p className="forum-thread-text">{jsxFunctions.parseTextLinks(thread.content)}</p>
                        </div>
                    </div>
                    <table className="forum-thread-container">
                        {generateRepliesJSX()}
                    </table>
                    {getReplyBoxJSX()}
                    {generatePageButtonsJSX()}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ThreadPage