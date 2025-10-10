import React, {useEffect, useState, useRef, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import {useCacheActions, useLayoutSelector, useSearchSelector, useSessionSelector, useThemeSelector,
useSessionActions, useSearchActions, usePageSelector, usePageActions, useMiscDialogActions,
useFlagSelector, useFlagActions, useCacheSelector} from "../../store"
import {TrackablePromise} from "../../structures/TrackablePromise"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import pageIcon from "../../assets/icons/page.png"
import scrollIcon from "../../assets/icons/scroll.png"
import squareIcon from "../../assets/icons/square.png"
import sizeIcon from "../../assets/icons/size.png"
import GridImage from "../image/GridImage"
import GridAnimation from "../image/GridAnimation"
import GridVideo from "../image/GridVideo"
import GridSong from "../image/GridSong"
import GridModel from "../image/GridModel"
import GridLive2D from "../image/GridLive2D"
import Carousel from "../site/Carousel"
import AdBanner from "./AdBanner"
import "./styles/related.less"
import {PostHistory, PostSearch, MiniTag, Tag} from "../../types/Types"

let replace = false
let relatedTimer = null as any
let delay = 2000
let limit = 100

interface Props {
    tag: string
    post?: PostSearch | PostHistory | null
    count?: number
    fallback?: string[]
}

const Related: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {related} = useCacheSelector()
    const {setPosts, setRelated} = useCacheActions()
    const {ratingType, square, showChildren, scroll, sizeType} = useSearchSelector()
    const {setSearch, setSearchFlag, setScroll, setSquare, setSizeType} = useSearchActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {relatedPage} = usePageSelector()
    const {setRelatedPage} = usePageActions()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const [visibleRelated, setVisibleRelated] = useState([] as PostSearch[])
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [index, setIndex] = useState(0)
    const [ended, setEnded] = useState(false)
    const [init, setInit] = useState(true)
    const [searchTerm, setSearchTerm] = useState(props.tag)
    const [sizeDropdown, setSizeDropdown] = useState(false)
    const [allImagesLoaded, setAllImagesLoaded] = useState(true)
    const sizeRef = useRef<HTMLImageElement>(null)
    const visiblePromisesRef = useRef<TrackablePromise<void>[]>([])
    const navigate = useNavigate()

    let rating = props.post?.rating || (ratingType === functions.r18() ? ratingType : "all")

    const searchPosts = async () => {
        if (props.post?.type === "model" || props.post?.type === "live2d") {
            if (session.liveModelPreview) return []
        }
        let result = await functions.http.get("/api/search/posts", {query: props.tag, type: props.post?.type || "all", 
        rating: functions.post.isR18(rating) ? rating : "all", style: functions.post.isSketch(props.post?.style || "all") ? "all+s" : "all", 
        sort: props.count ? "date" : "random", limit, showChildren}, session, setSessionFlag)

        if (result.length < 50 && props.fallback?.[0]) {
            let interResult = await functions.http.get("/api/search/posts", {query: props.fallback[0], type: props.post?.type || "all", 
            rating: functions.post.isR18(rating) ? rating : "all", style: functions.post.isSketch(props.post?.style || "all") ? "all+s" : "all", 
            sort: props.count ? "date" : "random", limit, showChildren}, session, setSessionFlag)
            const filtered = interResult.filter(p => !result.some(r => r.postID === p.postID))
            result.push(...filtered)
            setSearchTerm(props.fallback[0])
        }

        if (result.length < 50 && props.fallback?.[1]) {
            let interResult = await functions.http.get("/api/search/posts", {query: props.fallback[1], type: props.post?.type || "all", 
            rating: functions.post.isR18(rating) ? rating : "all", style: functions.post.isSketch(props.post?.style || "all") ? "all+s" : "all", 
            sort: props.count ? "date" : "random", limit, showChildren}, session, setSessionFlag)
            const filtered = interResult.filter(p => !result.some(r => r.postID === p.postID))
            result.push(...filtered)
            setSearchTerm(props.fallback[1])
        }

        return result
    }

    const updateRelated = async () => {
        if (!props.count && (session.username && !session.showRelated)) return
        if (!props.tag) return
        let result = await searchPosts()
        result = result.filter((p) => p.postID !== props.post?.postID)
        setRelatedPage(1)
        setEnded(false)
        setIndex(0)
        setVisibleRelated([])
        setRelated(result)
        delay = 0
    }

    useEffect(() => {
        clearTimeout(relatedTimer)
        relatedTimer = setTimeout(() => {
            if (init && related.length) {
                return setInit(false)
            }
            updateRelated()
        }, delay)
    }, [props.post, session])

    useEffect(() => {
        clearTimeout(relatedTimer)
        relatedTimer = setTimeout(() => {
            updateRelated()
        }, delay)
    }, [props.tag, session])

    const getPageAmount = () => {
        return mobile ? 10 : scroll ? 15 : 20
    }

    useEffect(() => {
        const updateRelated = () => {
            let currentIndex = index
            const newVisibleRelated = visibleRelated
            for (let i = 0; i < getPageAmount(); i++) {
                if (!related[currentIndex]) break
                newVisibleRelated.push(related[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleRelated(functions.util.removeDuplicates(newVisibleRelated))
        }
        if (scroll) updateRelated()
    }, [scroll, related, session])

    const updateOffset = async () => {
        if (!props.count && (session.username && !session.showRelated)) return
        if (ended) return
        if (props.post?.type === "model" || props.post?.type === "live2d") return
        let newOffset = offset + limit
        let padded = false
        if (!scroll) {
            newOffset = (relatedPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (related[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.http.get("/api/search/posts", {query: searchTerm, type: props.post?.type || "all", 
        rating: functions.post.isR18(rating) ? rating : "all", style: functions.post.isSketch(props.post?.style || "all") ? "all+s" : "all", 
        sort: props.count ? "date" : "random", showChildren, limit, offset: newOffset}, session, setSessionFlag)

        let hasMore = result?.length >= limit
        const cleanRelated = related.filter((t) => !t.fake)
        if (!scroll) {
            if (cleanRelated.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, postCount: cleanRelated[0]?.postCount}), ...result]
                padded = true
            }
        }

        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setRelated(functions.util.removeDuplicates([...related, ...result]))
            } else {
                setRelated(functions.util.removeDuplicates([...related, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setRelated(functions.util.removeDuplicates([...related, ...result]))
                } else {
                    setRelated(functions.util.removeDuplicates([...related, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.dom.scrolledToBottom()) {
                let currentIndex = index
                if (!related[currentIndex]) return updateOffset()
                const newVisibleRelated = visibleRelated
                for (let i = 0; i < 15; i++) {
                    if (!related[currentIndex]) break
                    newVisibleRelated.push(related[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRelated(functions.util.removeDuplicates(newVisibleRelated))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleRelated, index])

    useEffect(() => {
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleRelated([])
            setRelatedPage(1)
            updateRelated()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const relatedOffset = (relatedPage - 1) * getPageAmount()
            if (related[relatedOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const relatedAmount = Number(related[0]?.postCount)
            let maximum = relatedOffset + getPageAmount()
            if (maximum > relatedAmount) maximum = relatedAmount
            const maxRelated = related[maximum - 1]
            if (!maxRelated) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, relatedPage, ended])

    useEffect(() => {
        if (related?.length) {
            const maxRelatedPage = maxPage()
            if (maxRelatedPage === 1) return
            if (queryPage > maxRelatedPage) {
                setQueryPage(maxRelatedPage)
                setRelatedPage(maxRelatedPage)
            }
        }
    }, [related, relatedPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("relatedPage", String(relatedPage || ""))
    }, [relatedPage])

    const maxPage = () => {
        if (!related?.length) return 1
        if (Number.isNaN(Number(related[0]?.postCount))) return 10000
        return Math.ceil(Number(related[0]?.postCount) / getPageAmount())
    }

    const firstPage = () => {
        setRelatedPage(1)
    }

    const previousPage = () => {
        let newPage = relatedPage - 1 
        if (newPage < 1) newPage = 1 
        setRelatedPage(newPage)
    }

    const nextPage = () => {
        let newPage = relatedPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setRelatedPage(newPage)
    }

    const lastPage = () => {
        setRelatedPage(maxPage())
    }

    const goToPage = (newPage: number) => {
        setRelatedPage(newPage)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (relatedPage > maxPage() - 3) increment = -4
        if (relatedPage > maxPage() - 2) increment = -5
        if (relatedPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (relatedPage > maxPage() - 2) increment = -3
            if (relatedPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = relatedPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} 
                onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const getSizeMargin = () => {
        const rect = sizeRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "150px"
        const raw = window.innerWidth - rect.x
        let offset = -60
        if (sizeType === "tiny") offset += -15
        if (sizeType === "small") offset += -10
        if (sizeType === "medium") offset += -5
        if (sizeType === "large") offset += -10
        if (sizeType === "massive") offset += -5
        if (props.count) offset -= 20
        return `${raw + offset}px`
    }

    const getMarginLeft = () => {
        return mobile ? 5 : 15
    }

    const getMarginBottom = () => {
        return mobile ? 10 : 30
    }

    const getSquareSize = () => {
        if (sizeType === "tiny") {
            return mobile ? 110 : 130
        } else if (sizeType === "small") {
            return mobile ? 160 : 170
        } else if (sizeType === "medium") {
            return mobile ? 160 : 220
        } else if (sizeType === "large") {
            return mobile ? 360 : 380
        } else if (sizeType === "massive") {
            return mobile ? 460 : 480
        }
    }

    const getSize = () => {
        if (square) return getSquareSize()
        if (sizeType === "tiny") {
            return mobile ? 110 : 130
        } else if (sizeType === "small") {
            return mobile ? 150 : 180
        } else if (sizeType === "medium") {
            return mobile ? 240 : 250
        } else if (sizeType === "large") {
            return mobile ? 380 : 400
        } else if (sizeType === "massive") {
            return mobile ? 450 : 500
        }
    }

    useEffect(() => {
        if (scroll) return
        if (!visiblePromisesRef.current.length) return
        setAllImagesLoaded(false)
        const poll = async () => {
            const notFulfilled = () => {
                return visiblePromisesRef.current.filter((p) => p.state === "pending").length > 0
            }
            let timer = 0
            while (notFulfilled()) {
                await functions.timeout(50)
                timer += 50
                if (timer >= 1000) break
            }
            await functions.timeout(100)
            setAllImagesLoaded(true)
        }
        poll()
    }, [scroll, visibleRelated, relatedPage])

    const generateImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = [] as PostSearch[]
        if (scroll) {
            visible = functions.util.removeDuplicates(visibleRelated)
        } else {
            const postOffset = (relatedPage - 1) * getPageAmount()
            visible = related.slice(postOffset, postOffset + getPageAmount())
        }
        visiblePromisesRef.current.splice(0, visiblePromisesRef.current.length)
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i]
            if (post.fake) continue
            if (!session.username) if (post.rating !== functions.r13()) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(post.rating)) continue

            const promise = new TrackablePromise<void>()
            visiblePromisesRef.current.push(promise)

            const image = post.images[0]
            const thumb = functions.link.getThumbnailLink(image, "medium", session, mobile)
            const liveThumb = functions.link.getThumbnailLink(image, "medium", session, mobile, true)
            const images = post.images.map((image) => functions.link.getImageLink(image, session.upscaledImages))
            if (post.type === "model") {
                jsx.push(<GridModel key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} 
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "live2d") {
                jsx.push(<GridLive2D key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} 
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "audio") {
                jsx.push(<GridSong key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} 
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "video") {
                jsx.push(<GridVideo key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} live={liveThumb}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "animation") {
                jsx.push(<GridAnimation key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} live={liveThumb}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} onLoad={promise.resolve}/>)
            } else {
                jsx.push(<GridImage key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} live={liveThumb}
                    comicPages={post.type === "comic" ? images : null} onLoad={promise.resolve}/>)
            }
        }
        // jsx.push(<div key="ad" style={{width: "100%"}}><AdBanner/></div>)
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {relatedPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {relatedPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {relatedPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {relatedPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
        }
        return jsx
    }

    const toggleScroll = () => {
        const newValue = !scroll
        setScroll(newValue)
    }

    const searchTag = (event: React.MouseEvent) => {
        if (!props.tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${props.tag}`, "_blank")
        } else {
            navigate("/posts")
            setSearch(props.tag)
            setSearchFlag(true)
        }
    }

    const getImages = () => {
        return related.map((post) => functions.link.getThumbnailLink(post.images[0], "tiny", session, mobile))
    }

    const click = (img: string, index: number) => {
        const post = related[index]
        navigate(`/post/${post.postID}/${post.slug}`)
        setPosts(related)
    }

    let marginLeft = mobile ? 20 : 200
    let paddingLeft = props.count ? 0 : mobile ? 20 : 40

    if (!related.length) return null

    return (
        <div className="related" style={{paddingLeft: `${paddingLeft}px`, marginBottom: "10px"}}>
            {props.count ?
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="tag-label" onClick={searchTag} onAuxClick={searchTag}>{i18n.sort.posts}
                </span><span className="tag-label-alt">{props.count}</span>
                <img className="related-icon" src={scroll ? scrollIcon : pageIcon} onClick={toggleScroll}/>
                <img className="related-icon" src={squareIcon} onClick={() => setSquare(!square)} style={{filter: "brightness(110%) hue-rotate(60deg)"}}/>
                <img className="related-icon" ref={sizeRef} src={sizeIcon} onClick={() => setSizeDropdown((prev) => !prev)}/>
            </div> :
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="related-title">{i18n.post.related}</span>
                <img className="related-icon" src={scroll ? scrollIcon : pageIcon} onClick={toggleScroll}/>
                <img className="related-icon" src={squareIcon} onClick={() => setSquare(!square)} style={{filter: "brightness(110%) hue-rotate(60deg)"}}/>
                <img className="related-icon" ref={sizeRef} src={sizeIcon} onClick={() => setSizeDropdown((prev) => !prev)}/>
            </div>}
            <div className="related-container" style={{visibility: allImagesLoaded ? "visible" : "hidden", width: "98%", justifyContent: related.length < 5 ? "flex-start" : "space-evenly"}}>
                {generateImagesJSX()}
                {/* <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200}/> */}
            </div>
            <div className={`related-dropdown ${sizeDropdown ? "" : "hide-related-dropdown"}`} 
            style={{marginRight: getSizeMargin(), top: `50px`}} onClick={() => setSizeDropdown(false)}>
                <div className="related-dropdown-row" onClick={() => setSizeType("tiny")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.tiny}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("small")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.small}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("medium")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.medium}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("large")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.large}</span>
                </div>
                <div className="related-dropdown-row" onClick={() => setSizeType("massive")}>
                    <span className="related-dropdown-text">{i18n.sortbar.size.massive}</span>
                </div>
            </div>
        </div>
    )
}

export default Related