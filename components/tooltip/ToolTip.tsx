import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useSessionSelector, useSessionActions, useSearchSelector, useSearchActions, useInteractionSelector, 
useFlagActions, useInteractionActions, useThemeSelector} from "../../store"
import functions from "../../structures/Functions"
import "./styles/tooltip.less"
import pixiv from "../../assets/icons/pixiv.png"
import twitter from "../../assets/icons/twitter.png"
import deviantart from "../../assets/icons/deviantart.png"
import artstation from "../../assets/icons/artstation.png"
import danbooru from "../../assets/icons/danbooru.png"
import gelbooru from "../../assets/icons/gelbooru.png"
import safebooru from "../../assets/icons/safebooru.png"
import yandere from "../../assets/icons/yandere.png"
import konachan from "../../assets/icons/konachan.png"
import zerochan from "../../assets/icons/zerochan.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import youtube from "../../assets/icons/youtube.png"
import bandcamp from "../../assets/icons/bandcamp.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import tagIcon from "../../assets/icons/tag.png"
import image from "../../assets/icons/image.png"
import animation from "../../assets/icons/animation.png"
import video from "../../assets/icons/video.png"
import comic from "../../assets/icons/comic.png"
import live2d from "../../assets/icons/live2d.png"
import model from "../../assets/icons/model.png"
import audio from "../../assets/icons/audio.png"
import cute from "../../assets/icons/cute.png"
import sexy from "../../assets/icons/sexy.png"
import ecchi from "../../assets/icons/ecchi.png"
import hentai from "../../assets/icons/hentai.png"
import $2d from "../../assets/icons/2d.png"
import $3d from "../../assets/icons/3d.png"
import pixel from "../../assets/icons/pixel.png"
import chibi from "../../assets/icons/chibi.png"
import daki from "../../assets/icons/daki.png"
import sketch from "../../assets/icons/sketch.png"
import lineart from "../../assets/icons/lineart.png"
import promo from "../../assets/icons/promo.png"
import {MiniTag} from "../../types/Types"

