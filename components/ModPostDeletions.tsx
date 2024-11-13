import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useFlagActions, usePageActions,
useSearchSelector, useFlagSelector, usePageSelector, useMiscDialogActions, useActiveSelector} from "../store"
import approve from "../assets/icons/approve.png"
import reject from "../assets/icons/reject.png"
import functions from "../structures/Functions"
import "./styles/modposts.less"

const ModPostDeletions: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
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
    const [index, setIndex] = useState(0)
    const [visibleRequests, setVisibleRequests] = useState([]) as any
    const [updateVisibleRequestFlag, setUpdateVisibleRequestFlag] = useState(false)
    const [requests, setRequests] = useState([]) as any
    const [imagesRef, setImagesRef] = useState([]) as any
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const history = useHistory()
    const ref = useRef<HTMLCanvasElement>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updatePosts = async () => {
        const requests = await functions.get("/api/post/delete/request/list", null, session, setSessionFlag)
        setEnded(false)
        setRequests(requests)
    }

    useEffect(() => {
        updatePosts()
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

    const deletePost = async (username: string, postID: number) => {
        await functions.delete("/api/post/delete", {postID}, session, setSessionFlag)
        await functions.post("/api/post/delete/request/fulfill", {username, postID, accepted: true}, session, setSessionFlag)
        await updatePosts()
        setUpdateVisibleRequestFlag(true)
    }

    const rejectRequest = async (username: string, postID: number) => {
        await functions.post("/api/post/delete/request/fulfill", {username, postID, accepted: false}, session, setSessionFlag)
        await updatePosts()
        setUpdateVisibleRequestFlag(true)
    }

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateRequests = () => {
            let currentIndex = index
            let newVisibleRequests = visibleRequests as any
            for (let i = 0; i < 10; i++) {
                if (!requests[currentIndex]) break
                newVisibleRequests.push(requests[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            newVisibleRequests = functions.removeDuplicates(newVisibleRequests)
            setVisibleRequests(newVisibleRequests)
            const newImagesRef = newVisibleRequests.map(() => React.createRef()) as any
            setImagesRef(newImagesRef) as any
        }
        if (scroll) updateRequests()
    }, [requests, scroll])

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
        let result = await functions.get("/api/post/delete/request/list", {offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanHistory = requests.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanHistory.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, requestCount: cleanHistory[0]?.requestCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setRequests(result)
            } else {
                setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setRequests(result)
                } else {
                    setRequests((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!requests[currentIndex]) return updateOffset()
                let newPosts = visibleRequests as any
                for (let i = 0; i < 10; i++) {
                    if (!requests[currentIndex]) return updateOffset()
                    newPosts.push(requests[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                newPosts = functions.removeDuplicates(newPosts)
                setVisibleRequests()
                const newImagesRef = newPosts.map(() => React.createRef()) as any
                setImagesRef(newImagesRef) as any
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, index, visibleRequests, modState, session])

    const loadImages = async () => {
        for (let i = 0; i < visibleRequests.length; i++) {
            const request = visibleRequests[i]
            const ref = imagesRef[i]
            const img = functions.getThumbnailLink(request.post.images[0].type, request.postID, request.post.images[0].order, request.post.images[0].filename, "tiny")
            if (functions.isGIF(img)) continue
            if (!ref.current) continue
            let src = await functions.decryptThumb(img, session)
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
    }, [visibleRequests, session])

    useEffect(() => {
        if (!scroll) {
            const offset = (modPage - 1) * getPageAmount()
            let visibleRequests = requests.slice(offset, offset + getPageAmount())
            setVisibleRequests(visibleRequests)
            const newImagesRef = visibleRequests.map(() => React.createRef()) as any
            setImagesRef(newImagesRef)
        }
    }, [scroll, modPage, requests])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleRequests([])
            setModPage(1)
            updatePosts()
        }
    }, [scroll, modPage, modState, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [modState])

    useEffect(() => {
        const updatePageOffset = () => {
            const modOffset = (modPage - 1) * getPageAmount()
            if (requests[modOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const modAmount = Number(requests[0]?.requestCount)
            let maximum = modOffset + getPageAmount()
            if (maximum > modAmount) maximum = modAmount
            const maxTag = requests[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, requests, modPage, ended])

    useEffect(() => {
        if (requests?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setModPage(maxTagPage)
            }
        }
    }, [requests, modPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!requests?.length) return 1
        if (Number.isNaN(Number(requests[0]?.requestCount))) return 10000
        return Math.ceil(Number(requests[0]?.requestCount) / getPageAmount())
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

    const generatePostsJSX = () => {
        let jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleRequests) as any
        } else {
            const offset = (modPage - 1) * getPageAmount()
            visible = requests.slice(offset, offset + getPageAmount())
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
            const request = visible[i] as any
            if (!request) break
            if (request.fake) continue
            const imgClick = (event: any, middle?: boolean) => {
                if (middle) return window.open(`/post/${request.postID}`, "_blank")
                history.push(`/post/${request.postID}`)
            }
            const img = functions.getThumbnailLink(request.post.images[0].type, request.postID, request.post.images[0].order, request.post.images[0].filename, "tiny")
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        functions.isGIF(img) ? <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/> :
                        <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></canvas>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${request.username}`)}>Requester: {functions.toProperCase(request?.username) || "deleted"}</span>
                        <span className="mod-post-text">Reason: {request.reason}</span>
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectRequest(request.username, request.postID)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => deletePost(request.username, request.postID)}>
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
            {generatePostsJSX()}
        </div>
    )
}

export default ModPostDeletions