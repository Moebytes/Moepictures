import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, UnverifiedPostsContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/purple/approve.png"
import approveMagenta from "../assets/magenta/approve.png"
import reject from "../assets/purple/reject.png"
import rejectMagenta from "../assets/magenta/reject.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"
import axios from "axios"

const ModTagDeletions: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [requests, setRequests] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([]) as any
    const history = useHistory()

    const updateTags = async () => {
        const requests = await axios.get("/api/tag/delete/request/list", {withCredentials: true}).then((r) => r.data)
        setRequests(requests)
    }

    useEffect(() => {
        updateTags()
    }, [])

    const getApprove = () => {
        if (theme.includes("magenta")) return approveMagenta
        return approve
    }

    const getReject = () => {
        if (theme.includes("magenta")) return rejectMagenta
        return reject
    }

    const deleteTag = async (username: string, tag: string) => {
        await axios.delete("/api/tag/delete", {params: {tag}, withCredentials: true})
        await axios.post("/api/tag/delete/request/fulfill", {username, tag}, {withCredentials: true})
        updateTags()
    }

    const rejectRequest = async (username: string, tag: string) => {
        await axios.post("/api/tag/delete/request/fulfill", {username, tag}, {withCredentials: true})
        updateTags()
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
        setVisibleRequests(newVisibleRequests)
    }, [requests])

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!requests[currentIndex]) return
                const newPosts = visibleRequests as any
                for (let i = 0; i < 10; i++) {
                    if (!requests[currentIndex]) break
                    newPosts.push(requests[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRequests(newPosts)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const generateTagsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < visibleRequests.length; i++) {
            const request = requests[i]
            if (!request) break
            const searchTag = () => {
                setSearch(request.tag)
                setSearchFlag(true)
                history.push(`/posts`)
            }
            const img = functions.getTagLink(request.type, request.image)
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request.username || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        <span className="mod-post-link" onClick={searchTag}>Tag: {request.tag}</span>
                        <span className="mod-post-text">Description: {request.description}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag)}>
                            <img className="mod-post-options-img" src={getReject()}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deleteTag(request.username, request.tag)}>
                            <img className="mod-post-options-img" src={getApprove()}/>
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
            {generateTagsJSX()}
        </div>
    )
}

export default ModTagDeletions