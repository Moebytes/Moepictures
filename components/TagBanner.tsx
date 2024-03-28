import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SessionContext, EnableDragContext, PostsContext, VisiblePostsContext, SizeTypeContext, PageContext, ScrollContext,
SearchContext, SearchFlagContext, MobileContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import localforage from "localforage"
import "./styles/tagbanner.less"
import axios from "axios"

const TagBanner: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {posts, setPosts} = useContext(PostsContext) as any
    const {visiblePosts, setVisiblePosts} = useContext(VisiblePostsContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {page, setPage} = useContext(PageContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const [dragging, setDragging] = useState(false)
    const [bannerTags, setBannerTags] = useState([]) as any
    const containerRef = useRef(null) as any
    const history = useHistory()

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
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visiblePosts)
        } else {
            const postOffset = (page - 1) * getPageAmount()
            visible = posts.slice(postOffset, postOffset + getPageAmount())
        }
        return visible
    }

    const updateBannerTags = async () => {
        const visibleSlice = getVisibleSlice()
        const visibleTags = await axios.post("/api/search/sidebartags", {postIDs: visibleSlice.map((p: any) => p.postID)}).then((r) => r.data)
        const characterTags = [] as any
        const characterTagsImg = [] as any
        const seriesTags = [] as any
        const seriesTagsImg = [] as any
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
    }, [scroll, visiblePosts, posts, page, sizeType])

    const bannerTagJSX = () => {
        let jsx = [] as any
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
            jsx.push(
                <div className="tagbanner-box">
                    {bannerTag.image ? <img className="tagbanner-img" src={functions.getTagLink(bannerTag.type, bannerTag.image)}/> : null}
                    <span className="tagbanner-tag" onClick={tagClick}>{bannerTag.tag}</span>
                </div>
            )
        }
        return jsx
    }

    if (!bannerTags.length) return null

    return (
        <div className="tagbanner" ref={containerRef} style={mobile ? {width: "100%"} : {}}>
            {bannerTagJSX()}
        </div>
    )
}

export default TagBanner