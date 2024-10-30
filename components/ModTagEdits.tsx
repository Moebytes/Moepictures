import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext, SessionFlagContext, SiteHueContext, SiteLightnessContext, 
SiteSaturationContext, MobileContext, ShowPageDialogContext, ModPageContext, ScrollContext, PageFlagContext, ModStateContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import tagDiff from "../assets/icons/tagdiff.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"

const ModTagEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [requests, setRequests] = useState([]) as any
    const [oldTags, setOldTags] = useState(new Map())
    const [showOldTags, setShowOldTags] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([]) as any
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {modPage, setModPage} = useContext(ModPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {modState, setModState} = useContext(ModStateContext)
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTags = async () => {
        const requests = await functions.get("/api/tag/edit/request/list", null, session, setSessionFlag)
        setEnded(false)
        setRequests(requests)
        const tags = await functions.get("/api/tag/list", {tags: requests.map((r: any) => r.tag)}, session, setSessionFlag)
        for (const tag of tags) {
            oldTags.set(tag.tag, tag)
        }
        forceUpdate()
    }

    useEffect(() => {
        updateTags()
    }, [session])

    const updateVisibleRequests = () => {
        const newVisibleRequests = [] as any
        for (let i = 0; i < index; i++) {
            if (!requests[i]) break
            newVisibleRequests.push(requests[i])
        }
        setVisibleRequests(functions.removeDuplicates(newVisibleRequests))
    }

    useEffect(() => {
        if (updateVisibleRequestFlag) {
            updateVisibleRequests()
            setUpdateVisibleRequestFlag(false)
        }
    }, [requests, index, updateVisibleRequestFlag])

    const editTag = async (username: string, tag: string, key: string, description: string, image: string, aliases: string[], implications: string[], social: string, twitter: string, website: string, fandom: string) => {
        let bytes = null as any
        if (image) {
            if (image === "delete") {
                bytes = ["delete"]
            } else {
                const parts = image.split("/")
                const link = `${window.location.protocol}//${window.location.host}/unverified/${parts[0]}/${encodeURIComponent(parts[1])}`
                const arrayBuffer = await fetch(link).then((r) => r.arrayBuffer())
                bytes = Object.values(new Uint8Array(arrayBuffer))
            }
        }
        await functions.put("/api/tag/edit", {tag, key, description, image: bytes, aliases, implications, social, twitter, website, fandom}, session, setSessionFlag)
        await functions.post("/api/tag/edit/request/fulfill", {username, tag, image, accepted: true}, session, setSessionFlag)
        await updateTags()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, tag: string, image: string) => {
        await functions.post("/api/tag/edit/request/fulfill", {username, tag, image, accepted: false}, session, setSessionFlag)
        await updateTags()
        setUpdateVisibleRequestFlag(true)
    }

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateRequests = () => {
            let currentIndex = index
            const newVisibleRequests = visibleRequests as any
            for (let i = 0; i < 10; i++) {
                if (!requests[currentIndex]) break
                newVisibleRequests.push(requests[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleRequests(functions.removeDuplicates(newVisibleRequests))
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
        let result = await functions.get("/api/tag/edit/request/list", {offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanHistory = requests.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanHistory.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, requestCount: cleanHistory[0]?.requestCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setRequests(result)
            } else {
                setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
            const tags = await functions.get("/api/tag/list", {tags: result.map((r: any) => r.tag)}, session, setSessionFlag)
            for (const tag of tags) {
                oldTags.set(tag.tag, tag)
            }
            forceUpdate()
        } else {
            if (result?.length) {
                if (padded) {
                    setRequests(result)
                } else {
                    setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
                const tags = await functions.get("/api/tag/list", {tags: result.map((r: any) => r.tag)}, session, setSessionFlag)
                for (const tag of tags) {
                    oldTags.set(tag.tag, tag)
                }
                forceUpdate()
            }
            setEnded(true)
        }
    }


    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!requests[currentIndex]) return updateOffset()
                const newPosts = visibleRequests as any
                for (let i = 0; i < 10; i++) {
                    if (!requests[currentIndex]) return updateOffset()
                    newPosts.push(requests[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRequests(functions.removeDuplicates(newPosts))
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
            updateTags()
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
            const modAmount = Number(requests[0]?.requestCount)
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
        if (Number.isNaN(Number(requests[0]?.requestCount))) return 10000
        return Math.ceil(Number(requests[0]?.requestCount) / getPageAmount())
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
        const jsx = [] as any
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

    const diffJSX = (oldTag: any, newTag: any, showOldTag: boolean) => {
        let jsx = [] as React.ReactElement[]
        let changes = newTag.changes || {}
        const openTag = (event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/tag/${newTag.tag}`, "_blank")
            } else {
                history.push(`/tag/${newTag.tag}`)
            }
        }
        if (changes.tag) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>Old Tag: {oldTag.tag}</span>)
            } else {
                jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>New Tag: {newTag.key}</span>)
            }
        }
        if (changes.description) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text">Old Description: {oldTag.description || "No description."}</span>)
            } else {
                jsx.push(<span className="mod-post-text">New Description: {newTag.description || "No description."}</span>)
            }
        }
        if (changes.aliases) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text">Old Aliases: {oldTag.aliases.map((a: any) => a.alias).join(", ")}</span>)
            } else {
                jsx.push(<span className="mod-post-text">New Aliases: {newTag.aliases.join(", ")}</span>)
            }
        }
        if (changes.implications) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text">Old Implications: {oldTag.implications.map((i: any) => i.implication).join(", ")}</span>)
            } else {
                jsx.push(<span className="mod-post-text">New Implications: {newTag.implications.join(", ")}</span>)
            }
        }
        if (changes.pixivTags) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text">Old Pixiv Tags: {oldTag.pixivTags.join(", ")}</span>)
            } else {
                jsx.push(<span className="mod-post-text">New Pixiv Tags: {newTag.pixivTags.join(", ")}</span>)
            }
        }
        if (changes.website) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.website, "_blank")}>Old Website: {oldTag.website || "None."}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.website, "_blank")}>New Website: {newTag.website}</span>)
            }
        }
        if (changes.social) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.social, "_blank")}>Old Social: {oldTag.social || "None."}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.social, "_blank")}>New Social: {newTag.social}</span>)
            }
        }
        if (changes.twitter) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.twitter, "_blank")}>Old Twitter: {oldTag.twitter || "None."}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.twitter, "_blank")}>New Twitter: {newTag.twitter}</span>)
            }
        }
        if (changes.fandom) {
            if (showOldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.fandom, "_blank")}>Old Fandom: {oldTag.fandom || "None."}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.fandom, "_blank")}>New Fandom: {newTag.fandom}</span>)
            }
        }
        return jsx
    }

    const generateTagsJSX = () => {
        let jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleRequests) as any
        } else {
            const offset = (modPage - 1) * getPageAmount()
            visible = requests.slice(offset, offset + getPageAmount())
        }
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">No data</span>
                    </div>
                </div>
            )
        }
        for (let i = 0; i < visible.length; i++) {
            const request = visible[i] as any
            if (!request) break
            if (request.fake) continue
            const oldTag = oldTags.get(request.tag)
            const changeOldTag = () => {
                const value = showOldTags[i] || false 
                showOldTags[i] = !value 
                setShowOldTags(showOldTags)
                forceUpdate()
            }
            let parts = request.image?.split("/")
            if (request.image === "delete") parts = null
            const img = parts ? `${window.location.protocol}//${window.location.host}/unverified/${parts[0]}/${encodeURIComponent(parts[1])}` : ""
            const oldImg = oldTag ? functions.getTagLink(oldTag.type, oldTag.image) : ""
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    {showOldTags[i] && oldTag ? <>
                    {oldImg ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={oldImg}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request?.username) || "deleted"}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        {diffJSX(oldTag, request, showOldTags[i])}
                    </div>
                    </> : <>
                    {img ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request?.username) || "deleted"}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        {diffJSX(oldTag, request, showOldTags[i])}
                    </div> </>}
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => changeOldTag()}>
                            <img className="mod-post-options-img" src={tagDiff} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{showOldTags[i] ? "New" : "Old"}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag, request.image)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => editTag(request.username, request.tag, request.key, request.description, request.image, request.aliases, request.implications, request.social, request.twitter, request.website, request.fandom)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Approve</span>
                        </div>
                    </div> 
                </div>
            )
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

export default ModTagEdits