import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, usePageActions,
useSearchSelector, usePageSelector, useActiveSelector} from "../../store"
import approve from "../../assets/svg/approve.svg"
import reject from "../../assets/svg/reject.svg"
import functions from "../../functions/Functions"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {UnverifiedNoteSearch, Note} from "../../types/Types"
import "./styles/modposts.less"

let limit = 100
let pageAmount = 15

const ModNotes: React.FunctionComponent = (props) => {
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

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    const loadInitial = async () => {
        const notes = await functions.http.get("/api/note/list/unverified", null, session, setSessionFlag, true)
        return notes
    }

    const updateOffset = async (offset: number) => {
        let result = await functions.http.get("/api/note/list/unverified", {offset}, session, setSessionFlag, true)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItems, setManagedPage} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "noteCount"})

    useEffect(() => {
        initItems()
    }, [modState, session])

    useEffect(() => {
        if (modPage) setManagedPage(modPage)
    }, [])

    useEffect(() => {
        setModPage(page)
    }, [page])

    const approveNote = async (postID: string, originalID: string, order: number, data: Note[], username: string) => {
        await functions.http.post("/api/note/approve", {postID, originalID, order, data, username}, session, setSessionFlag)
        await initItems()
    }

    const rejectNote = async (postID: string, originalID: string, order: number, data: Note[], username: string) => {
        await functions.http.post("/api/note/reject", {postID, originalID, order, data, username}, session, setSessionFlag)
        await initItems()
    }

    const noteDataJSX = (unverifiedNote: UnverifiedNoteSearch) => {
        let noteChanges = unverifiedNote.addedEntries?.length || unverifiedNote.removedEntries?.length
        if (!noteChanges) return null

        const replaceKey = (i: string) => i.replace("Character", functions.util.toProperCase(i18n.tag.character))
        const addedJSX = unverifiedNote.addedEntries.map((i: string) => <span className="tag-add">+{replaceKey(i)}</span>)
        const removedJSX = unverifiedNote.removedEntries.map((i: string) => <span className="tag-remove">-{replaceKey(i)}</span>)

        if (![...addedJSX, ...removedJSX].length) return null
        return [...addedJSX, ...removedJSX]
    }

    const generateNotesJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as UnverifiedNoteSearch[]
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
            const noteGroup = visible[i]
            if (!noteGroup) break
            if (noteGroup.fake) continue
            const imgClick = (event?: React.MouseEvent, middle?: boolean) => {
                if (middle) return window.open(`/unverified/post/${noteGroup.postID}`, "_blank")
                navigate(`/unverified/post/${noteGroup.postID}`)
            }
            const img = functions.link.getUnverifiedThumbnailLink(noteGroup.post.images[0], "tiny", session, mobile)
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.file.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => navigate(`/user/${noteGroup.updater}`)}>{i18n.sidebar.updater}: {functions.util.toProperCase(noteGroup?.updater) || i18n.user.deleted}</span>
                        <span className="mod-post-text">{i18n.labels.reason}: {noteGroup.reason}</span>
                        {noteDataJSX(noteGroup)}
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectNote(noteGroup.postID, noteGroup.originalID, noteGroup.order, noteGroup.notes, noteGroup.updater)}>
                            <img className="mod-post-options-img" src={getIcon(reject)} style={{filter}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approveNote(noteGroup.postID, noteGroup.originalID, noteGroup.order, noteGroup.notes, noteGroup.updater)}>
                            <img className="mod-post-options-img" src={getIcon(approve)} style={{filter}}/>
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
            {generateNotesJSX()}
        </div>
    )
}

export default ModNotes