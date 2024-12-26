import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import MessageReply from "../components/MessageReply"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions, useMessageDialogActions, useMessageDialogSelector, useCacheSelector} from "../store"
import permissions from "../structures/Permissions"
import jsxFunctions from "../structures/JSXFunctions"
import PageDialog from "../dialogs/PageDialog"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import premiumCuratorStar from "../assets/icons/premium-curator-star.png"
import curatorStar from "../assets/icons/curator-star.png"
import premiumContributorPencil from "../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../assets/icons/contributor-pencil.png"
import premiumStar from "../assets/icons/premium-star.png"
import editOptIcon from "../assets/icons/edit-opt.png"
import deleteOptIcon from "../assets/icons/delete-opt.png"
import quoteOptIcon from "../assets/icons/quote-opt.png"
import forwardOptIcon from "../assets/icons/forward-opt.png"
import DeleteMessageDialog from "../dialogs/DeleteMessageDialog"
import EditMessageDialog from "../dialogs/EditMessageDialog"
import DeleteMessageReplyDialog from "../dialogs/DeleteMessageReplyDialog"
import EditMessageReplyDialog from "../dialogs/EditMessageReplyDialog"
import ForwardMessageDialog from "../dialogs/ForwardMessageDialog"
import favicon from "../assets/icons/favicon.png"
import emojiSelect from "../assets/icons/emoji-select.png"
import lewdIcon from "../assets/icons/lewd.png"
import radioButton from "../assets/icons/radiobutton.png"
import radioButtonChecked from "../assets/icons/radiobutton-checked.png"
import highlight from "../assets/icons/highlight.png"
import bold from "../assets/icons/bold.png"
import italic from "../assets/icons/italic.png"
import underline from "../assets/icons/underline.png"
import strikethrough from "../assets/icons/strikethrough.png"
import spoiler from "../assets/icons/spoiler.png"
import details from "../assets/icons/details.png"
import hexcolor from "../assets/icons/hexcolor.png"
import link from "../assets/icons/link-purple.png"
import codeblock from "../assets/icons/codeblock.png"
import "./styles/threadpage.less"
import {MessageUser, MessageUserReply} from "../types/Types"

interface Props {
    match: {params: {id: string}}
}

