import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSearchActions, useSearchSelector, useInteractionSelector, 
useFlagActions, useInteractionActions, useCacheActions, useCacheSelector, useActiveActions, usePostDialogSelector,
useMiscDialogActions, useSessionSelector, useSessionActions, usePostDialogActions, useSearchDialogActions, 
useGroupDialogActions, useActiveSelector, useSearchDialogSelector} from "../../store"
import {HashLink as Link} from "react-router-hash-link"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import searchIcon from "../../assets/icons/search.png"
import searchImage from "../../assets/icons/search-image.png"
import random from "../../assets/icons/random.png"
import bookmark from "../../assets/icons/bookmark.png"
import terms from "../../assets/icons/terms.png"
import contact from "../../assets/icons/contact.png"
import code from "../../assets/icons/code.png"
import setAvatar from "../../assets/icons/setavatar.png"
import addNote from "../../assets/icons/note-toggle-on.png"
import report from "../../assets/icons/report.png"
import takedown from "../../assets/icons/takedown.png"
import restore from "../../assets/icons/restore.png"
import tagEdit from "../../assets/icons/tag-outline.png"
import sourceEdit from "../../assets/icons/history-search.png"
import edit from "../../assets/icons/edit.png"
import historyIcon from "../../assets/icons/history.png"
import deleteIcon from "../../assets/icons/delete.png"
import rejectRed from "../../assets/icons/reject-red.png"
import approveGreen from "../../assets/icons/approve-green.png"
import editOptIcon from "../../assets/icons/edit-opt.png"
import deleteOptIcon from "../../assets/icons/tag-delete.png"
import tagIcon from "../../assets/icons/tag.png"
import hashIcon from "../../assets/icons/hash.png"
import website from "../../assets/icons/support.png"
import fandom from "../../assets/icons/fandom.png"
import pixiv from "../../assets/icons/pixiv.png"
import twitter from "../../assets/icons/twitter.png"
import deviantart from "../../assets/icons/deviantart.png"
import artstation from "../../assets/icons/artstation.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import youtube from "../../assets/icons/youtube.png"
import bandcamp from "../../assets/icons/bandcamp.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import SearchSuggestions from "../tooltip/SearchSuggestions"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import question from "../../assets/icons/question.png"
import autoSearchIcon from "../../assets/icons/autosearch.png"
import autoSearchActiveIcon from "../../assets/icons/autosearch-active.gif"
import saveSearchIcon from "../../assets/icons/savesearch.png"
import saveSearchActiveIcon from "../../assets/icons/savesearch-active.png"
import danbooru from "../../assets/icons/danbooru.png"
import gelbooru from "../../assets/icons/gelbooru.png"
import safebooru from "../../assets/icons/safebooru.png"
import yandere from "../../assets/icons/yandere.png"
import konachan from "../../assets/icons/konachan.png"
import zerochan from "../../assets/icons/zerochan.png"
import group from "../../assets/icons/group.png"
import parent from "../../assets/icons/parent.png"
import compressIcon from "../../assets/icons/compress.png"
import upscaleIcon from "../../assets/icons/waifu2x.png"
import lockIcon from "../../assets/icons/lock-red.png"
import unlockIcon from "../../assets/icons/unlock-red.png"
import privateIcon from "../../assets/icons/private.png"
import unprivateIcon from "../../assets/icons/unprivate.png"
import functions from "../../structures/Functions"
import path from "path"
import {PostSearch, PostHistory, UnverifiedPost, MiniTag} from "../../types/Types"
import "./styles/sidebar.less"

interface Props {
    post?: PostSearch | PostHistory | UnverifiedPost
    artists?: MiniTag[] 
    characters?: MiniTag[]  
    series?: MiniTag[]
    tags?: MiniTag[]
    unverified?: boolean
    noActions?: boolean
    order?: number
}

let interval = null as any
let tagTooltipTimer = null as any
let maxHeight1 = 547 // 582
let maxHeight2 = 625 // 655
let maxHeight3 = 672 // 698

