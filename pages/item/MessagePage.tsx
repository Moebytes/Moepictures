import React, {useEffect, useState, useRef} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import MessageReply from "../../components/search/MessageReply"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchSelector, usePageSelector, useFlagSelector,
useMessageDialogActions, useMessageDialogSelector, useCacheSelector} from "../../store"
import permissions from "../../structures/Permissions"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import systemCrown from "../../assets/icons/system-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import editOptIcon from "../../assets/icons/edit-opt.png"
import deleteOptIcon from "../../assets/icons/delete-opt.png"
import quoteOptIcon from "../../assets/icons/quote-opt.png"
import forwardOptIcon from "../../assets/icons/forward-opt.png"
import favicon from "../../assets/icons/favicon.png"
import emojiSelect from "../../assets/icons/emoji-select.png"
import lewdIcon from "../../assets/icons/lewd.png"
import radioButton from "../../assets/icons/radiobutton.png"
import radioButtonChecked from "../../assets/icons/radiobutton-checked.png"
import highlight from "../../assets/icons/highlight.png"
import bold from "../../assets/icons/bold.png"
import italic from "../../assets/icons/italic.png"
import underline from "../../assets/icons/underline.png"
import strikethrough from "../../assets/icons/strikethrough.png"
import spoiler from "../../assets/icons/spoiler.png"
import details from "../../assets/icons/details.png"
import hexcolor from "../../assets/icons/hexcolor.png"
import link from "../../assets/icons/link-purple.png"
import codeblock from "../../assets/icons/codeblock.png"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import "./styles/threadpage.less"
import {MessageUser, MessageUserReply} from "../../types/Types"

let pageAmount = 15

