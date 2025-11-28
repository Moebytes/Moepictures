import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {GroupPosts, GroupRequest} from "../../types/Types"
import "./styles/modposts.less"

let pageAmount = 15

const ModGroups: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [groups, setGroups] = useState([] as GroupPosts[])
    const [imagesRef, setImagesRef] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadInitial = async () => {
        const requests = await functions.http.get("/api/group/request/list", null, session, setSessionFlag, true)
        const groups = await functions.http.get("/api/groups/list", {slugs: requests.map((r) => r.slug)}, session, setSessionFlag, true)
        setGroups(groups)
        return requests
    }

    const updateOffset = async (newOffset: number) => {
        let result = await functions.http.get("/api/group/request/list", {offset: newOffset}, session, setSessionFlag, true)
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

    const addGroup = async (username: string, name: string, slug: string, requestID: string, postIDs: string[]) => {
        await functions.http.post("/api/group", {username, postIDs, name, remap: true}, session, setSessionFlag)
        await functions.http.post("/api/group/request/fulfill", {username, slug, requestID, accepted: true}, session, setSessionFlag)
        await initItemLoader()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, slug: string, requestID: string) => {
        await functions.http.post("/api/group/request/fulfill", {username, slug, requestID, accepted: false}, session, setSessionFlag)
        await initItemLoader()
        setUpdateVisibleRequestFlag(true)
    }

    const openPost = (postID: string, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    const postDiff = (addedPosts: string[], removedPosts: string[]) => {
        const addedPostsJSX = addedPosts.map((postID: string) => <span className="tag-add-clickable" onClick={(event) => openPost(postID, event)}>+{postID}</span>)
        const removedPostsJSX = removedPosts.map((postID: string) => <span className="tag-remove-clickable" onClick={(event) => openPost(postID, event)}>-{postID}</span>)
        if (![...addedPostsJSX, ...removedPostsJSX].length) return null
        return [...addedPostsJSX, ...removedPostsJSX]
    }

    const calcDifference = (request: GroupRequest) => {
        let oldGroup = groups.find((g) => g.slug === request.slug)
        let oldPosts = oldGroup?.posts.map((p) => p.postID) ?? []
        let newPosts = request.posts.map((p) => p.postID)

        const addedPosts = newPosts.filter((id) => !oldPosts.includes(id))
        const removedPosts = oldPosts.filter((id) => !newPosts.includes(id))

        return {addedPosts, removedPosts}
    }

    const loadImages = async () => {
        for (let i = 0; i < visibleItems.length; i++) {
            const request = visibleItems[i]
            const ref = imagesRef[i]
            const img = functions.link.getThumbnailLink(request.posts[0].images[0], "tiny", session, mobile)
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
        let visible = visibleItems as GroupRequest[]
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
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
                functions.post.openPost(request.posts[0], event, navigate, session, setSessionFlag)
            }
            const groupClick = (event: React.MouseEvent, middle?: boolean) => {
                if (!request.exists) return
                if (middle) return window.open(`/group/${request.slug}`, "_blank")
                navigate(`/group/${request.slug}`)
            }
            const img = functions.link.getThumbnailLink(request.posts[0].images[0], "tiny", session, mobile)
            const {addedPosts, removedPosts} = calcDifference(request)
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.file.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event)}></video> :
                        <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event)}></canvas>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        <span className="mod-post-link" onClick={groupClick} onAuxClick={(event) => groupClick(event, true)}>{i18n.labels.groupName}: {request.name}</span>
                        <span className="mod-post-text"><span className="mod-post-text">{i18n.sort.posts}: </span>{postDiff(addedPosts, removedPosts)}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.slug, request.requestID)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => addGroup(request.username, request.name, request.slug, request.requestID, request.postIDs)}>
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

export default ModGroups