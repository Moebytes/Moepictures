import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useFlagActions, usePageActions,
useSearchSelector, useFlagSelector, usePageSelector, useMiscDialogActions, useActiveSelector, useCacheSelector} from "../../store"
import favicon from "../../assets/icons/favicon.png"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import "./styles/modposts.less"
import {Report, ThreadReply, ThreadUser, UserComment} from "../../types/Types"

interface Props {
    request: Report
    updateReports?: () => void
}

const ReportRow: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {emojis} = useCacheSelector()
    const [hover, setHover] = useState(false)
    const [asset, setAsset] = useState(null as UserComment | ThreadUser | ThreadReply | null)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateAsset = async () => {
        if (props.request.type === "comment") {
            const asset = await functions.http.get("/api/comment", {commentID: props.request.id}, session, setSessionFlag)
            setAsset(asset as UserComment)
        } else if (props.request.type === "thread") {
            const asset = await functions.http.get("/api/thread", {threadID: props.request.id}, session, setSessionFlag)
            setAsset(asset as ThreadUser)
        } else if (props.request.type === "reply") {
            const asset = await functions.http.get("/api/reply", {replyID: props.request.id}, session, setSessionFlag)
            setAsset(asset as ThreadReply)
        }
    }

    useEffect(() => {
        updateAsset()
    }, [session])

    const openPost = (postID: string, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    const imgClick = (event: React.MouseEvent) => {
        if (!asset) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            if (props.request.type === "comment") {
                openPost((asset as UserComment).postID, event)
            } else if (props.request.type === "thread") {
                window.open(`/thread/${(asset as ThreadUser).threadID}`, "_blank")
            } else if (props.request.type === "reply") {
                window.open(`/thread/${(asset as ThreadReply).threadID}`, "_blank")
            }
        } else {
            if (props.request.type === "comment") {
                openPost((asset as UserComment).postID, event)
            } else if (props.request.type === "thread") {
                navigate(`/thread/${(asset as ThreadUser).threadID}`)
            } else if (props.request.type === "reply") {
                navigate(`/thread/${(asset as ThreadReply).threadID}`)
            }
        }
    }

    const approveRequest = async (username: string, id: string) => {
        if (props.request.type === "comment") {
            await functions.http.delete("/api/comment/delete", {commentID: props.request.id}, session, setSessionFlag)
            await functions.http.post("/api/comment/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: true}, session, setSessionFlag)
        } else if (props.request.type === "thread") {
            await functions.http.delete("/api/thread/delete", {threadID: props.request.id}, session, setSessionFlag)
            await functions.http.post("/api/thread/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: true}, session, setSessionFlag)
        } else if (props.request.type === "reply") {
            if (!asset) return
            await functions.http.delete("/api/reply/delete", {threadID: (asset as ThreadReply).threadID, replyID: props.request.id}, session, setSessionFlag)
            await functions.http.post("/api/reply/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: true}, session, setSessionFlag)
        }
        props.updateReports?.()
    }

    const rejectRequest = async (username: string, id: string) => {
        if (props.request.type === "comment") {
            await functions.http.post("/api/comment/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: false}, session, setSessionFlag)
        } else if (props.request.type === "thread") {
            await functions.http.post("/api/thread/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: false}, session, setSessionFlag)
        } else if (props.request.type === "reply") {
            await functions.http.post("/api/reply/report/fulfill", {reportID: props.request.reportID, reporter: props.request.reporter, username, id, accepted: false}, session, setSessionFlag)
        }
        props.updateReports?.()
    }

    let img = ""
    let username = ""
    let textType = ""
    let text = [] as React.ReactElement[]
    let id = ""
    if (asset) {
        img = asset.image ? functions.link.getTagLink("pfp", asset.image, asset.imageHash) : favicon
        username = (asset as UserComment).username ? (asset as UserComment).username : (asset as ThreadUser).creator
        if (props.request.type === "comment") {
            textType = `${i18n.labels.comment}: `
            text = functions.jsx.renderCommentText((asset as UserComment).comment, emojis)
            id = (asset as UserComment).postID
        } else if (props.request.type === "thread") {
            textType = `${i18n.labels.thread}: `
            text = functions.jsx.renderReplyText((asset as ThreadUser).title, emojis)
            id = (asset as ThreadUser).threadID
        } else if (props.request.type === "reply") {
            textType = `${i18n.buttons.reply}: `
            text = functions.jsx.renderReplyText((asset as ThreadReply).content, emojis)
            id = (asset as ThreadReply).threadID
        }
    }

    return (
        <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="mod-post-img-container">
                <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={imgClick}/>
            </div>
            <div className="mod-post-text-column">
                <span className="mod-post-link" onClick={() => navigate(`/user/${props.request.reporter}`)}>{i18n.labels.requester}: {functions.util.toProperCase(props.request?.reporter) || i18n.user.deleted}</span>
                <span className="mod-post-text">{i18n.labels.reason}: {props.request.reason}</span>
                <span className="mod-post-link" onClick={() => navigate(`/user/${username}`)}>{i18n.roles.user}: {username}</span>
                <span className="mod-post-text">{textType}{text}</span>
            </div>
            <div className="mod-post-options">
                <div className="mod-post-options-container" onClick={() => rejectRequest(username, id)}>
                    <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                    <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                </div>
                <div className="mod-post-options-container" onClick={() => approveRequest(username, id)}>
                    <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                    <span className="mod-post-options-text">{i18n.buttons.approve}</span>
                </div>
            </div>
        </div>
    )
}

const ModReports: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [requests, setRequests] = useState([] as Report[])
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([] as Report[])
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)

    const updateReports = async () => {
        const requests = await functions.http.get("/api/search/reports", null, session, setSessionFlag)
        setEnded(false)
        setRequests(requests)
    }

    useEffect(() => {
        updateReports()
    }, [session])

    const updateVisibleRequests = () => {
        const newVisibleRequests = [] as Report[]
        for (let i = 0; i < index; i++) {
            if (!requests[i]) break
            newVisibleRequests.push(requests[i])
        }
        setVisibleRequests(functions.util.removeDuplicates(newVisibleRequests))
    }

    const refreshReports = async () => {
        await updateReports()
        updateVisibleRequests()
    }

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateRequests = () => {
            let currentIndex = index
            const newVisibleRequests = visibleRequests
            for (let i = 0; i < 10; i++) {
                if (!requests[currentIndex]) break
                newVisibleRequests.push(requests[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleRequests(functions.util.removeDuplicates(newVisibleRequests))
        }
        if (scroll) updateRequests()
    }, [requests, scroll])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (modPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (modPage[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.http.get("/api/search/reports", {offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanHistory = requests.filter((t) => !t.fake)
        if (!scroll) {
            if (cleanHistory.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, reportCount: cleanHistory[0]?.reportCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setRequests(result)
            } else {
                setRequests((prev) => functions.util.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setRequests(result)
                } else {
                    setRequests((prev) => functions.util.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.dom.scrolledToBottom()) {
                let currentIndex = index
                if (!requests[currentIndex]) return updateOffset()
                const newPosts = visibleRequests
                for (let i = 0; i < 10; i++) {
                    if (!requests[currentIndex]) return updateOffset()
                    newPosts.push(requests[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRequests(functions.util.removeDuplicates(newPosts))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, index, visibleRequests, modState, session])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleRequests([])
            setModPage(1)
            updateReports()
        }
    }, [scroll, modPage, modState, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [modState])

    useEffect(() => {
        const updatePageOffset = () => {
            const modOffset = (modPage - 1) * getPageAmount()
            if (requests[modOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const modAmount = Number(requests[0]?.reportCount)
            let maximum = modOffset + getPageAmount()
            if (maximum > modAmount) maximum = modAmount
            const maxTag = requests[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, requests, modPage, ended])

    useEffect(() => {
        if (requests?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setModPage(maxTagPage)
            }
        }
    }, [requests, modPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!requests?.length) return 1
        if (Number.isNaN(Number(requests[0]?.reportCount))) return 10000
        return Math.ceil(Number(requests[0]?.reportCount) / getPageAmount())
    }

    const firstPage = () => {
        setModPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = modPage - 1 
        if (newPage < 1) newPage = 1 
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = modPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setModPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (modPage > maxPage() - 3) increment = -4
        if (modPage > maxPage() - 2) increment = -5
        if (modPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (modPage > maxPage() - 2) increment = -3
            if (modPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = modPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const generateTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = [] as Report[]
        if (scroll) {
            visible = functions.util.removeDuplicates(visibleRequests)
        } else {
            const offset = (modPage - 1) * getPageAmount()
            visible = requests.slice(offset, offset + getPageAmount())
        }
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} key={0}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">{i18n.labels.noData}</span>
                    </div>
                </div>
            )
        }
        for (let i = 0; i < visible.length; i++) {
            const request = visible[i]
            if (!request) break
            if (request.fake) continue
            jsx.push(<ReportRow key={request.id} request={request} updateReports={refreshReports}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {modPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {modPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {modPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {modPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
        }
        return jsx
    }

    return (
        <div className="mod-posts">
            {generateTagsJSX()}
        </div>
    )
}

export default ModReports