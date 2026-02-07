import React, {useEffect, useState, useRef} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import Reply from "../../components/search/Reply"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchSelector, usePageSelector,
useThreadDialogActions, useThreadDialogSelector, useCacheSelector} from "../../store"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import lockIcon from "../../assets/svg/lock.svg"
import stickyIcon from "../../assets/svg/sticky.svg"
import unlockIcon from "../../assets/svg/unlock.svg"
import unstickyIcon from "../../assets/svg/unsticky.svg"
import editIcon from "../../assets/svg/edit.svg"
import deleteIcon from "../../assets/svg/delete.svg"
import quoteIcon from "../../assets/svg/quote.svg"
import reportIcon from "../../assets/svg/report.svg"
import TextBox, {TextBoxRef} from "../../ui/TextBox"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {ThreadReply, ThreadUser} from "../../types/Types"
import "./styles/threadpage.less"

let pageAmount = 15

const ThreadPage: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {quoteText} = useActiveSelector()
    const {setActiveDropdown, setQuoteText} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {threadPage} = usePageSelector()
    const {setThreadPage} = usePageActions()
    const {deleteThreadID, deleteThreadFlag, editThreadID, editThreadFlag, 
        editThreadTitle, editThreadContent, editThreadR18} = useThreadDialogSelector()
    const {setDeleteThreadID, setDeleteThreadFlag, setEditThreadID, setEditThreadFlag, 
        setEditThreadTitle, setEditThreadContent, setEditThreadR18, setReportThreadID} = useThreadDialogActions()
    const {emojis} = useCacheSelector()
    const [thread, setThread] = useState(null as ThreadUser | null)
    const [replyID, setReplyID] = useState(-1)
    const [replyJumpFlag, setReplyJumpFlag] = useState(false)
    const [defaultIcon, setDefaultIcon] = useState(false)
    const textBoxRef = useRef<TextBoxRef>(null)
    const navigate = useNavigate()
    const {id: threadID} = useParams() as {id: string}

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--titleButtons")
    }

    useEffect(() => {
        const replyParam = new URLSearchParams(window.location.search).get("reply")
        const onDOMLoaded = () => {
            if (replyParam) {
                setReplyID(Number(replyParam))
                setReplyJumpFlag(true)
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => window.removeEventListener("load", onDOMLoaded)
    }, [])

    useEffect(() => {
        if (replyID > -1 && replyJumpFlag) {
            setTimeout(() => {
                onReplyJump(replyID)
                setReplyJumpFlag(false)
            }, 200)
        }
    }, [replyID, replyJumpFlag])

    useEffect(() => {
        const updateRead = async () => {
            if (session.username) {
                await functions.http.post("/api/thread/read", {threadID, forceRead: true}, session, setSessionFlag)
            }
        }
        updateRead()
    }, [session])

    const updateThread = async () => {
        const thread = await functions.http.get("/api/thread", {threadID}, session, setSessionFlag).catch(() => null)
        if (!thread) return functions.dom.replaceLocation("/404")
        if (thread.r18) {
            if (!session.cookie) return
            if (!session.showR18) return functions.dom.replaceLocation("/404")
        }
        setThread(thread)
        document.title = `${thread.title}`
        setDefaultIcon(thread.image ? false : true)
    }

    const loadInitial = async () => {
        const result = await functions.http.get("/api/thread/replies", {threadID}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItems, setManagedPage} = 
        usePaginatedScroll({loadInitial, pageAmount, countKey: "replyCount"})

    useEffect(() => {
        updateThread()
        initItems()
    }, [threadID, session])

    useEffect(() => {
        if (threadPage) setManagedPage(threadPage)
    }, [])

    useEffect(() => {
        setThreadPage(page)
    }, [page])

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
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (replyID > -1) searchParams.set("reply", String(replyID))
    }, [replyID])

    const onReplyJump = (replyID: number) => {
        if (replyID === 0) {
            setPage(1)
        } else {
            let index = -1
            for (let i = 0; i < visibleItems.length; i++) {
                if (visibleItems[i].replyID === String(replyID)) {
                    index = i 
                    break
                }
            }
            if (index > -1) {
                const pageNumber = Math.ceil(index / pageAmount)
                setPage(pageNumber)
                const element = document.querySelector(`[reply-id="${replyID}"]`)
                if (!element) return
                const position = element.getBoundingClientRect()
                const elementTop = position.top + window.scrollY
                window.scrollTo(0, elementTop - (window.innerHeight / 3))
                setReplyID(replyID)
            }
        }
    }

    const generateRepliesJSX = () => {
        if (!thread) return
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as ThreadReply[]
        for (let i = 0; i < visible.length; i++) {
            const reply = visible[i]
            if (reply.fake) continue
            jsx.push(<Reply reply={reply} thread={thread} onDelete={initItems} onEdit={initItems} onReplyJump={onReplyJump}/>)
        }
        return jsx
    }

    const getCreatorPFP = () => {
        if (!thread) return
        if (thread.image) {
            return functions.link.getTagLink("pfp", thread.image, thread.imageHash)
        } else {
            return favicon
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!thread?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(thread.imagePost, event, navigate, session, setSessionFlag)
    }

    const getCreatorJSX = () => {
        if (!thread) return
        return functions.jsx.usernameJSX({username: thread.creator, ...thread}, {
            containerClass: "thread-page-username-container",
            textClass: "thread-page-user-text",
            imageClass: "thread-page-user-label",
        }, i18n, navigate)
    }

    const updateSticky = async () => {
        functions.cache.clearResponseCacheKey("/api/thread")
        await functions.http.post("/api/thread/sticky", {threadID}, session, setSessionFlag)
        updateThread()
    }

    const updateLocked = async () => {
        functions.cache.clearResponseCacheKey("/api/thread")
        await functions.http.post("/api/thread/lock", {threadID}, session, setSessionFlag)
        updateThread()
    }

    const editThread = async () => {
        const badTitle = functions.validation.validateTitle(editThreadTitle, i18n)
        if (badTitle) return
        const badContent = functions.validation.validateThread(editThreadContent, i18n)
        if (badContent) return
        await functions.http.put("/api/thread/edit", {threadID, title: editThreadTitle, content: editThreadContent, r18: editThreadR18}, session, setSessionFlag)
        updateThread()
    }

    useEffect(() => {
        if (editThreadFlag && editThreadID === threadID) {
            editThread()
            setEditThreadFlag(false)
            setEditThreadID(null)
        }
    }, [editThreadFlag, editThreadID, editThreadTitle, editThreadContent, editThreadR18])

    const editThreadDialog = () => {
        if (!thread) return
        setEditThreadContent(functions.jsx.undoLinkReplacements(thread.content))
        setEditThreadTitle(thread.title)
        setEditThreadID(thread.threadID)
        setEditThreadR18(thread.r18 ?? false)
    }

    const deleteThread = async () => {
        await functions.http.delete("/api/thread/delete", {threadID}, session, setSessionFlag)
        navigate("/forum")
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
        const cleanReply = functions.render.parsePieces(thread.content).filter((s: string) => !s.includes(">>>")).join(" ")
        setQuoteText(functions.multiTrim(`
            >>>[0] ${functions.util.toProperCase(thread.creator)} said:
            > ${cleanReply}
        `))
    }

    const getOptionsJSX = () => {
        if (!thread) return
        let jsx = [] as React.ReactElement[]
        if (permissions.isMod(session)) {
            jsx.push(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={thread.sticky ? getIcon(unstickyIcon) : getIcon(stickyIcon)} onClick={updateSticky} style={{marginTop: "3px", filter}}/>
                <img draggable={false} className="thread-page-opt-icon" src={thread.locked ? getIcon(unlockIcon) : getIcon(lockIcon)} onClick={updateLocked} style={{filter}}/>
                </>
            )
        }
        if (session.username && !session.banned) {
            jsx.push(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={getIcon(quoteIcon)} onClick={triggerQuote} style={{filter}}/>
                <img draggable={false} className="thread-page-opt-icon" src={getIcon(reportIcon)} onClick={reportThreadDialog} style={{filter}}/>
                </>
            )
        }
        if (session.username === thread.creator || permissions.isMod(session)) {
            jsx.push(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={getIcon(editIcon)} onClick={editThreadDialog} style={{filter}}/>
                <img draggable={false} className="thread-page-opt-icon" src={getIcon(deleteIcon)} onClick={deleteThreadDialog} style={{filter}}/>
                </>
            )
        }
        return jsx
    }

    useEffect(() => {
        if (quoteText) {
            const text = textBoxRef.current?.getText() ?? ""
            const prevText = text.trim() ? `${text.trim()}\n` : ""
            textBoxRef.current?.updateText(`${prevText}${quoteText.trim()}`)
            setQuoteText("")
            window.scrollTo(0, document.body.scrollHeight)
        }
    }, [quoteText])

    const reply = async (text: string) => {
        const r18 = textBoxRef.current?.getR18() ?? false
        const badReply = functions.validation.validateReply(text, i18n)
        if (badReply) {
            textBoxRef.current?.showError(badReply)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        await functions.http.post("/api/thread/reply", {threadID, content: text, r18}, session, setSessionFlag)
        initItems()
        textBoxRef.current?.updateText("")
    }

    const viewThreads = () => {
        if (!thread) return
        navigate(`/posts/${thread.creator}`)
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(false)}>
                {thread ?
                <div className="thread-page" onMouseEnter={() => setEnableDrag(false)}>
                    <div className="thread-page-title-container">
                        {thread.sticky ? <img draggable={false} className="thread-page-icon" src={getIcon(stickyIcon)}/> : null}
                        {thread.locked ? <img draggable={false} className="thread-page-icon" src={getIcon(lockIcon)}/> : null}
                        <span className="thread-page-title">
                            {thread.r18 ? <span style={{color: "var(--r18Color)", marginRight: "10px"}}>[R18]</span> : null}
                            {thread.title}
                        </span>
                        {getOptionsJSX()}
                    </div>
                    <div className="thread-page-main-post" style={{backgroundColor: thread.r18 ? "var(--r18BGColor)" : ""}}>
                        <div className="thread-page-user-container">
                            {getCreatorJSX()}
                            <span className="thread-page-date-text">{functions.date.timeAgo(thread.createDate, i18n)}</span>
                            <img draggable={false} className="thread-page-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: defaultIcon ? filter : ""}}/>
                            <span className="thread-page-mini-link" onClick={viewThreads}>{thread.postCount} {Number(thread.postCount) === 1 ? i18n.buttons.post : i18n.sort.posts}</span>
                            <span className="thread-page-mini-text">{i18n.labels.joined} {functions.date.prettyDate(thread.joinDate, i18n, true)}</span>
                        </div>
                        <div className="thread-page-text-container">
                            <p className="thread-page-text">{functions.jsx.renderReplyText(thread.content, emojis)}</p>
                        </div>
                    </div>
                    <div className="thread-page-container">
                        {generateRepliesJSX()}
                    </div>
                    <TextBox ref={textBoxRef} type="reply" onPost={reply} r18Toggle={true} manualWidth={true}/>
                    {!scroll ? <PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/> : null}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ThreadPage