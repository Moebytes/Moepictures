import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {TagDeleteRequest} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModTagDeletions: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const navigate = useNavigate()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const loadInitial = async () => {
        const requests = await functions.http.get("/api/tag/delete/request/list", null, session, setSessionFlag, true)
        return requests
    }

    const updateOffset = async (offset: number) => {
        let result = await functions.http.get("/api/tag/delete/request/list", {offset}, session, setSessionFlag, true)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItems, setManagedPage} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "requestCount"})

    useEffect(() => {
        initItems()
    }, [modState, session])

    useEffect(() => {
        if (modPage) setManagedPage(modPage)
    }, [])

    useEffect(() => {
        setModPage(page)
    }, [page])

    const deleteTag = async (username: string, tag: string) => {
        await functions.http.delete("/api/tag/delete", {tag}, session, setSessionFlag)
        await functions.http.post("/api/tag/delete/request/fulfill", {username, tag, accepted: true}, session, setSessionFlag)
        await initItems()
    }

    const rejectRequest = async (username: string, tag: string) => {
        await functions.http.post("/api/tag/delete/request/fulfill", {username, tag, accepted: false}, session, setSessionFlag)
        await initItems()
    }

    const generateTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as TagDeleteRequest[]
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
            const openTag = (event: React.MouseEvent) => {
                if (event.ctrlKey || event.metaKey || event.button === 1) {
                    window.open(`/tag/${encodeURIComponent(request.tag)}`, "_blank")
                } else {
                    navigate(`/tag/${encodeURIComponent(request.tag)}`)
                }
            }
            const img = functions.link.getTagLink(request.type, request.image, request.imageHash)
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    {img ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        <span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.tag.tag}: {request.tag}</span>
                        <span className="mod-post-text">{i18n.labels.description}: {request.description || i18n.labels.noDesc}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag)}>
                            <img className="mod-post-options-img" src={reject} style={{filter}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deleteTag(request.username, request.tag)}>
                            <img className="mod-post-options-img" src={approve} style={{filter}}/>
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
            {generateTagsJSX()}
        </div>
    )
}

export default ModTagDeletions