const ToolTip: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {selectionMode} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {setDownloadFlag, setDownloadIDs} = useFlagActions()
    const {tooltipX, tooltipY, tooltipEnabled, tooltipPost} = useInteractionSelector()
    const {setEnableDrag, setToolTipEnabled} = useInteractionActions()
    const [tags, setTags] = useState([] as MiniTag[])
    const [artist, setArtist] = useState(null as MiniTag | null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    const updateTags = async () => {
        if (session?.username && !session?.showTooltips) return
        if (!tooltipPost) return
        const result = await functions.get("/api/post/tags", {postID: tooltipPost.postID}, session, setSessionFlag)
        const artists = result.filter((t) => t.type === "artist")
        const characters = result.filter((t) => t.type === "character")
        const series = result.filter((t) => t.type === "series")
        const meta = result.filter((t) => t.type === "meta")
        const appearance = result.filter((t) => t.type === "appearance")
        const outfit = result.filter((t) => t.type === "outfit")
        const accessory = result.filter((t) => t.type === "accessory")
        const action = result.filter((t) => t.type === "action")
        const scenery = result.filter((t) => t.type === "scenery")
        const tags = result.filter((t) => t.type === "tag")
        setArtist(artists[0])
        setTags([...characters, ...series, ...meta, ...appearance, ...outfit, ...accessory, ...action, ...scenery, ...tags.reverse()])
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
        } as React.CSSProperties
    }

    const getTagsJSX = () => {
        let jsxMap = [] as React.ReactElement[]
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].type === "artist") {
                jsxMap.push(<span key={i} className="tooltip-tag-clickable">{tags[i].tag}</span>)
            } else if (tags[i].type === "character") {
                jsxMap.push(<span key={i} className="tooltip-tag character-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "series") {
                jsxMap.push(<span key={i} className="tooltip-tag series-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "meta") {
                jsxMap.push(<span key={i} className="tooltip-tag meta-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "appearance") {
                jsxMap.push(<span key={i} className="tooltip-tag appearance-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "outfit") {
                jsxMap.push(<span key={i} className="tooltip-tag outfit-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "accessory") {
                jsxMap.push(<span key={i} className="tooltip-tag accessory-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "action") {
                jsxMap.push(<span key={i} className="tooltip-tag action-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "scenery") {
                jsxMap.push(<span key={i} className="tooltip-tag scenery-tag-color">{tags[i].tag}</span>)
            } else {
                jsxMap.push(<span key={i} className="tooltip-tag">{tags[i].tag}</span>)
            }
        }
        return jsxMap
    }

    const download = () => {
        if (!tooltipPost) return
        setDownloadIDs([tooltipPost.postID])
        setDownloadFlag(true)
    }

    const openNewTab = async () => {
        if (!tooltipPost) return
        const postImage = tooltipPost.images[0]
        let img = ""
        if (session.upscaledImages) {
            img = functions.getImageLink(postImage, true)
        } else {
            img = functions.getImageLink(postImage)
        }
        const decrypted = await functions.decryptItem(img, session)
        window.open(decrypted, "_blank")
    }

    const getImageDimensions = () => {
        if (!tooltipPost) return
        return `${tooltipPost.images[0].width}x${tooltipPost.images[0].height}`
    }

    const getPostLinkJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tooltipPost) return jsx
        if (tooltipPost.source?.includes("pixiv")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={pixiv} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("soundcloud")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={soundcloud} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("sketchfab")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={sketchfab} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("twitter") || tooltipPost.source?.includes("x.com")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("deviantart")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={deviantart} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("artstation")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={artstation} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("danbooru")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={danbooru} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("yande.re")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={yandere} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("youtube")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={youtube} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.source?.includes("bandcamp")) jsx.push(<img key="source" className="tooltip-img" style={{cursor: "pointer"}} src={bandcamp} onClick={() => window.open(tooltipPost.source, "_blank")}/>)
        if (tooltipPost.mirrors) {
            if (tooltipPost.mirrors.pixiv) jsx.push(<img key="pixiv" className="tooltip-img" style={{cursor: "pointer"}} src={pixiv} onClick={() => window.open(tooltipPost.mirrors?.pixiv, "_blank")}/>)
            if (tooltipPost.mirrors.soundcloud) jsx.push(<img key="soundcloud"className="tooltip-img" style={{cursor: "pointer"}} src={soundcloud} onClick={() => window.open(tooltipPost.mirrors?.soundcloud, "_blank")}/>)
            if (tooltipPost.mirrors.sketchfab) jsx.push(<img key="sketchfab" className="tooltip-img" style={{cursor: "pointer"}} src={sketchfab} onClick={() => window.open(tooltipPost.mirrors?.sketchfab, "_blank")}/>)
            if (tooltipPost.mirrors.twitter) jsx.push(<img key="twitter" className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(tooltipPost.mirrors?.twitter, "_blank")}/>)
            if (tooltipPost.mirrors.deviantart) jsx.push(<img key="deviantart" className="tooltip-img" style={{cursor: "pointer"}} src={deviantart} onClick={() => window.open(tooltipPost.mirrors?.deviantart, "_blank")}/>)
            if (tooltipPost.mirrors.artstation) jsx.push(<img key="artstation" className="tooltip-img" style={{cursor: "pointer"}} src={artstation} onClick={() => window.open(tooltipPost.mirrors?.artstation, "_blank")}/>)
            if (tooltipPost.mirrors.danbooru) jsx.push(<img key="danbooru" className="tooltip-img" style={{cursor: "pointer"}} src={danbooru} onClick={() => window.open(tooltipPost.mirrors?.danbooru, "_blank")}/>)
            if (tooltipPost.mirrors.gelbooru) jsx.push(<img key="gelbooru" className="tooltip-img" style={{cursor: "pointer"}} src={gelbooru} onClick={() => window.open(tooltipPost.mirrors?.gelbooru, "_blank")}/>)
            if (tooltipPost.mirrors.safebooru) jsx.push(<img key="safebooru" className="tooltip-img" style={{cursor: "pointer"}} src={safebooru} onClick={() => window.open(tooltipPost.mirrors?.safebooru, "_blank")}/>)
            if (tooltipPost.mirrors.yandere) jsx.push(<img key="yandere" className="tooltip-img" style={{cursor: "pointer"}} src={yandere} onClick={() => window.open(tooltipPost.mirrors?.yandere, "_blank")}/>)
            if (tooltipPost.mirrors.konachan) jsx.push(<img key="konachan" className="tooltip-img" style={{cursor: "pointer"}} src={konachan} onClick={() => window.open(tooltipPost.mirrors?.konachan, "_blank")}/>)
            if (tooltipPost.mirrors.zerochan) jsx.push(<img key="zerochan" className="tooltip-img" style={{cursor: "pointer"}} src={zerochan} onClick={() => window.open(tooltipPost.mirrors?.zerochan, "_blank")}/>)
            if (tooltipPost.mirrors.youtube) jsx.push(<img key="youtube" className="tooltip-img" style={{cursor: "pointer"}} src={youtube} onClick={() => window.open(tooltipPost.mirrors?.youtube, "_blank")}/>)
            if (tooltipPost.mirrors.bandcamp) jsx.push(<img key="bandcamp" className="tooltip-img" style={{cursor: "pointer"}} src={bandcamp} onClick={() => window.open(tooltipPost.mirrors?.bandcamp, "_blank")}/>)
        }
        return jsx
    }

    const copyTags = (removeDashes?: boolean, commas?: boolean) => {
        let tagArr = [artist?.tag || "", ...tags.map((t) => t.tag)]
        if (removeDashes) tagArr = tagArr.map((t) => t.replaceAll("-", " "))
        navigator.clipboard.writeText(commas ? tagArr.join(", ") : tagArr.join(" "))
        //setActionBanner("copy-tags")
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

    const searchArtist = () => {
        if (history.location.pathname === "/" || history.location.pathname === "/posts") {
            setSearch(artist.tag)
            setSearchFlag(true)
        } else {
            history.push(`/tag/${artist.tag}`)
        }
    }

    const getTypeIcon = () => {
        if (tooltipPost.type === "image") return image
        if (tooltipPost.type === "comic") return comic
        if (tooltipPost.type === "animation") return animation
        if (tooltipPost.type === "video") return video
        if (tooltipPost.type === "audio") return audio
        if (tooltipPost.type === "model") return model
        if (tooltipPost.type === "live2d") return live2d
        return image
    }

    const getRatingIcon = () => {
        if (tooltipPost.rating === "cute") return cute
        if (tooltipPost.rating === "sexy") return sexy
        if (tooltipPost.rating === "ecchi") return ecchi
        if (tooltipPost.rating === "hentai") return hentai
        return cute
    }

    const getStyleIcon = () => {
        if (tooltipPost.style === "2d") return $2d
        if (tooltipPost.style === "3d") return $3d
        if (tooltipPost.style === "chibi") return chibi
        if (tooltipPost.style === "pixel") return pixel
        if (tooltipPost.style === "daki") return daki
        if (tooltipPost.style === "promo") return promo
        if (tooltipPost.style === "sketch") return sketch
        if (tooltipPost.style === "lineart") return lineart
        return $2d
    }

    const getIconStyle = (icon: string) => {
        if (icon === "hentai") return {filter: `hue-rotate(-10deg)`}
        if (icon === "sketch") return {filter: `hue-rotate(125deg)`}
        if (icon === "lineart") return {filter: `hue-rotate(125deg)`}
        return {filter: `hue-rotate(60deg)`}
    }
 
    return (
        <div className="tooltip" style={getStyle()} onMouseEnter={() => setToolTipEnabled(true)} onMouseLeave={() => setToolTipEnabled(false)}>
            <div className="tooltip-row">
                <div className="tooltip-artist-container">
                    <img className="tooltip-img" src={functions.getTagLink(artist.type, artist.image, artist.imageHash)}/>
                    <span className={`tooltip-tag-clickable ${tooltipPost?.hidden ? "strikethrough" : ""}`} style={{marginRight: "5px"}} onClick={searchArtist} onAuxClick={openArtist}>{artist.tag}</span>
                    <img className="tooltip-img-small" src={tagIcon} onClick={() => copyTags()} onContextMenu={(event) => {event.preventDefault(); copyTags(true, true)}}/>
                </div>
                <div className="tooltip-artist-container">
                    <span className={`tooltip-tag-clickable ${tooltipPost?.hidden ? "strikethrough" : ""}`} onClick={download} onAuxClick={openNewTab}>{getImageDimensions()}</span>
                    {getPostLinkJSX()}
                </div>
            </div>
            <div className="tooltip-column" ref={scrollRef} style={{overflowY: "auto"}}>
                <div className="tooltip-tag-container">
                    <span className={`tooltip-tag-text ${tooltipPost?.hidden ? "strikethrough" : ""}`}><img src={getTypeIcon()} className="tooltip-icon" style={getIconStyle(tooltipPost.type)}/>{tooltipPost.type}</span>
                    <span className={`tooltip-tag-text ${tooltipPost?.hidden ? "strikethrough" : ""}`}><img src={getRatingIcon()} className="tooltip-icon" style={getIconStyle(tooltipPost.rating)}/>{tooltipPost.rating}</span>
                    <span className={`tooltip-tag-text ${tooltipPost?.hidden ? "strikethrough" : ""}`}><img src={getStyleIcon()} className="tooltip-icon" style={getIconStyle(tooltipPost.style)}/>{tooltipPost.style}</span>
                </div>
                <div className="tooltip-tag-container">
                    <span className={`tooltip-tag-text ${tooltipPost?.hidden ? "strikethrough" : ""}`}>{tooltipPost.englishTitle || i18n.labels.noTitle}</span>
                    <span className={`tooltip-tag-text ${tooltipPost?.hidden ? "strikethrough" : ""}`}>{functions.formatDate(new Date(tooltipPost.posted))}</span>
                </div>
                <div className="tooltip-tag-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {getTagsJSX()}
                </div>
            </div>
        </div>
    )
}

export default ToolTip