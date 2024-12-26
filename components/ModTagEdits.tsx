import React, {useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useFlagActions, usePageActions,
useSearchSelector, useFlagSelector, usePageSelector, useMiscDialogActions, useActiveSelector} from "../store"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import tagDiff from "../assets/icons/tagdiff.png"
import functions from "../structures/Functions"
import {TagEditRequest, Tag} from "../types/Types"
import "./styles/modposts.less"

const ModTagEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
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
    const [requests, setRequests] = useState([] as TagEditRequest[])
    const [oldTags, setOldTags] = useState(new Map<string, Tag>())
    const [showOldTags, setShowOldTags] = useState([] as boolean[])
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([] as TagEditRequest[])
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
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
        const tags = await functions.get("/api/tag/list", {tags: requests.map((r) => r.tag)}, session, setSessionFlag)
        for (const tag of tags) {
            oldTags.set(tag.tag, tag)
        }
        forceUpdate()
    }

    useEffect(() => {
        updateTags()
    }, [session])

    const updateVisibleRequests = () => {
        const newVisibleRequests = [] as TagEditRequest[]
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
        let bytes = null as number[] | ["delete"] | null
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
        await functions.put("/api/tag/edit", {tag, key, description, image: bytes!, aliases, implications, social, twitter, website, fandom}, session, setSessionFlag)
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
            const newVisibleRequests = visibleRequests
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
        const cleanHistory = requests.filter((t) => !t.fake)
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
                setRequests((prev) => functions.removeDuplicates([...prev, ...result]))
            }
            const tags = await functions.get("/api/tag/list", {tags: result.map((r) => r.tag)}, session, setSessionFlag)
            for (const tag of tags) {
                oldTags.set(tag.tag, tag)
            }
            forceUpdate()
        } else {
            if (result?.length) {
                if (padded) {
                    setRequests(result)
                } else {
                    setRequests((prev) => functions.removeDuplicates([...prev, ...result]))
                }
                const tags = await functions.get("/api/tag/list", {tags: result.map((r) => r.tag)}, session, setSessionFlag)
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
                const newPosts = visibleRequests
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

    const diffJSX = (oldTag: Tag, newTag: TagEditRequest, showOldTag: boolean) => {
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
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.labels.oldTag}: {oldTag.tag}</span>)
            } else {
                jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.labels.newTag}: {newTag.key}</span>)
            }
        } else {
            jsx.push(<span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.tag.tag}: {newTag.key}</span>)
        }
        if (changes.type) {
            if (showOldTag && oldTag) {
                jsx.push(<span className={`mod-post-text ${functions.getTagColor(oldTag)}`}>{i18n.labels.oldCategory}: {oldTag.type}</span>)
            } else {
                jsx.push(<span className={`mod-post-text ${functions.getTagColor(newTag)}`}>{i18n.labels.newCategory}: {newTag.type}</span>)
            }
        }
        if (changes.description) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldDescription}: {oldTag.description || i18n.labels.noDesc}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newDescription}: {newTag.description || i18n.labels.noDesc}</span>)
            }
        }
        if (changes.aliases) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldAliases}: {oldTag.aliases?.[0] ? oldTag.aliases.map((a) => a?.alias).join(", ") : i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newAliases}: {newTag.aliases?.[0] ? newTag.aliases.join(", ") : i18n.labels.none}</span>)
            }
        }
        if (changes.implications) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldImplications}: {oldTag.implications?.[0] ? oldTag.implications.map((i) => i?.implication).join(", ") : i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newImplications}: {newTag.implications?.[0] ? newTag.implications.join(", ") : i18n.labels.none}</span>)
            }
        }
        if (changes.pixivTags) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldPixivTags}: {oldTag.pixivTags?.[0] ? oldTag.pixivTags.join(", ") : i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newPixivTags}: {newTag.pixivTags?.[0] ? newTag.pixivTags.join(", ") : i18n.labels.none}</span>)
            }
        }
        if (changes.website) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.website!, "_blank")}>{i18n.labels.oldWebsite}: {oldTag.website || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.website!, "_blank")}>{i18n.labels.newWebsite}: {newTag.website}</span>)
            }
        }
        if (changes.social) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.social!, "_blank")}>{i18n.labels.oldSocial}: {oldTag.social || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.social!, "_blank")}>{i18n.labels.newSocial}: {newTag.social}</span>)
            }
        }
        if (changes.twitter) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.twitter!, "_blank")}>{i18n.labels.oldTwitter}: {oldTag.twitter || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.twitter!, "_blank")}>{i18n.labels.newTwitter}: {newTag.twitter}</span>)
            }
        }
        if (changes.fandom) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.fandom!, "_blank")}>{i18n.labels.oldFandom}: {oldTag.fandom || i18n.labels.none}</span>)
            } else {
                jsx.push(<span className="mod-post-text mod-post-hover" onClick={() => window.open(newTag.fandom!, "_blank")}>{i18n.labels.newFandom}: {newTag.fandom}</span>)
            }
        }
        if (changes.featured) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldFeatured}: {oldTag.featured}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newFeatured}: {newTag.featured}</span>)
            }
        }
        if (changes.r18) {
            if (showOldTag && oldTag) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldR18}: {oldTag.r18 ? i18n.buttons.yes : i18n.buttons.no}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newR18}: {newTag.r18 ? i18n.buttons.yes : i18n.buttons.no}</span>)
            }
        }
        return jsx
    }

    const generateTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = [] as TagEditRequest[]
        if (scroll) {
            visible = functions.removeDuplicates(visibleRequests)
        } else {
            const offset = (modPage - 1) * getPageAmount()
            visible = requests.slice(offset, offset + getPageAmount())
        }
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
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
            const oldTag = oldTags.get(request.tag)
            const changeOldTag = () => {
                const value = showOldTags[i] || false 
                showOldTags[i] = !value 
                setShowOldTags(showOldTags)
                forceUpdate()
            }
            let parts = request.image?.split("/") ?? null
            if (request.image === "delete") parts = null
            const img = parts ? `${window.location.protocol}//${window.location.host}/unverified/${parts[0]}/${encodeURIComponent(parts[1])}` : ""
            const oldImg = oldTag ? functions.getTagLink(oldTag.type, oldTag.image, oldTag.imageHash) : ""
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    {showOldTags[i] && oldTag ? <>
                    {oldImg ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={oldImg}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldTag, request, showOldTags[i])}
                    </div>
                    </> : <>
                    {img ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldTag!, request, showOldTags[i])}
                    </div> </>}
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => changeOldTag()}>
                            <img className="mod-post-options-img" src={tagDiff} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{showOldTags[i] ? i18n.buttons.new : i18n.buttons.old}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag, request.image!)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => editTag(request.username, request.tag, request.key, request.description, 
                            request.image!, request.aliases, request.implications, request.social!, request.twitter!, request.website!, request.fandom!)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.approve}</span>
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