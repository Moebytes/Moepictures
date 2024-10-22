import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext, SessionFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
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
    const [imagesRef, setImagesRef] = useState([]) as any
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
        const newImagesRef = newVisibleRequests.map(() => React.createRef()) as any
        setImagesRef(newImagesRef) as any
    }

    useEffect(() => {
        if (updateVisibleRequestFlag) {
            updateVisibleRequests()
            setUpdateVisibleRequestFlag(false)
        }
    }, [requests, index, updateVisibleRequestFlag])

    const deleteGroup = async (username: string, group: string, post: any) => {
        if (post) {
            await functions.delete("/api/group/post/delete", {name: group, postID: post.postID, username}, session, setSessionFlag)
            await functions.post("/api/group/post/delete/request/fulfill", {username, slug: group, postID: post.postID, accepted: true}, session, setSessionFlag)
        } else {
            await functions.delete("/api/group/delete", {slug: group}, session, setSessionFlag)
            await functions.post("/api/group/delete/request/fulfill", {username, slug: group, accepted: true}, session, setSessionFlag)
        }
        await updateGroups()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, group: string, post: any) => {
        if (post) {
            await functions.post("/api/group/post/delete/request/fulfill", {username, slug: group, postID: post.postID, accepted: false}, session, setSessionFlag)
        } else {
            await functions.post("/api/group/delete/request/fulfill", {username, slug: group, accepted: false}, session, setSessionFlag)
        }
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
        const newImagesRef = newVisibleRequests.map(() => React.createRef()) as any
        setImagesRef(newImagesRef) as any
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
                const newImagesRef = newPosts.map(() => React.createRef()) as any
                setImagesRef(newImagesRef) as any
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const loadImages = async () => {
        for (let i = 0; i < visibleRequests.length; i++) {
            const request = visibleRequests[i]
            if (!request.post) continue
            const ref = imagesRef[i]
            const img = functions.getThumbnailLink(request.post.images[0].type, request.post.postID, request.post.images[0].order, request.post.images[0].filename, "tiny")
            if (functions.isGIF(img)) continue
            if (!ref.current) continue
            let src = img
            if (functions.isImage(img)) {
                src = await cryptoFunctions.decryptedLink(img)
            } else if (functions.isModel(img)) {
                src = await functions.modelImage(img)
            } else if (functions.isAudio(img)) {
                src = await functions.songCover(img)
            }
            const imgElement = document.createElement("img")
            imgElement.src = src 
            imgElement.onload = () => {
                if (!ref.current) return
                const refCtx = ref.current.getContext("2d")
                ref.current.width = imgElement.width
                ref.current.height = imgElement.height
                refCtx?.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height)
            }
        }
    }

    useEffect(() => {
        loadImages()
    }, [visibleRequests])

    const generateGroupsJSX = () => {
        let jsx = [] as any
        const requests = functions.removeDuplicates(visibleRequests)
        if (!requests.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">No data</span>
                    </div>
                </div>
            )
        }
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i] as any
            if (!request) break
            const imgClick = (event: any, middle?: boolean) => {
                if (!request.post) return
                if (middle) return window.open(`/post/${request.post.postID}`, "_blank")
                history.push(`/post/${request.post.postID}`)
            }
            const openGroup = (event: React.MouseEvent) => {
                event.preventDefault()
                if (event.ctrlKey || event.metaKey || event.button === 1) {
                    window.open(`/group/${request.group}`, "_blank")
                } else {
                    history.push(`/group/${request.group}`)
                }
            }
            let img = ""
            if (request.post) img = functions.getThumbnailLink(request.post.images[0].type, request.post.postID, request.post.images[0].order, request.post.images[0].filename, "tiny")
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    {request.post ? <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        functions.isGIF(img) ? <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/> :
                        <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></canvas>}
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request?.username) || "deleted"}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        {request.post ? <span className="mod-post-link">Post: {request.post.postID}</span> : null}
                        <span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>Group: {request.name}</span>
                        <span className="mod-post-text">Description: {request.description || "No description."}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.group, request.post)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deleteGroup(request.username, request.group, request.post)}>
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