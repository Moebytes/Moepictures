import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, 
ShowBulkQuickEditDialogContext, HideTitlebarContext, SessionContext, MobileContext, SelectionModeContext, 
SelectionItemsContext, SelectionPostsContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import SearchSuggestions from "../components/SearchSuggestions"
import axios from "axios"
import "./styles/dialog.less"

const BulkQuickEditDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {showBulkQuickEditDialog, setShowBulkQuickEditDialog} = useContext(ShowBulkQuickEditDialogContext)
    const {selectionMode, setSelectionMode} = useContext(SelectionModeContext)
    const {selectionItems, setSelectionItems} = useContext(SelectionItemsContext) as {selectionItems: Set<string>, setSelectionItems: any}
    const {selectionPosts, setSelectionPosts} = useContext(SelectionPostsContext) as {selectionPosts: Map<string, any>, setSelectionPosts: any}
    const {mobile, setMobile} = useContext(MobileContext)
    const [artists, setArtists] = useState("") as any
    const [characters, setCharacters] = useState("") as any
    const [series, setSeries] = useState("") as any
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
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const reset = () => {
        setArtists("")
        setCharacters("") as any
        setSeries("")
        setMetaTags("")
    }

    useEffect(() => {
        document.title = "Moebooru: Bulk Quick Edit"

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
        if (showBulkQuickEditDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            reset()
        }
    }, [showBulkQuickEditDialog])

    const bulkQuickEdit = async () => {
        if (!permissions.isElevated(session)) return setShowBulkQuickEditDialog(false)
        if (!selectionMode) return setShowBulkQuickEditDialog(false)
        if (!artists?.trim() && !characters?.trim() && !series?.trim() && !metaTags?.trim()) return setShowBulkQuickEditDialog(false)
        let promiseArray = [] as Promise<any>[]
        for (const postID of selectionItems.values()) {
            const promise = new Promise(async (resolve) => {
                const post = selectionPosts.get(postID)
                const parsedTags = await functions.parseTagsSingle(post)
                const tagCategories = await functions.tagCategories(parsedTags, true)

                let artistData = tagCategories.artists.map((a: any) => a.tag)
                let characterData = tagCategories.characters.map((c: any) => c.tag)
                let seriesData = tagCategories.series.map((s: any) => s.tag)
                let tagData = tagCategories.tags.map((t: any) => t.tag)

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

                const data = {
                    postID: postID,
                    unverified: false,
                    type: post.type,
                    restrict: post.restrict,
                    style: post.style,
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
            await axios.put("/api/post/quickedit", data, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        }
        setShowBulkQuickEditDialog(false)
        setSelectionMode(false)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            bulkQuickEdit()
        } else {
            setShowBulkQuickEditDialog(false)
            setSelectionMode(false)
            setTimeout(() => {
                setSelectionMode(true)
            }, 200)
        }
    }

    useEffect(() => {
        const tagX = posX
        const tagY = posY
        setTagX(tagX)
        setTagY(tagY)
    }, [artists, characters, series, metaTags])

    useEffect(() => {
        if (artistsActive || charactersActive || seriesActive || metaActive) {
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

    const handleMetaClick = (tag: string) => {
        setMetaTags((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }

    if (showBulkQuickEditDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Bulk Quick Edit</span>
                        </div>
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
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Bulk Edit"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default BulkQuickEditDialog