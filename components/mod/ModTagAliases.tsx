import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {AliasRequest} from "../../types/Types"
import "./styles/modposts.less"

let pageAmount = 15

const ModTagAliases: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadInitial = async () => {
        const requests = await functions.http.get("/api/tag/aliasto/request/list", null, session, setSessionFlag, true)
        return requests
    }

    const updateOffset = async (newOffset: number) => {
        let result = await functions.http.get("/api/tag/aliasto/request/list", {offset: newOffset}, session, setSessionFlag, true)
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

    const aliasTag = async (username: string, tag: string, aliasTo: string, reason: string | null) => {
        await functions.http.post("/api/tag/aliasto", {tag, aliasTo, username, reason}, session, setSessionFlag)
        await functions.http.post("/api/tag/aliasto/request/fulfill", {username, tag, aliasTo, accepted: true}, session, setSessionFlag)
        await initItemLoader()
    }

    const rejectRequest = async (username: string, tag: string, aliasTo: string) => {
        await functions.http.post("/api/tag/aliasto/request/fulfill", {username, tag, aliasTo, accepted: false}, session, setSessionFlag)
        await initItemLoader()
    }

    const generateTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as AliasRequest[]
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} key={0}>
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
                <div className="mod-post">
                    {img ?
                    <div className="mod-post-img-container">
                        <img className="mod-post-tag-img" src={img}/>
                    </div> : null}
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        <span className="mod-post-link" onClick={openTag} onAuxClick={openTag}>{i18n.tag.tag}: {request.tag}</span>
                        <span className="mod-post-text">{i18n.labels.aliasTo}: {request.aliasTo}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.tag, request.aliasTo)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => aliasTag(request.username, request.tag, request.aliasTo, request.reason)}>
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
            {generateTagsJSX()}
        </div>
    )
}

export default ModTagAliases