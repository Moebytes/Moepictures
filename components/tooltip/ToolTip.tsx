/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import {useSessionSelector, useSessionActions, useSearchSelector, useSearchActions, useInteractionSelector, 
useFlagActions, useInteractionActions, useThemeSelector, useActiveActions, useLayoutSelector} from "../../store"
import functions from "../../functions/Functions"
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
import eshuushuu from "../../assets/icons/eshuushuu.png"
import animepictures from "../../assets/icons/animepictures.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import youtube from "../../assets/icons/youtube.png"
import bandcamp from "../../assets/icons/bandcamp.png"
import sketchfab from "../../assets/icons/sketchfab.png"

import tagIcon from "../../assets/svg/tags.svg"
import image from "../../assets/svg/image.svg"
import animation from "../../assets/svg/animation.svg"
import video from "../../assets/svg/video.svg"
import comic from "../../assets/svg/comic.svg"
import live2d from "../../assets/svg/live2d.svg"
import model from "../../assets/svg/model.svg"
import audio from "../../assets/svg/music.svg"
import cute from "../../assets/svg/cute.svg"
import sexy from "../../assets/svg/sexy.svg"
import erotic from "../../assets/svg/erotic.svg"
import lewd from "../../assets/svg/lewd.svg"
import $2d from "../../assets/svg/2d.svg"
import $3d from "../../assets/svg/3d.svg"
import pixel from "../../assets/svg/pixel.svg"
import chibi from "../../assets/svg/chibi.svg"
import daki from "../../assets/svg/daki.svg"
import sketch from "../../assets/svg/sketch.svg"
import lineart from "../../assets/svg/lineart.svg"
import promo from "../../assets/svg/promo.svg"
import {TagCount, PostFull} from "../../types/Types"
import "./styles/tooltip.less"

