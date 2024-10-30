import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext, SessionFlagContext, SiteHueContext, SiteLightnessContext, 
SiteSaturationContext, MobileContext, ShowPageDialogContext, ModPageContext, ScrollContext, PageFlagContext, ModStateContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import "./styles/modposts.less"

const ModTranslations: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [unverifiedTranslations, setUnverifiedTranslations] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleTranslations, setVisibleTranslations] = useState([]) as any
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {modPage, setModPage} = useContext(ModPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {modState, setModState} = useContext(ModStateContext)
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [imagesRef, setImagesRef] = useState([]) as any
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTranslations = async () => {
        const translations = await functions.get("/api/translation/list/unverified", null, session, setSessionFlag)
        setEnded(false)
        setUnverifiedTranslations(translations)
    }

    useEffect(() => {
        updateTranslations()
    }, [session])

    const updateVisibleTranslations = () => {
        const newVisibleTranslations = [] as any
        for (let i = 0; i < index; i++) {
            if (!unverifiedTranslations[i]) break
            newVisibleTranslations.push(unverifiedTranslations[i])
        }
        setVisibleTranslations(functions.removeDuplicates(newVisibleTranslations))
    }

    const refreshTranslations = async () => {
        updateTranslations()
        updateVisibleTranslations()
    }

    const approveTranslation = async (translationID: number, username: string, postID: number) => {
        await functions.post("/api/translation/approve", {translationID, username, postID}, session, setSessionFlag)
        await updateTranslations()
        refreshTranslations()
    }

    const rejectTranslation = async (translationID: number, username: string, postID: number) => {
        await functions.post("/api/translation/reject", {translationID, username, postID}, session, setSessionFlag)
        await updateTranslations()
        refreshTranslations()
    }

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateRequests = () => {
            let currentIndex = index
            const newVisibleTranslations = visibleTranslations as any
            for (let i = 0; i < 10; i++) {
                if (!unverifiedTranslations[currentIndex]) break
                newVisibleTranslations.push(unverifiedTranslations[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleTranslations(functions.removeDuplicates(newVisibleTranslations))
            const newImagesRef = newVisibleTranslations.map(() => React.createRef()) as any
            setImagesRef(newImagesRef) as any
        }
        if (scroll) updateRequests()
    }, [unverifiedTranslations, scroll])

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
        let result = await functions.get("/api/translation/list/unverified", {offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanHistory = unverifiedTranslations.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanHistory.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, translationCount: cleanHistory[0]?.translationCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setUnverifiedTranslations(result)
            } else {
                setUnverifiedTranslations((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setUnverifiedTranslations(result)
                } else {
                    setUnverifiedTranslations((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!unverifiedTranslations[currentIndex]) return updateOffset()
                const newTranslations = visibleTranslations as any
                for (let i = 0; i < 10; i++) {
                    if (!unverifiedTranslations[currentIndex]) return updateOffset()
                    newTranslations.push(unverifiedTranslations[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleTranslations(functions.removeDuplicates(newTranslations))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, index, visibleTranslations, modState, session])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleTranslations([])
            setModPage(1)
            updateTranslations()
        }
    }, [scroll, modPage, modState, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [modState])

    useEffect(() => {
        const updatePageOffset = () => {
            const modOffset = (modPage - 1) * getPageAmount()
            if (unverifiedTranslations[modOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const modAmount = Number(unverifiedTranslations[0]?.translationCount)
            let maximum = modOffset + getPageAmount()
            if (maximum > modAmount) maximum = modAmount
            const maxTag = unverifiedTranslations[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, unverifiedTranslations, modPage, ended])

    useEffect(() => {
        if (unverifiedTranslations?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setModPage(maxTagPage)
            }
        }
    }, [unverifiedTranslations, modPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!unverifiedTranslations?.length) return 1
        if (Number.isNaN(Number(unverifiedTranslations[0]?.translationCount))) return 10000
        return Math.ceil(Number(unverifiedTranslations[0]?.translationCount) / getPageAmount())
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
        const jsx = [] as any
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

    const translationDataJSX = (translation: any) => {
        let translationChanges = translation.addedEntries?.length || translation.removedEntries?.length
        if (!translationChanges) return null
        const addedJSX = translation.addedEntries.map((i: string) => <span className="tag-add">+{i}</span>)
        const removedJSX = translation.removedEntries.map((i: string) => <span className="tag-remove">-{i}</span>)

        if (![...addedJSX, ...removedJSX].length) return null
        return [...addedJSX, ...removedJSX]
    }

    const generateTranslationsJSX = () => {
        let jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleTranslations) as any
        } else {
            const offset = (modPage - 1) * getPageAmount()
            visible = unverifiedTranslations.slice(offset, offset + getPageAmount())
        }
        if (!visible.length) {
            return (
                <div className="mod-post" style={{justifyContent: "center", alignItems: "center", height: "75px"}} 
                onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)} key={0}>
                    <div className="mod-post-text-column">
                        <span className="mod-post-text">No data</span>
                    </div>
                </div>
            )
        }
        for (let i = 0; i < visible.length; i++) {
            const translation = visible[i] as any
            if (!translation) break
            if (translation.fake) continue
            const imgClick = (event?: any, middle?: boolean) => {
                if (middle) return window.open(`/unverified/post/${translation.postID}`, "_blank")
                history.push(`/unverified/post/${translation.postID}`)
            }
            const img = functions.getUnverifiedThumbnailLink(translation.post.images[0].type, translation.postID, translation.post.images[0].order, translation.post.images[0].filename, "tiny")
            jsx.push(
                <div className="mod-post" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${translation.updater}`)}>Updater: {functions.toProperCase(translation?.updater) || "deleted"}</span>
                        <span className="mod-post-text">Reason: {translation.reason}</span>
                        {translationDataJSX(translation)}
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectTranslation(translation.translationID, translation.updater, translation.postID)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approveTranslation(translation.translationID, translation.updater, translation.postID)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Approve</span>
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
            {generateTranslationsJSX()}
        </div>
    )
}

export default ModTranslations