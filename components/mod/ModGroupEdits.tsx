import React, {useEffect, useState, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useFlagActions, usePageActions,
useSearchSelector, useFlagSelector, usePageSelector, useMiscDialogActions, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import tagDiff from "../../assets/icons/tagdiff.png"
import functions from "../../functions/Functions"
import {Group, GroupEditRequest} from "../../types/Types"
import "./styles/modposts.less"

const ModGroupEdits: React.FunctionComponent = (props) => {
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
    const [requests, setRequests] = useState([] as GroupEditRequest[])
    const [oldGroups, setOldGroups] = useState(new Map<string, Group>())
    const [showOldGroups, setShowOldGroups] = useState([] as boolean[])
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([] as GroupEditRequest[])
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateGroups = async () => {
        const requests = await functions.http.get("/api/group/edit/request/list", null, session, setSessionFlag)
        setEnded(false)
        setRequests(requests)
        const groups = await functions.http.get("/api/groups/list", {groups: requests.map((r) => r.name)}, session, setSessionFlag)
        for (const group of groups) {
            oldGroups.set(group.name, group)
        }
        forceUpdate()
    }

    useEffect(() => {
        updateGroups()
    }, [session])

    const updateVisibleRequests = () => {
        const newVisibleRequests = [] as GroupEditRequest[]
        for (let i = 0; i < index; i++) {
            if (!requests[i]) break
            newVisibleRequests.push(requests[i])
        }
        setVisibleRequests(functions.util.removeDuplicates(newVisibleRequests))
    }

    useEffect(() => {
        if (updateVisibleRequestFlag) {
            updateVisibleRequests()
            setUpdateVisibleRequestFlag(false)
        }
    }, [requests, index, updateVisibleRequestFlag])

    const editGroup = async (username: string, slug: string, name: string, description: string, reason: string | null) => {
        await functions.http.put("/api/group/edit", {username, slug, name, description, reason}, session, setSessionFlag)
        await functions.http.post("/api/group/edit/request/fulfill", {username, slug, accepted: true}, session, setSessionFlag)
        await updateGroups()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, slug: string) => {
        await functions.http.post("/api/group/edit/request/fulfill", {username, slug, accepted: false}, session, setSessionFlag)
        await updateGroups()
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
        let result = await functions.http.get("/api/group/edit/request/list", {offset: newOffset}, session, setSessionFlag)
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
                setRequests((prev) => functions.util.removeDuplicates([...prev, ...result]))
            }
            const groups = await functions.http.get("/api/groups/list", {groups: result.map((r) => r.name)}, session, setSessionFlag)
            for (const group of groups) {
                oldGroups.set(group.name, group)
            }
            forceUpdate()
        } else {
            if (result?.length) {
                if (padded) {
                    setRequests(result)
                } else {
                    setRequests((prev) => functions.util.removeDuplicates([...prev, ...result]))
                }
                const groups = await functions.http.get("/api/groups/list", {groups: result.map((r) => r.name)}, session, setSessionFlag)
                for (const group of groups) {
                    oldGroups.set(group.name, group)
                }
                forceUpdate()
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
            updateGroups()
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

    const diffJSX = (oldGroup: Group, newGroup: GroupEditRequest, showOldGroup: boolean) => {
        let jsx = [] as React.ReactElement[]
        let changes = newGroup.changes || {}
        const openGroup = (event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/group/${newGroup.group}`, "_blank")
            } else {
                navigate(`/group/${newGroup.group}`)
            }
        }
        if (changes.name) {
            if (showOldGroup && oldGroup) {
                jsx.push(<span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>{i18n.labels.oldName}: {oldGroup.name}</span>)
            } else {
                jsx.push(<span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>{i18n.labels.newName}: {newGroup.name}</span>)
            }
        }
        if (changes.description) {
            if (showOldGroup && oldGroup) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldDescription}: {oldGroup.description || i18n.labels.noDesc}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newDescription}: {newGroup.description || i18n.labels.noDesc}</span>)
            }
        }
        return jsx
    }

    const generateGroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = [] as GroupEditRequest[]
        if (scroll) {
            visible = functions.util.removeDuplicates(visibleRequests)
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
            const oldGroup = oldGroups.get(request.name)
            const changeOldGroup = () => {
                const value = showOldGroups[i] || false 
                showOldGroups[i] = !value 
                setShowOldGroups(showOldGroups)
                forceUpdate()
            }
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    {showOldGroups[i] && oldGroup ?
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldGroup, request, showOldGroups[i])}
                    </div> :
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldGroup!, request, showOldGroups[i])}
                    </div>}
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => changeOldGroup()}>
                            <img className="mod-post-options-img" src={tagDiff} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{showOldGroups[i] ? i18n.buttons.new : i18n.buttons.old}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.group)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => editGroup(request.username, request.group, request.name, request.description, request.reason)}>
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
            {generateGroupsJSX()}
        </div>
    )
}

export default ModGroupEdits