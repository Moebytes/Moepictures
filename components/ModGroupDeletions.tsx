import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext, SessionFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"

const ModGroupDeletions: React.FunctionComponent = (props) => {
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
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([]) as any
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateGroups = async () => {
        const requests = await functions.get("/api/group/delete/request/list", null, session, setSessionFlag)
        setEnded(false)
        setRequests(requests)
    }

    useEffect(() => {
        updateGroups()
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

    const deleteTag = async (username: string, group: string) => {
        await functions.delete("/api/group/delete", {slug: group}, session, setSessionFlag)
        await functions.post("/api/group/delete/request/fulfill", {username, slug: group, accepted: true}, session, setSessionFlag)
        await updateGroups()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, group: string) => {
        await functions.post("/api/group/delete/request/fulfill", {username, slug: group, accepted: false}, session, setSessionFlag)
        await updateGroups()
        setUpdateVisibleRequestFlag(true)
    }

    useEffect(() => {
        let currentIndex = index
        const newVisibleRequests = visibleRequests as any
        for (let i = 0; i < 10; i++) {
            if (!requests[currentIndex]) break
            newVisibleRequests.push(requests[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleRequests(functions.removeDuplicates(newVisibleRequests))
    }, [requests])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await functions.get("/api/group/delete/request/list", {offset: newOffset}, session, setSessionFlag)
        if (result?.length >= 100) {
            setOffset(newOffset)
            setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
        } else {
            if (result?.length) setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
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
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const generateGroupsJSX = () => {
        let jsx = [] as any
        const requests = functions.removeDuplicates(visibleRequests)
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i] as any
            if (!request) break
            const openGroup = () => {
                history.push(`/group/${request.group}`)
            }
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request?.username) || "deleted"}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        <span className="mod-post-link" onClick={openGroup}>Name: {request.name}</span>
                        <span className="mod-post-text">Description: {request.description || "No description."}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.group)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deleteTag(request.username, request.group)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Approve</span>
                        </div>
                    </div>
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

export default ModGroupDeletions