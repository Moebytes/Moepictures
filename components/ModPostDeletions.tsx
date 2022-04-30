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

const ModPostDeletions: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [requests, setRequests] = useState([]) as any
    const history = useHistory()

    const updatePosts = async () => {
        const requests = await axios.get("/api/post/delete/request/list", {withCredentials: true}).then((r) => r.data)
        console.log(requests)
        setRequests(requests)
    }

    useEffect(() => {
        updatePosts()
    }, [])

    const getApprove = () => {
        if (theme.includes("magenta")) return approveMagenta
        return approve
    }

    const getReject = () => {
        if (theme.includes("magenta")) return rejectMagenta
        return reject
    }

    const deletePost = async (username: string, postID: number) => {
        await axios.delete("/api/post/delete", {params: {postID}, withCredentials: true})
        await axios.post("/api/post/delete/request/fulfill", {username, postID}, {withCredentials: true})
        updatePosts()
    }

    const rejectRequest = async (username: string, postID: number) => {
        await axios.post("/api/post/delete/request/fulfill", {username, postID}, {withCredentials: true})
        updatePosts()
    }

    const generatePostsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i]
            const imgClick = () => {
                history.push(`/post/${request.postID}`)
            }
            const img = functions.getImageLink(request.post.images[0].type, request.postID, request.post.images[0].filename)
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick}></video> :
                        <img className="mod-post-img" src={img} onClick={imgClick}/>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request.username || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.postID)}>
                            <img className="mod-post-options-img" src={getReject()}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deletePost(request.username, request.postID)}>
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
            {generatePostsJSX()}
        </div>
    )
}

export default ModPostDeletions