/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useSearchSelector, useSearchActions, useLayoutSelector} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import XIcon from "../../assets/svg/x-button.svg"

import ImageIcon from "../../assets/svg/image.svg"
import AnimationIcon from "../../assets/svg/animation.svg"
import VideoIcon from "../../assets/svg/video.svg"
import ComicIcon from "../../assets/svg/comic.svg"
import Live2dIcon from "../../assets/svg/live2d.svg"
import ModelIcon from "../../assets/svg/model.svg"
import AudioIcon from "../../assets/svg/music.svg"

import CuteIcon from "../../assets/svg/cute.svg"
import SexyIcon from "../../assets/svg/sexy.svg"
import EroticIcon from "../../assets/svg/erotic.svg"
import LewdIcon from "../../assets/svg/lewd.svg"

import $2dIcon from "../../assets/svg/2d.svg"
import $3dIcon from "../../assets/svg/3d.svg"
import PixelIcon from "../../assets/svg/pixel.svg"
import ChibiIcon from "../../assets/svg/chibi.svg"
import DakiIcon from "../../assets/svg/daki.svg"
import SketchIcon from "../../assets/svg/sketch.svg"
import LineartIcon from "../../assets/svg/lineart.svg"
import PromoIcon from "../../assets/svg/promo.svg"

import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import {PostType, PostRating, PostStyle, PostQuickEditParams, PostSearch} from "../../types/Types"
import "../dialog.less"

let caretPosition = 0

const BulkTagEditDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {showBulkTagEditDialog} = usePostDialogSelector()
    const {setShowBulkTagEditDialog} = usePostDialogActions()
    const {selectionMode, selectionItems, selectionPosts} = useSearchSelector()
    const {setSelectionMode, setSelectionItems, setSelectionPosts} = useSearchActions()
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
    const errorRef = useRef<HTMLSpanElement>(null!)
    const artistRef = useRef<HTMLInputElement>(null!)
    const characterRef = useRef<HTMLInputElement>(null!)
    const seriesRef = useRef<HTMLInputElement>(null!)
    const metaRef = useRef<HTMLInputElement>(null!)
    const tagRef = useRef<HTMLDivElement>(null!)
    const controls = useDragControls()

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
        if (showBulkTagEditDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
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
                const parsedTags = await functions.tag.parseTags([post], session, setSessionFlag)
                const tagCategories = await functions.tag.tagCategories(parsedTags, session, setSessionFlag)

                let artistData = tagCategories.artists.map((a) => a.tag)
                let characterData = tagCategories.characters.map((c) => c.tag)
                let seriesData = tagCategories.series.map((s) => s.tag)
                let tagData = [...tagCategories.tags.map((t) => t.tag), ...tagCategories.meta.map((m) => m.tag)]

                if (functions.util.cleanHTML(artists)?.trim()) {
                    artistData = functions.util.cleanHTML(artists).trim().split(/[\n\r\s]+/g)
                }
                if (functions.util.cleanHTML(characters)?.trim()) {
                    characterData = functions.util.cleanHTML(characters).trim().split(/[\n\r\s]+/g)
                }
                if (functions.util.cleanHTML(series)?.trim()) {
                    seriesData = functions.util.cleanHTML(series).trim().split(/[\n\r\s]+/g)
                }

                const metaData = functions.util.cleanHTML(metaTags).trim().split(/[\n\r\s]+/g)
                const appendData = functions.util.cleanHTML(appendTags).trim().split(/[\n\r\s]+/g)
                let combinedData = [...metaData, ...appendData]

                let toAppend = [] as string[]
                let toRemove = [] as string[]
                for (const tag of combinedData) {
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
        setShowBulkTagEditDialog(false)
        setSelectionMode(false)
        selectionItems.clear()
        selectionPosts.clear()
        setSelectionItems(selectionItems)
        setSelectionPosts(selectionPosts)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
        await Promise.all(promiseArray)
        for (let i = 0; i < promiseArray.length; i++) {
            const data = await promiseArray[i]
            await functions.http.put("/api/post/quickedit", data, session, setSessionFlag)
        }
        functions.cache.clearCache()
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
            const parts = functions.util.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const handleCharacterClick = (tag: string) => {
        setCharacters((prev: string) => {
            const parts = functions.util.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }
    
    const handleSeriesClick = (tag: string) => {
        setSeries((prev: string) => {
            const parts = functions.util.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const handleMetaClick = (tag: string) => {
        setMetaTags((prev: string) => {
            const parts = functions.util.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const setCaretPosition = () => {
        if (!tagRef.current) return
        const selection = window.getSelection()!
        if (!selection.rangeCount) return
        var range = selection.getRangeAt(0)
        var preCaretRange = range.cloneRange()
        preCaretRange.selectNodeContents(tagRef.current!)
        preCaretRange.setEnd(range.endContainer, range.endOffset)
        caretPosition = preCaretRange.toString().length
    }

    const handleTagClick = (tag: string) => {
        setAppendTags((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    const getStyleJSX = () => {
        if (type === "model") {
            return (
                <div className="dialog-row">
                    <button style={{padding: "7px 7px"}} className={`quickedit-button ${style === "x" ? "button-selected" : ""}`} onClick={() => setStyle("x")}>
                        <XIcon className="quickedit-button-img"/>
                    </button>
                    <button className={`quickedit-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <$3dIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["3d"]}</span>
                    </button>
                    <button className={`quickedit-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <ChibiIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.chibi}</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <PixelIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                </div>
            )
        } else if (type === "audio") {
            return (
                <div className="dialog-row">
                    <button style={{padding: "7px 7px"}} className={`quickedit-button ${style === "x" ? "button-selected" : ""}`} onClick={() => setStyle("x")}>
                        <XIcon className="quickedit-button-img"/>
                    </button>
                    <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <$2dIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["2d"]}</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <PixelIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                    <button className={`quickedit-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                        <SketchIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.sketch}</span>
                    </button>
                </div>
            )
        } else {
            return (
                <>
                <div className="dialog-row">
                    <button style={{padding: "7px 7px"}} className={`quickedit-button ${style === "x" ? "button-selected" : ""}`} onClick={() => setStyle("x")}>
                        <XIcon className="quickedit-button-img"/>
                    </button>
                    <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <$2dIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["2d"]}</span>
                    </button>
                    {type !== "live2d" ? <button className={`quickedit-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <$3dIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style["3d"]}</span>
                    </button> : null}
                    <button className={`quickedit-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <ChibiIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.chibi}</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <PixelIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                    {type !== "comic" ? 
                    <button className={`quickedit-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                        <DakiIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.daki}</span>
                    </button> : null}
                </div>
                <div className="dialog-row">
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "promo" ? "button-selected" : ""}`} onClick={() => setStyle("promo")}>
                        <PromoIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.promo}</span>
                    </button> : null}
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                        <SketchIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.sketch}</span>
                    </button> : null}
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                        <LineartIcon className="quickedit-button-img"/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.lineart}</span>
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
                    <XIcon className="quickedit-button-img"/>
                </button>
                <button className={`quickedit-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <ImageIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`quickedit-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <AnimationIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.animation}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <VideoIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <ComicIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.comic}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <AudioIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`quickedit-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <Live2dIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.live2d}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <ModelIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div>
            </> : <>
            <div className="dialog-row">
                <button style={{padding: "7px 7px"}} className={`quickedit-button ${type === "x" ? "button-selected" : ""}`} onClick={() => setType("x")}>
                    <XIcon className="quickedit-button-img"/>
                </button>
                <button className={`quickedit-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <ImageIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`quickedit-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <AnimationIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.animation}</span>
                </button>
                <button className={`quickedit-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <VideoIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <ComicIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.comic}</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <AudioIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`quickedit-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <Live2dIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.live2d}</span>
                </button>
                <button className={`quickedit-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <ModelIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div> </>}
            {mobile ? <>
            <div className="dialog-row">
                <button style={{padding: "7px 7px"}} className={`quickedit-button ${rating === "x" ? "button-selected" : ""}`} onClick={() => setRating("x")}>
                    <XIcon className="quickedit-button-img"/>
                </button>
                <button className={`quickedit-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <CuteIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`quickedit-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <SexyIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`quickedit-button ${rating === "erotic" ? "button-selected" : ""}`} onClick={() => setRating("erotic")}>
                    <EroticIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.erotic}</span>
                </button>
            </div>
            <div className="dialog-row">
                {session.showR18 ?
                <button className={`quickedit-button ${rating === "lewd" ? "button-selected" : ""}`} onClick={() => setRating("lewd")}>
                    <LewdIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.lewd}</span>
                </button> : null}
            </div>
            </> : <>
            <div className="dialog-row">
                <button style={{padding: "7px 7px"}} className={`quickedit-button ${rating === "x" ? "button-selected" : ""}`} onClick={() => setRating("x")}>
                    <XIcon className="quickedit-button-img"/>
                </button>
                <button className={`quickedit-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <CuteIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`quickedit-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <SexyIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`quickedit-button ${rating === "erotic" ? "button-selected" : ""}`} onClick={() => setRating("erotic")}>
                    <EroticIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.erotic}</span>
                </button>
                {session.showR18 ?
                <button className={`quickedit-button ${rating === "lewd" ? "button-selected" : ""}`} onClick={() => setRating("lewd")}>
                    <LewdIcon className="quickedit-button-img"/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.lewd}</span>
                </button> : null}
            </div>
            </>}
            {getStyleJSX()}
            <div className="dialog-row">
                <SearchSuggestions active={artistsActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(artistRef.current)} click={(tag) => handleArtistClick(tag)} type="artist"/>
                <span className="dialog-text">{i18n.navbar.artists}: </span>
                <input ref={artistRef} className="dialog-input artist-tag-color" type="text" spellCheck={false} value={artists} onChange={(event) => setArtists(event.target.value)} onFocus={() => setArtistsActive(true)} onBlur={() => setArtistsActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(characterRef.current)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                <span className="dialog-text">{i18n.navbar.characters}: </span>
                <input ref={characterRef} className="dialog-input character-tag-color" type="text" spellCheck={false} value={characters} onChange={(event) => setCharacters(event.target.value)} onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(seriesRef.current)} click={(tag) => handleSeriesClick(tag)} type="series"/>
                <span className="dialog-text">{i18n.tag.series}: </span>
                <input ref={seriesRef} className="dialog-input series-tag-color" type="text" spellCheck={false} value={series} onChange={(event) => setSeries(event.target.value)} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={metaActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(metaRef.current)} click={(tag) => handleMetaClick(tag)} type="meta"/>
                <span className="dialog-text">{i18n.tag.meta}: </span>
                <input ref={metaRef} className="dialog-input meta-tag-color" type="text" spellCheck={false} value={metaTags} onChange={(event) => setMetaTags(event.target.value)} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.pages.bulkUpload.appendTags}: </span>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={tagActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(tagRef.current)} click={(tag) => handleTagClick(tag)} type="tags"/>
                <ContentEditable innerRef={tagRef} className="dialog-textarea" style={{height: "140px"}} spellCheck={false} html={appendTags} onChange={(event) => {setCaretPosition(); setAppendTags(event.target.value)}} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
            </div>
            </>
        )
    }

    if (showBulkTagEditDialog) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.bulkTagEdit.title}</span>
                        </div>
                        {mainJSX()}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.bulkEdit}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default BulkTagEditDialog