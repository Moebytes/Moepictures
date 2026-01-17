import React, {useEffect, useState, useRef, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import {useCacheActions, useLayoutSelector, useSearchSelector, useSessionSelector, useThemeSelector,
useSessionActions, useSearchActions, usePageSelector, usePageActions, useMiscDialogActions,
useFlagSelector, useFlagActions, useCacheSelector} from "../../store"
import {TrackablePromise} from "../../structures/TrackablePromise"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import scrollSVG from "../../assets/svg/scroll.svg"
import pagesSVG from "../../assets/svg/pages.svg"
import squareSVG from "../../assets/svg/square.svg"
import sizeSVG from "../../assets/svg/size.svg"
import GridImage from "../image/GridImage"
import GridAnimation from "../image/GridAnimation"
import GridVideo from "../image/GridVideo"
import GridSong from "../image/GridSong"
import GridModel from "../image/GridModel"
import GridLive2D from "../image/GridLive2D"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {PostHistory, PostSearch, MiniTag, Tag} from "../../types/Types"
import "./styles/related.less"

let relatedTimer = null as any
let delay = 2000
let limit = 100
let pageAmount = 15

interface Props {
    tag: string
    post?: PostSearch | PostHistory | null
    count?: number
    fallback?: string[]
}

const Related: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {related} = useCacheSelector()
    const {setNavigationPosts, setRelated} = useCacheActions()
    const {ratingType, square, showChildren, scroll, sizeType} = useSearchSelector()
    const {setSearch, setSearchFlag, setSquare, setSizeType} = useSearchActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {relatedPage} = usePageSelector()
    const {setRelatedPage} = usePageActions()
    const [init, setInit] = useState(true)
    const [searchTerm, setSearchTerm] = useState(props.tag)
    const [sizeDropdown, setSizeDropdown] = useState(false)
    const [allImagesLoaded, setAllImagesLoaded] = useState(true)
    const sizeRef = useRef<HTMLImageElement>(null)
    const visiblePromisesRef = useRef<TrackablePromise<void>[]>([])
    const navigate = useNavigate()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--titleButtons")
    }

    let rating = props.post?.rating || (ratingType === functions.r18() ? ratingType : "all")

    const searchPosts = async () => {
        if (props.post?.type === "model" || props.post?.type === "live2d") {
            if (session.liveModelPreview) return []
        }
        let result = await functions.http.get("/api/search/posts", {query: props.tag, type: props.post?.type || "all", 
        rating: functions.post.isR18(rating) ? rating : "all", style: functions.post.isSketch(props.post?.style || "all") ? "all+s" : "all", 
        sort: props.count ? "date" : "random", limit, showChildren}, session, setSessionFlag, true)

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

    const loadInitial = async () => {
        if (!props.count && (session.username && !session.showRelated)) return []
        if (!props.tag) return []
        let result = await searchPosts()
        result = result.filter((p) => p.postID !== props.post?.postID)
        delay = 0
        return result
    }
    
    const updateOffset = async (offset: number) => {
        if (!props.count && (session.username && !session.showRelated)) return null
        if (props.post?.type === "model" || props.post?.type === "live2d") return []

        let result = await functions.http.get("/api/search/posts", {query: searchTerm, type: props.post?.type || "all", 
        rating: functions.post.isR18(rating) ? rating : "all", style: functions.post.isSketch(props.post?.style || "all") ? "all+s" : "all", 
        sort: props.count ? "date" : "random", showChildren, limit, offset}, session, setSessionFlag)

        return result
    }

    const {items, visibleItems, page, setPage, maxPage, initItems, setManagedPage, setManagedItems, 
        toggleScroll} = usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "postCount"})

    useEffect(() => {
        clearTimeout(relatedTimer)
        relatedTimer = setTimeout(() => {
            if (init && items.length) {
                return setInit(false)
            }
            initItems()
        }, delay)
    }, [props.post, session])

    useEffect(() => {
        clearTimeout(relatedTimer)
        relatedTimer = setTimeout(() => {
            initItems()
        }, delay)
    }, [props.tag, session])

    useEffect(() => {
        if (relatedPage) setManagedPage(relatedPage)
        if (related) setManagedItems(related)
    }, [])

    useEffect(() => {
        setRelatedPage(page)
        setRelated(items)
    }, [items, page])

    const getSizeMargin = () => {
        const rect = sizeRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "150px"
        const raw = window.innerWidth - rect.x
        let offset = -50
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
    }, [scroll, items, relatedPage])

    const generateImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = visibleItems as PostSearch[]
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
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} model={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "live2d") {
                jsx.push(<GridLive2D key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} 
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} live2d={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "audio") {
                jsx.push(<GridSong key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} 
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} audio={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "video") {
                jsx.push(<GridVideo key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} live={liveThumb}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} video={images[0]} post={post} onLoad={promise.resolve}/>)
            } else if (post.type === "animation") {
                jsx.push(<GridAnimation key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()} live={liveThumb}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} anim={images[0]} post={post} onLoad={promise.resolve}/>)
            } else {
                jsx.push(<GridImage key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={getMarginBottom()}
                    marginLeft={getMarginLeft()} height={getSize()} borderRadius={4} img={thumb} original={images[0]} post={post} live={liveThumb}
                    comicPages={post.type === "comic" ? images : null} onLoad={promise.resolve}/>)
            }
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
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
        return visibleItems.map((post) => functions.link.getThumbnailLink(post.images[0], "tiny", session, mobile))
    }

    const click = (img: string, index: number) => {
        const post = visibleItems[index]
        navigate(`/post/${post.postID}/${post.slug}`)
        setNavigationPosts(visibleItems)
    }

    let marginLeft = mobile ? 20 : 200
    let paddingLeft = props.count ? 0 : mobile ? 20 : 40

    if (!items.length) return null

    return (
        <div className="related" style={{paddingLeft: `${paddingLeft}px`, marginBottom: "10px"}}>
            {props.count ?
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="tag-label" onClick={searchTag} onAuxClick={searchTag}>{i18n.sort.posts}
                </span><span className="tag-label-alt">{props.count}</span>
                <img className="related-icon" src={getIcon(scroll ? scrollSVG : pagesSVG)} onClick={toggleScroll} style={{filter}}/>
                <img className="related-icon" src={getIcon(squareSVG)} onClick={() => setSquare(!square)} style={{filter}}/>
                <img className="related-icon" ref={sizeRef} src={getIcon(sizeSVG)} onClick={() => setSizeDropdown((prev) => !prev)} style={{filter}}/>
            </div> :
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="related-title">{i18n.post.related}</span>
                <img className="related-icon" src={getIcon(scroll ? scrollSVG : pagesSVG)} onClick={toggleScroll} style={{filter}}/>
                <img className="related-icon" src={getIcon(squareSVG)} onClick={() => setSquare(!square)} style={{filter}}/>
                <img className="related-icon" ref={sizeRef} src={getIcon(sizeSVG)} onClick={() => setSizeDropdown((prev) => !prev)} style={{filter}}/>
            </div>}
            <div className="related-container" style={{visibility: allImagesLoaded ? "visible" : "hidden", width: "98%", justifyContent: related.length < 5 ? "flex-start" : "space-evenly"}}>
                {generateImagesJSX()}
                {/* <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200} unlimited={true}/> */}
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