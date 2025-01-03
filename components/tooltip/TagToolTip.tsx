import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useSessionSelector, useSessionActions, useSearchSelector, useInteractionSelector, 
useInteractionActions, useSearchActions, useFilterSelector} from "../../store"
import functions from "../../structures/Functions"
import jsxFunctions from "../../structures/JSXFunctions"
import website from "../../assets/icons/website.png"
import fandom from "../../assets/icons/fandom.png"
import pixiv from "../../assets/icons/pixiv.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import twitter from "../../assets/icons/twitter.png"
import {PostSearch, Tag} from "../../types/Types"
import "./styles/tagtooltip.less"

let changeTimer = null as any

const TagToolTip: React.FunctionComponent = (props) => {
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {selectionMode, ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {tagTooltipTag, tagTooltipEnabled, tagTooltipY} = useInteractionSelector()
    const {setTagToolTipEnabled} = useInteractionActions()
    const [hover, setHover] = useState(false)
    const [tag, setTag] = useState(null as Tag | null)
    const [items, setItems] = useState([] as {post: PostSearch, image: string, ref: React.RefObject<HTMLImageElement>}[])
    const history = useHistory()

    const updateTag = async () => {
        if (session?.username && !session?.showTagTooltips) return
        if (!tagTooltipTag) return
        const tag = await functions.get("/api/tag", {tag: tagTooltipTag}, session, setSessionFlag)
        if (!tag) return
        setTag(tag)
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        let posts = await functions.get("/api/search/posts", {query: tag.tag, type: "all", rating, style: "all", sort: "random", limit: 32}, session, setSessionFlag)
        let items = [] as {post: PostSearch, image: string, ref: React.RefObject<HTMLImageElement>}[]
        await Promise.all(posts.map(async (post) => {
            let thumbnail = functions.getThumbnailLink(post.images[0].type, post.postID, post.images[0].order, post.images[0].filename, "tiny")
            let image = await functions.decryptThumb(thumbnail, session, `tooltip-${thumbnail}`, true)
            items.push({post, image, ref: React.createRef<HTMLImageElement>()})
        }))
        setItems(items)
    }

    useEffect(() => {
        if (changeTimer) clearTimeout(changeTimer)
        changeTimer = setTimeout(() => {
            updateTag()
        }, 500)
    }, [tagTooltipTag, ratingType, session])

    useEffect(() => {
        const scrollHandler = async (event: Event) => {
            if (hover) return
            setTagToolTipEnabled(false)
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [hover])

    const tagSocialJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (tag.type === "artist") {
            if (tag.website) {
                jsx.push(<img className="tag-tooltip-social" src={website} onClick={() => window.open(tag.website!, "_blank", "noreferrer")}/>)
            }
            if (tag.social?.includes("pixiv.net")) {
                jsx.push(<img className="tag-tooltip-social" src={pixiv} onClick={() => window.open(tag.social!, "_blank", "noreferrer")}/>)
            } else if (tag.social?.includes("soundcloud.com")) {
                jsx.push(<img className="tag-tooltip-social" src={soundcloud} onClick={() => window.open(tag.social!, "_blank", "noreferrer")}/>)
            } else if (tag.social?.includes("sketchfab.com")) {
                jsx.push(<img className="tag-tooltip-social" src={sketchfab} onClick={() => window.open(tag.social!, "_blank", "noreferrer")}/>)
            }
            if (tag.twitter) {
                jsx.push(<img className="tag-tooltip-social" src={twitter} onClick={() => window.open(tag.twitter!, "_blank", "noreferrer")}/>)
            }
        }
        if (tag.type === "character") {
            if (tag.fandom) {
                jsx.push(<img className="tag-tooltip-social" src={fandom} onClick={() => window.open(tag.fandom!, "_blank", "noreferrer")}/>)
            }
        }
        if (tag.type === "series") {
            if (tag.website) {
                jsx.push(<img className="tag-tooltip-social" src={website} onClick={() => window.open(tag.website!, "_blank", "noreferrer")}/>)
            }
            if (tag.twitter) {
                jsx.push(<img className="tag-tooltip-social" src={twitter} onClick={() => window.open(tag.twitter!, "_blank", "noreferrer")}/>)
            }
        }
        return jsx
    }

    const pixivTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (tag.pixivTags?.[0]) {
            for (let i = 0; i < tag.pixivTags.slice(0, 5).length; i++) {
                jsx.push(<button className="tag-tooltip-pixtag-button" onClick={() => window.open(`https://www.pixiv.net/tags/${tag.pixivTags?.[i]}/artworks`, "_blank", "noreferrer")}>{tag.pixivTags[i]}</button>)
            }
        }
        if (jsx.length) {
            return <div className="tag-tooltip-pixtag-button-container">{jsx}</div>
        } else {
            return null
        }
    }

    const tagAliasJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (tag.aliases?.[0]) {
            for (let i = 0; i < tag.aliases.slice(0, 5).length; i++) {
                const item = tag.aliases[i]
                let alias = typeof item === "string" ? item : item?.alias 
                if (!alias) continue
                jsx.push(<button className="tag-tooltip-alias-button" onClick={(event) => searchTag(event, alias)}>{alias.replaceAll("-", " ")}</button>)
            }
        }
        if (jsx.length) {
            return <div className="tag-tooltip-alias-button-container">{jsx}</div>
        } else {
            return null
        }
    }

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLImageElement>) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const width = rect?.width
        const height = rect?.height
        const x = event.clientX - rect.x
        const y = event.clientY - rect.y
        const translateX = ((x / width) - 0.5) * 3
        const translateY = ((y / height) - 0.5) * 3
        ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.06)`
    }

    const cancelImageAnimation = (ref: React.RefObject<HTMLImageElement>) => {
        if (!ref.current) return
        ref.current.style.transform = "scale(1)"
    }

    const tagImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        const onImageLoad = (ref: React.RefObject<HTMLImageElement>)=> {
            if (!ref.current) return
            const landscape = ref.current.width <= ref.current.height
            if (landscape) {
                ref.current.style.width = `90px`
                ref.current.style.height = "auto"
            } else {
                ref.current.style.width = "auto"
                ref.current.style.height = `90px`
            }
        }
        if (items.length) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                jsx.push(
                    <div className="tag-tooltip-image-box" onMouseMove={(event) => imageAnimation(event, item.ref)} onMouseLeave={() => cancelImageAnimation(item.ref)}>
                        <img className="tag-tooltip-image" ref={item.ref} onClick={(event) => openPost(event, item.post)} src={item.image} onLoad={() => onImageLoad(item.ref)}/>
                    </div>
                )
            }
        }
        if (jsx.length) {
            return <div className="tag-tooltip-image-container">{jsx}</div>
        } else {
            return null
        }
    }

    useEffect(() => {
        for (let i = 0; i < items.length; i++) {
            const ref = items[i].ref
            if (!ref.current) continue
            ref.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        }
    }, [items, brightness, contrast, hue, saturation, blur])

    const tagInfo = (event: React.MouseEvent) => {
        if (!tag) return
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${tag.tag}`, "_blank")
        } else {
            history.push(`/tag/${tag.tag}`)
        }
        setTagToolTipEnabled(false)
    }

    const searchTag = (event: React.MouseEvent, alias?: string) => {
        if (!tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${alias ? alias : tag.tag}`, "_blank")
        } else {
            history.push("/posts")
            setSearch(alias ? alias : tag.tag)
            setSearchFlag(true)
        }
    }

    const openPost = (event: React.MouseEvent, post: PostSearch) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${post.postID}`, "_blank")
        } else {
            history.push(`/post/${post.postID}`)
        }
        setTagToolTipEnabled(false)
    }

    const getTagName = () => {
        if (!tag) return
        return functions.toProperCase(tag.tag.replaceAll("-", " "))
    }

    const getStyle = () => {
        if (typeof window === "undefined") return {}
        const constrainedTop = Math.max(0, Math.min(tagTooltipY - 300, window.innerHeight - 520))
        return {
            opacity: tagTooltipEnabled ? "1" : "0", 
            pointerEvents: tagTooltipEnabled ? "all" : "none",
            left: `${functions.sidebarWidth()}px`, 
            top: `${constrainedTop}px`
        } as React.CSSProperties
    }

    if (selectionMode) return null
    if (!tag) return null
    if (session?.username && !session?.showTagTooltips) return null
 
    return (
        <div className="tag-tooltip" style={getStyle()} onMouseEnter={() => {setHover(true); setTagToolTipEnabled(true)}} onMouseLeave={() => {setHover(false); setTagToolTipEnabled(false)}}>
            <div className="tag-tooltip-row">
                {tag.image ?
                <div className="tag-tooltip-img-container">
                    <img className="tag-tooltip-img" src={functions.getTagLink(tag.type, tag.image, tag.imageHash)}/>
                </div> : null}
                <span className={`tag-tooltip-heading ${functions.getTagColor(tag)}`} onClick={tagInfo} onAuxClick={tagInfo}>{getTagName()}</span>
                {tagSocialJSX()}
            </div>
            {pixivTagsJSX()}
            {tagAliasJSX()}
            <div className="tag-tooltip-row">
                <div className="tag-tooltip-text-container">
                    <span className="tag-tooltip-text">{jsxFunctions.renderCommentaryText(tag.description)}</span>
                </div>
            </div>
            {tagImagesJSX()}
        </div>
    )
}

export default TagToolTip