import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {Post, GroupDeleteRequest} from "../../types/Types"
import "./styles/modposts.less"

let pageAmount = 15

const ModGroupDeletions: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [imagesRef, setImagesRef] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadInitial = async () => {
        const requests = await functions.http.get("/api/group/delete/request/list", null, session, setSessionFlag, true)
        return requests
    }

    const updateOffset = async (newOffset: number) => {
        let result = await functions.http.get("/api/group/delete/request/list", {offset: newOffset}, session, setSessionFlag, true)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItemLoader, setManagedPage} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, countKey: "requestCount"})

    useEffect(() => {
        initItemLoader()
    }, [modState, session])

    useEffect(() => {
        if (modPage) setManagedPage(modPage)
    }, [])

    useEffect(() => {
        setModPage(page)
    }, [page])

    const updateVisibleRequests = () => {
        const newImagesRef = visibleItems.map(() => React.createRef<HTMLCanvasElement>())
        setImagesRef(newImagesRef)
    }

    useEffect(() => {
        if (updateVisibleRequestFlag) {
            updateVisibleRequests()
            setUpdateVisibleRequestFlag(false)
        }
    }, [visibleItems, updateVisibleRequestFlag])

    const deleteGroup = async (username: string, group: string, post: Post) => {
        if (post) {
            await functions.http.delete("/api/group/post/delete", {name: group, postID: post.postID, username}, session, setSessionFlag)
            await functions.http.post("/api/group/post/delete/request/fulfill", {username, slug: group, postID: post.postID, accepted: true}, session, setSessionFlag)
        } else {
            await functions.http.delete("/api/group/delete", {slug: group}, session, setSessionFlag)
            await functions.http.post("/api/group/delete/request/fulfill", {username, slug: group, accepted: true}, session, setSessionFlag)
        }
        await initItemLoader()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, group: string, post: Post) => {
        if (post) {
            await functions.http.post("/api/group/post/delete/request/fulfill", {username, slug: group, postID: post.postID, accepted: false}, session, setSessionFlag)
        } else {
            await functions.http.post("/api/group/delete/request/fulfill", {username, slug: group, accepted: false}, session, setSessionFlag)
        }
        await initItemLoader()
        setUpdateVisibleRequestFlag(true)
    }

    const loadImages = async () => {
        for (let i = 0; i < visibleItems.length; i++) {
            const request = visibleItems[i]
            if (!request.post) continue
            const ref = imagesRef[i]
            const img = functions.link.getThumbnailLink(request.post.images[0], "tiny", session, mobile)
            if (!ref.current) continue
            let src = await functions.crypto.decryptThumb(img, session)
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
    }, [visibleItems, session])

    const generateGroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as GroupDeleteRequest[]
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
            const imgClick = (event: React.MouseEvent) => {
                functions.post.openPost(request.post, event, navigate, session, setSessionFlag)
            }
            const openGroup = (event: React.MouseEvent) => {
                event.preventDefault()
                if (event.ctrlKey || event.metaKey || event.button === 1) {
                    window.open(`/group/${request.group}`, "_blank")
                } else {
                    navigate(`/group/${request.group}`)
                }
            }
            let img = ""
            if (request.post) img = functions.link.getThumbnailLink(request.post.images[0], "tiny", session, mobile)
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    {request.post ? <div className="mod-post-img-container">
                        {functions.file.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event)}></video> :
                        <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event)}></canvas>}
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {request.post ? <span className="mod-post-link">{i18n.buttons.post}: {request.post.postID}</span> : null}
                        <span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>{i18n.labels.group}: {request.name}</span>
                        <span className="mod-post-text">{i18n.labels.description}: {request.description || i18n.labels.noDesc}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.group, request.post)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deleteGroup(request.username, request.group, request.post)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.approve}</span>
                        </div>
                    </div>
                </div>
            )
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
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