const MessagePage: React.FunctionComponent<Props> = (props) => {
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
    const {setScroll} = useSearchActions()
    const {messagePage} = usePageSelector()
    const {setMessagePage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag, messageFlag} = useFlagSelector()
    const {setPageFlag, setMessageFlag} = useFlagActions()
    const {deleteMessageID, deleteMessageFlag, editMessageID, editMessageFlag, editMessageTitle, editMessageContent, editMessageR18} = useMessageDialogSelector()
    const {setDeleteMessageID, setDeleteMessageFlag, setEditMessageID, setEditMessageFlag, setEditMessageTitle, setEditMessageContent, setEditMessageR18, setForwardMessageObj} = useMessageDialogActions()
    const {emojis} = useCacheSelector()
    const [message, setMessage] = useState(null as MessageUser | null)
    const [replies, setReplies] = useState([] as MessageUserReply[])
    const [index, setIndex] = useState(0)
    const [visibleReplies, setVisibleReplies] = useState([] as MessageUserReply[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const [replyID, setReplyID] = useState(-1)
    const [replyJumpFlag, setReplyJumpFlag] = useState(false)
    const [text, setText] = useState("")
    const [r18, setR18] = useState(false)
    const [defaultIcon, setDefaultIcon] = useState(false)
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [error, setError] = useState(false)
    const history = useHistory()
    const errorRef = useRef<HTMLDivElement>(null)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const messageID = props.match.params.id

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
        const message = await functions.get("/api/message", {messageID}, session, setSessionFlag).catch(() => null)
        if (!message) return functions.replaceLocation("/404")
        if (message.r18) {
            if (!session.cookie) return
            if (!session.showR18) return functions.replaceLocation("/404")
        }
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
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            functions.replaceLocation("/401")
        }
        if (message && message.creator !== session.username) {
            let canRead = false
            for (const recipient of message.recipients) {
                if (recipient === session.username) {
                    canRead = true
                }
            }

            if (!canRead) functions.replaceLocation("/401")
        }
    }, [session, message])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateReplies = () => {
            let currentIndex = index
            const newVisibleReplies = visibleReplies
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
                const newVisibleReplies = visibleReplies
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
        localStorage.setItem("messagePage", String(messagePage || ""))
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
        const jsx = [] as React.ReactElement[]
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
        const jsx = [] as React.ReactElement[]
        let visible = [] as MessageUserReply[]
        if (scroll) {
            visible = functions.removeDuplicates(visibleReplies)
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
        if (!message) return
        if (message.image) {
            return functions.getTagLink("pfp", message.image, message.imageHash)
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
        if (!message?.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${message.imagePost}`, "_blank")
        } else {
            history.push(`/post/${message.imagePost}`)
        }
    }

    const getCreatorJSX = () => {
        if (!message) return
        if (message.role === "admin") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                    <span className="thread-page-user-text admin-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={adminCrown}/>
                </div>
            )
        } else if (message.role === "mod") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text mod-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={modCrown}/>
                </div>
            )
        } else if (message.role === "system") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text system-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={systemCrown}/>
                </div>
            )
        } else if (message.role === "premium-curator") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text curator-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (message.role === "curator") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text curator-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={curatorStar}/>
                </div>
            )
        } else if (message.role === "premium-contributor") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text premium-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (message.role === "contributor") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text contributor-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (message.role === "premium") {
            return (
                <div className="thread-page-username-container" onClick={creatorClick} onAuxClick={creatorClick}>
                <span className="thread-page-user-text premium-color">{functions.toProperCase(message.creator)}</span>
                    <img className="thread-page-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className={`thread-page-user-text ${message.banned ? "banned" : ""}`} onClick={creatorClick} onAuxClick={creatorClick}>{functions.toProperCase(message?.creator) || "deleted"}</span>
    }

    const editMessage = async () => {
        const badTitle = functions.validateTitle(editMessageTitle, i18n)
        if (badTitle) return
        const badContent = functions.validateThread(editMessageContent, i18n)
        if (badContent) return
        await functions.put("/api/message/edit", {messageID, title: editMessageTitle, content: editMessageContent, r18: editMessageR18}, session, setSessionFlag)
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
        setEditMessageR18(message.r18)
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

    const forwardMessageDialog = () => {
        if (!message) return
        setForwardMessageObj(message)
    }

    const triggerQuote = () => {
        if (!message) return
        const cleanReply = functions.parsePieces(message.content).filter((s: string) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[0] ${functions.toProperCase(message.creator)} said:
            > ${cleanReply}
        `))
    }

    const getOptionsJSX = () => {
        if (!message) return
        let jsx = [] as React.ReactElement[]
        if (message.role !== "system" && session.username && !session.banned) {
            jsx.push(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={quoteOptIcon} onClick={triggerQuote} style={{filter: getFilter()}}/>
                </>
            )
        }
        if (session.username === message.creator || permissions.isMod(session)) {
            jsx.push(
                <>
                <img draggable={false} className="thread-page-opt-icon" src={forwardOptIcon} onClick={forwardMessageDialog} style={{filter: getFilter()}}/>
                <img draggable={false} className="thread-page-opt-icon" src={editOptIcon} onClick={editMessageDialog} style={{filter: getFilter()}}/>
                <img draggable={false} className="thread-page-opt-icon" src={deleteOptIcon} onClick={deleteMessageDialog} style={{filter: getFilter()}}/>
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
        const badReply = functions.validateReply(text, i18n)
        if (badReply) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badReply
            await functions.timeout(2000)
            return setError(false)
        }
        await functions.post("/api/message/reply", {messageID, content: text, r18}, session, setSessionFlag)
        updateReplies()
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
            if (items.length) rows.push(<div className="emoji-row">{items}</div>)
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
                            <button className="thread-page-textarea-button"><img src={highlight} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "highlight")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={bold} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "bold")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={italic} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "italic")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={underline} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "underline")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={strikethrough} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "strikethrough")} style={{filter: getFilter()}}/></button>
                            <button className="thread-page-textarea-button"><img src={spoiler} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "spoiler")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={link} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "link")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={details} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "details")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={hexcolor} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "color")} style={{filter: getFilter()}}/></button>
                            <button className="comments-textarea-button"><img src={codeblock} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "code")} style={{filter: getFilter()}}/></button>
                        </div>
                        {previewMode ? <div className="thread-page-preview">{jsxFunctions.renderText(text, emojis, "message", undefined, r18)}</div> : 
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

    return (
        <>
        <EditMessageDialog/> 
        <DeleteMessageDialog/> 
        <EditMessageReplyDialog/>
        <DeleteMessageReplyDialog/>
        <ForwardMessageDialog/>
        <PageDialog/>
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
                        <span className="thread-page-info">{`${message.creator} -> ${message.recipients.map((r) => r === null ? "deleted" : r).join(", ")}`}</span>
                    </div>
                    <div className="thread-page-main-post" style={{backgroundColor: message.r18 ? "var(--r18BGColor)" : ""}}>
                        <div className="thread-page-user-container">
                            {getCreatorJSX()}
                            <span className="thread-page-date-text">{functions.timeAgo(message.createDate, i18n)}</span>
                            <img draggable={false} className="thread-page-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        </div>
                        <div className="thread-page-text-container">
                            <p className="thread-page-text">{jsxFunctions.renderMessageText(message.content, emojis)}</p>
                        </div>
                    </div>
                    <div className="thread-page-container">
                        {generateRepliesJSX()}
                    </div>
                    {getReplyBoxJSX()}
                    {emojiGrid()}
                    {generatePageButtonsJSX()}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default MessagePage