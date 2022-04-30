import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, UnverifiedPostsContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/purple/approve.png"
import approveMagenta from "../assets/magenta/approve.png"
import reject from "../assets/purple/reject.png"
import rejectMagenta from "../assets/magenta/reject.png"
import tagDiff from "../assets/purple/tagdiff.png"
import tagDiffMagenta from "../assets/magenta/tagdiff.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"
import axios from "axios"

const ModTagEdits: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [requests, setRequests] = useState([]) as any
    const [oldTags, setOldTags] = useState([]) as any
    const [showOldTag, setShowOldTag] = useState(false)
    const history = useHistory()

    const updateTags = async () => {
        const requests = await axios.get("/api/tag/edit/request/list", {withCredentials: true}).then((r) => r.data)
        const oldTags = await axios.get("/api/tag/list", {params: {tags: requests.map((r: any) => r.tag)}, withCredentials: true}).then((r) => r.data)
        setRequests(requests)
        setOldTags(oldTags)
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

    const getTagDiff = () => {
        if (theme.includes("magenta")) return tagDiffMagenta
        return tagDiff
    }

    const editTag = async (username: string, tag: string, key: string, description: string, image: string, aliases: string[]) => {
        let bytes = null as any
        if (image) {
            const parts = image.split("/")
            const link = `${window.location.protocol}//${window.location.host}/unverified/${parts[0]}/${encodeURIComponent(parts[1])}`
            const arrayBuffer = await fetch(link).then((r) => r.arrayBuffer())
            bytes = new Uint8Array(arrayBuffer)
        }
        await axios.put("/api/tag/edit", {tag, key, description, image: bytes ? Object.values(bytes) : null, aliases}, {withCredentials: true})
        await axios.post("/api/tag/edit/request/fulfill", {username, tag, image}, {withCredentials: true})
        updateTags()
    }

    const rejectRequest = async (username: string, tag: string, image: string) => {
        await axios.post("/api/tag/edit/request/fulfill", {username, tag, image}, {withCredentials: true})
        updateTags()
    }

    const generateTagsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i]
            const oldTag = oldTags[i]
            const searchTag = () => {
                setSearch(request.tag)
                setSearchFlag(true)
                history.push(`/posts`)
            }
            const parts = request.image?.split("/")
            const img = parts ? `${window.location.protocol}//${window.location.host}/unverified/${parts[0]}/${encodeURIComponent(parts[1])}` : ""
            const oldImg = oldTag ? functions.getTagLink(oldTag.type, oldTag.image) : ""
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    {showOldTag && oldTag ? <>
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={oldImg}/>
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request.username || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        <span className="mod-post-link" onClick={searchTag}>Old Tag: {oldTag.tag}</span>
                        <span className="mod-post-text">Old Description: {oldTag.description || "No description."}</span>
                        <span className="mod-post-text">Old Aliases: {oldTag.aliases?.[0] ? oldTag.aliases.map((a: any) => a.tag).join(", ") : "None"}</span>
                    </div>
                    </> : <>
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request.username || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        <span className="mod-post-link" onClick={searchTag}>New Tag: {request.key}</span>
                        <span className="mod-post-text">New Description: {request.description || "No description."}</span>
                        <span className="mod-post-text">New Aliases: {request.aliases?.[0] ? request.aliases.join(", ") : "None"}</span>
                    </div> </>}
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => setShowOldTag((prev: boolean) => !prev)}>
                            <img className="mod-post-options-img" src={getTagDiff()}/>
                            <span className="mod-post-options-text">{showOldTag ? "New" : "Old"}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag, request.image)}>
                            <img className="mod-post-options-img" src={getReject()}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => editTag(request.username, request.tag, request.key, request.description, request.image, request.aliases)}>
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

export default ModTagEdits