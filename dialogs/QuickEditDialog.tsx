import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, QuickEditIDContext, QuickEditUnverifiedContext, HideTitlebarContext, SessionContext, MobileContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/quickeditdialog.less"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import image from "../assets/purple/image.png"
import animation from "../assets/purple/animation.png"
import video from "../assets/purple/video.png"
import comic from "../assets/purple/comic.png"
import explicit from "../assets/purple/explicit.png"
import questionable from "../assets/purple/questionable.png"
import safe from "../assets/purple/safe.png"
import $2d from "../assets/purple/2d.png"
import $3d from "../assets/purple/3d.png"
import pixel from "../assets/purple/pixel.png"
import chibi from "../assets/purple/chibi.png"
import SearchSuggestions from "../components/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import axios from "axios"

const QuickEditDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {quickEditID, setQuickEditID} = useContext(QuickEditIDContext)
    const {quickEditUnverified, setQuickEditUnverified} = useContext(QuickEditUnverifiedContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [type, setType] = useState("image")
    const [restrict, setRestrict] = useState("safe")
    const [style, setStyle] = useState("2d")
    const [artists, setArtists] = useState("") as any
    const [characters, setCharacters] = useState("") as any
    const [series, setSeries] = useState("") as any
    const [tags, setTags] = useState("")
    const [artistsActive, setArtistsActive] = useState(false)
    const [charactersActive, setCharactersActive] = useState(false)
    const [seriesActive, setSeriesActive] = useState(false)
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
        let post = null as any 
        if (quickEditUnverified) {
            post = await axios.get("/api/post/unverified", {params: {postID: quickEditID}, withCredentials: true}).then((r) => r.data)
        } else {
            post = await axios.get("/api/post", {params: {postID: quickEditID}, withCredentials: true}).then((r) => r.data)
        }
        if (!post) return history.push("/404")
        setType(post.type)
        setRestrict(post.restrict)
        setStyle(post.style)

        const parsedTags = await functions.parseTags([post])
        const tagCategories = await functions.tagCategories(parsedTags)
        setArtists(tagCategories.artists.map((t: any) => t.tag).join(" "))
        setCharacters(tagCategories.characters.map((t: any) => t.tag).join(" "))
        setSeries(tagCategories.series.map((t: any) => t.tag).join(" "))
        setTags(tagCategories.tags.map((t: any) => t.tag).join(" "))
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
        document.title = "Moebooru: Quick Edit"

        const logPosition = (event: any) => {
            const element = document.querySelector(".quickedit-dialog-box")
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
        if (quickEditID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            updateFields()
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            reset()
        }
    }, [quickEditID])

    const quickEdit = async () => {
        if (permissions.isStaff(session)) {
            const data = {
                postID: quickEditID,
                unverified: quickEditUnverified,
                type,
                restrict,
                style,
                artists: functions.cleanHTML(artists).split(/[\n\r\s]+/g),
                characters: functions.cleanHTML(characters).split(/[\n\r\s]+/g),
                series: functions.cleanHTML(series).split(/[\n\r\s]+/g),
                tags: functions.cleanHTML(tags).split(/[\n\r\s]+/g)
            }
            await axios.put("/api/post/quickedit", data, {withCredentials: true})
            setQuickEditID(null)
            history.go(0)
        } else {
            const tagArr = functions.cleanHTML(tags).split(/[\n\r\s]+/g)
            if (tagArr.length < 5) {
                setError(true)
                await functions.timeout(20)
                errorRef.current.innerText = "Minimum of 5 tags is required."
                await functions.timeout(3000)
                return setError(false)
            }
            const badReason = functions.validateReason(reason)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                return setError(false)
            }
            const data = {
                postID: quickEditID,
                type,
                restrict,
                style,
                artists: functions.cleanHTML(artists).split(/[\n\r\s]+/g),
                characters: functions.cleanHTML(characters).split(/[\n\r\s]+/g),
                series: functions.cleanHTML(series).split(/[\n\r\s]+/g),
                tags: functions.cleanHTML(tags).split(/[\n\r\s]+/g),
                reason
            }
            await axios.put("/api/post/quickedit/unverified", data, {withCredentials: true})
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            quickEdit()
        } else {
            setQuickEditID(null)
        }
    }

    const close = () => {
        setQuickEditID(null)
        setSubmitted(false)
        setReason("")
    }

    useEffect(() => {
        const tagX = posX
        const tagY = posY
        setTagX(tagX)
        setTagY(tagY)
    }, [artists, characters, series, tags])

    useEffect(() => {
        if (artistsActive || charactersActive || seriesActive || tagActive) {
            const tagX = posX
            const tagY = posY
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [artistsActive, charactersActive, seriesActive, tagActive])

    const handleArtistClick = (tag: string) => {
        setArtists((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }

    const handleCharacterClick = (tag: string) => {
        setCharacters((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }
    
    const handleSeriesClick = (tag: string) => {
        setSeries((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }

    const handleTagClick = (tag: string) => {
        setTags((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }

    if (quickEditID) {
        if (permissions.isStaff(session)) {
            return (
                <div className="quickedit-dialog">
                    <Draggable handle=".quickedit-dialog-title-container">
                    <div className="quickedit-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="quickedit-container">
                            <div className="quickedit-dialog-title-container">
                                <span className="quickedit-dialog-title">Quick Edit</span>
                            </div>
                            <div className="quickedit-dialog-row">
                                <span className="quickedit-dialog-text">Classification: </span>
                            </div>
                            {mobile ? <>
                            <div className="quickedit-dialog-row">
                                <button className={`quickedit-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                                    <img className="quickedit-button-img" src={image}/>
                                    <span className="quickedit-button-text">Image</span>
                                </button>
                                <button className={`quickedit-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                                    <img className="quickedit-button-img" src={animation}/>
                                    <span className="quickedit-button-text">Animation</span>
                                </button>
                            </div>
                            <div className="quickedit-dialog-row">
                                <button className={`quickedit-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                                    <img className="quickedit-button-img" src={video}/>
                                    <span className="quickedit-button-text">Video</span>
                                </button>
                                <button className={`quickedit-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                                    <img className="quickedit-button-img" src={comic}/>
                                    <span className="quickedit-button-text">Comic</span>
                                </button>
                            </div>
                            </> : <> :
                            <div className="quickedit-dialog-row">
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
                            </div> </>}
                            {mobile ? <>
                            <div className="quickedit-dialog-row">
                                <button className={`quickedit-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                                    <img className="quickedit-button-img" src={safe}/>
                                    <span className="quickedit-button-text">Safe</span>
                                </button>
                                <button className={`quickedit-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                                    <img className="quickedit-button-img" src={questionable}/>
                                    <span className="quickedit-button-text">Questionable</span>
                                </button>
                            </div>
                            <div className="quickedit-dialog-row">
                                {permissions.isAdmin(session) ?
                                <button className={`quickedit-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                                    <img className="quickedit-button-img" src={explicit}/>
                                    <span className="quickedit-button-text">Explicit</span>
                                </button> : null}
                            </div>
                            </> : <>
                            <div className="quickedit-dialog-row">
                                <button className={`quickedit-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                                    <img className="quickedit-button-img" src={safe}/>
                                    <span className="quickedit-button-text">Safe</span>
                                </button>
                                <button className={`quickedit-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                                    <img className="quickedit-button-img" src={questionable}/>
                                    <span className="quickedit-button-text">Questionable</span>
                                </button>
                                {permissions.isAdmin(session) ?
                                <button className={`quickedit-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                                    <img className="quickedit-button-img" src={explicit}/>
                                    <span className="quickedit-button-text">Explicit</span>
                                </button> : null}
                            </div>
                            </>}
                            <div className="quickedit-dialog-row">
                                <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                                    <img className="quickedit-button-img" src={$2d}/>
                                    <span className="quickedit-button-text">2D</span>
                                </button>
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
                            <div className="quickedit-dialog-row">
                                <SearchSuggestions active={artistsActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(artists)} click={(tag) => handleArtistClick(tag)} type="artist"/>
                                <span className="quickedit-dialog-text">Artists: </span>
                                <input className="quickedit-dialog-input" type="text" spellCheck={false} value={artists} onChange={(event) => setArtists(event.target.value)} onFocus={() => setArtistsActive(true)} onBlur={() => setArtistsActive(false)}/>
                            </div>
                            <div className="quickedit-dialog-row">
                                <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(characters)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                                <span className="quickedit-dialog-text">Characters: </span>
                                <input className="quickedit-dialog-input" type="text" spellCheck={false} value={characters} onChange={(event) => setCharacters(event.target.value)} onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}/>
                            </div>
                            <div className="quickedit-dialog-row">
                                <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(series)} click={(tag) => handleSeriesClick(tag)} type="series"/>
                                <span className="quickedit-dialog-text">Series: </span>
                                <input className="quickedit-dialog-input" type="text" spellCheck={false} value={series} onChange={(event) => setSeries(event.target.value)} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)}/>
                            </div>
                            <div className="quickedit-dialog-row">
                                <span className="quickedit-dialog-text">Tags: </span>
                            </div>
                            <div className="quickedit-dialog-row">
                                <SearchSuggestions active={tagActive} text={functions.cleanHTML(tags)} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} click={handleTagClick} type="tag"/>
                                <ContentEditable innerRef={tagRef} className="quickedit-textarea" spellCheck={false} html={tags} onChange={(event) => setTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                            </div>
                            <div className="quickedit-dialog-row">
                                <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="download-button">{"Edit"}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="quickedit-dialog">
                <Draggable handle=".quickedit-dialog-title-container">
                <div className="quickedit-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="quickedit-container">
                        <div className="quickedit-dialog-title-container">
                            <span className="quickedit-dialog-title">Quick Edit Request</span>
                        </div>
                        {submitted ? <>
                        <div className="quickedit-dialog-row">
                            <span className="quickedit-dialog-text">Your edit request was submitted.</span>
                        </div>
                        <div className="quickedit-dialog-row">
                            <button onClick={() => close()} className="quickedit-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="quickedit-button">{"OK"}</button>
                        </div> 
                        </> : <>
                        <div className="quickedit-dialog-row">
                            <span className="quickedit-dialog-text">Classification: </span>
                        </div>
                        <div className="quickedit-dialog-row">
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
                        <div className="quickedit-dialog-row">
                            <button className={`quickedit-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                                <img className="quickedit-button-img" src={safe}/>
                                <span className="quickedit-button-text">Safe</span>
                            </button>
                            <button className={`quickedit-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                                <img className="quickedit-button-img" src={questionable}/>
                                <span className="quickedit-button-text">Questionable</span>
                            </button>
                            {permissions.isAdmin(session) ?
                            <button className={`quickedit-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                                <img className="quickedit-button-img" src={explicit}/>
                                <span className="quickedit-button-text">Explicit</span>
                            </button> : null}
                        </div>
                        <div className="quickedit-dialog-row">
                            <button className={`quickedit-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                                <img className="quickedit-button-img" src={$2d}/>
                                <span className="quickedit-button-text">2D</span>
                            </button>
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
                        <div className="quickedit-dialog-row">
                            <SearchSuggestions active={artistsActive} x={tagX} y={tagY} width={200} text={functions.cleanHTML(artists)} click={(tag) => handleArtistClick(tag)} type="artist"/>
                            <span className="quickedit-dialog-text">Artists: </span>
                            <input className="quickedit-dialog-input" type="text" spellCheck={false} value={artists} onChange={(event) => setArtists(event.target.value)} onFocus={() => setArtistsActive(true)} onBlur={() => setArtistsActive(false)}/>
                        </div>
                        <div className="quickedit-dialog-row">
                            <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={200} text={functions.cleanHTML(characters)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                            <span className="quickedit-dialog-text">Characters: </span>
                            <input className="quickedit-dialog-input" type="text" spellCheck={false} value={characters} onChange={(event) => setCharacters(event.target.value)} onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}/>
                        </div>
                        <div className="quickedit-dialog-row">
                            <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={200} text={functions.cleanHTML(series)} click={(tag) => handleSeriesClick(tag)} type="series"/>
                            <span className="quickedit-dialog-text">Series: </span>
                            <input className="quickedit-dialog-input" type="text" spellCheck={false} value={series} onChange={(event) => setSeries(event.target.value)} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)}/>
                        </div>
                        <div className="quickedit-dialog-row">
                            <span className="quickedit-dialog-text">Tags: </span>
                        </div>
                        <div className="quickedit-dialog-row">
                            <SearchSuggestions active={tagActive} text={functions.cleanHTML(tags)} x={tagX} y={tagY} width={200} click={handleTagClick} type="tag"/>
                            <ContentEditable innerRef={tagRef} className="quickedit-textarea" spellCheck={false} html={tags} onChange={(event) => setTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                        </div>
                        <div className="quickedit-dialog-row">
                            <span className="quickedit-dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="quickedit-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="quickedit-dialog-validation-container"><span className="quickedit-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="quickedit-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Submit Request"}</button>
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

export default QuickEditDialog