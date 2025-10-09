import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useFlagActions, useLayoutSelector, useActiveActions} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
import permissions from "../../structures/Permissions"
import image from "../../assets/icons/image.png"
import animation from "../../assets/icons/animation.png"
import video from "../../assets/icons/video.png"
import comic from "../../assets/icons/comic.png"
import cute from "../../assets/icons/cute.png"
import hot from "../../assets/icons/hot.png"
import erotic from "../../assets/icons/erotic.png"
import hentai from "../../assets/icons/hentai.png"
import $2d from "../../assets/icons/2d.png"
import $3d from "../../assets/icons/3d.png"
import pixel from "../../assets/icons/pixel.png"
import chibi from "../../assets/icons/chibi.png"
import daki from "../../assets/icons/daki.png"
import sketch from "../../assets/icons/sketch.png"
import lineart from "../../assets/icons/lineart.png"
import promo from "../../assets/icons/promo.png"
import audio from "../../assets/icons/audio.png"
import model from "../../assets/icons/model.png"
import live2d from "../../assets/icons/live2d.png"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import {PostType, PostRating, PostStyle, UploadImage} from "../../types/Types"
import "../dialog.less"

let caretPosition = 0

const TagEditDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setPostFlag} = useFlagActions()
    const {tagEditID} = usePostDialogSelector()
    const {setTagEditID} = usePostDialogActions()
    const {setActionBanner} = useActiveActions()
    const {mobile} = useLayoutSelector()
    const [type, setType] = useState("image" as PostType)
    const [rating, setRating] = useState("cute" as PostRating)
    const [style, setStyle] = useState("2d" as PostStyle)
    const [artists, setArtists] = useState("")
    const [characters, setCharacters] = useState("")
    const [series, setSeries] = useState("")
    const [rawTags, setRawTags] = useState("")
    const [metaTags, setMetaTags] = useState("")
    const [artistsActive, setArtistsActive] = useState(false)
    const [charactersActive, setCharactersActive] = useState(false)
    const [seriesActive, setSeriesActive] = useState(false)
    const [metaActive, setMetaActive] = useState(false)
    const [tagActive, setTagActive] = useState(false)
    const [posX, setPosX] = useState(0)
    const [posY, setPosY] = useState(0)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [reason, setReason] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null!)
    const artistRef = useRef<HTMLInputElement>(null!)
    const characterRef = useRef<HTMLInputElement>(null!)
    const seriesRef = useRef<HTMLInputElement>(null!)
    const metaRef = useRef<HTMLInputElement>(null!)
    const tagRef = useRef<HTMLDivElement>(null!)

    const updateFields = async () => {
        if (!tagEditID) return
        setType(tagEditID.post.type)
        setRating(tagEditID.post.rating)
        setStyle(tagEditID.post.style)
        setArtists(tagEditID.artists.map((t) => t.tag).join(" "))
        setCharacters(tagEditID.characters.map((t) => t.tag).join(" "))
        setSeries(tagEditID.series.map((t) => t.tag).join(" "))
        setMetaTags(tagEditID.meta.map((t) => t.tag).join(" "))
        setRawTags(functions.tag.parseTagGroupsField(tagEditID.tags.map((t) => t.tag), tagEditID.tagGroups))
    }

    const reset = () => {
        setType("image")
        setRating("cute")
        setStyle("2d")
        setArtists("")
        setCharacters("")
        setSeries("")
        setRawTags("")
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
        document.title = i18n.sidebar.tagEdit
    }, [i18n])

    useEffect(() => {
        if (tagEditID) {
            document.body.style.pointerEvents = "none"
            updateFields()
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            reset()
        }
    }, [tagEditID])

    const tagEdit = async () => {
        if (!tagEditID) return
        if (tagEditID.unverified || permissions.isContributor(session)) {
            let {tags, tagGroups} = functions.tag.parseTagGroups(functions.util.cleanHTML(rawTags))
            const joined = `${characters} ${series} ${tags.join(" ")} ${metaTags}`
            if (joined.includes("_") || joined.includes("/") || joined.includes("\\")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.invalidCharacters
                setRawTags(rawTags.replaceAll("_", "-").replaceAll("/", "-").replaceAll("\\", "-"))
                await functions.timeout(3000)
                return setError(false)
            }
            if (joined.includes(",")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.spaceSeparation
                const splitTags = functions.util.cleanHTML(rawTags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
                setRawTags(splitTags.join(" "))
                await functions.timeout(3000)
                return setError(false)
            }
            if (!permissions.isMod(session)) {
                if (tags.length < 5) {
                    setError(true)
                    if (!errorRef.current) await functions.timeout(20)
                    errorRef.current!.innerText = i18n.pages.upload.tagMinimum
                    await functions.timeout(3000)
                    return setError(false)
                }
            }
            const data = {
                postID: tagEditID.post.postID,
                unverified: tagEditID.unverified,
                type,
                rating,
                style,
                artists: functions.util.cleanHTML(artists).split(/[\n\r\s]+/g),
                characters: functions.util.cleanHTML(characters).split(/[\n\r\s]+/g),
                series: functions.util.cleanHTML(series).split(/[\n\r\s]+/g),
                tags: functions.util.cleanHTML(`${tags.join(" ")} ${metaTags}`).split(/[\n\r\s]+/g),
                tagGroups,
                reason
            }
            setTagEditID(null)
            await functions.http.put("/api/post/quickedit", data, session, setSessionFlag)
            setPostFlag(tagEditID.post.postID)
            setActionBanner("tag-edit")
        } else {
            let {tags, tagGroups} = functions.tag.parseTagGroups(functions.util.cleanHTML(rawTags))
            const joined = `${characters} ${series} ${tags.join(" ")} ${metaTags}`
            if (joined.includes("_") || joined.includes("/") || joined.includes("\\")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.invalidCharacters
                setRawTags(rawTags.replaceAll("_", "-").replaceAll("/", "-").replaceAll("\\", "-"))
                await functions.timeout(3000)
                return setError(false)
            }
            if (joined.includes(",")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.spaceSeparation
                await functions.timeout(3000)
                const splitTags = functions.util.cleanHTML(rawTags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
                setRawTags(splitTags.join(" "))
                return setError(false)
            }
            if (tags.length < 5) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.tagMinimum
                await functions.timeout(3000)
                return setError(false)
            }
            const badReason = functions.validation.validateReason(reason, i18n)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                return setError(false)
            }
            const data = {
                postID: tagEditID.post.postID,
                type,
                rating,
                style,
                artists: functions.util.cleanHTML(artists).split(/[\n\r\s]+/g),
                characters: functions.util.cleanHTML(characters).split(/[\n\r\s]+/g),
                series: functions.util.cleanHTML(series).split(/[\n\r\s]+/g),
                tags: functions.util.cleanHTML(`${tags.join(" ")} ${metaTags}`).split(/[\n\r\s]+/g),
                tagGroups,
                reason
            }
            await functions.http.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
            setSubmitted(true)
            functions.cache.clearCache()
        }
    }

    const tagLookup = async () => {
        if (!tagEditID) return
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.fetching
        try {
            let image = tagEditID.post.images[tagEditID.order - 1]
            if (typeof image === "string") throw new Error("History state")
            let link = functions.link.getImageLink(image)
            let response = await fetch(functions.util.appendURLParams(link, {upscaled: false}), {headers: {"x-force-upscale": "false"}}).then((r) => r.arrayBuffer())
            let current = null as UploadImage | null
            if (response.byteLength) {
                const decrypted = await functions.crypto.decryptBuffer(response, link, session)
                const bytes = new Uint8Array(decrypted)
                const result = functions.byte.bufferFileType(bytes)?.[0] || {}
                const pixivID = tagEditID.post.source?.match(/\d+/)?.[0] || "image"
                const ext = result.typename === "mkv" ? "webm" : result.typename
                current = {
                    link,
                    ext,
                    originalLink: link,
                    bytes: Object.values(bytes),
                    size: decrypted.byteLength,
                    width: image.width,
                    height: image.height,
                    thumbnail: "",
                    thumbnailExt: "",
                    name: `${pixivID}.${ext}`
                }
            }
            if (!current) throw new Error("Bad image")
            let hasUpscaled = image.upscaledFilename ? true : false
            const sourceLookup = await functions.http.post("/api/misc/sourcelookup", {current, rating}, session, setSessionFlag)
            const tagLookup = await functions.http.post("/api/misc/taglookup", {current, type, rating, style, hasUpscaled}, session, setSessionFlag)

            let artistArr = sourceLookup.artists.length ? sourceLookup.artists : tagLookup.artists
            const newArtists = artistArr?.map((a) => a.tag) || []
            const newCharacters = tagLookup.characters.map((c) => c.tag)
            const newSeries = tagLookup.series.map((s) => s.tag)

            setArtists(newArtists.join(" "))
            setCharacters(newCharacters.join(" "))
            setSeries(newSeries.join(" "))
            setMetaTags(tagLookup.meta.join(" "))
            setRawTags(tagLookup.tags.join(" "))
        } catch (e) {
            console.log(e)
            errorRef.current!.innerText = i18n.pages.upload.nothingFound
            await functions.timeout(3000)
        }
        return setError(false)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            tagEdit()
        } else {
            setTagEditID(null)
        }
    }

    const close = () => {
        setTagEditID(null)
        setSubmitted(false)
        setReason("")
    }

    useEffect(() => {
        const tagX = posX
        const tagY = posY
        setTagX(tagX)
        setTagY(tagY)
    }, [artists, characters, series, metaTags, rawTags])

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
        setRawTags((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    const getStyleJSX = () => {
        if (type === "model") {
            return (
                <div className="dialog-row">
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
                </div>
                <div className="dialog-row">
                    {type !== "comic" ? 
                    <button className={`quickedit-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                        <img className="quickedit-button-img" src={daki}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.daki}</span>
                    </button> : null}
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "promo" ? "button-selected" : ""}`} onClick={() => setStyle("promo")}>
                        <img className="quickedit-button-img" src={promo}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.promo}</span>
                    </button> : null}
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                        <img className="quickedit-button-img" src={sketch}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.sketch}</span>
                    </button> : null}
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                        <img className="quickedit-button-img" src={lineart}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.lineart}</span>
                    </button>
                    : null}
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
            <div className="dialog-row">
                <span className="dialog-text">{i18n.pages.upload.classification}: </span>
            </div>
            <div className="dialog-row">
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
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <img className="quickedit-button-img" src={cute}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`quickedit-button ${rating === "hot" ? "button-selected" : ""}`} onClick={() => setRating("hot")}>
                    <img className="quickedit-button-img" src={hot}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.hot}</span>
                </button>
                <button className={`quickedit-button ${rating === "erotic" ? "button-selected" : ""}`} onClick={() => setRating("erotic")}>
                    <img className="quickedit-button-img" src={erotic}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.erotic}</span>
                </button>
                {session.showR18 ?
                <button className={`quickedit-button ${rating === "hentai" ? "button-selected" : ""}`} onClick={() => setRating("hentai")}>
                    <img className="quickedit-button-img" src={hentai}/>
                    <span className="quickedit-button-text">{i18n.sortbar.rating.hentai}</span>
                </button> : null}
            </div>
            {getStyleJSX()}
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={artistsActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(artistRef.current)} click={(tag) => handleArtistClick(tag)} type="artist"/>
                <span className="dialog-text">{i18n.navbar.artists}: </span>
                <input ref={artistRef} className="dialog-input artist-tag-color" type="text" spellCheck={false} value={artists} onChange={(event) => setArtists(event.target.value)} onFocus={() => setArtistsActive(true)} onBlur={() => setArtistsActive(false)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(characterRef.current)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                <span className="dialog-text">{i18n.navbar.characters}: </span>
                <input ref={characterRef} className="dialog-input character-tag-color" type="text" spellCheck={false} value={characters} onChange={(event) => setCharacters(event.target.value)} onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(seriesRef.current)} click={(tag) => handleSeriesClick(tag)} type="series"/>
                <span className="dialog-text">{i18n.tag.series}: </span>
                <input ref={seriesRef} className="dialog-input series-tag-color" type="text" spellCheck={false} value={series} onChange={(event) => setSeries(event.target.value)} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={metaActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.render.getTypingWord(metaRef.current)} click={(tag) => handleMetaClick(tag)} type="meta"/>
                <span className="dialog-text">{i18n.tag.meta}: </span>
                <input ref={metaRef} className="dialog-input meta-tag-color" type="text" spellCheck={false} value={metaTags} onChange={(event) => setMetaTags(event.target.value)} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text tag-color">{i18n.navbar.tags}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={tagActive} text={functions.render.getTypingWord(tagRef.current)} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} click={handleTagClick} type="tags"/>
                <ContentEditable innerRef={tagRef} className="dialog-textarea" style={{height: "140px"}} spellCheck={false} html={rawTags} onChange={(event) => {setCaretPosition(); setRawTags(event.target.value)}} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.reason}: </span>
                <input style={{width: "100%"}} className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
            </div>
            </>
        )
    }

    if (tagEditID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.sidebar.tagEdit}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (tagEditID.post.locked && !permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.sidebar.tagEdit}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.locked}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (tagEditID.unverified || permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-50px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.sidebar.tagEdit}</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row" style={{marginLeft: "0px"}}>
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => tagLookup()} style={{backgroundColor: "var(--buttonBG)", marginLeft: "-5px"}} className="dialog-button">{i18n.buttons.fetch}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.edit}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{marginTop: "-50px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.tagEdit.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.editGroup.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div> 
                        </> : <>
                        {mainJSX()}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row" style={{marginLeft: "0px"}}>
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => tagLookup()} style={{backgroundColor: "var(--buttonBG)", marginLeft: "-5px"}} className="dialog-button">{i18n.buttons.fetch}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submitRequest}</button>
                        </div>
                        </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default TagEditDialog