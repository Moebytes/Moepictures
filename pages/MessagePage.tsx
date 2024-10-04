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
import MessageReply from "../components/MessageReply"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, 
SiteLightnessContext, SiteSaturationContext, ScrollContext, MessagePageContext, ShowPageDialogContext, PageFlagContext,
DeleteMessageIDContext, DeleteMessageFlagContext, QuoteTextContext, EditMessageIDContext, EditMessageFlagContext,
EditMessageTitleContext, EditMessageContentContext, HasNotificationContext, SessionFlagContext} from "../Context"
import permissions from "../structures/Permissions"
import jsxFunctions from "../structures/JSXFunctions"
import PageDialog from "../dialogs/PageDialog"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import editOptIcon from "../assets/icons/edit-opt.png"
import deleteOptIcon from "../assets/icons/delete-opt.png"
import quoteOptIcon from "../assets/icons/quote-opt.png"
import DeleteMessageDialog from "../dialogs/DeleteMessageDialog"
import EditMessageDialog from "../dialogs/EditMessageDialog"
import DeleteMessageReplyDialog from "../dialogs/DeleteMessageReplyDialog"
import EditMessageReplyDialog from "../dialogs/EditMessageReplyDialog"
import favicon from "../assets/icons/favicon.png"
import "./styles/messagepage.less"

interface Props {
    match?: any
}

