import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useSearchSelector, useSearchActions, useLayoutSelector} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import xIcon from "../assets/icons/x.png"
import image from "../assets/icons/image.png"
import animation from "../assets/icons/animation.png"
import video from "../assets/icons/video.png"
import comic from "../assets/icons/comic.png"
import cute from "../assets/icons/cute.png"
import sexy from "../assets/icons/sexy.png"
import ecchi from "../assets/icons/ecchi.png"
import hentai from "../assets/icons/hentai.png"
import $2d from "../assets/icons/2d.png"
import $3d from "../assets/icons/3d.png"
import pixel from "../assets/icons/pixel.png"
import chibi from "../assets/icons/chibi.png"
import daki from "../assets/icons/daki.png"
import sketch from "../assets/icons/sketch.png"
import lineart from "../assets/icons/lineart.png"
import promo from "../assets/icons/promo.png"
import audio from "../assets/icons/audio.png"
import model from "../assets/icons/model.png"
import live2d from "../assets/icons/live2d.png"
import SearchSuggestions from "../components/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import "./styles/dialog.less"
import {PostType, PostRating, PostStyle, PostQuickEditParams, PostSearch} from "../types/Types"

const BulkTagEditDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {showBulkTagEditDialog} = usePostDialogSelector()
    const {setShowBulkTagEditDialog} = usePostDialogActions()
    const {selectionMode, selectionItems, selectionPosts} = useSearchSelector()
    const {setSelectionMode} = useSearchActions()
    const {mobile} = useLayoutSelector()
    const [type, setType] = useState("x")
    const [rating, setRating] = useState("x")
    const [style, setStyle] = useState("x")
    const [artists, setArtists] = useState("")
    const [characters, setCharacters] = useState("")
    const [series, setSeries] = useState("")
    const [metaTags, setMetaTags] = useState("")
    const [appendTags, setAppendTags] = useState("")
    const [artistsActive, setArtistsActive] = useState(false)
    const [charactersActive, setCharactersActive] = useState(false)
    const [seriesActive, setSeriesActive] = useState(false)
    const [metaActive, setMetaActive] = useState(false)
    const [tagActive, setTagActive] = useState(false)
    const [posX, setPosX] = useState(0)
    const [posY, setPosY] = useState(0)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const tagRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    const reset = () => {
        setArtists("")
        setCharacters("")
        setSeries("")
        setMetaTags("")
        setAppendTags("")
    }

    useEffect(() => {
        const logPosition = (event: MouseEvent) => {
            const element = document.querySelector(".dialog-box")
            if (!element) return
            const rect = element.getBoundingClientRect()
            setPosX(event.clientX - rect.left - 10)
            setPosY(event.clientY - rect.top + 10)
        }
        window.addEventListener("mousemove", logPosition)
        return () => {
            window.removeEventListener("mousemove", logPosition)
        }
    }, [])

    useEffect(() => {
        document.title = i18n.dialogs.bulkTagEdit.title
    }, [i18n])

    useEffect(() => {
        if (showBulkTagEditDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            reset()
        }
    }, [showBulkTagEditDialog])

    const bulkQuickEdit = async () => {
        if (!permissions.isAdmin(session)) return setShowBulkTagEditDialog(false)
        if (!selectionMode) return setShowBulkTagEditDialog(false)
        if (!artists?.trim() && !characters?.trim() && !series?.trim() && !metaTags?.trim() && !appendTags?.trim()
        && type === "x" && rating === "x" && style === "x") return setShowBulkTagEditDialog(false)
        let promiseArray = [] as Promise<PostQuickEditParams>[]
        for (const postID of selectionItems.values()) {
            const promise = new Promise<PostQuickEditParams>(async (resolve) => {
                const post = selectionPosts.get(String(postID)) as PostSearch
                const parsedTags = await functions.parseTagsSingle(post, session, setSessionFlag)
                const tagCategories = await functions.tagCategories(parsedTags, session, setSessionFlag, true)

                let artistData = tagCategories.artists.map((a) => a.tag)
                let characterData = tagCategories.characters.map((c) => c.tag)
                let seriesData = tagCategories.series.map((s) => s.tag)
                let tagData = tagCategories.tags.map((t) => t.tag)

                if (functions.cleanHTML(artists)?.trim()) {
                    artistData = functions.cleanHTML(artists).trim().split(/[\n\r\s]+/g)
                }
                if (functions.cleanHTML(characters)?.trim()) {
                    characterData = functions.cleanHTML(characters).trim().split(/[\n\r\s]+/g)
                }
                if (functions.cleanHTML(series)?.trim()) {
                    seriesData = functions.cleanHTML(series).trim().split(/[\n\r\s]+/g)
                }
                if (functions.cleanHTML(metaTags)?.trim()) {
                    tagData = functions.removeDuplicates([...tagData, ...functions.cleanHTML(metaTags).trim().split(/[\n\r\s]+/g)])
                }
                
                if (functions.cleanHTML(appendTags)?.trim()) {
                    const appendData = functions.cleanHTML(appendTags).trim().split(/[\n\r\s]+/g)
                    let toAppend = [] as string[]
                    let toRemove = [] as string[]
                    for (const tag of appendData) {
                        if (tag.startsWith("-")) {
                            toRemove.push(tag.replace("-", ""))
                        } else {
                            toAppend.push(tag.startsWith("+") ? tag.replace("+", "") : tag)
                        }
                    }
                    const tagSet = new Set(tagData)
                    toAppend.forEach(tag => tagSet.add(tag))
                    toRemove.forEach(tag => tagSet.delete(tag))
                    tagData = Array.from(tagSet)
                }

                const data = {
                    postID: postID,
                    unverified: false,
                    type: type === "x" ? post.type : type as PostType,
                    rating: rating === "x" ? post.rating : rating as PostRating,
                    style: style === "x" ? post.style : style as PostStyle,
                    artists: artistData,
                    characters: characterData,
                    series: seriesData,
                    tags: tagData,
                    reason: ""
                }
                resolve(data)
            })
            promiseArray.push(promise)
        }
        await Promise.all(promiseArray)
        for (let i = 0; i < promiseArray.length; i++) {
            const data = await promiseArray[i]
            functions.put("/api/post/quickedit", data, session, setSessionFlag)
        }
        setShowBulkTagEditDialog(false)
        setSelectionMode(false)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            bulkQuickEdit()
        } else {
            setShowBulkTagEditDialog(false)
        }
    }

    useEffect(() => {
        const tagX = posX
        const tagY = posY
        setTagX(tagX)
        setTagY(tagY)
    }, [artists, characters, series, metaTags, appendTags])

    useEffect(() => {
        if (artistsActive || charactersActive || seriesActive || metaActive || tagActive) {
            const tagX = posX
            const tagY = posY
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [artistsActive, charactersActive, seriesActive, metaActive, tagActive])

    const handleArtistClick = (tag: string) => {
        setArtists((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const handleCharacterClick = (tag: string) => {
        setCharacters((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }
    
    const handleSeriesClick = (tag: string) => {
        setSeries((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const handleMetaClick = (tag: string) => {
        setMetaTags((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const handleTagClick = (tag: string) => {
        setAppendTags((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const getStyleJSX = () => {
        if (type === "model") {
            return (
                <div className="dialog-row">
                    <button style={{padding: "7px 7px"}} className={`quickedit-button ${style === "x" ? "button-selected" : ""}`} onClick={() => setStyle("x")}>
                        <img className="quickedit-button-img" src={xIcon}/>
                    </button>
                    <button className={`quickedit-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <img className="quickedit-button-img" src={$3d}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["3d"]}</span>
                    </button>
                    <button className={`quickedit-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="quickedit-button-img" src={chibi}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.chibi}</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="quickedit-button-img" src={pixel}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                </div>
            )
        } else if (type === "audio") {
            return (
                <div className="dialog-row">
                    <button style={{padding: "7px 7px"}} className={`quickedit-button ${style === "x" ? "button-selected" : ""}`} onClick={() => setStyle("x")}>
                        <img className="quickedit-button-img" src={xIcon}/>
                    </button>
                    <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <img className="quickedit-button-img" src={$2d}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["2d"]}</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="quickedit-button-img" src={pixel}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                    <button className={`quickedit-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                        <img className="quickedit-button-img" src={sketch}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.sketch}</span>
                    </button>
                </div>
            )
        } else {
            return (
                <>
                <div className="dialog-row">
                    <button style={{padding: "7px 7px"}} className={`quickedit-button ${style === "x" ? "button-selected" : ""}`} onClick={() => setStyle("x")}>
                        <img className="quickedit-button-img" src={xIcon}/>
                    </button>
                    <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <img className="quickedit-button-img" src={$2d}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["2d"]}</span>
                    </button>
                    {type !== "live2d" ? <button className={`quickedit-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <img className="quickedit-button-img" src={$3d}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["3d"]}</span>
                    </button> : null}
                    <button className={`quickedit-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="quickedit-button-img" src={chibi}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.chibi}</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="quickedit-button-img" src={pixel}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                    {type !== "comic" ? 
                    <button className={`quickedit-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                        <img className="quickedit-button-img" src={daki}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.daki}</span>
                    </button> : null}
                </div>
                <div className="dialog-row">
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                        <img className="quickedit-button-img" src={sketch}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.sketch}</span>
                    </button> : null}
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                        <img className="quickedit-button-img" src={lineart}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.lineart}</span>
                    </button> : null}
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "promo" ? "button-selected" : ""}`} onClick={() => setStyle("promo")}>
                        <img className="quickedit-button-img" src={promo}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.promo}</span>
                    </button> : null}
                </div>
                </>
            )
        }
    }

    useEffect(() => {
        if (type === "comic") {
            if (style === "daki") setStyle("2d")
        } else if (type === "model") {
            if (style === "2d" || style === "daki" || style === "sketch" || style === "lineart" || style === "promo") setStyle("3d")
        } else if (type === "live2d") {
            if (style === "3d" || style === "sketch" || style === "lineart" || style === "promo") setStyle("2d")
        } else if (type === "audio") {
            if (style === "3d" || style === "chibi" || style === "daki" || style === "lineart" || style === "promo") setStyle("2d")
        }
    }, [type, style])

    const mainJSX = () => {
        return (
            <>
            {mobile ? <>
            <div className="dialog-row">
                <button style={{padding: "7px 7px"}} className={`quickedit-button ${type === "x" ? "button-selected" : ""}`} onClick={() => setType("x")}>
                    <img className="quickedit-button-img" src={xIcon}/>
                </button>
                <button className={`quickedit-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <img className="quickedit-button-img" src={image}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`quickedit-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <img className="quickedit-button-img" src={animation}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.animation}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <img className="quickedit-button-img" src={video}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <img className="quickedit-button-img" src={comic}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.comic}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <img className="quickedit-button-img" src={audio}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`quickedit-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <img className="quickedit-button-img" src={live2d}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.live2d}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <img className="quickedit-button-img" src={model}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div>
            </> : <>
            <div className="dialog-row">
                <button style={{padding: "7px 7px"}} className={`quickedit-button ${type === "x" ? "button-selected" : ""}`} onClick={() => setType("x")}>
                    <img className="quickedit-button-img" src={xIcon}/>
                </button>
                <button className={`quickedit-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <img className="quickedit-button-img" src={image}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`quickedit-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <img className="quickedit-button-img" src={animation}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.animation}</span>
                </button>
                <button className={`quickedit-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <img className="quickedit-button-img" src={video}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <img className="quickedit-button-img" src={comic}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.comic}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <img className="quickedit-button-img" src={audio}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`quickedit-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <img className="quickedit-button-img" src={live2d}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.live2d}</span>
                </button>
                <button className={`quickedit-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <img className="quickedit-button-img" src={model}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div> </>}
            {mobile ? <>
            <div className="dialog-row">
                <button style={{padding: "7px 7px"}} className={`quickedit-button ${rating === "x" ? "button-selected" : ""}`} onClick={() => setRating("x")}>
                    <img className="quickedit-button-img" src={xIcon}/>
                </button>
                <button className={`quickedit-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <img className="quickedit-button-img" src={cute}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`quickedit-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <img className="quickedit-button-img" src={sexy}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`quickedit-button ${rating === "ecchi" ? "button-selected" : ""}`} onClick={() => setRating("ecchi")}>
                    <img className="quickedit-button-img" src={ecchi}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.ecchi}</span>
                </button>
            </div>
            <div className="dialog-row">
                {session.showR18 ?
                <button className={`quickedit-button ${rating === "hentai" ? "button-selected" : ""}`} onClick={() => setRating("hentai")}>
                    <img className="quickedit-button-img" src={hentai}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.hentai}</span>
                </button> : null}
            </div>
            </> : <>
            <div className="dialog-row">
                <button style={{padding: "7px 7px"}} className={`quickedit-button ${rating === "x" ? "button-selected" : ""}`} onClick={() => setRating("x")}>
                    <img className="quickedit-button-img" src={xIcon}/>
                </button>
                <button className={`quickedit-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <img className="quickedit-button-img" src={cute}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`quickedit-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <img className="quickedit-button-img" src={sexy}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`quickedit-button ${rating === "ecchi" ? "button-selected" : ""}`} onClick={() => setRating("ecchi")}>
                    <img className="quickedit-button-img" src={ecchi}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.ecchi}</span>
                </button>
                {session.showR18 ?
                <button className={`quickedit-button ${rating === "hentai" ? "button-selected" : ""}`} onClick={() => setRating("hentai")}>
                    <img className="quickedit-button-img" src={hentai}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.hentai}</span>
                </button> : null}
            </div>
            </>}
            {getStyleJSX()}
            <div className="dialog-row">
                <SearchSuggestions active={artistsActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(artists)} click={(tag) => handleArtistClick(tag)} type="artist"/>
                <span className="dialog-text">{i18n.navbar.artists}: </span>
                <input className="dialog-input artist-tag-color" type="text" spellCheck={false} value={artists} onChange={(event) => setArtists(event.target.value)} onFocus={() => setArtistsActive(true)} onBlur={() => setArtistsActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(characters)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                <span className="dialog-text">{i18n.navbar.characters}: </span>
                <input className="dialog-input character-tag-color" type="text" spellCheck={false} value={characters} onChange={(event) => setCharacters(event.target.value)} onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(series)} click={(tag) => handleSeriesClick(tag)} type="series"/>
                <span className="dialog-text">{i18n.tag.series}: </span>
                <input className="dialog-input series-tag-color" type="text" spellCheck={false} value={series} onChange={(event) => setSeries(event.target.value)} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={metaActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(metaTags)} click={(tag) => handleMetaClick(tag)} type="meta"/>
                <span className="dialog-text">{i18n.tag.meta}: </span>
                <input className="dialog-input meta-tag-color" type="text" spellCheck={false} value={metaTags} onChange={(event) => setMetaTags(event.target.value)} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.pages.bulkUpload.appendTags}: </span>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={tagActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(appendTags)} click={(tag) => handleTagClick(tag)} type="tag"/>
                <ContentEditable innerRef={tagRef} className="dialog-textarea" style={{height: "140px"}} spellCheck={false} html={appendTags} onChange={(event) => setAppendTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
            </div>
            </>
        )
    }

    if (showBulkTagEditDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.bulkTagEdit.title}</span>
                        </div>
                        {mainJSX()}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.bulkEdit}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default BulkTagEditDialog