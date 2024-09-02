import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import tagDiff from "../assets/icons/tagdiff.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"
import axios from "axios"

const ModTagEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [requests, setRequests] = useState([]) as any
    const [oldTags, setOldTags] = useState([]) as any
    const [showOldTags, setShowOldTags] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([]) as any
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTags = async () => {
        const requests = await axios.get("/api/tag/edit/request/list", {withCredentials: true}).then((r) => r.data)
        const oldTags = await axios.get("/api/tag/list", {params: {tags: requests.map((r: any) => r.tag)}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setRequests(requests)
        setOldTags(oldTags)
    }

    useEffect(() => {
        updateTags()
    }, [])

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
        await axios.put("/api/tag/edit", {tag, key, description, image: bytes, aliases, implications, social, twitter, website, fandom}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        await axios.post("/api/tag/edit/request/fulfill", {username, tag, image, accepted: true}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        await updateTags()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, tag: string, image: string) => {
        await axios.post("/api/tag/edit/request/fulfill", {username, tag, image, accepted: false}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        await updateTags()
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
        const result = await axios.get("/api/tag/edit/request/list", {params: {offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length >= 100) {
            const oldTags = await axios.get("/api/tag/list", {params: {tags: requests.map((r: any) => r.tag)}, withCredentials: true}).then((r) => r.data)
            setOffset(newOffset)
            setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
            setOldTags((prev: any) => functions.removeDuplicates([...prev, ...oldTags]))
        } else {
            if (result?.length) {
                setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
                setOldTags((prev: any) => functions.removeDuplicates([...prev, ...oldTags]))
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
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const generateTagsJSX = () => {
        let jsx = [] as any
        const requests = functions.removeDuplicates(visibleRequests)
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i] as any
            if (!request) break
            const oldTag = oldTags[i]
            const searchTag = () => {
                history.push(`/posts`)
                setSearch(request.tag)
                setSearchFlag(true)
            }
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
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request.username || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        <span className="mod-post-link" onClick={searchTag}>Old Tag: {oldTag.tag}</span>
                        <span className="mod-post-text">Old Description: {oldTag.description || "No description."}</span>
                        <span className="mod-post-text">Old Aliases: {oldTag.aliases?.[0] ? oldTag.aliases.map((a: any) => a.alias).join(", ") : "None"}</span>
                        <span className="mod-post-text">Old Implications: {oldTag.implications?.[0] ? oldTag.implications.map((i: any) => i.implication).join(", ") : "None"}</span>
                        {oldTag.type === "artist" ? <>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.website, "_blank")}>Old Website: {oldTag.website || "None."}</span>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.social, "_blank")}>Old Social: {oldTag.social || "None."}</span>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.twitter, "_blank")}>Old Twitter: {oldTag.twitter || "None."}</span>
                        </> : null}
                        {oldTag.type === "character" ? <>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.fandom, "_blank")}>Old Fandom: {oldTag.fandom || "None."}</span>
                        </> : null}
                        {oldTag.type === "series" ? <>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.website, "_blank")}>Old Website: {oldTag.website || "None."}</span>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(oldTag.twitter, "_blank")}>Old Twitter: {oldTag.twitter || "None."}</span>
                        </> : null}
                    </div>
                    </> : <>
                    {img ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request.username || "Deleted")}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                        <span className="mod-post-link" onClick={searchTag}>New Tag: {request.key}</span>
                        <span className="mod-post-text">New Description: {request.description || "No description."}</span>
                        <span className="mod-post-text">New Aliases: {request.aliases?.[0] ? request.aliases.join(", ") : "None"}</span>
                        <span className="mod-post-text">New Implications: {request.implications?.[0] ? request.implications.join(", ") : "None"}</span>
                        {oldTag.type === "artist" ? <>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(request.website, "_blank")}>New Website: {request.website || "None."}</span>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(request.social, "_blank")}>New Social: {request.social || "None."}</span>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(request.twitter, "_blank")}>New Twitter: {request.twitter || "None."}</span>
                        </> : null}
                        {oldTag.type === "character" ? <>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(request.fandom, "_blank")}>New Fandom: {request.fandom || "None."}</span>
                        </> : null}
                        {oldTag.type === "series" ? <>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(request.website, "_blank")}>New Website: {request.website || "None."}</span>
                        <span className="mod-post-text mod-post-hover" onClick={() => window.open(request.twitter, "_blank")}>New Twitter: {request.twitter || "None."}</span>
                        </> : null}
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
        return jsx
    }

    return (
        <div className="mod-posts">
            {generateTagsJSX()}
        </div>
    )
}

export default ModTagEdits