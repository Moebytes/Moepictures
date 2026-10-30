/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useEffectEvent, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useLayoutSelector, usePageActions, useActiveSelector, useSearchSelector,
usePageSelector, useThreadDialogActions, useThreadDialogSelector, useCacheSelector} from "../../store"
import {useGetThreadRepliesInfiniteQuery, useGetThreadRepliesPageQuery, useInvalidateThreads} from "../../api"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import moeText from "../../moetext/MoeText"
import Reply from "../../components/search/Reply"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import LockIcon from "../../assets/svg/lock.svg"
import StickyIcon from "../../assets/svg/sticky.svg"
import UnlockIcon from "../../assets/svg/unlock.svg"
import UnstickyIcon from "../../assets/svg/unsticky.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import QuoteIcon from "../../assets/svg/quote.svg"
import ReportIcon from "../../assets/svg/report.svg"
import TextBox, {TextBoxRef} from "../../ui/TextBox"
import PageControls from "../../components/site/PageControls"
import LoadingSpinner from "../../components/search/LoadingSpinner"
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
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
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
            if (session.username) {
                await functions.http.post("/api/thread/read", {threadID, forceRead: true}, session, setSessionFlag)
                invalidateThreads()
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
        functions.dom.changeTitle(thread.title, i18n)
        setDefaultIcon(thread.image ? false : true)
    }

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const infiniteQuery = useGetThreadRepliesInfiniteQuery(
        {threadID, refreshKey},
        {skip: !scroll, initialPageParam: {offset: (page - 1) * pageAmount, limit: 100}}
    )

    const batchSize = Math.max(pageAmount, Math.floor(100 / pageAmount) * pageAmount)
    const batchOffset = Math.floor((page - 1) * pageAmount / batchSize) * batchSize
    const pageOffset = (page - 1) * pageAmount - batchOffset

    const pageQuery = useGetThreadRepliesPageQuery(
        {threadID,
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

    const refreshItems = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)

        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    useEffect(() => {
        updateThread()
        refreshItems()
    }, [threadID, session])

    useEffect(() => {
        if (threadPage && !location.search) setPage(threadPage)
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
            jsx.push(<Reply reply={reply} thread={thread} onDelete={refreshItems} onEdit={refreshItems} onReplyJump={onReplyJump}/>)
        }
        return jsx
    }

    const getCreatorPFP = () => {
        if (!thread) return
        if (thread.image) {
            return functions.link.getFolderLink("pfp", thread.image, thread.imageHash)
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
        invalidateThreads()
        updateThread()
    }

    const updateLocked = async () => {
        functions.cache.clearResponseCacheKey("/api/thread")
        await functions.http.post("/api/thread/lock", {threadID}, session, setSessionFlag)
        invalidateThreads()
        updateThread()
    }

    const editThread = async () => {
        const badTitle = functions.validation.validateTitle(editThreadTitle, i18n)
        if (badTitle) return
        const badContent = functions.validation.validateThread(editThreadContent, i18n)
        if (badContent) return
        await functions.http.put("/api/thread/edit", {threadID, title: editThreadTitle, content: editThreadContent, r18: editThreadR18}, session, setSessionFlag)
        invalidateThreads()
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
        setEditThreadContent(moeText.undoLinkReplacements(thread.content))
        setEditThreadTitle(thread.title)
        setEditThreadID(thread.threadID)
        setEditThreadR18(thread.r18 ?? false)
    }

    const deleteThread = async () => {
        await functions.http.delete("/api/thread/delete", {threadID}, session, setSessionFlag)
        invalidateThreads()
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
                {thread.sticky ? 
                <UnstickyIcon className="thread-page-opt-icon" onClick={updateSticky} style={{marginTop: "3px"}}/> :
                <StickyIcon className="thread-page-opt-icon" onClick={updateSticky} style={{marginTop: "3px"}}/>}
                {thread.locked ? 
                <UnlockIcon className="thread-page-opt-icon" onClick={updateLocked}/> :
                <LockIcon className="thread-page-opt-icon" onClick={updateLocked}/>}
                </>
            )
        }
        if (session.username && !session.banned) {
            jsx.push(
                <>
                <QuoteIcon className="thread-page-opt-icon" onClick={triggerQuote}/>
                <ReportIcon className="thread-page-opt-icon" onClick={reportThreadDialog}/>
                </>
            )
        }
        if (session.username === thread.creator || permissions.isMod(session)) {
            jsx.push(
                <>
                <EditIcon className="thread-page-opt-icon" onClick={editThreadDialog}/>
                <DeleteIcon className="thread-page-opt-icon" onClick={deleteThreadDialog}/>
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
        invalidateThreads()
        refreshItems()
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
                        {thread.sticky ? <StickyIcon className="thread-page-icon"/> : null}
                        {thread.locked ? <LockIcon className="thread-page-icon"/> : null}
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
                            <img draggable={false} className="thread-page-user-img" src={getCreatorPFP()} onClick={creatorImgClick} onAuxClick={creatorImgClick}/>
                            <span className="thread-page-mini-link" onClick={viewThreads}>{thread.postCount} {Number(thread.postCount) === 1 ? i18n.buttons.post : i18n.sort.posts}</span>
                            <span className="thread-page-mini-text">{i18n.labels.joined} {functions.date.prettyDate(thread.joinDate, i18n, true)}</span>
                        </div>
                        <div className="thread-page-text-container">
                            <p className="thread-page-text">{moeText.renderReplyText(thread.content, emojis)}</p>
                        </div>
                    </div>
                    <div className="thread-page-container">
                        {generateRepliesJSX()}
                    </div>
                    <TextBox ref={textBoxRef} type="reply" onPost={reply} r18Toggle={true} manualWidth={true}/>
                    {!scroll ? <PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/> : null}
                </div> : <LoadingSpinner/>}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ThreadPage