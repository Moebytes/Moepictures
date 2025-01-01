import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useLayoutSelector, useSessionSelector, useSessionActions, 
useSearchSelector, useSearchActions, useCacheSelector, usePageSelector} from "../../store"
import functions from "../../structures/Functions"
import {TagCount, PostSearch} from "../../types/Types"
import "./styles/tagbanner.less"

let startX = 0
let deltaCounter = 0
let lastDeltaY = 0

const TagBanner: React.FunctionComponent = (props) => {
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {sizeType, scroll} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {posts, visiblePosts} = useCacheSelector()
    const {page} = usePageSelector()
    const [dragging, setDragging] = useState(false)
    const [bannerTags, setBannerTags] = useState([] as TagCount[])
    const [trackPad, setTrackPad] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [marginLeft, setMarginLeft] = useState(0)
    const history = useHistory()

    useEffect(() => {
        containerRef.current?.addEventListener("wheel", handleWheel, {passive: false})
        return () => {
            containerRef.current?.removeEventListener("wheel", handleWheel)
        }
    })

    const handleWheel = (event: WheelEvent) => {
        if (!containerRef.current) return
        if (!trackPad) event.preventDefault()
        let marginLeft = parseInt(containerRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        let trackPadScroll = false
        if (deltaCounter < 15) trackPadScroll = true
        if (Math.abs(event.deltaY) === lastDeltaY) {
            deltaCounter += 1
        } else {
            deltaCounter = 0
        }
        if (Math.abs(event.deltaY) > 0) lastDeltaY = Math.abs(event.deltaY)
        if (trackPadScroll) {
            containerRef.current.style.marginLeft = "0px"
            return setTrackPad(true)
        }
        setTrackPad(false)
        if (Math.abs(event.deltaY) < 5) {
            if (event.deltaX < 0) {
                marginLeft += 25
            } else {
                marginLeft -= 25
            }
        } else {
            if (event.deltaY < 0) {
                marginLeft -= 25
            } else {
                marginLeft += 25
            }
        }
        if (marginLeft > 0) marginLeft = 0
        const maxScrollLeft = containerRef.current.scrollWidth - containerRef.current.clientWidth
        if (marginLeft < -maxScrollLeft) marginLeft = -maxScrollLeft
        containerRef.current.style.marginLeft = `${marginLeft}px`
        setMarginLeft(marginLeft)
    }

    const handleTouchStart = (event: React.TouchEvent) => {
        if (!event.touches.length) return
        setDragging(true)
        startX = event.touches[0].pageX
    }

    const handleTouchMove = (event: React.TouchEvent) => {
        if (!containerRef.current) return
        if (!event.touches.length) return
        if (!dragging) return
        let marginLeft = parseInt(containerRef.current.style.marginLeft)
        if (Number.isNaN(marginLeft)) marginLeft = 0
        if (event.touches[0].pageX < startX) {
            marginLeft -= 10
        } else if (event.touches[0].pageX > startX) {
            marginLeft += 10
        }
        if (marginLeft > 0) marginLeft = 0
        const maxScrollLeft = containerRef.current.scrollWidth - containerRef.current.clientWidth
        if (marginLeft < -maxScrollLeft) marginLeft = -maxScrollLeft
        containerRef.current.style.marginLeft = `${marginLeft}px`
        setMarginLeft(marginLeft)
        startX = event.touches[0].pageX
    }

    const handleTouchEnd = (event: React.TouchEvent) => {
        setDragging(false)
    }

    const getPageAmount = () => {
        let loadAmount = 60
        if (sizeType === "tiny") loadAmount = 60
        if (sizeType === "small") loadAmount = 40
        if (sizeType === "medium") loadAmount = 25
        if (sizeType === "large") loadAmount = 20
        if (sizeType === "massive") loadAmount = 15
        return loadAmount * 2
    }

    const getVisibleSlice = () => {
        let visible = [] as PostSearch[]
        if (scroll) {
            visible = functions.removeDuplicates(visiblePosts)
        } else {
            const postOffset = (page - 1) * getPageAmount()
            visible = posts.slice(postOffset, postOffset + getPageAmount()) as PostSearch[]
        }
        return visible
    }

    const updateBannerTags = async () => {
        const visibleSlice = getVisibleSlice()
        const visibleTags = await functions.get("/api/search/sidebartags", {postIDs: visibleSlice.map((p) => p.postID)}, session, setSessionFlag)
        const characterTags = [] as TagCount[]
        const characterTagsImg = [] as TagCount[]
        const seriesTags = [] as TagCount[]
        const seriesTagsImg = [] as TagCount[]
        for (const tag of visibleTags) {
            if (tag.tag === "original") continue
            if (tag.tag === "no-series") continue
            if (tag.tag === "unknown-series") continue
            if (tag.tag === "unknown-character") continue
            if (tag.type === "character") tag.image ? characterTagsImg.push(tag) : characterTags.push(tag)
            if (tag.type === "series") tag.image ? seriesTagsImg.push(tag) : seriesTags.push(tag)
        }
        setBannerTags([...characterTagsImg, ...seriesTagsImg, ...characterTags, ...seriesTags])
    }

    useEffect(() => {
        updateBannerTags()
    }, [scroll, visiblePosts, posts, page, sizeType, session])

    const bannerTagJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (const bannerTag of bannerTags) {
            const getClass = () => {
                if (bannerTag.type === "artist") return "tagbanner-artist-tag"
                if (bannerTag.type === "character") return "tagbanner-character-tag"
                if (bannerTag.type === "series") return "tagbanner-series-tag"
                return "tagbanner-tag"
            }
            const tagClick = () => {
                setSearch(bannerTag.tag)
                setSearchFlag(true)
            }
            const tagPage = (event: React.MouseEvent) => {
                event.preventDefault()
                history.push(`/tag/${bannerTag.tag}`)
            }
            jsx.push(
                <div className="tagbanner-box">
                    {bannerTag.image ? <img className="tagbanner-img" src={functions.getTagLink(bannerTag.type, bannerTag.image, bannerTag.imageHash)}/> : null}
                    <span className="tagbanner-tag" onClick={tagClick} onContextMenu={tagPage}>{bannerTag.tag}</span>
                </div>
            )
        }
        return jsx
    }

    if (!bannerTags.length) return null

    const getWidth = () => {
        if (trackPad) return mobile ? "100%" : ""
        return mobile ? `calc(100vw + ${Math.abs(marginLeft)}px)` : `calc(100vw - ${functions.sidebarWidth()}px + ${Math.abs(marginLeft)}px)`
    }

    return (
        <div className="tagbanner" ref={containerRef} style={{width: getWidth(), overflowX: trackPad ? "auto" : "hidden"}}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {bannerTagJSX()}
        </div>
    )
}

export default TagBanner