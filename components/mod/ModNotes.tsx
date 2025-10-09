import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useFlagActions, usePageActions,
useSearchSelector, useFlagSelector, usePageSelector, useMiscDialogActions, useActiveSelector} from "../../store"
import approve from "../../assets/icons/approve.png"
import reject from "../../assets/icons/reject.png"
import functions from "../../functions/Functions"
import {UnverifiedNoteSearch, Note} from "../../types/Types"
import "./styles/modposts.less"

const ModNotes: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {modState} = useActiveSelector()
    const [hover, setHover] = useState(false)
    const [unverifiedNotes, setUnverifiedNotes] = useState([] as UnverifiedNoteSearch[])
    const [index, setIndex] = useState(0)
    const [visibleNotes, setVisibleNotes] = useState([] as UnverifiedNoteSearch[])
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [imagesRef, setImagesRef] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateNotes = async () => {
        const notes = await functions.http.get("/api/note/list/unverified", null, session, setSessionFlag)
        setEnded(false)
        setUnverifiedNotes(notes)
    }

    useEffect(() => {
        updateNotes()
    }, [session])

    const updateVisibleNotes = () => {
        const newVisibleNotes = [] as UnverifiedNoteSearch[]
        for (let i = 0; i < index; i++) {
            if (!unverifiedNotes[i]) break
            newVisibleNotes.push(unverifiedNotes[i])
        }
        setVisibleNotes(functions.util.removeDuplicates(newVisibleNotes))
    }

    const refreshNotes = async () => {
        updateNotes()
        updateVisibleNotes()
    }

    const approveNote = async (postID: string, originalID: string, order: number, data: Note[], username: string) => {
        await functions.http.post("/api/note/approve", {postID, originalID, order, data, username}, session, setSessionFlag)
        await updateNotes()
        refreshNotes()
    }

    const rejectNote = async (postID: string, originalID: string, order: number, data: Note[], username: string) => {
        await functions.http.post("/api/note/reject", {postID, originalID, order, data, username}, session, setSessionFlag)
        await updateNotes()
        refreshNotes()
    }

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateRequests = () => {
            let currentIndex = index
            const newVisibleNotes = visibleNotes
            for (let i = 0; i < 10; i++) {
                if (!unverifiedNotes[currentIndex]) break
                newVisibleNotes.push(unverifiedNotes[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleNotes(functions.util.removeDuplicates(newVisibleNotes))
            const newImagesRef = newVisibleNotes.map(() => React.createRef<HTMLCanvasElement>())
            setImagesRef(newImagesRef)
        }
        if (scroll) updateRequests()
    }, [unverifiedNotes, scroll])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (modPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (modPage[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.http.get("/api/note/list/unverified", {offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanHistory = unverifiedNotes.filter((t) => !t.fake)
        if (!scroll) {
            if (cleanHistory.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, noteCount: cleanHistory[0]?.noteCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setUnverifiedNotes(result)
            } else {
                setUnverifiedNotes((prev) => functions.util.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setUnverifiedNotes(result)
                } else {
                    setUnverifiedNotes((prev) => functions.util.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.dom.scrolledToBottom()) {
                let currentIndex = index
                if (!unverifiedNotes[currentIndex]) return updateOffset()
                const newNotes = visibleNotes
                for (let i = 0; i < 10; i++) {
                    if (!unverifiedNotes[currentIndex]) return updateOffset()
                    newNotes.push(unverifiedNotes[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleNotes(functions.util.removeDuplicates(newNotes))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, index, visibleNotes, modState, session])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleNotes([])
            setModPage(1)
            updateNotes()
        }
    }, [scroll, modPage, modState, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [modState])

    useEffect(() => {
        const updatePageOffset = () => {
            const modOffset = (modPage - 1) * getPageAmount()
            if (unverifiedNotes[modOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const modAmount = Number(unverifiedNotes[0]?.noteCount)
            let maximum = modOffset + getPageAmount()
            if (maximum > modAmount) maximum = modAmount
            const maxTag = unverifiedNotes[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, unverifiedNotes, modPage, ended])

    useEffect(() => {
        if (unverifiedNotes?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setModPage(maxTagPage)
            }
        }
    }, [unverifiedNotes, modPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!unverifiedNotes?.length) return 1
        if (Number.isNaN(Number(unverifiedNotes[0]?.noteCount))) return 10000
        return Math.ceil(Number(unverifiedNotes[0]?.noteCount) / getPageAmount())
    }

    const firstPage = () => {
        setModPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = modPage - 1 
        if (newPage < 1) newPage = 1 
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = modPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setModPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setModPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (modPage > maxPage() - 3) increment = -4
        if (modPage > maxPage() - 2) increment = -5
        if (modPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (modPage > maxPage() - 2) increment = -3
            if (modPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = modPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
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
        let visible = [] as UnverifiedNoteSearch[]
        if (scroll) {
            visible = functions.util.removeDuplicates(visibleNotes)
        } else {
            const offset = (modPage - 1) * getPageAmount()
            visible = unverifiedNotes.slice(offset, offset + getPageAmount())
        }
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
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.reject}</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approveNote(noteGroup.postID, noteGroup.originalID, noteGroup.order, noteGroup.notes, noteGroup.updater)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">{i18n.buttons.approve}</span>
                        </div>
                    </div>
                </div>
            )
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {modPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {modPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {modPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {modPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
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