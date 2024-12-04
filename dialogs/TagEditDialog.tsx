import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useFlagActions, useLayoutSelector, useActiveActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import image from "../assets/icons/image.png"
import animation from "../assets/icons/animation.png"
import video from "../assets/icons/video.png"
import comic from "../assets/icons/comic.png"
import explicit from "../assets/icons/explicit.png"
import questionable from "../assets/icons/questionable.png"
import safe from "../assets/icons/safe.png"
import $2d from "../assets/icons/2d.png"
import $3d from "../assets/icons/3d.png"
import pixel from "../assets/icons/pixel.png"
import chibi from "../assets/icons/chibi.png"
import daki from "../assets/icons/daki.png"
import audio from "../assets/icons/audio.png"
import model from "../assets/icons/model.png"
import live2d from "../assets/icons/live2d.png"
import SearchSuggestions from "../components/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import "./styles/dialog.less"

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
    const [type, setType] = useState("image")
    const [restrict, setRestrict] = useState("safe")
    const [style, setStyle] = useState("2d")
    const [artists, setArtists] = useState("") as any
    const [characters, setCharacters] = useState("") as any
    const [series, setSeries] = useState("") as any
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
    const errorRef = useRef<any>(null)
    const tagRef = useRef<any>(null)
    const history = useHistory()

    const updateFields = async () => {
        setType(tagEditID.post.type)
        setRestrict(tagEditID.post.restrict)
        setStyle(tagEditID.post.style)
        setArtists(tagEditID.artists.map((t: any) => t.tag).join(" "))
        setCharacters(tagEditID.characters.map((t: any) => t.tag).join(" "))
        setSeries(tagEditID.series.map((t: any) => t.tag).join(" "))
        const rawMetaTags = tagEditID.tags.filter((t: any) => t.type === "meta")
        const rawTags = tagEditID.tags.filter((t: any) => t.type === "appearance" || 
        t.type === "outfit" ||  t.type === "accessory" ||  t.type === "action" || 
        t.type === "scenery" || t.type === "tag")
        setMetaTags(rawMetaTags.map((t: any) => t.tag).join(" "))
        setTags(rawTags.map((t: any) => t.tag).join(" "))
    }

    const reset = () => {
        setType("image")
        setRestrict("safe")
        setStyle("2d")
        setArtists("")
        setCharacters("") as any
        setSeries("")
        setTags("")
    }

    useEffect(() => {
        document.title = "Tag Edit"

        const logPosition = (event: any) => {
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
        if (permissions.isContributor(session)) {
            const joined = `${characters} ${series} ${tags} ${metaTags}`
            if (joined.includes("_") || joined.includes("/") || joined.includes("\\")) {
                setError(true)
                await functions.timeout(20)
                errorRef.current.innerText = "Invalid characters in tags: _ / \\"
                setTags(tags.replaceAll("_", "-").replaceAll("/", "-").replaceAll("\\", "-"))
                await functions.timeout(3000)
                return setError(false)
            }
            if (joined.includes(",")) {
                setError(true)
                await functions.timeout(20)
                errorRef.current.innerText = "Tags should be separated with a space."
                const splitTags = functions.cleanHTML(tags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
                setTags(splitTags.join(" "))
                await functions.timeout(3000)
                return setError(false)
            }
            const tagArr = functions.cleanHTML(tags).split(/[\n\r\s]+/g)
            if (!permissions.isMod(session)) {
                if (tagArr.length < 5) {
                    setError(true)
                    await functions.timeout(20)
                    errorRef.current.innerText = "Minimum of 5 tags is required."
                    await functions.timeout(3000)
                    return setError(false)
                }
            }
            const data = {
                postID: tagEditID.post.postID,
                unverified: tagEditID.unverified,
                type,
                restrict,
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
                await functions.timeout(20)
                errorRef.current.innerText = "Invalid characters in tags: _ / \\"
                setTags(tags.replaceAll("_", "-").replaceAll("/", "-").replaceAll("\\", "-"))
                await functions.timeout(3000)
                return setError(false)
            }
            if (joined.includes(",")) {
                setError(true)
                await functions.timeout(20)
                errorRef.current.innerText = "Tags should be separated with a space."
                await functions.timeout(3000)
                const splitTags = functions.cleanHTML(tags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
                setTags(splitTags.join(" "))
                return setError(false)
            }
            const tagArr = functions.cleanHTML(tags).split(/[\n\r\s]+/g)
            if (tagArr.length < 5) {
                setError(true)
                await functions.timeout(20)
                errorRef.current.innerText = "Minimum of 5 tags is required."
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
                restrict,
                style,
                artists: functions.cleanHTML(artists).split(/[\n\r\s]+/g),
                characters: functions.cleanHTML(characters).split(/[\n\r\s]+/g),
                series: functions.cleanHTML(series).split(/[\n\r\s]+/g),
                tags: functions.cleanHTML(`${tags} ${metaTags}`).split(/[\n\r\s]+/g),
                reason
            }
            await functions.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
            setSubmitted(true)
        }
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
                        <span className="quickedit-button-text">3D</span>
                    </button>
                    <button className={`quickedit-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="quickedit-button-img" src={chibi}/>
                        <span className="quickedit-button-text">Chibi</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="quickedit-button-img" src={pixel}/>
                        <span className="quickedit-button-text">Pixel</span>
                    </button>
                </div>
            )
        } else if (type === "audio") {
            return (
                <div className="dialog-row">
                    <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <img className="quickedit-button-img" src={$2d}/>
                        <span className="quickedit-button-text">2D</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="quickedit-button-img" src={pixel}/>
                        <span className="quickedit-button-text">Pixel</span>
                    </button>
                </div>
            )
        } else {
            return (
                <div className="dialog-row">
                    <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <img className="quickedit-button-img" src={$2d}/>
                        <span className="quickedit-button-text">2D</span>
                    </button>
                    {type !== "live2d" ? <button className={`quickedit-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <img className="quickedit-button-img" src={$3d}/>
                        <span className="quickedit-button-text">3D</span>
                    </button> : null}
                    <button className={`quickedit-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="quickedit-button-img" src={chibi}/>
                        <span className="quickedit-button-text">Chibi</span>
                    </button>
                    <button className={`quickedit-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="quickedit-button-img" src={pixel}/>
                        <span className="quickedit-button-text">Pixel</span>
                    </button>
                    {type !== "comic" ? 
                    <button className={`quickedit-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                        <img className="quickedit-button-img" src={daki}/>
                        <span className="quickedit-button-text">Daki</span>
                    </button> : null}
                </div>
            )
        }
    }

    useEffect(() => {
        if (type === "comic") {
            if (style === "daki") setStyle("2d")
        } else if (type === "model") {
            if (style === "2d" || style === "daki") setStyle("3d")
        } else if (type === "live2d") {
            if (style === "3d") setStyle("2d")
        } else if (type === "audio") {
            if (style === "3d" || style === "chibi" || style === "daki") setStyle("2d")
        }
    }, [type, style])

    const mainJSX = () => {
        return (
            <>
            <div className="dialog-row">
                <span className="dialog-text">Classification: </span>
            </div>
            {mobile ? <>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <img className="quickedit-button-img" src={image}/>
                    <span className="quickedit-button-text">Image</span>
                </button>
                <button className={`quickedit-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <img className="quickedit-button-img" src={animation}/>
                    <span className="quickedit-button-text">Animation</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <img className="quickedit-button-img" src={video}/>
                    <span className="quickedit-button-text">Video</span>
                </button>
                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <img className="quickedit-button-img" src={comic}/>
                    <span className="quickedit-button-text">Comic</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <img className="quickedit-button-img" src={audio}/>
                    <span className="quickedit-button-text">Audio</span>
                </button>
                <button className={`quickedit-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <img className="quickedit-button-img" src={live2d}/>
                    <span className="quickedit-button-text">Live2D</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <img className="quickedit-button-img" src={model}/>
                    <span className="quickedit-button-text">Model</span>
                </button>
            </div>
            </> : <>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <img className="quickedit-button-img" src={image}/>
                    <span className="quickedit-button-text">Image</span>
                </button>
                <button className={`quickedit-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <img className="quickedit-button-img" src={animation}/>
                    <span className="quickedit-button-text">Animation</span>
                </button>
                <button className={`quickedit-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <img className="quickedit-button-img" src={video}/>
                    <span className="quickedit-button-text">Video</span>
                </button>
                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <img className="quickedit-button-img" src={comic}/>
                    <span className="quickedit-button-text">Comic</span>
                </button>
            </div>
            <div className="dialog-row">
                <button className={`quickedit-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <img className="quickedit-button-img" src={audio}/>
                    <span className="quickedit-button-text">Audio</span>
                </button>
                <button className={`quickedit-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <img className="quickedit-button-img" src={live2d}/>
                    <span className="quickedit-button-text">Live2D</span>
                </button>
                <button className={`quickedit-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <img className="quickedit-button-img" src={model}/>
                    <span className="quickedit-button-text">Model</span>
                </button>
            </div> </>}
            {mobile ? <>
            <div className="dialog-row">
                <button className={`quickedit-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                    <img className="quickedit-button-img" src={safe}/>
                    <span className="quickedit-button-text">Safe</span>
                </button>
                <button className={`quickedit-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                    <img className="quickedit-button-img" src={questionable}/>
                    <span className="quickedit-button-text">Questionable</span>
                </button>
            </div>
            <div className="dialog-row">
                {session.showR18 ?
                <button className={`quickedit-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                    <img className="quickedit-button-img" src={explicit}/>
                    <span className="quickedit-button-text">Explicit</span>
                </button> : null}
            </div>
            </> : <>
            <div className="dialog-row">
                <button className={`quickedit-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                    <img className="quickedit-button-img" src={safe}/>
                    <span className="quickedit-button-text">Safe</span>
                </button>
                <button className={`quickedit-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                    <img className="quickedit-button-img" src={questionable}/>
                    <span className="quickedit-button-text">Questionable</span>
                </button>
                {session.showR18 ?
                <button className={`quickedit-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                    <img className="quickedit-button-img" src={explicit}/>
                    <span className="quickedit-button-text">Explicit</span>
                </button> : null}
            </div>
            </>}
            {getStyleJSX()}
            <div className="dialog-row">
                <SearchSuggestions active={artistsActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(artists)} click={(tag) => handleArtistClick(tag)} type="artist"/>
                <span className="dialog-text">Artists: </span>
                <input className="dialog-input artist-tag-color" type="text" spellCheck={false} value={artists} onChange={(event) => setArtists(event.target.value)} onFocus={() => setArtistsActive(true)} onBlur={() => setArtistsActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(characters)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                <span className="dialog-text">Characters: </span>
                <input className="dialog-input character-tag-color" type="text" spellCheck={false} value={characters} onChange={(event) => setCharacters(event.target.value)} onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(series)} click={(tag) => handleSeriesClick(tag)} type="series"/>
                <span className="dialog-text">Series: </span>
                <input className="dialog-input series-tag-color" type="text" spellCheck={false} value={series} onChange={(event) => setSeries(event.target.value)} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)}/>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={metaActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(metaTags)} click={(tag) => handleMetaClick(tag)} type="meta"/>
                <span className="dialog-text">Meta: </span>
                <input className="dialog-input meta-tag-color" type="text" spellCheck={false} value={metaTags} onChange={(event) => setMetaTags(event.target.value)} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text tag-color">Tags: </span>
            </div>
            <div className="dialog-row">
                <SearchSuggestions active={tagActive} text={functions.cleanHTML(tags)} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} click={handleTagClick} type="tag"/>
                <ContentEditable innerRef={tagRef} className="dialog-textarea" style={{height: "140px"}} spellCheck={false} html={tags} onChange={(event) => setTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">Reason: </span>
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
                                <span className="dialog-title">Tag Edit</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot edit.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
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
                                <span className="dialog-title">Tag Edit</span>
                            </div>
                            <span className="dialog-ban-text">This post is locked. Cannot edit.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-50px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Tag Edit</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Edit"}</button>
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
                            <span className="dialog-title">Tag Edit Request</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Your edit request was submitted.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div> 
                        </> : <>
                        {mainJSX()}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Submit Request"}</button>
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