const MessagePage: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag, setHasNotification} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {quoteText} = useActiveSelector()
    const {setActiveDropdown, setQuoteText} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {messagePage} = usePageSelector()
    const {setMessagePage} = usePageActions()
    const {messageFlag} = useFlagSelector()
    const {setMessageFlag} = useFlagActions()
    const {deleteMessageID, deleteMessageFlag, editMessageID, editMessageFlag, 
        editMessageTitle, editMessageContent, editMessageR18} = useMessageDialogSelector()
    const {setDeleteMessageID, setDeleteMessageFlag, setEditMessageID, setEditMessageFlag, 
        setEditMessageTitle, setEditMessageContent, setEditMessageR18, setForwardMessageObj} = useMessageDialogActions()
    const {emojis} = useCacheSelector()
    const [message, setMessage] = useState(null as MessageUser | null)
    const [replyID, setReplyID] = useState(-1)
    const [replyJumpFlag, setReplyJumpFlag] = useState(false)
    const [text, setText] = useState("")
    const [r18, setR18] = useState(false)
    const [defaultIcon, setDefaultIcon] = useState(false)
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [error, setError] = useState(false)
    const navigate = useNavigate()
    const errorRef = useRef<HTMLDivElement>(null)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const {id: messageID} = useParams() as {id: string}

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
            await functions.http.post("/api/message/read", {messageID, forceRead: true}, session, setSessionFlag)
            const result = await functions.http.get("/api/user/checkmail", null, session, setSessionFlag)
            setHasNotification(result)
        }
        updateRead()
    }, [session])

    const updateMessage = async () => {
        const message = await functions.http.get("/api/message", {messageID}, session, setSessionFlag).catch(() => null)
        if (!message) return functions.dom.replaceLocation("/404")
        if (message.r18) {
            if (!session.cookie) return
            if (!session.showR18) return functions.dom.replaceLocation("/404")
        }
        setMessage(message)
        document.title = `${message.title}`
        setDefaultIcon(message.image ? false : true)
    }

    const loadInitial = async () => {
        const result = await functions.http.get("/api/message/replies", {messageID}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItemLoader, setManagedPage} = 
        usePaginatedScroll({loadInitial, pageAmount, countKey: "replyCount"})

    useEffect(() => {
        updateMessage()
        initItemLoader()
    }, [messageID, session])

    useEffect(() => {
        if (messagePage) setManagedPage(messagePage)
    }, [])

    useEffect(() => {
        setMessagePage(page)
    }, [page])

    useEffect(() => {
        if (messageFlag) {
            updateMessage()
            setMessageFlag(false)
        }
    }, [messageID, session, messageFlag])

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
        if (!session.cookie) return
        if (!session.username) {
            functions.dom.replaceLocation("/401")
        }
        if (message && message.creator !== session.username) {
            let canRead = false
            for (const recipient of message.recipients) {
                if (recipient === session.username) {
                    canRead = true
                }
            }

            if (!canRead) functions.dom.replaceLocation("/401")
        }
    }, [session, message])

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
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as MessageUserReply[]
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<MessageReply reply={visible[i]} onDelete={initItemLoader} onEdit={initItemLoader} onReplyJump={onReplyJump}/>)
        }
        return jsx
    }

    const getCreatorPFP = () => {
        if (!message) return
        if (message.image) {
            return functions.link.getTagLink("pfp", message.image, message.imageHash)
        } else {
            return favicon
        }
    }

    const creatorClick = (event: React.MouseEvent) => {
        if (!message) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${message.creator}`, "_blank")
        } else {
            navigate(`/user/${message.creator}`)
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!message?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(message.imagePost, event, navigate, session, setSessionFlag)
    }

    const getCreatorJSX = () => {
        if (!message) return
        if (message.role === "admin") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                    <span className="thread-page-user-text admin-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={adminCrown}/>
                </div>
            )
        } else if (message.role === "mod") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text mod-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={modCrown}/>
                </div>
            )
        } else if (message.role === "system") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text system-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={systemCrown}/>
                </div>
            )
        } else if (message.role === "premium-curator") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text curator-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (message.role === "curator") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text curator-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={curatorStar}/>
                </div>
            )
        } else if (message.role === "premium-contributor") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text premium-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (message.role === "contributor") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text contributor-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (message.role === "premium") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text premium-color">{functions.util.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className={`thread-page-user-text ${message.banned ? "banned" : ""}`} onClick={creatorClick} onAuxClick={creatorClick}>{functions.util.toProperCase(message?.creator) || "deleted"}</span>
    }

    const editMessage = async () => {
        const badTitle = functions.validation.validateTitle(editMessageTitle, i18n)
        if (badTitle) return
        const badContent = functions.validation.validateThread(editMessageContent, i18n)
        if (badContent) return
        await functions.http.put("/api/message/edit", {messageID, title: editMessageTitle, content: editMessageContent, r18: editMessageR18}, session, setSessionFlag)
        updateMessage()
    }

    useEffect(() => {
        if (editMessageFlag && editMessageID === messageID) {
            editMessage()
            setEditMessageFlag(false)
            setEditMessageID(null)
        }
    }, [editMessageFlag, editMessageID, editMessageTitle, editMessageContent, editMessageR18])

    const editMessageDialog = () => {
        if (!message) return
        setEditMessageContent(message.content)
        setEditMessageTitle(message.title)
        setEditMessageID(message.messageID)
        setEditMessageR18(message.r18 ?? false)
    }

    const deleteMessage = async () => {
        await functions.http.delete("/api/message/delete", {messageID}, session, setSessionFlag)
        navigate("/mail")
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

    const forwardMessageDialog = () => {
        if (!message) return
        setForwardMessageObj(message)
    }

    const triggerQuote = () => {
        if (!message) return
        const cleanReply = functions.render.parsePieces(message.content).filter((s: string) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[0] ${functions.util.toProperCase(message.creator)} said:
            > ${cleanReply}
        `))
    }

    const getOptionsJSX = () => {
        if (!message) return
        if (message.role !== "system" && session.username && !session.banned) {
            return (
                <img draggable={false} className="thread-page-opt-icon" src={quoteOptIcon} onClick={triggerQuote} style={{filter: getFilter()}}/>
            )
        }
        if (session.username === message.creator || permissions.isMod(session)) {
            return(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={forwardOptIcon} onClick={forwardMessageDialog} style={{filter: getFilter()}}/>
                <img draggable={false} className="thread-page-opt-icon" src={editOptIcon} onClick={editMessageDialog} style={{filter: getFilter()}}/>
                <img draggable={false} className="thread-page-opt-icon" src={deleteOptIcon} onClick={deleteMessageDialog} style={{filter: getFilter()}}/>
                </>
            )
        }
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
        await functions.http.post("/api/message/reply", {messageID, content: text, r18}, session, setSessionFlag)
        initItemLoader()
        setText("")
    }

    const getEmojiMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -145
        if (mobile) offset += 0
        return `${raw + offset}px`
    }

    const getEmojiMarginBottom = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".thread-page-textarea"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = 180
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
            if (items.length) rows.push(<div key={i} className="emoji-row">{items}</div>)
        }
        return (
            <div className={`emoji-grid ${showEmojiDropdown ? "" : "hide-emoji-grid"}`}
            style={{marginRight: getEmojiMarginRight(), marginBottom: getEmojiMarginBottom()}}>
                {rows}
            </div>
        )
    }

    const getReplyBoxJSX = () => {
        if (!message) return
        if (message.role === "system") return (
            <div className="thread-page-reply-box" style={{justifyContent: "flex-start"}}>
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: mobile ? "0px" : "15px"}}>{i18n.pages.message.system}</span>
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
                        {previewMode ? <div className="thread-page-preview">{functions.jsx.renderText(text, emojis, "message", undefined, r18)}</div> : 
                        <div style={{marginTop: "0px"}} className="thread-page-row-start" onMouseEnter={() => setEnableDrag(false)}>
                            <textarea ref={textRef} className="thread-page-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}></textarea>
                        </div>}
                        {error ? <div className="thread-page-validation-container"><span className="thread-page-validation" ref={errorRef}></span></div> : null}
                        <div className="thread-page-button-container-left">
                            <button className="thread-page-button" onClick={reply}>{i18n.buttons.message}</button>
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

    const recipientsJSX = () => {
        if (!message) return null
        const recipientsArr = message.recipients.map((r) => r === null ? "deleted" : r).join(", ").split(" ")
        const viewUser = (user: string, event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/user/${user}`, "_blank")
            } else {
                navigate(`/user/${user}`)
            }
        }
        return (
            <span className="thread-page-info">
                <span className="thread-page-info-link" onClick={(event) => viewUser(message.creator, event)}>{message.creator}</span>
                <span> {"->"} </span>
                {recipientsArr.map((r) => <span className="thread-page-info-link" onClick={(event) => viewUser(r, event)}>{r} </span>)}
            </span>
        )
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(false)}>
                {message ?
                <div className="thread-page" onMouseEnter={() => setEnableDrag(false)}>
                    <div className="thread-page-title-container">
                        <span className="thread-page-title">
                            {message.r18 ? <span style={{color: "var(--r18Color)", marginRight: "10px"}}>[R18]</span> : null}
                            {message.title}
                        </span>
                        {getOptionsJSX()}
                    </div>
                    <div className="thread-page-title-container">
                        {recipientsJSX()}
                    </div>
                    <div className="thread-page-main-post" style={{backgroundColor: message.r18 ? "var(--r18BGColor)" : ""}}>
                        <div className="thread-page-user-container">
                            {getCreatorJSX()}
                            <span className="thread-page-date-text">{functions.date.timeAgo(message.createDate, i18n)}</span>
                            <img draggable={false} className="thread-page-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        </div>
                        <div className="thread-page-text-container">
                            <p className="thread-page-text">{functions.jsx.renderMessageText(message.content, emojis)}</p>
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

export default MessagePage