const MessagePage: React.FunctionComponent<Props> = (props) => {
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
    const {messagePage, setMessagePage} = useContext(MessagePageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteMessageID, setDeleteMessageID} = useContext(DeleteMessageIDContext)
    const {deleteMessageFlag, setDeleteMessageFlag} = useContext(DeleteMessageFlagContext)
    const {editMessageID, setEditMessageID} = useContext(EditMessageIDContext)
    const {editMessageFlag, setEditMessageFlag} = useContext(EditMessageFlagContext)
    const {editMessageTitle, setEditMessageTitle} = useContext(EditMessageTitleContext)
    const {editMessageContent, setEditMessageContent} = useContext(EditMessageContentContext)
    const {hasNotification, setHasNotification} = useContext(HasNotificationContext)
    const [message, setMessage] = useState(null) as any
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
    const messageID = props?.match.params.id

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const replyParam = new URLSearchParams(window.location.search).get("reply")
        const onDOMLoaded = () => {
            const savedPage = localStorage.getItem("messagePage")
            if (savedPage && Number(savedPage) > 0) setMessagePage(Number(savedPage))
            if (pageParam && Number(pageParam) > 0) {
                setQueryPage(Number(pageParam))
                setMessagePage(Number(pageParam))
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

    useEffect(() => {
        const updateRead = async () => {
            await functions.post("/api/message/read", {messageID, forceRead: true}, session, setSessionFlag)
            const result = await functions.get("/api/user/checkmail", null, session, setSessionFlag)
            setHasNotification(result)
        }
        updateRead()
    }, [session])

    const updateMessage = async () => {
        const message = await functions.get("/api/message", {messageID}, session, setSessionFlag)
        setMessage(message)
        document.title = `${message.title}`
        setDefaultIcon(message.image ? false : true)
    }

    const updateReplies = async () => {
        const result = await functions.get("/api/message/replies", {messageID}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleReplies([])
        setReplies(result)
    }

    useEffect(() => {
        updateMessage()
        updateReplies()
    }, [messageID, session])

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

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            history.push("/401")
        }
        if (message) {
            if (message.creator !== session.username &&
                message.recipient !== session.username) {
                    history.push("/401")
                }
        }
    }, [session, message])

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
            setMessagePage(1)
            updateReplies()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) {
            history.replace(`${location.pathname}?page=${messagePage}${replyID > -1 ? `&reply=${replyID}` : ""}`)
        } else {
            if (replyID > -1) history.replace(`${location.pathname}?reply=${replyID}`) 
        }
    }, [scroll, messagePage, replyID])

    useEffect(() => {
        if (replies?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setMessagePage(maxTagPage)
            }
        }
    }, [replies, messagePage, queryPage])

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
        localStorage.setItem("messagePage", String(messagePage))
    }, [messagePage])

    const maxPage = () => {
        if (!replies?.length) return 1
        if (Number.isNaN(Number(replies[0]?.replyCount))) return 10000
        return Math.ceil(Number(replies[0]?.replyCount) / getPageAmount())
    }

    const firstPage = () => {
        setMessagePage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = messagePage - 1 
        if (newPage < 1) newPage = 1 
        setMessagePage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = messagePage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setMessagePage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setMessagePage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number, noScroll?: boolean) => {
        setMessagePage(newPage)
        if (!noScroll) window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (messagePage > maxPage() - 3) increment = -4
        if (messagePage > maxPage() - 2) increment = -5
        if (messagePage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (messagePage > maxPage() - 2) increment = -3
            if (messagePage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = messagePage + increment
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
                    {messagePage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {messagePage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {jsx}
                    {messagePage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {messagePage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
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
            const postOffset = (messagePage - 1) * getPageAmount()
            visible = replies.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<MessageReply key={visible[i].replyID} reply={visible[i]} onDelete={updateReplies} onEdit={updateReplies} onReplyJump={onReplyJump}/>)
        }
        return jsx
    }

    const getCreatorPFP = () => {
        if (message.image) {
            return functions.getTagLink("pfp", message.image)
        } else {
            return favicon
        }
    }

    const creatorClick = (event: React.MouseEvent) => {
        if (!message) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${message.creator}`, "_blank")
        } else {
            history.push(`/user/${message.creator}`)
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!message.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${message.imagePost}`, "_blank")
        } else {
            history.push(`/post/${message.imagePost}`)
        }
    }

    const getCreatorJSX = () => {
        if (message.role === "admin") {
            return (
                <div className="mail-message-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                    <span className="mail-message-user-text admin-color">{functions.toProperCase(message.creator)}</span>
                    <img className="mail-message-user-label" src={adminCrown}/>
                </div>
            )
        } else if (message.role === "mod") {
            return (
                <div className="mail-message-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="mail-message-user-text mod-color">{functions.toProperCase(message.creator)}</span>
                    <img className="mail-message-user-label" src={modCrown}/>
                </div>
            )
        } else if (message.role === "system") {
            return (
                <div className="mail-message-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="mail-message-user-text system-color">{functions.toProperCase(message.creator)}</span>
                    <img className="mail-message-user-label" src={systemCrown}/>
                </div>
            )
        }
        return <span className={`mail-message-user-text ${message.banned ? "banned" : ""}`} onClick={creatorClick} onAuxClick={creatorClick}>{functions.toProperCase(message.creator)}</span>
    }

    const editMessage = async () => {
        const badTitle = functions.validateTitle(editMessageTitle)
        if (badTitle) return
        const badContent = functions.validateThread(editMessageContent)
        if (badContent) return
        await functions.put("/api/message/edit", {messageID, title: editMessageTitle, content: editMessageContent}, session, setSessionFlag)
        updateMessage()
    }

    useEffect(() => {
        if (editMessageFlag && editMessageID === messageID) {
            editMessage()
            setEditMessageFlag(false)
            setEditMessageID(null)
        }
    }, [editMessageFlag, editMessageID, editMessageTitle, editMessageContent])

    const editMessageDialog = () => {
        if (!message) return
        setEditMessageContent(message.content)
        setEditMessageTitle(message.title)
        setEditMessageID(message.messageID)
    }

    const deleteMessage = async () => {
        await functions.delete("/api/message/delete", {messageID}, session, setSessionFlag)
        history.push("/mail")
    }

    useEffect(() => {
        if (deleteMessageFlag && deleteMessageID === messageID) {
            deleteMessage()
            setDeleteMessageFlag(false)
            setDeleteMessageID(null)
        }
    }, [deleteMessageFlag, deleteMessageID])

    const deleteMessageDialog = () => {
        if (!message) return
        setDeleteMessageID(messageID)
    }

    const triggerQuote = () => {
        if (!message) return
        const cleanReply = functions.parseComment(message.content).filter((s: any) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[0] ${functions.toProperCase(message.creator)} said:
            > ${cleanReply}
        `))
    }

    const getOptionsJSX = () => {
        if (!message) return
        let jsx = [] as any
        if (session.username && !session.banned) {
            jsx.push(
                <>
                <img draggable={false} className="mail-message-opt-icon" src={quoteOptIcon} onClick={triggerQuote} style={{filter: getFilter()}}/>
                </>
            )
        }
        if (session.username === message.creator || permissions.isElevated(session)) {
            jsx.push(
                <>
                <img draggable={false} className="mail-message-opt-icon" src={editOptIcon} onClick={editMessageDialog} style={{filter: getFilter()}}/>
                <img draggable={false} className="mail-message-opt-icon" src={deleteOptIcon} onClick={deleteMessageDialog} style={{filter: getFilter()}}/>
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
        await functions.post("/api/message/reply", {messageID, content: text}, session, setSessionFlag)
        updateReplies()
        setText("")
    }

    const getReplyBoxJSX = () => {
        if (message.role === "system") return (
            <div className="mail-message-reply-box" style={{justifyContent: "flex-start"}}>
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: "15px"}}>Cannot respond to system messages.</span>
            </div>
        )
        if (session.banned) return (
            <div className="mail-message-reply-box" style={{justifyContent: "flex-start"}}>
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: "15px"}}>You are banned. Cannot reply.</span>
            </div>
        )
        if (session.username) {
            return (
                <div className="mail-message-reply-box">
                    <div className="mail-message-input-container">
                        <div className="mail-message-row-start" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea className="mail-message-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="mail-message-validation-container"><span className="mail-message-validation" ref={errorRef}></span></div> : null}
                        <div className="mail-message-button-container-left">
                            <button className="mail-message-button" onClick={reply}>Message</button>
                        </div>
                    </div>
                </div>
            )
        }
    }

    return (
        <>
        <DragAndDrop/> 
        <EditMessageDialog/> 
        <DeleteMessageDialog/> 
        <EditMessageReplyDialog/>
        <DeleteMessageReplyDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(false)}>
                {message ?
                <div className="mail-message" onMouseEnter={() => setEnableDrag(false)}>
                    <div className="mail-message-title-container">
                        <span className="mail-message-title">{message.title}</span>
                        {getOptionsJSX()}
                    </div>
                    <div className="mail-message-title-container">
                        <span className="mail-message-info">{`${message.creator} -> ${message.recipient}`}</span>
                    </div>
                    <div className="mail-message-main-post">
                        <div className="mail-message-user-container">
                            {getCreatorJSX()}
                            <span className="mail-message-date-text">{functions.timeAgo(message.createDate)}</span>
                            <img draggable={false} className="mail-message-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        </div>
                        <div className="mail-message-text-container">
                            <p className="mail-message-text">{jsxFunctions.parseTextLinks(message.content)}</p>
                        </div>
                    </div>
                    <table className="mail-message-container">
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

export default MessagePage