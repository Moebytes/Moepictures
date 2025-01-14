import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useFlagActions, useLayoutSelector, useActiveActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import permissions from "../../structures/Permissions"
import image from "../../assets/icons/image.png"
import animation from "../../assets/icons/animation.png"
import video from "../../assets/icons/video.png"
import comic from "../../assets/icons/comic.png"
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
import audio from "../../assets/icons/audio.png"
import model from "../../assets/icons/model.png"
import live2d from "../../assets/icons/live2d.png"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import {PostType, PostRating, PostStyle, UploadImage} from "../../types/Types"
import "../dialog.less"

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
    const [tags, setTags] = useState("")
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
    const errorRef = useRef<HTMLSpanElement>(null)
    const tagRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    const updateFields = async () => {
        if (!tagEditID) return
        setType(tagEditID.post.type)
        setRating(tagEditID.post.rating)
        setStyle(tagEditID.post.style)
        setArtists(tagEditID.artists.map((t) => t.tag).join(" "))
        setCharacters(tagEditID.characters.map((t) => t.tag).join(" "))
        setSeries(tagEditID.series.map((t) => t.tag).join(" "))
        const rawMetaTags = tagEditID.tags.filter((t) => t.type === "meta")
        const rawTags = tagEditID.tags.filter((t) => t.type === "appearance" || 
        t.type === "outfit" ||  t.type === "accessory" ||  t.type === "action" || 
        t.type === "scenery" || t.type === "tag")
        setMetaTags(rawMetaTags.map((t) => t.tag).join(" "))
        setTags(rawTags.map((t) => t.tag).join(" "))
    }

    const reset = () => {
        setType("image")
        setRating("cute")
        setStyle("2d")
        setArtists("")
        setCharacters("")
        setSeries("")
        setTags("")
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
            const joined = `${characters} ${series} ${tags} ${metaTags}`
            if (joined.includes("_") || joined.includes("/") || joined.includes("\\")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.invalidCharacters
                setTags(tags.replaceAll("_", "-").replaceAll("/", "-").replaceAll("\\", "-"))
                await functions.timeout(3000)
                return setError(false)
            }
            if (joined.includes(",")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.spaceSeparation
                const splitTags = functions.cleanHTML(tags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
                setTags(splitTags.join(" "))
                await functions.timeout(3000)
                return setError(false)
            }
            const tagArr = functions.cleanHTML(tags).split(/[\n\r\s]+/g)
            if (!permissions.isMod(session)) {
                if (tagArr.length < 5) {
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
                artists: functions.cleanHTML(artists).split(/[\n\r\s]+/g),
                characters: functions.cleanHTML(characters).split(/[\n\r\s]+/g),
                series: functions.cleanHTML(series).split(/[\n\r\s]+/g),
                tags: functions.cleanHTML(`${tags} ${metaTags}`).split(/[\n\r\s]+/g),
                reason
            }
            setTagEditID(null)
            await functions.put("/api/post/quickedit", data, session, setSessionFlag)
            setPostFlag(true)
            setActionBanner("tag-edit")
        } else {
            const joined = `${characters} ${series} ${tags} ${metaTags}`
            if (joined.includes("_") || joined.includes("/") || joined.includes("\\")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.invalidCharacters
                setTags(tags.replaceAll("_", "-").replaceAll("/", "-").replaceAll("\\", "-"))
                await functions.timeout(3000)
                return setError(false)
            }
            if (joined.includes(",")) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.spaceSeparation
                await functions.timeout(3000)
                const splitTags = functions.cleanHTML(tags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
                setTags(splitTags.join(" "))
                return setError(false)
            }
            const tagArr = functions.cleanHTML(tags).split(/[\n\r\s]+/g)
            if (tagArr.length < 5) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.pages.upload.tagMinimum
                await functions.timeout(3000)
                return setError(false)
            }
            const badReason = functions.validateReason(reason, i18n)
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
                artists: functions.cleanHTML(artists).split(/[\n\r\s]+/g),
                characters: functions.cleanHTML(characters).split(/[\n\r\s]+/g),
                series: functions.cleanHTML(series).split(/[\n\r\s]+/g),
                tags: functions.cleanHTML(`${tags} ${metaTags}`).split(/[\n\r\s]+/g),
                reason
            }
            await functions.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
            setSubmitted(true)
            functions.clearCache()
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
            let link = functions.getImageLink(image.type, image.postID, image.order, image.filename)
            let response = await fetch(`${link}?upscaled=false`, {headers: {"x-force-upscale": "false"}}).then((r) => r.arrayBuffer())
            let current = null as UploadImage | null
            if (response.byteLength) {
                const decrypted = await functions.decryptBuffer(response, link, session)
                const bytes = new Uint8Array(decrypted)
                const result = functions.bufferFileType(bytes)?.[0] || {}
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
                    name: `${pixivID}.${ext}`
                }
            }
            if (!current) throw new Error("Bad image")
            let hasUpscaled = image.upscaledFilename ? true : false
            const sourceLookup = await functions.post("/api/misc/sourcelookup", {current, rating}, session, setSessionFlag)
            const tagLookup = await functions.post("/api/misc/taglookup", {current, type, rating, style, hasUpscaled}, session, setSessionFlag)
            const tagMap = await functions.tagsCache(session, setSessionFlag)

            let artistArr = sourceLookup.artists.length ? sourceLookup.artists : tagLookup.artists
            const newArtists = artistArr?.map((a) => a.tag) || []
            const newCharacters = tagLookup.characters.map((c) => c.tag)
            const newSeries = tagLookup.series.map((s) => s.tag)
            const newMeta = tagLookup.tags.filter((t) => tagMap[t]?.type === "meta")
            const newTags = tagLookup.tags.filter((t) => !newMeta.includes(t))

            setArtists(newArtists.join(" "))
            setCharacters(newCharacters.join(" "))
            setSeries(newSeries.join(" "))
            setMetaTags(newMeta.join(" "))
            setTags(newTags.join(" "))
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
    }, [artists, characters, series, metaTags, tags])

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
        setTags((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
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
                    {!mobile && type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                        <img className="quickedit-button-img" src={lineart}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.lineart}</span>
                    </button>
                    : null}
                </div>
                {mobile ?
                <div className="dialog-row">
                    {type !== "live2d" ? 
                    <button className={`quickedit-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                        <img className="quickedit-button-img" src={lineart}/>
                        <span className="quickedit-button-text">{i18n.sortbar.style.lineart}</span>
                    </button> : null}
                </div> : null}
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
            {mobile ? <>
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
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <img className="quickedit-button-img" src={comic}/>
                    <span className="quickedit-button-text">{i18n.sortbar.type.comic}</span>
                </button>
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
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={artistsActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.cleanHTML(artists)} click={(tag) => handleArtistClick(tag)} type="artist"/>
                <span className="dialog-text">{i18n.navbar.artists}: </span>
                <input className="dialog-input artist-tag-color" type="text" spellCheck={false} value={artists} onChange={(event) => setArtists(event.target.value)} onFocus={() => setArtistsActive(true)} onBlur={() => setArtistsActive(false)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.cleanHTML(characters)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                <span className="dialog-text">{i18n.navbar.characters}: </span>
                <input className="dialog-input character-tag-color" type="text" spellCheck={false} value={characters} onChange={(event) => setCharacters(event.target.value)} onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.cleanHTML(series)} click={(tag) => handleSeriesClick(tag)} type="series"/>
                <span className="dialog-text">{i18n.tag.series}: </span>
                <input className="dialog-input series-tag-color" type="text" spellCheck={false} value={series} onChange={(event) => setSeries(event.target.value)} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={metaActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.cleanHTML(metaTags)} click={(tag) => handleMetaClick(tag)} type="meta"/>
                <span className="dialog-text">{i18n.tag.meta}: </span>
                <input className="dialog-input meta-tag-color" type="text" spellCheck={false} value={metaTags} onChange={(event) => setMetaTags(event.target.value)} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text tag-color">{i18n.navbar.tags}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={tagActive} text={functions.cleanHTML(tags)} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} click={handleTagClick} type="tag"/>
                <ContentEditable innerRef={tagRef} className="dialog-textarea" style={{height: "140px"}} spellCheck={false} html={tags} onChange={(event) => setTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
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