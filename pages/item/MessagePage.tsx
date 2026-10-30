/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions, useActiveSelector,
useSearchSelector, usePageSelector, useFlagSelector, useMessageDialogActions, useMessageDialogSelector,
useCacheSelector} from "../../store"
import {useGetMessageRepliesInfiniteQuery, useGetMessageRepliesPageQuery, 
useInvalidateMessages, useInvalidateThreads} from "../../api"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import moeText from "../../moetext/MoeText"
import MessageReply from "../../components/search/MessageReply"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import QuoteIcon from "../../assets/svg/quote.svg"
import ForwardIcon from "../../assets/svg/forward.svg"
import TextBox, {TextBoxRef} from "../../ui/TextBox"
import PageControls from "../../components/site/PageControls"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import {MessageUser, MessageUserReply} from "../../types/Types"
import "./styles/threadpage.less"

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
    const [defaultIcon, setDefaultIcon] = useState(false)
    const navigate = useNavigate()
    const textBoxRef = useRef<TextBoxRef>(null)
    const {id: messageID} = useParams() as {id: string}
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const invalidateMessages = useInvalidateMessages()
    const invalidateThreads = useInvalidateThreads()

    usePageURL(page, setPage, query, setQuery)

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
            invalidateMessages()
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
        functions.dom.changeTitle(message.title, i18n)
        setDefaultIcon(message.image ? false : true)
    }

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useGetMessageRepliesInfiniteQuery(
        {messageID, refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit: 100}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(100 / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetMessageRepliesPageQuery(
        {messageID,
        offset: batchOffset, refreshKey},
        {skip: scroll}
    )

    const items = useMemo(() => {
        let result = scroll ? infiniteQuery.currentData?.pages.flat() ?? [] : pageQuery.currentData ?? []
        return result
    }, [scroll, infiniteQuery.currentData, pageQuery.currentData])

    const visibleItems = useMemo(() => {
        return scroll ? items : items.slice(pageOffset, pageOffset + pageAmount)
    }, [items, pageOffset, pageAmount, scroll])
    
    const totalCount = Number(items[0]?.replyCount ?? items.length)
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    const loadMore = useEffectEvent(() => {
        if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) infiniteQuery.fetchNextPage()
    })

    useEffect(() => {
        if (!scroll) return
        const onScroll = () => {
            if (functions.dom.scrolledToBottom()) loadMore()
        }
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [scroll])

    const onRefresh = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)

        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    useEffect(() => {
        updateMessage()
        onRefresh()
    }, [messageID, session])

    useEffect(() => {
        if (messagePage && !location.search) setPage(messagePage)
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
            jsx.push(<MessageReply reply={visible[i]} onDelete={onRefresh} onEdit={onRefresh} onReplyJump={onReplyJump}/>)
        }
        return jsx
    }

    const getCreatorPFP = () => {
        if (!message) return
        if (message.image) {
            return functions.link.getFolderLink("pfp", message.image, message.imageHash)
        } else {
            return favicon
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!message?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(message.imagePost, event, navigate, session, setSessionFlag)
    }

    const getCreatorJSX = () => {
        if (!message) return
        return functions.jsx.usernameJSX({username: message.creator, ...message}, {
            containerClass: "thread-page-username-container",
            textClass: "thread-page-user-text",
            imageClass: "thread-page-user-label",
        }, i18n, navigate)
    }

    const editMessage = async () => {
        const badTitle = functions.validation.validateTitle(editMessageTitle, i18n)
        if (badTitle) return
        const badContent = functions.validation.validateThread(editMessageContent, i18n)
        if (badContent) return
        await functions.http.put("/api/message/edit", {messageID, title: editMessageTitle, content: editMessageContent, r18: editMessageR18}, session, setSessionFlag)
        invalidateMessages()
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
        setEditMessageContent(moeText.undoLinkReplacements(message.content))
        setEditMessageTitle(message.title)
        setEditMessageID(message.messageID)
        setEditMessageR18(message.r18 ?? false)
    }

    const deleteMessage = async () => {
        await functions.http.delete("/api/message/delete", {messageID}, session, setSessionFlag)
        invalidateMessages()
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
                <QuoteIcon className="thread-page-opt-icon" onClick={triggerQuote}/>
            )
        }
        if (session.username === message.creator || permissions.isMod(session)) {
            return(
                <>
                <ForwardIcon className="thread-page-opt-icon" onClick={forwardMessageDialog}/>
                <EditIcon className="thread-page-opt-icon" onClick={editMessageDialog}/>
                <DeleteIcon className="thread-page-opt-icon" onClick={deleteMessageDialog}/>
                </>
            )
        }
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
        await functions.http.post("/api/message/reply", {messageID, content: text, r18}, session, setSessionFlag)
        invalidateThreads()
        onRefresh()
        textBoxRef.current?.updateText("")
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
                            <img draggable={false} className="thread-page-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick}/>
                        </div>
                        <div className="thread-page-text-container">
                            <p className="thread-page-text">{moeText.renderMessageText(message.content, emojis)}</p>
                        </div>
                    </div>
                    <div className="thread-page-container">
                        {generateRepliesJSX()}
                    </div>
                    <TextBox ref={textBoxRef} type="message" onPost={reply} r18Toggle={true} manualWidth={true}/>
                    {!scroll ? <PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/> : null}
                </div> : <LoadingSpinner/>}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default MessagePage