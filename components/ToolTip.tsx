import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SessionContext, EnableDragContext, ToolTipXContext, ToolTipYContext, ToolTipEnabledContext, ToolTipPostContext,
ToolTipImgContext, DownloadFlagContext, DownloadIDsContext, SelectionModeContext} from "../Context"
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
import tagIcon from "../assets/icons/tag.png"
import axios from "axios"

const ToolTip: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
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
        const result = await axios.get("/api/post/tags", {params: {postID: tooltipPost.postID}, withCredentials: true}).then((r) => r.data)
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
    }, [tooltipPost])

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
        if (tooltipPost.link?.includes("twitter") || tooltipPost.link?.includes("x.com")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(tooltipPost.link, "_blank")}/>)
        if (tooltipPost.mirrors) {
            if (tooltipPost.mirrors.pixiv) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={pixiv} onClick={() => window.open(tooltipPost.mirrors.pixiv, "_blank")}/>)
            if (tooltipPost.mirrors.twitter) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(tooltipPost.mirrors.twitter, "_blank")}/>)
            if (tooltipPost.mirrors.deviantart) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={deviantart} onClick={() => window.open(tooltipPost.mirrors.deviantart, "_blank")}/>)
            if (tooltipPost.mirrors.artstation) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={artstation} onClick={() => window.open(tooltipPost.mirrors.artstation, "_blank")}/>)
            if (tooltipPost.mirrors.danbooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={danbooru} onClick={() => window.open(tooltipPost.mirrors.danbooru, "_blank")}/>)
            if (tooltipPost.mirrors.gelbooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={gelbooru} onClick={() => window.open(tooltipPost.mirrors.gelbooru, "_blank")}/>)
            if (tooltipPost.mirrors.safebooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={safebooru} onClick={() => window.open(tooltipPost.mirrors.safebooru, "_blank")}/>)
            if (tooltipPost.mirrors.yandere) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={yandere} onClick={() => window.open(tooltipPost.mirrors.yandere, "_blank")}/>)
            if (tooltipPost.mirrors.konachan) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={konachan} onClick={() => window.open(tooltipPost.mirrors.konachan, "_blank")}/>)
        }
        return jsx
    }

    const copyTags = (removeDashes?: boolean, noCommas?: boolean) => {
        let tagArr = [artist.tag, ...tags.map((t: any) => t.tag)]
        if (removeDashes) tagArr = tagArr.map((t: any) => t.replaceAll("-", " "))
        navigator.clipboard.writeText(noCommas ? tagArr.join(" ") : tagArr.join(", "))
    }

    if (selectionMode) return null
    if (!artist || !tags || !tooltipPost) return null

    return (
        <div className="tooltip" style={getStyle()} onMouseEnter={() => setToolTipEnabled(true)} onMouseLeave={() => setToolTipEnabled(false)}>
            <div className="tooltip-row">
                <div className="tooltip-artist-container">
                    <img className="tooltip-img" src={functions.getTagLink(artist.type, artist.image)}/>
                    <span className="tooltip-artist-tag" style={{marginRight: "5px"}} onClick={() => window.open(artist.pixiv ? artist.pixiv : artist.twitter, "_blank")}>{artist.tag}</span>
                    <img className="tooltip-img-small" src={tagIcon} onClick={() => copyTags()} onAuxClick={() => copyTags(false, true)} onContextMenu={(event) => {event.preventDefault(); copyTags(true)}}/>
                </div>
                <div className="tooltip-artist-container">
                    <span className="tooltip-artist-tag" onClick={download}>{getImageDimensions()}</span>
                    {getPostLinkJSX()}
                </div>
            </div>
            <div className="tooltip-column" ref={scrollRef} style={{overflowY: "auto"}}>
                <div className="tooltip-tag-container">
                    <span className="tooltip-artist-tag">{tooltipPost.translatedTitle}</span>
                    <span className="tooltip-artist-tag">{functions.formatDate(new Date(tooltipPost.drawn))}</span>
                </div>
                <div className="tooltip-tag-container">
                    {getTagsJSX()}
                </div>
            </div>
        </div>
    )
}

export default ToolTip