import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SessionContext, EnableDragContext, ToolTipXContext, ToolTipYContext, ToolTipEnabledContext, ToolTipPostContext,
ToolTipImgContext, DownloadFlagContext, DownloadIDsContext, SelectionModeContext, SessionFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import "./styles/tooltip.less"
import pixiv from "../assets/icons/pixiv.png"
import twitter from "../assets/icons/twitter.png"
import deviantart from "../assets/icons/deviantart.png"
import artstation from "../assets/icons/artstation.png"
import danbooru from "../assets/icons/danbooru.png"
import gelbooru from "../assets/icons/gelbooru.png"
import safebooru from "../assets/icons/safebooru.png"
import yandere from "../assets/icons/yandere.png"
import konachan from "../assets/icons/konachan.png"
import soundcloud from "../assets/icons/soundcloud.png"
import youtube from "../assets/icons/youtube.png"
import bandcamp from "../assets/icons/bandcamp.png"
import sketchfab from "../assets/icons/sketchfab.png"
import tagIcon from "../assets/icons/tag.png"

const ToolTip: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadIDs, setDownloadIDs} = useContext(DownloadIDsContext)
    const {tooltipX, setToolTipX} = useContext(ToolTipXContext)
    const {tooltipY, setToolTipY} = useContext(ToolTipYContext)
    const {tooltipEnabled, setToolTipEnabled} = useContext(ToolTipEnabledContext)
    const {tooltipPost, setToolTipPost} = useContext(ToolTipPostContext)
    const {tooltipImg, setToolTipImg} = useContext(ToolTipImgContext)
    const {selectionMode, setSelectionMode} = useContext(SelectionModeContext)
    const [tags, setTags] = useState(null) as any
    const [artist, setArtist] = useState(null) as any
    const scrollRef = useRef(null) as any
    const history = useHistory()

    const updateTags = async () => {
        const result = await functions.get("/api/post/tags", {postID: tooltipPost.postID}, session, setSessionFlag)
        const artists = result.tags.filter((t: any) => t.type === "artist")
        const characters = result.tags.filter((t: any) => t.type === "character")
        const series = result.tags.filter((t: any) => t.type === "series")
        const meta = result.tags.filter((t: any) => t.type === "meta")
        const tags = result.tags.filter((t: any) => t.type === "tag")
        setArtist(artists[0])
        setTags([...characters, ...series, ...meta, ...tags.reverse()])
    }

    useEffect(() => {
        if (tooltipPost) updateTags()
    }, [tooltipPost, session])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0
    }, [tags])

    useEffect(() => {
        const scrollHandler = async () => {
            setToolTipEnabled(false)
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [])

    const getStyle = () => {
        return {
            opacity: tooltipEnabled ? "1" : "0", 
            pointerEvents: tooltipEnabled ? "all" : "none",
            left: `${tooltipX}px`, 
            top: `${tooltipY}px`
        } as any
    }

    const getTagsJSX = () => {
        let jsxMap = [] as any
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].type === "artist") {
                jsxMap.push(<span className="tooltip-artist-tag">{tags[i].tag}</span>)
            } else if (tags[i].type === "character") {
                jsxMap.push(<span className="tooltip-character-tag">{tags[i].tag}</span>)
            } else if (tags[i].type === "series") {
                jsxMap.push(<span className="tooltip-series-tag">{tags[i].tag}</span>)
            } else if (tags[i].type === "meta") {
                jsxMap.push(<span className="tooltip-meta-tag">{tags[i].tag}</span>)
            } else {
                jsxMap.push(<span className="tooltip-tag">{tags[i].tag}</span>)
            }
        }
        return jsxMap
    }

    const download = () => {
        setDownloadIDs([tooltipPost.postID])
        setDownloadFlag(true)
    }

    const getImageDimensions = () => {
        return `${tooltipPost.images[0].width}x${tooltipPost.images[0].height}`
    }

    const getPostLinkJSX = () => {
        let jsx = [] as any
        if (tooltipPost.link?.includes("pixiv")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={pixiv} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("soundcloud")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={soundcloud} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("sketchfab")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={sketchfab} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("twitter") || tooltipPost.link?.includes("x.com")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("deviantart")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={deviantart} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("artstation")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={artstation} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("danbooru")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={danbooru} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("yande.re")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={yandere} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("youtube")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={youtube} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.link?.includes("bandcamp")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={bandcamp} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.mirrors) {
            if (tooltipPost.mirrors.pixiv) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={pixiv} onClick={() => window.open(tooltipPost.mirrors.pixiv, "_blank")}/>)
            if (tooltipPost.mirrors.soundcloud) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={soundcloud} onClick={() => window.open(tooltipPost.mirrors.soundcloud, "_blank")}/>)
            if (tooltipPost.mirrors.sketchfab) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={sketchfab} onClick={() => window.open(tooltipPost.mirrors.sketchfab, "_blank")}/>)
            if (tooltipPost.mirrors.twitter) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(tooltipPost.mirrors.twitter, "_blank")}/>)
            if (tooltipPost.mirrors.deviantart) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={deviantart} onClick={() => window.open(tooltipPost.mirrors.deviantart, "_blank")}/>)
            if (tooltipPost.mirrors.artstation) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={artstation} onClick={() => window.open(tooltipPost.mirrors.artstation, "_blank")}/>)
            if (tooltipPost.mirrors.danbooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={danbooru} onClick={() => window.open(tooltipPost.mirrors.danbooru, "_blank")}/>)
            if (tooltipPost.mirrors.gelbooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={gelbooru} onClick={() => window.open(tooltipPost.mirrors.gelbooru, "_blank")}/>)
            if (tooltipPost.mirrors.safebooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={safebooru} onClick={() => window.open(tooltipPost.mirrors.safebooru, "_blank")}/>)
            if (tooltipPost.mirrors.yandere) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={yandere} onClick={() => window.open(tooltipPost.mirrors.yandere, "_blank")}/>)
            if (tooltipPost.mirrors.konachan) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={konachan} onClick={() => window.open(tooltipPost.mirrors.konachan, "_blank")}/>)
            if (tooltipPost.mirrors.youtube) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={youtube} onClick={() => window.open(tooltipPost.mirrors.youtube, "_blank")}/>)
            if (tooltipPost.mirrors.bandcamp) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={bandcamp} onClick={() => window.open(tooltipPost.mirrors.bandcamp, "_blank")}/>)
        }
        return jsx
    }

    const copyTags = (removeDashes?: boolean, commas?: boolean) => {
        let tagArr = [artist.tag, ...tags.map((t: any) => t.tag)]
        if (removeDashes) tagArr = tagArr.map((t: any) => t.replaceAll("-", " "))
        navigator.clipboard.writeText(commas ? tagArr.join(", ") : tagArr.join(" "))
    }

    if (selectionMode) return null
    if (!artist || !tags || !tooltipPost) return null
    if (session?.username && !session?.showTooltips) return null

    const openArtist = () => {
        if (artist.social?.includes("pixiv.net")) return window.open(artist.social, "_blank")
        if (artist.social?.includes("soundcloud.com")) return window.open(artist.social, "_blank")
        if (artist.social?.includes("sketchfab.com")) return window.open(artist.social, "_blank")
        if (artist.twitter) return window.open(artist.twitter, "_blank")
    }
 
    return (
        <div className="tooltip" style={getStyle()} onMouseEnter={() => setToolTipEnabled(true)} onMouseLeave={() => setToolTipEnabled(false)}>
            <div className="tooltip-row">
                <div className="tooltip-artist-container">
                    <img className="tooltip-img" src={functions.getTagLink(artist.type, artist.image)}/>
                    <span className={`tooltip-artist-tag ${tooltipPost?.hidden ? "strikethrough" : ""}`} style={{marginRight: "5px"}} onClick={openArtist}>{artist.tag}</span>
                    <img className="tooltip-img-small" src={tagIcon} onClick={() => copyTags()} onContextMenu={(event) => {event.preventDefault(); copyTags(true, true)}}/>
                </div>
                <div className="tooltip-artist-container">
                    <span className={`tooltip-artist-tag ${tooltipPost?.hidden ? "strikethrough" : ""}`} onClick={download}>{getImageDimensions()}</span>
                    {getPostLinkJSX()}
                </div>
            </div>
            <div className="tooltip-column" ref={scrollRef} style={{overflowY: "auto"}}>
                <div className="tooltip-tag-container">
                    <span className={`tooltip-artist-tag ${tooltipPost?.hidden ? "strikethrough" : ""}`}>{tooltipPost.translatedTitle}</span>
                    <span className={`tooltip-artist-tag ${tooltipPost?.hidden ? "strikethrough" : ""}`}>{functions.formatDate(new Date(tooltipPost.drawn))}</span>
                </div>
                <div className="tooltip-tag-container">
                    {getTagsJSX()}
                </div>
            </div>
        </div>
    )
}

export default ToolTip