import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useSearchSelector, useSearchActions, useLayoutSelector} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import SearchSuggestions from "../components/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import "./styles/dialog.less"

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
    const [artists, setArtists] = useState("") as any
    const [characters, setCharacters] = useState("") as any
    const [series, setSeries] = useState("") as any
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
    const errorRef = useRef<any>(null)
    const tagRef = useRef<any>(null)
    const history = useHistory()

    const reset = () => {
        setArtists("")
        setCharacters("") as any
        setSeries("")
        setMetaTags("")
        setAppendTags("")
    }

    useEffect(() => {
        document.title = "Bulk Tag Edit"

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
        if (!artists?.trim() && !characters?.trim() && !series?.trim() && !metaTags?.trim() && !appendTags?.trim()) return setShowBulkTagEditDialog(false)
        let promiseArray = [] as Promise<any>[]
        for (const postID of selectionItems.values()) {
            const promise = new Promise(async (resolve) => {
                const post = selectionPosts.get(postID)
                const parsedTags = await functions.parseTagsSingle(post, session, setSessionFlag)
                const tagCategories = await functions.tagCategories(parsedTags, session, setSessionFlag, true)

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
            //functions.put("/api/post/quickedit", data, session, setSessionFlag)
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

    if (showBulkTagEditDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Bulk Tag Edit</span>
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
                        <div className="dialog-row">
                            <span className="dialog-text">Append Tags: </span>
                        </div>
                        <div className="dialog-row">
                            <SearchSuggestions active={tagActive} x={tagX} y={tagY} width={mobile ? 140 : 200} fontSize={17} text={functions.cleanHTML(appendTags)} click={(tag) => handleTagClick(tag)} type="tag"/>
                            <ContentEditable innerRef={tagRef} className="dialog-textarea" style={{height: "140px"}} spellCheck={false} html={appendTags} onChange={(event) => setAppendTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
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

export default BulkTagEditDialog