const ToolTip: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {selectionMode} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {setDownloadFlag, setDownloadIDs} = useFlagActions()
    const {tooltipX, tooltipY, tooltipEnabled, tooltipPost, postTooltipID} = useInteractionSelector()
    const {setEnableDrag, setToolTipEnabled, setToolTipPost, setPostTooltipID} = useInteractionActions()
    const {setActionBanner} = useActiveActions()
    const [post, setPost] = useState(null as PostFull | null)
    const [img, setImg] = useState("")
    const [tags, setTags] = useState([] as TagCount[])
    const [metaTags, setMetaTags] = useState([] as string[])
    const [artist, setArtist] = useState(null as TagCount | null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const location = useLocation()

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    const getRedIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--r18Color")
    }
    
    const getBlueIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sketchColor")
    }

    const updatePost = async () => {
        if (tooltipPost) setPost(tooltipPost)
        if (postTooltipID) {
            const post = await functions.http.get("/api/post", {postID: postTooltipID ?? ""}, session, setSessionFlag)
            if (post) {
                setPost(post)
                const image = post.images[0]
                const imageLink = typeof image === "string" ?
                    await functions.link.getPostThumbnail(post, 0, "medium", session, mobile) : 
                    functions.link.getThumbnailLink(image, "tiny", session, mobile)
                let img = await functions.crypto.decryptThumb(imageLink, session, imageLink, mobile)
                setImg(img)
            }
        }
        
    }

    useEffect(() => {
        setImg("")
        updatePost()
    }, [tooltipPost, postTooltipID, session])

    const updateTags = async () => {
        if (session?.username && !session?.showTooltips) return
        if (!post) return
        const result = await functions.tag.parseTags([post], session, setSessionFlag)
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
        setMetaTags(meta.map((t) => t.tag))
    }

    useEffect(() => {
        if (post) updateTags()
    }, [post, session])

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
            width: img ? "420px" : "325px",
            height: img ? "250px" : "175px",
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
                jsxMap.push(<span className="tooltip-tag-clickable">{tags[i].tag}</span>)
            } else if (tags[i].type === "character") {
                jsxMap.push(<span className="tooltip-tag character-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "series") {
                jsxMap.push(<span className="tooltip-tag series-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "meta") {
                jsxMap.push(<span className="tooltip-tag meta-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "appearance") {
                jsxMap.push(<span className="tooltip-tag appearance-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "outfit") {
                jsxMap.push(<span className="tooltip-tag outfit-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "accessory") {
                jsxMap.push(<span className="tooltip-tag accessory-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "action") {
                jsxMap.push(<span className="tooltip-tag action-tag-color">{tags[i].tag}</span>)
            } else if (tags[i].type === "scenery") {
                jsxMap.push(<span className="tooltip-tag scenery-tag-color">{tags[i].tag}</span>)
            } else {
                jsxMap.push(<span className="tooltip-tag">{tags[i].tag}</span>)
            }
        }
        return jsxMap
    }

    const download = () => {
        if (!post) return
        setDownloadIDs([post.postID])
        setDownloadFlag(true)
    }

    const openNewTab = async () => {
        if (!post) return
        const postImage = post.images[0]
        let img = ""
        if (session.upscaledImages) {
            img = functions.link.getImageLink(postImage, true)
        } else {
            img = functions.link.getImageLink(postImage)
        }
        const decrypted = await functions.crypto.decryptItem(img, session)
        window.open(decrypted, "_blank")
    }

    const getImageDimensions = () => {
        if (!post) return
        return `${post.images[0].width}x${post.images[0].height}`
    }

    const getPostLinkJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!post) return jsx
        if (post.source?.includes("pixiv")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={pixiv} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.source?.includes("soundcloud")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={soundcloud} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.source?.includes("sketchfab")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={sketchfab} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.source?.includes("twitter") || post.source?.includes("x.com")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.source?.includes("deviantart")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={deviantart} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.source?.includes("artstation")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={artstation} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.source?.includes("youtube")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={youtube} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.source?.includes("bandcamp")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={bandcamp} onClick={() => window.open(post.source, "_blank")}/>)
        //if (post.source?.includes("danbooru")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={danbooru} onClick={() => window.open(post.source, "_blank")}/>)
        //if (post.source?.includes("yande.re")) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={yandere} onClick={() => window.open(post.source, "_blank")}/>)
        if (post.mirrors) {
            if (post.mirrors.pixiv) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={pixiv} onClick={() => window.open(post.mirrors?.pixiv, "_blank")}/>)
            if (post.mirrors.soundcloud) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={soundcloud} onClick={() => window.open(post.mirrors?.soundcloud, "_blank")}/>)
            if (post.mirrors.sketchfab) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={sketchfab} onClick={() => window.open(post.mirrors?.sketchfab, "_blank")}/>)
            if (post.mirrors.twitter) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={twitter} onClick={() => window.open(post.mirrors?.twitter, "_blank")}/>)
            if (post.mirrors.deviantart) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={deviantart} onClick={() => window.open(post.mirrors?.deviantart, "_blank")}/>)
            if (post.mirrors.artstation) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={artstation} onClick={() => window.open(post.mirrors?.artstation, "_blank")}/>)
            if (post.mirrors.youtube) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={youtube} onClick={() => window.open(post.mirrors?.youtube, "_blank")}/>)
            if (post.mirrors.bandcamp) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={bandcamp} onClick={() => window.open(post.mirrors?.bandcamp, "_blank")}/>)
            //if (post.mirrors.danbooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={danbooru} onClick={() => window.open(post.mirrors?.danbooru, "_blank")}/>)
            //if (post.mirrors.gelbooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={gelbooru} onClick={() => window.open(post.mirrors?.gelbooru, "_blank")}/>)
            //if (post.mirrors.safebooru) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={safebooru} onClick={() => window.open(post.mirrors?.safebooru, "_blank")}/>)
            //if (post.mirrors.yandere) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={yandere} onClick={() => window.open(post.mirrors?.yandere, "_blank")}/>)
            //if (post.mirrors.konachan) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={konachan} onClick={() => window.open(post.mirrors?.konachan, "_blank")}/>)
            //if (post.mirrors.zerochan) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={zerochan} onClick={() => window.open(post.mirrors?.zerochan, "_blank")}/>)
            //if (post.mirrors.eshuushuu) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={eshuushuu} onClick={() => window.open(post.mirrors?.eshuushuu, "_blank")}/>)
            //if (post.mirrors.animepictures) jsx.push(<img className="tooltip-img" style={{cursor: "pointer"}} src={animepictures} onClick={() => window.open(post.mirrors?.animepictures, "_blank")}/>)
        }
        return jsx
    }

    const copyTags = async (event: React.MouseEvent) => {
        event.preventDefault()
        let combined = [artist?.tag || "", ...tags.map((t) => t.tag)]
        let commas = false
        let replaceDash = false 
        let danbooru = false
        if (event.shiftKey) {
            commas = false
            replaceDash = true
            danbooru = true
        } else if (event.button === 2) {
            commas = true
            replaceDash = true
        }
        let outTags = ""
        if (danbooru) {
            combined = combined.filter((t) => !metaTags.includes(t))
            if (combined.includes("solo")) combined.push("1girl")
            outTags = await functions.http.post("/api/misc/danboorutags", 
            {tags: combined.join(" ")}, session, setSessionFlag).then((r) => r.tags)
        } else {
            if (replaceDash) combined = combined.map((c: string) => c.replaceAll("-", " "))
            outTags = commas ? combined.join(", ") : combined.join(" ")
        }
        navigator.clipboard.writeText(outTags)
        setActionBanner("copy-tags")
    }

    if (selectionMode) return null
    if (!artist || !tags || !post) return null
    if (session?.username && !session?.showTooltips) return null

    const openArtist = () => {
        if (artist.social?.includes("pixiv.net")) return window.open(artist.social, "_blank")
        if (artist.social?.includes("soundcloud.com")) return window.open(artist.social, "_blank")
        if (artist.social?.includes("sketchfab.com")) return window.open(artist.social, "_blank")
        if (artist.twitter) return window.open(artist.twitter, "_blank")
    }

    const searchArtist = () => {
        if (location.pathname === "/" || location.pathname === "/posts") {
            setSearch(artist.tag)
            setSearchFlag(true)
        } else {
            navigate(`/tag/${encodeURIComponent(artist.tag)}`)
        }
    }

    const getTypeIcon = () => {
        if (post.type === "image") return getIcon(image)
        if (post.type === "comic") return getIcon(comic)
        if (post.type === "animation") return getIcon(animation)
        if (post.type === "video") return getIcon(video)
        if (post.type === "audio") return getIcon(audio)
        if (post.type === "model") return getIcon(model)
        if (post.type === "live2d") return getIcon(live2d)
        return image
    }

    const getRatingIcon = () => {
        if (post.rating === "cute") return getIcon(cute)
        if (post.rating === "sexy") return getIcon(sexy)
        if (post.rating === "erotic") return getIcon(erotic)
        if (post.rating === "lewd") return getRedIcon(lewd)
        return cute
    }

    const getStyleIcon = () => {
        if (post.style === "2d") return getIcon($2d)
        if (post.style === "3d") return getIcon($3d)
        if (post.style === "chibi") return getIcon(chibi)
        if (post.style === "pixel") return getIcon(pixel)
        if (post.style === "daki") return getIcon(daki)
        if (post.style === "promo") return getBlueIcon(promo)
        if (post.style === "sketch") return getBlueIcon(sketch)
        if (post.style === "lineart") return getBlueIcon(lineart)
        return getIcon($2d)
    }
 
    const imgClick = (event: React.MouseEvent) => {
        functions.post.openPost(post, event, navigate, session, setSessionFlag)
    }

    const closeTooltip = () => {
        setToolTipEnabled(false)
        setToolTipPost(null)
        setPostTooltipID(null)
    }

    return (
        <div className="tooltip" style={getStyle()} onMouseEnter={() => setToolTipEnabled(true)} onMouseLeave={closeTooltip}>
            <div className="tooltip-row">
                <div className="tooltip-artist-container">
                    <img className="tooltip-img" src={functions.link.getTagLink(artist.type, artist.image, artist.imageHash)}/>
                    <span className={`tooltip-tag-clickable ${post?.hidden ? "strikethrough" : ""}`} style={{marginRight: "5px"}} onClick={searchArtist} onAuxClick={openArtist}>{artist.tag}</span>
                    <img className="tooltip-img-small" src={getIcon(tagIcon)} onClick={copyTags} onContextMenu={copyTags}/>
                </div>
                <div className="tooltip-artist-container">
                    <span className={`tooltip-tag-clickable ${post?.hidden ? "strikethrough" : ""}`} onClick={download} onAuxClick={openNewTab}>{getImageDimensions()}</span>
                    {getPostLinkJSX()}
                </div>
            </div>
            <div className="tooltip-column" ref={scrollRef} style={{overflowY: "auto", flexDirection: img ? "row" : "column"}}>
                {img ? <div className="tooltip-column-container">
                        <img className="tooltip-image" src={img} onClick={imgClick} fetchPriority="high" draggable={false}/>
                </div> : null}
                <div className="tooltip-column-container">
                    <div className="tooltip-tag-container">
                        <span className={`tooltip-tag-text ${post?.hidden ? "strikethrough" : ""}`}><img src={getTypeIcon()} className="tooltip-icon"/>{post.type}</span>
                        <span className={`tooltip-tag-text ${post?.hidden ? "strikethrough" : ""}`}><img src={getRatingIcon()} className="tooltip-icon"/>{post.rating}</span>
                        <span className={`tooltip-tag-text ${post?.hidden ? "strikethrough" : ""}`}><img src={getStyleIcon()} className="tooltip-icon"/>{post.style}</span>
                    </div>
                    <div className="tooltip-tag-container">
                        <span className={`tooltip-tag-text ${post?.hidden ? "strikethrough" : ""}`}>{post.englishTitle || i18n.labels.noTitle}</span>
                        <span className={`tooltip-tag-text ${post?.hidden ? "strikethrough" : ""}`}>{functions.date.formatDate(new Date(post.posted))}</span>
                    </div>
                    <div className="tooltip-tag-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {getTagsJSX()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ToolTip