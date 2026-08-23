/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import ApproveIcon from "../../assets/svg/approve.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import TagDiffIcon from "../../assets/svg/tagdiff.svg"
import functions from "../../functions/Functions"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {Group, GroupEditRequest} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModGroupEdits: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [oldGroups, setOldGroups] = useState(new Map<string, Group>())
    const [showOldGroups, setShowOldGroups] = useState([] as boolean[])
    const navigate = useNavigate()

    const loadInitial = async () => {
        const requests = await functions.http.get("/api/group/edit/request/list", null, session, setSessionFlag, true)
        const groups = await functions.http.get("/api/groups/list", {slugs: requests.map((r) => r.group)}, session, setSessionFlag, true)
        for (const group of groups) {
            oldGroups.set(group.name, group)
        }
        forceUpdate()
        return requests
    }

    const updateOffset = async (offset: number) => {
        let result = await functions.http.get("/api/group/edit/request/list", {offset}, session, setSessionFlag, true)
        const groups = await functions.http.get("/api/groups/list", {slugs: result.map((r) => r.group)}, session, setSessionFlag, true)
        for (const group of groups) {
            oldGroups.set(group.name, group)
        }
        forceUpdate()
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

    const editGroup = async (username: string, slug: string, name: string, description: string, reason: string | null) => {
        await functions.http.put("/api/group/edit", {username, slug, name, description, reason}, session, setSessionFlag)
        await functions.http.post("/api/group/edit/request/fulfill", {username, slug, accepted: true}, session, setSessionFlag)
        await initItems()
    }

    const rejectRequest = async (username: string, slug: string) => {
        await functions.http.post("/api/group/edit/request/fulfill", {username, slug, accepted: false}, session, setSessionFlag)
        await initItems()
    }

    const diffJSX = (oldGroup: Group, newGroup: GroupEditRequest, showOldGroup: boolean) => {
        let jsx = [] as React.ReactElement[]
        let changes = newGroup.changes || {}
        const openGroup = (event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/group/${newGroup.group}`, "_blank")
            } else {
                navigate(`/group/${newGroup.group}`)
            }
        }
        if (changes.name) {
            if (showOldGroup && oldGroup) {
                jsx.push(<span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>{i18n.labels.oldName}: {oldGroup.name}</span>)
            } else {
                jsx.push(<span className="mod-post-link" onClick={openGroup} onAuxClick={openGroup}>{i18n.labels.newName}: {newGroup.name}</span>)
            }
        }
        if (changes.description) {
            if (showOldGroup && oldGroup) {
                jsx.push(<span className="mod-post-text">{i18n.labels.oldDescription}: {oldGroup.description || i18n.labels.noDesc}</span>)
            } else {
                jsx.push(<span className="mod-post-text">{i18n.labels.newDescription}: {newGroup.description || i18n.labels.noDesc}</span>)
            }
        }
        return jsx
    }

    const generateGroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as GroupEditRequest[]
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
            const oldGroup = oldGroups.get(request.name)
            const changeOldGroup = () => {
                const value = showOldGroups[i] || false 
                showOldGroups[i] = !value 
                setShowOldGroups(showOldGroups)
                forceUpdate()
            }
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    {showOldGroups[i] && oldGroup ?
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldGroup, request, showOldGroups[i])}
                    </div> :
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${request.username}`)}>{i18n.labels.requester}: {functions.util.toProperCase(request?.username) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {request.reason}</span>
                        {diffJSX(oldGroup!, request, showOldGroups[i])}
                    </div>}
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => changeOldGroup()}>
                            <TagDiffIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{showOldGroups[i] ? i18n.buttons.new : i18n.buttons.old}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.group)}>
                            <RejectIcon className="mod-post-options-img"/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => editGroup(request.username, request.group, request.name, request.description, request.reason)}>
                            <ApproveIcon className="mod-post-options-img"/>
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

export default ModGroupEdits