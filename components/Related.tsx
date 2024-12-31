import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useCacheActions, useLayoutSelector, useSearchSelector, useSessionSelector, useThemeSelector,
useSessionActions, useSearchActions, usePageSelector, usePageActions, useMiscDialogActions,
useFlagSelector, useFlagActions} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import pageIcon from "../assets/icons/page.png"
import scrollIcon from "../assets/icons/scroll.png"
import squareIcon from "../assets/icons/square.png"
import GridImage from "./GridImage"
import GridSong from "./GridSong"
import GridModel from "./GridModel"
import GridLive2D from "./GridLive2D"
import Carousel from "./Carousel"
import "./styles/related.less"
import {PostHistory, PostSearch, MiniTag} from "../types/Types"

let replace = false

interface Props {
    tag: string
    post?: PostSearch | PostHistory | null
    count?: number
}

const Related: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {setPosts} = useCacheActions()
    const {ratingType, square, showChildren, scroll} = useSearchSelector()
    const {setSearch, setSearchFlag, setScroll, setSquare} = useSearchActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {relatedPage} = usePageSelector()
    const {setRelatedPage} = usePageActions()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const [related, setRelated] = useState([] as PostSearch[])
    const [visibleRelated, setVisibleRelated] = useState([] as PostSearch[])
    const [queryPage, setQueryPage] = useState(1)
    const [offset, setOffset] = useState(0)
    const [index, setIndex] = useState(0)
    const [ended, setEnded] = useState(false)
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        /*
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            const savedPage = localStorage.getItem("relatedPage")
            if (savedPage) setRelatedPage(Number(savedPage))
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setRelatedPage(Number(pageParam))
            }
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setRelatedPage(Number(pageParam))
        }
        window.addEventListener("load", onDOMLoaded)
        window.addEventListener("popstate", updateStateChange)
        window.addEventListener("pushstate", updateStateChange)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
            window.removeEventListener("popstate", updateStateChange)
            window.removeEventListener("pushstate", updateStateChange)
        }*/
    }, [])
    /*
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (!scroll) searchParams.set("page", String(relatedPage || ""))
        if (replace) {
            if (!scroll) history.replace(`${location.pathname}?${searchParams.toString()}`)
            replace = false
        } else {
            if (!scroll) history.push(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, relatedPage])*/

    const updateRelated = async () => {
        if (!props.count && !session.showRelated) return
        if (!props.tag) return
        let result = await functions.get("/api/search/posts", {query: props.tag, type: props.post?.type || "all", 
        rating: functions.isR18(props.post?.rating || "all") ? functions.r18() : "all", style: functions.isSketch(props.post?.style || "all") ? "all+s" : "all", 
        sort: props.count ? "date" : "random", showChildren}, session, setSessionFlag)
        result = result.filter((p) => p.postID !== props.post?.postID)
        setRelatedPage(1)
        setEnded(false)
        setIndex(0)
        setVisibleRelated([])
        setRelated(result)
    }

    useEffect(() => {
        updateRelated()
    }, [props.post, props.tag, session])

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
            setVisibleRelated(functions.removeDuplicates(newVisibleRelated))
        }
        if (scroll) updateRelated()
    }, [scroll, related, session])

    const updateOffset = async () => {
        if (!props.count && !session.showRelated) return
        if (ended) return
        let newOffset = offset + 100
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
        let result = await functions.get("/api/search/posts", {query: props.tag, type: props.post?.type || "all", 
        rating: functions.isR18(props.post?.rating || "all") ? functions.r18() : "all", style: functions.isSketch(props.post?.style || "all") ? "all+s" : "all", 
        sort: props.count ? "date" : "random", showChildren, offset: newOffset}, session, setSessionFlag)

        let hasMore = result?.length >= 100
        const cleanRelated = related.filter((t) => !t.fake)
        if (!scroll) {
            if (cleanRelated.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, commentCount: cleanRelated[0]?.postCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setRelated(result)
            } else {
                setRelated((prev) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setRelated(result)
                } else {
                    setRelated((prev) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!related[currentIndex]) return updateOffset()
                const newVisibleRelated = visibleRelated
                for (let i = 0; i < 15; i++) {
                    if (!related[currentIndex]) return updateOffset()
                    newVisibleRelated.push(related[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRelated(functions.removeDuplicates(newVisibleRelated))
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
    }, [scroll, related, relatedPage, ended])

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

    const generateImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        let visible = [] as PostSearch[]
        if (scroll) {
            visible = functions.removeDuplicates(visibleRelated)
        } else {
            const postOffset = (relatedPage - 1) * getPageAmount()
            visible = related.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            const post = visible[i]
            if (post.fake) continue
            if (!session.username) if (post.rating !== functions.r13()) continue
            if (!functions.isR18(ratingType)) if (functions.isR18(post.rating)) continue
            const images = post.images.map((i) => functions.getThumbnailLink(i.type, post.postID, i.order, i.filename, "medium", mobile))
            if (post.type === "model") {
                jsx.push(<GridModel key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={30} 
                marginLeft={5} height={square ? 220 : 250} borderRadius={4} img={images[0]} model={images[0]} post={post}/>)
            } else if (post.type === "live2d") {
                jsx.push(<GridLive2D key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={30} 
                marginLeft={5} height={square ? 220 : 250} borderRadius={4} img={images[0]} live2d={images[0]} post={post}/>)
            } else if (post.type === "audio") {
                jsx.push(<GridSong key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={30} 
                marginLeft={5} height={square ? 220 : 250} borderRadius={4} img={images[0]} audio={images[0]} post={post}/>)
            } else {
                jsx.push(<GridImage key={post.postID} id={post.postID} autoLoad={true} square={square} marginBottom={30} 
                marginLeft={5} height={square ? 220 : 250} borderRadius={4} img={images[0]} original={images[0]} post={post}
                comicPages={post.type === "comic" ? images : null}/>)
            }
        }
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
        localStorage.setItem("scroll", `${newValue}`)
        setScroll(newValue)
    }

    const searchTag = (event: React.MouseEvent) => {
        if (!props.tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${props.tag}`, "_blank")
        } else {
            history.push("/posts")
            setSearch(props.tag)
            setSearchFlag(true)
        }
    }

    const getImages = () => {
        return related.map((post) => functions.getThumbnailLink(post.images[0].type, post.postID, 
        post.images[0].order, post.images[0].filename, "medium"))
    }

    const click = (img: string, index: number) => {
        const post = related[index]
        history.push(`/post/${post.postID}/${post.slug}`)
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(related)
    }

    let marginLeft = mobile ? 20 : 200

    if (!related.length) return null

    return (
        <div className="related" style={{paddingLeft: props.count ? "0px" : "40px", marginBottom: "10px"}}>
            {props.count ?
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="tag-label" onClick={searchTag} onAuxClick={searchTag}>{i18n.sort.posts}
                </span><span className="tag-label-alt">{props.count}</span>
                <img className="related-icon" src={scroll ? scrollIcon : pageIcon} onClick={toggleScroll}/>
                <img className="related-icon" src={squareIcon} onClick={() => setSquare(!square)}/>
            </div> :
            <div style={{display: "flex", alignItems: "center", marginBottom: "20px"}}>
                <span className="related-title">{i18n.post.related}</span>
                <img className="related-icon" src={scroll ? scrollIcon : pageIcon} onClick={toggleScroll}/>
                <img className="related-icon" src={squareIcon} onClick={() => setSquare(!square)}/>
            </div>}
            <div className="related-container" style={{width: props.count ? "100%" : "97%", justifyContent: "space-evenly"}}>
                {generateImagesJSX()}
                {/* <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200}/> */}
            </div>
        </div>
    )
}

export default Related