const SideBar: React.FunctionComponent<Props> = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile, relative, hideNavbar, hideSidebar, hideSortbar, hideTitlebar} = useLayoutSelector()
    const {search, noteMode, autoSearch, saveSearch} = useSearchSelector()
    const {setSearch, setSearchFlag, setNoteMode, setNoteDrawingEnabled, setAutoSearch, setSaveSearch} = useSearchActions()
    const {posts, unverifiedPosts, tags} = useCacheSelector()
    const {setTags} = useCacheActions()
    const {mobileScrolling} = useInteractionSelector()
    const {setEnableDrag, setSidebarHover, setTagToolTipTag, setTagToolTipEnabled, setTagToolTipY} = useInteractionActions()
    const {sidebarText} = useActiveSelector()
    const {setRandomFlag, setImageSearchFlag} = useFlagActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {showUpscalingDialog, showCompressingDialog, showDeletePostDialog, showTakedownPostDialog} = usePostDialogSelector()
    const {setTagEditID, setSourceEditID, setPrivatePostObj, setLockPostID, setShowUpscalingDialog, setShowCompressingDialog, setShowDeletePostDialog, setShowTakedownPostDialog, setChildPostObj} = usePostDialogActions()
    const {saveSearchDialog, deleteAllSaveSearchDialog} = useSearchDialogSelector()
    const {setSaveSearchDialog, setDeleteAllSaveSearchDialog, setEditSaveSearchName, setEditSaveSearchKey, setEditSaveSearchTags} = useSearchDialogActions()
    const {setActionBanner} = useActiveActions()
    const {setGroupPostID} = useGroupDialogActions()
    const [maxHeight, setMaxHeight] = useState(maxHeight1)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [approverRole, setApproverRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 80}%) brightness(${siteLightness + 350}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterRandom = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 230}deg) saturate(${siteSaturation - 30}%) brightness(${siteLightness + 200}%)`
        return `hue-rotate(${siteHue - 200}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTags = async () => {
        const tags = await functions.parseTags(posts, session, setSessionFlag)
        setTags(tags)
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await functions.get("/api/user", {username: props.post.uploader}, session, setSessionFlag)
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image, uploader.imageHash) : favicon)
            if (uploader?.role) setUploaderRole(uploader.role)
            const updater = await functions.get("/api/user", {username: props.post.updater}, session, setSessionFlag)
            if (updater?.role) setUpdaterRole(updater.role)
            const approver = await functions.get("/api/user", {username: props.post.approver}, session, setSessionFlag)
            if (approver?.role) setApproverRole(approver.role)
        }
    }

    useEffect(() => {
        updateTags()
        updateUserImg()
        const savedUploaderImage = localStorage.getItem("uploaderImage")
        if (savedUploaderImage) setUploaderImage(savedUploaderImage)
        const savedSaveSearch = localStorage.getItem("saveSearch")
        if (savedSaveSearch) setSaveSearch(savedSaveSearch === "true")
    }, [session])

    useEffect(() => {
        functions.linkToBase64(uploaderImage).then((uploaderImage) => {
            localStorage.setItem("uploaderImage", uploaderImage)
        })
        localStorage.setItem("saveSearch", String(saveSearch))
    }, [uploaderImage, saveSearch])

    useEffect(() => {
        updateUserImg()
    }, [props.post])

    useEffect(() => {
        updateTags()
    }, [posts])

    useEffect(() => {
        const scrollHandler = () => {
            const sidebar = document.querySelector(".sidebar") as HTMLElement
            const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
            if (!sidebar && !mobileSidebar) return
            if (mobile) {
                mobileSidebar.style.top = `${functions.titlebarHeight()}px`
                mobileSidebar.style.height = "auto"
                return
            }
            if (!sidebar) return
            if (!relative) {
                if (!hideTitlebar) {
                    sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                    if (maxHeight !== maxHeight1) setMaxHeight(maxHeight1)
                } else {
                    if (window.scrollY !== 0) {
                        if (hideNavbar && window.scrollY > functions.titlebarHeight()) {
                            sidebar.style.top = "0px"
                            sidebar.style.height = "100vh"
                            if (maxHeight !== maxHeight3) setMaxHeight(maxHeight3)
                        } else {
                            sidebar.style.top = `${functions.navbarHeight()}px`
                            sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                            if (maxHeight !== maxHeight2) setMaxHeight(maxHeight2)
                        }
                    } else {
                        sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                        sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                        if (maxHeight !== maxHeight1) setMaxHeight(maxHeight1)
                    }
                }
            } else {
                sidebar.style.top = "0px"
                sidebar.style.height = "auto"
                if (maxHeight !== maxHeight3) setMaxHeight(maxHeight3)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            setTimeout(() => {
                window.removeEventListener("scroll", scrollHandler)
            }, 10)
        }
    }, [relative, hideTitlebar, hideNavbar])

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
        if (!sidebar && !mobileSidebar) return
        if (mobile) {
            mobileSidebar.style.top = `${functions.titlebarHeight()}px`
            mobileSidebar.style.height = "auto"
            return
        }
        if (!sidebar) return
        if (!relative) {
            if (!hideTitlebar) {
                sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                if (maxHeight !== maxHeight1) setMaxHeight(maxHeight1)
            } else {
                if (window.scrollY !== 0) {
                    if (hideNavbar && window.scrollY > functions.titlebarHeight()) {
                        sidebar.style.top = "0px"
                        sidebar.style.height = "100vh"
                        if (maxHeight !== maxHeight3) setMaxHeight(maxHeight3)
                    } else {
                        sidebar.style.top = `${functions.navbarHeight()}px`
                        sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                        if (maxHeight !== maxHeight2) setMaxHeight(maxHeight2)
                    }
                } else {
                    sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                    if (maxHeight !== maxHeight1) setMaxHeight(maxHeight1)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxHeight !== maxHeight3) setMaxHeight(maxHeight3)
        }
    }, [hideTitlebar, relative, mobile])

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
        if (!sidebar && !mobileSidebar) return
        if (mobile) {
            mobileSidebar.style.top = `${functions.titlebarHeight()}px`
            mobileSidebar.style.height = "auto"
            return
        }
        if (!sidebar) return
        if (!relative) {
            if (!hideNavbar) {
                if (!hideTitlebar) {
                    sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                    if (maxHeight !== maxHeight1) setMaxHeight(maxHeight1)
                } else {
                    sidebar.style.top = `${functions.navbarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                    if (maxHeight !== maxHeight2) setMaxHeight(maxHeight2)
                }
                return
            }
            if (!hideSortbar) {
                if (sidebar.style.top === "0px") {
                    sidebar.style.top = `${functions.navbarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                    if (maxHeight !== maxHeight2) setMaxHeight(maxHeight2)
                }
            } else {
                if (sidebar.style.top === `${functions.navbarHeight()}px`) {
                    sidebar.style.top = "0px"
                    sidebar.style.height = "100vh"
                    if (maxHeight !== maxHeight3) setMaxHeight(maxHeight3)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxHeight !== maxHeight3) setMaxHeight(maxHeight3)
        }
    }, [hideSortbar, hideNavbar, hideTitlebar, mobile])

    const getAutoSearch = () => {
        if (autoSearch) {
            return autoSearchActiveIcon
        } else {
            return autoSearchIcon
        }
    }

    const getSaveSearch = () => {
        if (saveSearch) {
            return saveSearchActiveIcon
        } else {
            return saveSearchIcon
        }
    }

    const tagInfo = (event: React.MouseEvent, tag?: string) => {
        if (!tag) return
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${tag}`, "_blank")
        } else {
            history.push(`/tag/${tag}`)
        }
        setTagToolTipEnabled(false)
    }

    const tagMouseEnter = (event: React.MouseEvent, tag?: string) => {
        if (!tag) return
        tagTooltipTimer = setTimeout(() => {
            setTagToolTipY(event.clientY)
            setTagToolTipTag(tag)
            setTagToolTipEnabled(true)
        }, 200)
    }

    const tagMouseLeave = () => {
        if (tagTooltipTimer) clearTimeout(tagTooltipTimer)
        setTagToolTipEnabled(false)
    }

    const generateArtistsJSX = () => {
        if (!props.artists) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.artists.length; i++) {
            if (!props.artists[i]) break
            const link = functions.getTagLink("artist", props.artists[i].image, props.artists[i].imageHash)
            const tagClick = () => {
                if (!props.artists) return
                history.push(`/posts`)
                setSearch(props.artists[i].tag)
                setSearchFlag(true)
            }
            const artistSocials = () => {
                if (!props.artists) return
                let jsx = [] as React.ReactElement[]
                if (props.artists[i].website) {
                    jsx.push(<img className="sidebar-social" src={website} onClick={() => window.open(props.artists?.[i].website!, "_blank")}/>)
                }
                if (props.artists[i].social?.includes("pixiv.net")) {
                    jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.artists?.[i].social!, "_blank")}/>)
                } else if (props.artists[i].social?.includes("soundcloud.com")) {
                    jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.artists?.[i].social!, "_blank")}/>)
                } else if (props.artists[i].social?.includes("sketchfab.com")) {
                    jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.artists?.[i].social!, "_blank")}/>)
                }
                if (props.artists[i].twitter) {
                    jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.artists?.[i].twitter!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                    {link ?
                    <div className="sidebar-row">
                        <img className="sidebar-img" src={link}/>
                    </div> : null}
                    <div className="sidebar-row">
                        <span className="tag-hover" onMouseEnter={(event) => tagMouseEnter(event, props.artists?.[i].tag)}>
                            <img className="tag-info" src={question} onClick={(event) => tagInfo(event, props.artists?.[i].tag)} onAuxClick={(event) => tagInfo(event, props.artists?.[i].tag)}/>
                            <span className="tag artist-tag-color" onClick={() => tagClick()} onContextMenu={(event) => tagInfo(event, props.artists?.[i].tag)}>{props.artists[i].tag.replaceAll("-", " ")}</span>
                            {artistSocials()}
                            <span className={`tag-count ${props.artists[i].count === "1" ? "artist-tag-color" : ""}`}>{props.artists[i].count}</span>
                        </span>
                    </div>
                </>)
        }
        return jsx
    }

    const generateCharactersJSX = () => {
        if (!props.characters) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.characters.length; i++) {
            if (!props.characters[i]) break
            const link = functions.getTagLink("character", props.characters[i].image, props.characters[i].imageHash)
            const tagClick = () => {
                if (!props.characters) return
                history.push(`/posts`)
                setSearch(props.characters[i].tag)
                setSearchFlag(true)
            }
            const characterSocials = () => {
                if (!props.characters) return
                let jsx = [] as React.ReactElement[] 
                if (props.characters[i].fandom) {
                    jsx.push(<img className="sidebar-social" src={fandom} onClick={() => window.open(props.characters?.[i].fandom!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="sidebar-row">
                    <img className="sidebar-img" src={link}/>
                </div> : null}
                <div className="sidebar-row">
                    <span className="tag-hover" onMouseEnter={(event) => tagMouseEnter(event, props.characters?.[i].tag)}>
                        <img className="tag-info" src={question} onClick={(event) => tagInfo(event, props.characters?.[i].tag)} onAuxClick={(event) => tagInfo(event, props.characters?.[i].tag)}/>
                        <span className="tag character-tag-color" onClick={() => tagClick()} onContextMenu={(event) => tagInfo(event, props.characters?.[i].tag)}>{props.characters[i].tag.replaceAll("-", " ")}</span>
                        {characterSocials()}
                        <span className={`tag-count ${props.characters[i].count === "1" ? "artist-tag-color" : ""}`}>{props.characters[i].count}</span>
                    </span>
                </div> </>
                )
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        if (!props.series) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.series.length; i++) {
            if (!props.series[i]) break
            const link = functions.getTagLink("series", props.series[i].image, props.series[i].imageHash)
            const tagClick = () => {
                if (!props.series) return
                history.push(`/posts`)
                setSearch(props.series[i].tag)
                setSearchFlag(true)
            }
            const seriesSocials = () => {
                if (!props.series) return
                let jsx = [] as React.ReactElement[] 
                if (props.series[i].website) {
                    jsx.push(<img className="sidebar-social" src={website} onClick={() => window.open(props.series?.[i].website!, "_blank")}/>)
                }
                if (props.series[i].twitter) {
                    jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.series?.[i].twitter!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="sidebar-row">
                    <img className="sidebar-img" src={link}/>
                </div> : null}
                <div className="sidebar-row">
                    <span className="tag-hover" onMouseEnter={(event) => tagMouseEnter(event, props.series?.[i].tag)}>
                        <img className="tag-info" src={question} onClick={(event) => tagInfo(event, props.series?.[i].tag)} onAuxClick={(event) => tagInfo(event, props.series?.[i].tag)}/>
                        <span className="tag series-tag-color" onClick={() => tagClick()} onContextMenu={(event) => tagInfo(event, props.series?.[i].tag)}>{props.series[i].tag.replaceAll("-", " ")}</span>
                        {seriesSocials()}
                        <span className={`tag-count ${props.series[i].count === "1" ? "artist-tag-color" : ""}`}>{props.series[i].count}</span>
                    </span>
                </div> </>
                )
        }
        return jsx
    }

    const generateSavedSearchJSX = () => {
        if (!session.username) return null
        let jsx = [] as React.ReactElement[]
        const savedSearches = session.savedSearches || {}
        for (let i = 0; i < Object.keys(savedSearches).length; i++) {
            const name = Object.keys(savedSearches)[i]
            const savedSearch = Object.values(savedSearches)[i]
            const editSavedSearch = () => {
                setEditSaveSearchName(name)
                setEditSaveSearchKey(name)
                setEditSaveSearchTags(savedSearch)
            }
            const savedSearchClick = () => {
                setSearch(savedSearch)
                setSearchFlag(true)
            }
            jsx.push(
                <div className="sidebar-row">
                    <span className="tag-hover">
                        <img className="tag-info" src={editOptIcon} onClick={editSavedSearch} style={{filter: "saturate(35%) brightness(200%)"}}/>
                        <span className="saved-search" onClick={savedSearchClick}>{name}</span>
                    </span>
                </div>
            )

        }
        return jsx
    }

    const organizeTags = () => {
        if (!props.tags) return [] as MiniTag[]
        const meta = props.tags.filter((t) => t.type === "meta")
        const appearance = props.tags.filter((t) => t.type === "appearance")
        const outfit = props.tags.filter((t) => t.type === "outfit")
        const accessory = props.tags.filter((t) => t.type === "accessory")
        const action = props.tags.filter((t) => t.type === "action")
        const scenery = props.tags.filter((t) => t.type === "scenery")
        const tags = props.tags.filter((t) => t.type === "tag")
        return [...meta, ...appearance, ...outfit, ...accessory, ...action, ...scenery, ...tags.reverse()]
    }

    const generateTagJSX = () => {
        if (!props.tags && saveSearch) return generateSavedSearchJSX()
        let jsx = [] as React.ReactElement[]
        let currentTags = props.tags ? organizeTags() : tags
        let max = props.tags ? currentTags.length : Math.min(currentTags.length, 100)
        for (let i = 0; i < max; i++) {
            if (!currentTags[i]) break
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(currentTags[i].tag)
                setSearchFlag(true)
            }
            jsx.push(
                <div className="sidebar-row">
                    <span className="tag-hover" onMouseEnter={(event) => tagMouseEnter(event, currentTags[i].tag)}>
                        <img className="tag-info" src={question} onClick={(event) => tagInfo(event, currentTags[i].tag)} onAuxClick={(event) => tagInfo(event, currentTags[i].tag)}/>
                        <span className={`tag ${functions.getTagColor(currentTags[i])}`} onClick={() => tagClick()} onContextMenu={(event) => tagInfo(event, currentTags[i].tag)}>{currentTags[i].tag.replaceAll("-", " ")}</span>
                        <span className={`tag-count ${currentTags[i].count === "1" ? "artist-tag-color" : ""}`}>{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    const generateSourceJSX = () => {
        if (!props.post) return
        let jsx = [] as React.ReactElement[]
        if (props.post.source) {
            if (props.post.source.includes("pixiv")) {
                jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("soundcloud")) {
                jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("sketchfab")) {
                jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("twitter") || props.post.source.includes("x.com")) {
                jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("deviantart")) {
                jsx.push(<img className="sidebar-social" src={deviantart} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("artstation")) {
                jsx.push(<img className="sidebar-social" src={artstation} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("danbooru")) {
                jsx.push(<img className="sidebar-social" src={danbooru} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("gelbooru")) {
                jsx.push(<img className="sidebar-social" src={gelbooru} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("safebooru")) {
                jsx.push(<img className="sidebar-social" src={safebooru} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("yande.re")) {
                jsx.push(<img className="sidebar-social" src={yandere} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("konachan")) {
                jsx.push(<img className="sidebar-social" src={konachan} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("zerochan")) {
                jsx.push(<img className="sidebar-social" src={zerochan} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("youtube")) {
                jsx.push(<img className="sidebar-social" src={youtube} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("bandcamp")) {
                jsx.push(<img className="sidebar-social" src={bandcamp} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
        }
        return (
            <div className="sidebar-row">
                <span className="tag">{i18n.labels.source}:</span>
                <span className={`tag-alt-link ${props.post.hidden ? "strikethrough" : ""}`} onClick={() => window.open(props.post?.source, "_blank")}>{functions.getSiteName(props.post.source, i18n)}</span>
                {jsx}
            </div>
        )
        return null
    }

    const generateMirrorsJSX = () => {
        if (!props.post) return
        let jsx = [] as React.ReactElement[]
        if (props.post.mirrors) {
            if (props.post.mirrors.pixiv) {
                jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.post?.mirrors?.pixiv, "_blank")}/>)
            }
            if (props.post.mirrors.soundcloud) {
                jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.post?.mirrors?.soundcloud, "_blank")}/>)
            }
            if (props.post.mirrors.sketchfab) {
                jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.post?.mirrors?.sketchfab, "_blank")}/>)
            }
            if (props.post.mirrors.twitter) {
                jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.post?.mirrors?.twitter, "_blank")}/>)
            }
            if (props.post.mirrors.deviantart) {
                jsx.push(<img className="sidebar-social" src={deviantart} onClick={() => window.open(props.post?.mirrors?.deviantart, "_blank")}/>)
            }
            if (props.post.mirrors.artstation) {
                jsx.push(<img className="sidebar-social" src={artstation} onClick={() => window.open(props.post?.mirrors?.artstation, "_blank")}/>)
            }
            if (props.post.mirrors.danbooru) {
                jsx.push(<img className="sidebar-social" src={danbooru} onClick={() => window.open(props.post?.mirrors?.danbooru, "_blank")}/>)
            }
            if (props.post.mirrors.gelbooru) {
                jsx.push(<img className="sidebar-social" src={gelbooru} onClick={() => window.open(props.post?.mirrors?.gelbooru, "_blank")}/>)
            }
            if (props.post.mirrors.safebooru) {
                jsx.push(<img className="sidebar-social" src={safebooru} onClick={() => window.open(props.post?.mirrors?.safebooru, "_blank")}/>)
            }
            if (props.post.mirrors.yandere) {
                jsx.push(<img className="sidebar-social" src={yandere} onClick={() => window.open(props.post?.mirrors?.yandere, "_blank")}/>)
            }
            if (props.post.mirrors.konachan) {
                jsx.push(<img className="sidebar-social" src={konachan} onClick={() => window.open(props.post?.mirrors?.konachan, "_blank")}/>)
            }
            if (props.post.mirrors.zerochan) {
                jsx.push(<img className="sidebar-social" src={zerochan} onClick={() => window.open(props.post?.mirrors?.zerochan, "_blank")}/>)
            }
            if (props.post.mirrors.youtube) {
                jsx.push(<img className="sidebar-social" src={youtube} onClick={() => window.open(props.post?.mirrors?.youtube, "_blank")}/>)
            }
            if (props.post.mirrors.bandcamp) {
                jsx.push(<img className="sidebar-social" src={bandcamp} onClick={() => window.open(props.post?.mirrors?.bandcamp, "_blank")}/>)
            }
        }
        if (jsx.length) {
            return (
                <div className="sidebar-row">
                    <span className="tag">{i18n.labels.mirrors}:</span>
                    {jsx}
                </div>
            )
        }
        return null
    }

    const triggerSearch = () => {
        history.push(`/posts`)
        setSearchFlag(true)
    }

    const randomSearch = async () => {
        if (props.post && history.location.pathname.includes("/post/")) {
            const posts = await functions.get("/api/search/posts", {type: "all", rating: functions.isR18(props.post.rating) ? functions.r18() : "all", style: "all", sort: "random"}, session, setSessionFlag)
            history.push(`/post/${posts[0].postID}/${posts[0].slug}`)
        } else {
            history.push(`/posts`)
            setRandomFlag(true)
        }
    }

    const imageSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const result = await functions.imageSearch(file, session, setSessionFlag)
        setImageSearchFlag(result)
        history.push("/posts")
        event.target.value = ""
    }

    const deletePost = async () => {
        setShowDeletePostDialog(!showDeletePostDialog)
    }

    const editPost = async () => {
        if (!props.post) return
        if (props.unverified) return history.push(`/unverified/edit-post/${props.post.postID}`)
        history.push(`/edit-post/${props.post.postID}`)
    }

    const privatePost = async () => {
        if (!props.post || !props.artists) return
        setPrivatePostObj({postID: props.post.postID, artists: props.artists})
    }

    const lockPost = async () => {
        if (!props.post) return
        setLockPostID(props.post.postID)
    }

    const modNext = () => {
        let currentIndex = unverifiedPosts.findIndex((p) => p.postID === props.post?.postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                history.push(`/unverified/post/${id}`)
            }
        }
        history.push(`/mod-queue`)
    }

    const upscalingDialog = () => {
        setShowUpscalingDialog(!showUpscalingDialog)
    }

    const compressingDialog = () => {
        setShowCompressingDialog(!showCompressingDialog)
    }

    const approvePost = async () => {
        if (!props.post) return
        await functions.post("/api/post/approve", {postID: props.post.postID}, session, setSessionFlag)
        modNext()
    }

    const rejectPost = async () => {
        if (!props.post) return
        await functions.post("/api/post/reject", {postID: props.post.postID}, session, setSessionFlag)
        modNext()
    }

    const triggerSetAvatar = () => {
        if (!props.post) return
        window.scrollTo(0, 0)
        history.push(`/set-avatar/${props.post.postID}`)
    }

    const postHistory = () => {
        if (!props.post) return
        window.scrollTo(0, 0)
        history.push(`/post/history/${props.post.postID}`)
    }
    
    const triggerTagEdit = () => {
        if (!props.post || !props.artists || !props.characters || !props.series || !props.tags) return
        setTagEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            tags: props.tags, unverified: props.unverified})
    }

    const triggerSourceEdit = () => {
        if (!props.post || !props.artists || !props.characters || !props.series || !props.tags) return
        setSourceEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            tags: props.tags, unverified: props.unverified})
    }

    const triggerAddNote = () => {
        window.scrollTo(0, 0)
        const newMode = !noteMode
        setNoteMode(newMode)
        if (newMode) setNoteDrawingEnabled(true)
    }

    const triggerParent = () => {
        if (!props.post) return
        setChildPostObj({post: props.post, unverified: props.unverified})
    }

    const triggerGroup = () => {
        if (!props.post) return
        setGroupPostID(props.post.postID)
    }

    const triggerTakedown = () => {
        setShowTakedownPostDialog(!showTakedownPostDialog)
    }

    const generateUsernameJSX = (type?: string) => {
        if (!props.post) return
        let username = props.post.uploader
        let role = uploaderRole
        if (type === "updater") {
            username = props.post.updater 
            role = updaterRole
        }
        if (type === "approver") {
            username = props.post.approver 
            role = approverRole
        }
        if (role === "admin") {
            return (
                <div className="sidebar-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                     <span className="tag-alt admin-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="sidebar-user-label" src={adminCrown}/>
                </div>
            )
        } else if (role === "mod") {
            return (
                <div className="sidebar-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                    <span className="tag-alt mod-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="sidebar-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="tag-alt-link" onClick={() => username ? history.push(`/user/${username}`) : null}>{functions.toProperCase(username) || "deleted"}</span>
    }

    const copyTags = (replaceDash?: boolean, commas?: boolean) => {
        if (!props.artists || !props.characters || !props.series || !props.tags) return
        const artists = props.artists.map((a) => a.tag)
        const characters = props.characters.map((c) => c.tag)
        const series = props.series.map((s) => s.tag)
        const tags = props.tags.map((t) => t.tag)
        let combined = [...artists, ...characters, ...series, ...tags]
        if (replaceDash) combined = combined.map((c: string) => c.replaceAll("-", " "))
        navigator.clipboard.writeText(commas ? combined.join(", ") : combined.join(" "))
        setActionBanner("copy-tags")
    }

    const copyHash = () => {
        if (!props.post || !props.order) return
        const image = props.post.images[props.order-1]
        if (typeof image === "string") return
        navigator.clipboard.writeText(image.hash)
        setActionBanner("copy-hash")
    }

    const copyTagsJSX = () => {
        if (!session) return
        if (session.captchaNeeded) return null
        if (props.artists && props.characters && props.series && props.tags) {
            return (
                <div className="sidebar-subcontainer">
                    <div className="sidebar-row">
                        <span className="tag-hover" onClick={() => copyTags()} onContextMenu={(event) => {event.preventDefault(); copyTags(true, true)}}>
                            <img className="sidebar-icon" src={tagIcon}/>
                            <span className="tag-red">{i18n.sidebar.copyTags}</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const tagCaptchaJSX = () => {
        if (!session) return
        if (session.captchaNeeded) {
            if (!history.location.pathname.includes("/post/") && !history.location.pathname.includes("/edit-post")) return
            const toggleCaptcha = () => {
                sessionStorage.setItem("ignoreCaptcha", "false")
                history.go(0)
            }
            return (
                <div className="sidebar-subcontainer">
                    <div className="sidebar-row">
                        <span className="tag-hover" onClick={toggleCaptcha}>
                            <img className="sidebar-icon" src={tagIcon}/>
                            <span className="tag-red">{i18n.sidebar.unlockPost}</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const filetypeJSX = () => {
        if (props.post && props.unverified) {
            const image = (props.post as UnverifiedPost).images[(props.order || 1) - 1]
            const originalSize = image.size ? functions.readableFileSize(image.size) : ""
            const upscaledSize = image.upscaledSize ? functions.readableFileSize(image.upscaledSize) : ""
            const originalExt = path.extname(image?.filename || "").replace(".", "")
            const upscaledExt = path.extname(image?.upscaledFilename || "").replace(".", "")
            return (
                <div className="sidebar-subcontainer">
                    {originalSize ? 
                    <div className="sidebar-row">
                        <span className="tag artist-tag-color">{i18n.labels.size}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{originalSize}</span>
                    </div> : null}
                    {upscaledSize ? 
                    <div className="sidebar-row">
                        <span className="tag artist-tag-color">{i18n.labels.upscaledSize}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{upscaledSize}</span>
                    </div> : null}
                    {originalExt ? 
                    <div className="sidebar-row">
                        <span className="tag artist-tag-color">{i18n.labels.fileType}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{originalExt}</span>
                    </div> : null}
                    {upscaledExt ? 
                    <div className="sidebar-row">
                        <span className="tag artist-tag-color">{i18n.labels.upscaledFileType}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{upscaledExt}</span>
                    </div> : null}
                </div>
            )
        }
    }

    const noTagsArtist = () => {
        if (!props.post || !session) return
        if (session.captchaNeeded) {
            return (
                <div className="sidebar-row">
                    <span className="tag">{i18n.tag.artist}:</span>
                    <span className="tag-alt">{props.post.artist || "None"}</span>
                </div>
            )
        }
    }

    useEffect(() => {
        window.clearInterval(interval)
        if (autoSearch && history.location.pathname.includes("/post/")) {
            const searchLoop = async () => {
                if (!props.post || !autoSearch) return
                const posts = await functions.get("/api/search/posts", {type: "all", rating: functions.isR18(props.post.rating) ? functions.r18() : "all", style: "all", sort: "random", limit: 1}, session, setSessionFlag)
                history.push(`/post/${posts[0].postID}/${posts[0].slug}`)
            }
            if (autoSearch) {
                interval = window.setInterval(searchLoop, Math.floor(Number(session.autosearchInterval || 3000)))
            }
        } else if (autoSearch && !history.location.pathname.includes("/posts")) {
            history.push("/posts")
        }
        return () => {
            window.clearInterval(interval)
        }
    }, [session, autoSearch])

    const toggleAutoSearch = async () => {
        if (permissions.isPremium(session)) {
            setAutoSearch(!autoSearch)
        } else {
            setPremiumRequired(true)
        }
    }

    const subcontainerHeight = () => {
        if (props.post) return "max-content"
        if (saveSearch) return `${maxHeight - 30}px`
        return `${maxHeight}px`
    }

    if (mobile) return (
        <>
        <div className={`mobile-sidebar ${relative ? "mobile-sidebar-relative" : ""} ${mobileScrolling ? "hide-mobile-sidebar" : ""}`}>
            <div className="mobile-search-container">
                <input className="mobile-search" type="search" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? triggerSearch() : null} onFocus={(event) => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                <button className="search-mobile-button" style={{filter: getFilterSearch()}} onClick={triggerSearch}>
                    <img src={searchIcon}/>
                </button>
                <label style={{display: "flex", width: "max-content", height: "max-content"}} htmlFor="image-search">
                    <div className="search-mobile-button" style={{filter: getFilterSearch()}}>
                        <img src={searchImage}/>
                    </div>
                </label>
                <input id="image-search" type="file" onChange={(event) => imageSearch(event)}/>
                <button className="search-mobile-button" style={{filter: getFilterSearch()}} onClick={randomSearch}>
                    <img src={random}/>
                </button>
            </div>
        </div>
        <SearchSuggestions active={suggestionsActive} sticky={true}/>
        </>
    )

    return (
        <>
        <SearchSuggestions active={suggestionsActive}/>
        <div className={`sidebar ${hideSidebar ? "hide-sidebar" : ""} ${hideTitlebar ? "sidebar-top" : ""}
        ${relative ? "sidebar-relative" : ""}`} onMouseEnter={() => {setEnableDrag(false); setSidebarHover(true)}} onMouseLeave={() => {setSidebarHover(false); tagMouseLeave()}}>
            <div className="sidebar-container">
            <div className="sidebar-content">
                {sidebarText ?
                <div className="sidebar-text-container">
                    <span className="sidebar-text">{sidebarText}</span>
                </div> : null}
                <div className="search-container" onMouseEnter={() => setEnableDrag(false)}>
                    <input className="search" type="search" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? triggerSearch() : null} onFocus={() => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                    <button className="search-button" style={{filter: getFilterSearch()}} onClick={triggerSearch}>
                        <img src={searchIcon}/>
                    </button>
                    <label style={{display: "flex", width: "max-content", height: "max-content"}} htmlFor="image-search">
                        <div className="search-button" style={{filter: getFilterSearch()}}>
                            <img src={searchImage}/>
                        </div>
                    </label>
                    <input id="image-search" type="file" onChange={(event) => imageSearch(event)}/>
                </div>
                <div className="random-container">
                    <button className="random-button" style={{filter: getFilterRandom()}} onClick={randomSearch}>
                        <span>{i18n.sort.random}</span>
                        <img src={random}/>
                    </button>
                    {session.username ? <img className="autosearch" style={{filter: getFilter()}} src={getAutoSearch()} onClick={toggleAutoSearch}/> : null}
                    {!props.post && session.username ? <img className="autosearch" style={{filter: getFilter()}} src={getSaveSearch()} onClick={() => setSaveSearch(!saveSearch)}/> : null}
                </div>
                {!props.post && session.username && saveSearch ? 
                <div className="random-container">
                    <button className="save-search-button" style={{filter: getFilterSearch()}} onClick={() => setSaveSearchDialog(!saveSearchDialog)}>
                        <img src={bookmark}/>
                        <span>{i18n.sidebar.saveSearch}</span>
                    </button>
                    <img className="autosearch" style={{filter: getFilter()}} src={deleteOptIcon} onClick={() => setDeleteAllSaveSearchDialog(!deleteAllSaveSearchDialog)}/>
                </div> : null}

                {copyTagsJSX()}
                {tagCaptchaJSX()}
                {filetypeJSX()}

                {props.post && props.artists ?
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{props.artists.length > 1 ? i18n.navbar.artists : i18n.tag.artist}</span>
                        </div>
                        {generateArtistsJSX()}
                        {noTagsArtist()}
                        <div className="sidebar-row">
                            <span className="tag">{i18n.labels.title}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.title || "None"}</span>
                        </div>
                        {props.post.englishTitle ? 
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.english}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{functions.toProperCase(props.post.englishTitle)}</span>
                        </div>
                        : null}
                        <div className="sidebar-row">
                            <span className="tag">{i18n.tag.artist}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.artist || "?"}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sort.posted}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.posted ? functions.formatDate(new Date(props.post.posted)) : "Unknown"}</span>
                        </div>
                        {generateSourceJSX()}
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sort.bookmarks}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.bookmarks ? props.post.bookmarks : "?"}</span>
                        </div>
                        {generateMirrorsJSX()}
                    </div>
                : null}

                {props.characters ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{props.characters.length > 1 ? i18n.navbar.characters : i18n.tag.character}</span>
                        </div>
                        {generateCharactersJSX()}
                    </div>
                : null}

                {props.series ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{i18n.tag.series}</span>
                        </div>
                        {generateSeriesJSX()}
                    </div>
                : null}

                <div className="sidebar-subcontainer" style={{height: subcontainerHeight()}}>
                    {props.tags ?
                        <div className="sidebar-row">
                            <span className="sidebar-title">{i18n.navbar.tags}</span>
                        </div>
                    : null}
                    {generateTagJSX()}
                </div>

                {props.post ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{i18n.sidebar.details}</span>
                        </div>
                        <div className="sidebar-row">
                            <img className="sidebar-img" src={uploaderImage}/>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.uploader}:</span>
                            {generateUsernameJSX("uploader")}
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.uploaded}:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.uploadDate))}</span>
                        </div>
                        {props.post.uploadDate !== props.post.updatedDate ? <>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.updater}:</span>
                            {generateUsernameJSX("updater")}
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.updated}:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.updatedDate))}</span>
                        </div> </> : null}
                        {props.post.approver && props.post.uploader !== props.post.approver ? <>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.approver}:</span>
                            {generateUsernameJSX("approver")}
                        </div> 
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.approved}:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.approveDate))}</span>
                        </div> </> : null}
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.type}:</span>
                            <span className="tag-alt">{i18n.sortbar.type[props.post.type]}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.rating}:</span>
                            <span className="tag-alt">{i18n.sortbar.rating[props.post.rating]}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sidebar.style}:</span>
                            <span className="tag-alt">{i18n.sortbar.style[props.post.style]}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sort.favorites}:</span>
                            <span className="tag-alt">{(props.post as PostSearch).favoriteCount || 0}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">{i18n.sort.cuteness}:</span>
                            <span className="tag-alt">{(props.post as PostSearch).cuteness || 500}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={() => copyHash()} onAuxClick={() => copyHash()} onContextMenu={(event) => {event.preventDefault(); copyHash()}}>
                                <img className="sidebar-icon" src={hashIcon} style={{filter: getFilter()}}/>
                                <span className="tag">{i18n.sidebar.copyHash}</span>
                            </span>
                        </div>
                    </div>
                : null}  

                {props.post && session.username && !props.noActions ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerTagEdit}>
                                <img className="sidebar-icon" src={tagEdit} style={{filter: getFilter()}}/>
                                <span className="tag">{i18n.sidebar.tagEdit}</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerSourceEdit}>
                                <img className="sidebar-icon" src={sourceEdit} style={{filter: getFilter()}}/>
                                <span className="tag">{i18n.sidebar.sourceEdit}</span>
                            </span>
                        </div>
                        {!props.unverified && !functions.isR18(props.post.rating) ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerSetAvatar}>
                                <img className="sidebar-icon" src={setAvatar} style={{filter: getFilter()}}/>
                                <span className="tag">{i18n.sidebar.setAvatar}</span>
                            </span>
                        </div> : null}
                        {!props.unverified ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerParent}>
                                <img className="sidebar-icon" src={parent} style={{filter: getFilter()}}/>
                                <span className="tag">{i18n.sidebar.addParent}</span>
                            </span>
                        </div> : null}
                        {!props.unverified ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerGroup}>
                                <img className="sidebar-icon" src={group} style={{filter: getFilter()}}/>
                                <span className="tag">{i18n.sidebar.addGroup}</span>
                            </span>
                        </div> : null}
                        {!props.unverified ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerAddNote}>
                                <img className="sidebar-icon" src={addNote} style={{filter: getFilter()}}/>
                                <span className="tag">{i18n.sidebar.addNote}</span>
                            </span>
                        </div> : null}
                        {!props.unverified && permissions.canPrivate(session, props.artists) ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={privatePost}>
                                <img className="sidebar-icon" src={props.post.private ? unprivateIcon : privateIcon} style={{filter: getFilter()}}/>
                                <span className="tag">{props.post.private ? i18n.sidebar.unprivate : i18n.sort.private}</span>
                            </span>
                        </div> : null}
                        {!props.unverified && permissions.isMod(session) ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerTakedown}>
                                <img className="sidebar-icon" src={props.post.hidden ? restore : takedown} style={{filter: getFilter()}}/>
                                <span className="tag">{props.post.hidden ? i18n.sidebar.restore : i18n.sidebar.takedown}</span>
                            </span>
                        </div> : null}
                        {permissions.isMod(session) && props.unverified ? <>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={compressingDialog}>
                                <img className="sidebar-icon" src={compressIcon}/>
                                <span className="tag">{i18n.buttons.compress}</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={upscalingDialog}>
                                <img className="sidebar-icon" src={upscaleIcon}/>
                                <span className="tag">{i18n.buttons.upscale}</span>
                            </span>
                        </div></> : null}
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={editPost}>
                                <img className="sidebar-icon" src={edit}/>
                                <span className="tag-red">{i18n.buttons.edit}</span>
                            </span>
                        </div>
                        {permissions.isMod(session) && props.unverified ? <>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={approvePost}>
                                <img className="sidebar-icon" src={approveGreen}/>
                                <span className="tag-green">{i18n.buttons.approve}</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={rejectPost}>
                                <img className="sidebar-icon" src={rejectRed}/>
                                <span className="tag-red">{i18n.buttons.reject}</span>
                            </span>
                        </div>
                        </> : null}
                        {!props.unverified && permissions.isMod(session) ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={lockPost}>
                                <img className="sidebar-icon" src={props.post.locked ? unlockIcon : lockIcon}/>
                                <span className="tag-red">{props.post.locked ? i18n.sidebar.unlock : i18n.sidebar.lock}</span>
                            </span>
                        </div> : null}
                        {!props.unverified ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={postHistory}>
                                <img className="sidebar-icon" src={historyIcon}/>
                                <span className="tag-red">{i18n.sidebar.history}</span>
                            </span>
                        </div> : null}
                        {!props.unverified ?
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={deletePost}>
                                <img className="sidebar-icon" src={deleteIcon}/>
                                <span className="tag-red">{i18n.buttons.delete}</span>
                            </span>
                        </div> : null}
                    </div>
                : null}
            </div>

            <div className="sidebar-footer">
                    <span className="sidebar-footer-text">©{new Date().getFullYear()} Moepictures</span>
                    <Link to="/terms">
                        <img className="sidebar-footer-icon" src={terms} style={{filter: getFilter()}}/>
                    </Link>
                    <Link to="/contact">
                        <img className="sidebar-footer-icon" src={contact} style={{filter: getFilter()}}/>
                    </Link>
                    {/* <img className="sidebar-footer-icon" src={code} style={{filter: getFilter()}} onClick={() => window.open(pack.repository.url, "_blank")}/> */}
                </div>
            </div>
        </div>
        </>
    )
}

export default SideBar