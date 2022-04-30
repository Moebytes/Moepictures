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

const ModTagAliases: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [requests, setRequests] = useState([]) as any
    const history = useHistory()

    const updateTags = async () => {
        const requests = await axios.get("/api/tag/aliasto/request/list", {withCredentials: true}).then((r) => r.data)
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

    const aliasTag = async (username: string, tag: string, aliasTo: string) => {
        await axios.post("/api/tag/aliasto", {tag, aliasTo}, {withCredentials: true})
        await axios.post("/api/tag/aliasto/request/fulfill", {username, tag}, {withCredentials: true})
        updateTags()
    }

    const rejectRequest = async (username: string, tag: string) => {
        await axios.post("/api/tag/aliasto/request/fulfill", {username, tag}, {withCredentials: true})
        updateTags()
    }

    const generateTagsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i]
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
                        <span className="mod-post-text">Alias To: {request.aliasTo}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag)}>
                            <img className="mod-post-options-img" src={getReject()}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => aliasTag(request.username, request.tag, request.aliasTo)}>
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

export default ModTagAliases