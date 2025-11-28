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
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import systemCrown from "../../assets/icons/system-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import lockIcon from "../../assets/icons/lock.png"
import stickyIcon from "../../assets/icons/sticky.png"
import lockOptIcon from "../../assets/icons/lock-opt.png"
import stickyOptIcon from "../../assets/icons/sticky-opt.png"
import unlockOptIcon from "../../assets/icons/unlock-opt.png"
import unstickyOptIcon from "../../assets/icons/unsticky-opt.png"
import editOptIcon from "../../assets/icons/edit-opt.png"
import deleteOptIcon from "../../assets/icons/delete-opt.png"
import quoteOptIcon from "../../assets/icons/quote-opt.png"
import reportOptIcon from "../../assets/icons/report-opt.png"
import emojiSelect from "../../assets/icons/emoji-select.png"
import favicon from "../../assets/icons/favicon.png"
import lewdIcon from "../../assets/icons/lewd.png"
import radioButton from "../../assets/icons/radiobutton.png"
import radioButtonChecked from "../../assets/icons/radiobutton-checked.png"
import highlight from "../../assets/icons/highlight.png"
import bold from "../../assets/icons/bold.png"
import italic from "../../assets/icons/italic.png"
import underline from "../../assets/icons/underline.png"
import strikethrough from "../../assets/icons/strikethrough.png"
import spoiler from "../../assets/icons/spoiler.png"
import link from "../../assets/icons/link-purple.png"
import details from "../../assets/icons/details.png"
import hexcolor from "../../assets/icons/hexcolor.png"
import codeblock from "../../assets/icons/codeblock.png"
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
    const [text, setText] = useState("")
    const [r18, setR18] = useState(false)
    const [defaultIcon, setDefaultIcon] = useState(false)
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLDivElement>(null)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const navigate = useNavigate()
    const {id: threadID} = useParams() as {id: string}

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
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

    const {visibleItems, page, setPage, maxPage, initItemLoader, setManagedPage} = 
        usePaginatedScroll({loadInitial, pageAmount, countKey: "replyCount"})

    useEffect(() => {
        updateThread()
        initItemLoader()
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
            jsx.push(<Reply reply={reply} thread={thread} onDelete={initItemLoader} onEdit={initItemLoader} onReplyJump={onReplyJump}/>)
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

    const creatorClick = (event: React.MouseEvent) => {
        if (!thread) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${thread.creator}`, "_blank")
        } else {
            navigate(`/user/${thread.creator}`)
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
        setEditThreadContent(thread.content)
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
                <img draggable={false} className="thread-page-opt-icon" src={thread.sticky ? unstickyOptIcon : stickyOptIcon} onClick={updateSticky} style={{marginTop: "3px", filter: getFilter()}}/>
                <img draggable={false} className="thread-page-opt-icon" src={thread.locked ? unlockOptIcon : lockOptIcon} onClick={updateLocked} style={{filter: getFilter()}}/>
                </>
            )
        }
        if (session.username && !session.banned) {
            jsx.push(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={quoteOptIcon} onClick={triggerQuote} style={{filter: getFilter()}}/>
                <img draggable={false} className="thread-page-opt-icon" src={reportOptIcon} onClick={reportThreadDialog} style={{filter: getFilter()}}/>
                </>
            )
        }
        if (session.username === thread.creator || permissions.isMod(session)) {
            jsx.push(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={editOptIcon} onClick={editThreadDialog} style={{filter: getFilter()}}/>
                <img draggable={false} className="thread-page-opt-icon" src={deleteOptIcon} onClick={deleteThreadDialog} style={{filter: getFilter()}}/>
                </>
            )
        }
        return jsx
    }

    useEffect(() => {
        if (quoteText) {
            const prevText = text.trim() ? `${text.trim()}\n` : ""
            setText(`${prevText}${quoteText.trim()}`)
            setQuoteText("")
            window.scrollTo(0, document.body.scrollHeight)
        }
    }, [quoteText])

    const reply = async () => {
        const badReply = functions.validation.validateReply(text, i18n)
        if (badReply) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badReply
            await functions.timeout(2000)
            return setError(false)
        }
        await functions.http.post("/api/thread/reply", {threadID, content: text, r18}, session, setSessionFlag)
        initItemLoader()
        setText("")
    }

    const getEmojiMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -145
        if (mobile) offset -= 20
        return `${raw + offset}px`
    }

    const getEmojiMarginBottom = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".thread-page-textarea"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = 120
        if (mobile) offset += 0
        return `${raw + offset}px`
    }

    const emojiGrid = () => {
        let rows = [] as React.ReactElement[]
        let rowAmount = 7
        for (let i = 0; i < Object.keys(emojis).length; i++) {
            let items = [] as React.ReactElement[]
            for (let j = 0; j < rowAmount; j++) {
                const k = (i*rowAmount)+j
                const key = Object.keys(emojis)[k]
                if (!key) break
                const appendText = () => {
                    setText((prev: string) => prev + ` :${key}:`)
                    setShowEmojiDropdown(false)
                }
                items.push(
                    <img draggable={false} src={emojis[key]} className="emoji-big" onClick={appendText}/>
                )
            }
            if (items.length) rows.push(<div className="emoji-row">{items}</div>)
        }
        return (
            <div className={`emoji-grid ${showEmojiDropdown ? "" : "hide-emoji-grid"}`}
            style={{marginRight: getEmojiMarginRight(), marginBottom: getEmojiMarginBottom()}}>
                {rows}
            </div>
        )
    }

    const viewThreads = () => {
        if (!thread) return
        navigate(`/posts/${thread.creator}`)
    }

    const getReplyBoxJSX = () => {
        if (!thread) return
        if (thread.locked && !permissions.isMod(session)) return (
            <div className="thread-page-reply-box" style={{justifyContent: "flex-start"}}>
                <span className="thread-page-validation" style={{fontSize: "20px", marginLeft: mobile ? "0px" : "15px"}}>{i18n.pages.thread.locked}</span>
            </div>
        )
        if (session.banned) return (
            <div className="thread-page-reply-box" style={{justifyContent: "flex-start"}}>
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: mobile ? "0px" : "15px"}}>{i18n.pages.message.banned}</span>
            </div>
        )
        if (session.username) {
            return (
                <div className="thread-page-reply-box">
                    <div className="thread-page-input-container">
                        <div className="thread-page-textarea-buttons">
                            <button className="thread-page-textarea-button"><img src={highlight} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "highlight")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={bold} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "bold")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={italic} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "italic")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={underline} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "underline")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={strikethrough} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "strikethrough")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={spoiler} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "spoiler")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={link} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "link")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={details} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "details")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={hexcolor} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "color")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={codeblock} onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "code")} style={{filter: getFilter()}}/></button>
                        </div>
                        {previewMode ? <div className="thread-page-preview">{functions.jsx.renderText(text, emojis, "reply", undefined, r18)}</div> : 
                        <div style={{marginTop: "0px"}} className="thread-page-row-start" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea ref={textRef} className="thread-page-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}></textarea>
                        </div>}
                        {error ? <div className="thread-page-validation-container"><span className="thread-page-validation" ref={errorRef}></span></div> : null}
                        <div className="thread-page-button-container-left">
                            <button className="thread-page-button" onClick={reply}>{i18n.buttons.reply}</button>
                            <button className="comments-emoji-button" ref={emojiRef} onClick={() => setShowEmojiDropdown((prev: boolean) => !prev)}>
                                <img src={emojiSelect}/>
                            </button>
                            <button className={previewMode ? "thread-page-edit-button" : "thread-page-preview-button"} onClick={() => setPreviewMode((prev: boolean) => !prev)}>{previewMode ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
                            {session.showR18 ?
                            <div className="thread-page-replybox-row">
                                <img className="thread-page-checkbox" src={r18 ? radioButtonChecked : radioButton} onClick={() => setR18((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                                <span className="thread-page-replybox-text" style={{marginLeft: "10px"}}>R18</span>
                                <img className="thread-page-icon" src={lewdIcon} style={{marginLeft: "15px", height: "50px", filter: getFilter()}}/>
                            </div> : null}
                        </div>
                    </div>
                </div>
            )
        }
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
                        {thread.sticky ? <img draggable={false} className="thread-page-icon" src={stickyIcon}/> : null}
                        {thread.locked ? <img draggable={false} className="thread-page-icon" src={lockIcon}/> : null}
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
                            <img draggable={false} className="thread-page-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
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
                    {getReplyBoxJSX()}
                    {emojiGrid()}
                    {!scroll ? <PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/> : null}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ThreadPage