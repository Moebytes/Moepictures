import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, HideNavbarContext, HideSortbarContext, EnableDragContext, MobileContext, UnverifiedPostsContext,
RelativeContext, HideTitlebarContext, SearchContext, SearchFlagContext, PostsContext, ShowDeletePostDialogContext,
TagsContext, RandomFlagContext, ImageSearchFlagContext, SessionContext, QuickEditIDContext, QuickEditUnverifiedContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import searchIcon from "../assets/purple/search.png"
import searchImage from "../assets/purple/search-image.png"
import searchMagenta from "../assets/magenta/search.png"
import searchImageMagenta from "../assets/magenta/search-image.png"
import searchPurpleLight from "../assets/purple-light/search.png"
import searchImagePurpleLight from "../assets/purple-light/search-image.png"
import searchMagentaLight from "../assets/magenta-light/search.png"
import searchImageMagentaLight from "../assets/magenta-light/search-image.png"
import random from "../assets/purple/random.png"
import randomMagenta from "../assets/magenta/random.png"
import randomPurpleLight from "../assets/purple-light/random.png"
import randomMagentaLight from "../assets/magenta-light/random.png"
import randomMobile from "../assets/purple/random-mobile.png"
import randomMobileMagenta from "../assets/magenta/random-mobile.png"
import randomMobilePurpleLight from "../assets/purple-light/random-mobile.png"
import randomMobileMagentaLight from "../assets/magenta-light/random-mobile.png"
import terms from "../assets/purple/terms.png"
import termsMagenta from "../assets/magenta/terms.png"
import termsPurpleLight from "../assets/purple-light/terms.png"
import termsMagentaLight from "../assets/magenta-light/terms.png"
import contact from "../assets/purple/contact.png"
import contactMagenta from "../assets/magenta/contact.png"
import contactPurpleLight from "../assets/purple-light/contact.png"
import contactMagentaLight from "../assets/magenta-light/contact.png"
import code from "../assets/purple/code.png"
import codeMagenta from "../assets/magenta/code.png"
import codePurpleLight from "../assets/purple-light/code.png"
import codeMagentaLight from "../assets/magenta-light/code.png"
import artistImg from "../assets/images/artist.png"
import setAvatar from "../assets/purple/setavatar.png"
import setAvatarMagenta from "../assets/magenta/setavatar.png"
import addTranslation from "../assets/purple/addtranslation.png"
import addTranslationMagenta from "../assets/magenta/addtranslation.png"
import report from "../assets/purple/report.png"
import reportMagenta from "../assets/magenta/report.png"
import edit from "../assets/purple/edit.png"
import editMagenta from "../assets/magenta/edit.png"
import historyIcon from "../assets/purple/history.png"
import historyMagenta from "../assets/magenta/history.png"
import quickEdit from "../assets/purple/quickedit.png"
import quickEditMagenta from "../assets/magenta/quickedit.png"
import deleteIcon from "../assets/purple/delete.png"
import deleteIconMagenta from "../assets/magenta/delete.png"
import rejectRed from "../assets/purple/reject-red.png"
import approveGreen from "../assets/purple/approve-green.png"
import adminCrown from "../assets/purple/admin-crown.png"
import modCrown from "../assets/purple/mod-crown.png"
import functions from "../structures/Functions"
import axios from "axios"
import "./styles/mobileinfo.less"

interface Props {
    post?: any
    artists?: any 
    characters?: any 
    series?: any
    tags?: any
    unverified?: boolean
}

const MobileInfo: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {unverifiedPosts, setUnverifiedPosts} = useContext(UnverifiedPostsContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {tags, setTags} = useContext(TagsContext)
    const {randomFlag, setRandomFlag} = useContext(RandomFlagContext)
    const {imageSearchFlag, setImageSearchFlag} = useContext(ImageSearchFlagContext)
    const {showDeletePostDialog, setShowDeletePostDialog} = useContext(ShowDeletePostDialogContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const [maxTags, setMaxTags] = useState(23)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const {quickEditID, setQuickEditID} = useContext(QuickEditIDContext)
    const {quickEditUnverified, setQuickEditUnverified} = useContext(QuickEditUnverifiedContext)
    const history = useHistory()

    const updateTags = async () => {
        const tags = await functions.parseTags(posts)
        setTags(tags)
    }

    const getFavicon = () => {
        if (theme.includes("magenta")) return faviconMagenta 
        return favicon
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await axios.get("/api/user", {params: {username: props.post.uploader}, withCredentials: true}).then((r) => r.data)
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image) : getFavicon())
            if (uploader?.role) setUploaderRole(uploader.role)
            const updater = await axios.get("/api/user", {params: {username: props.post.updater}, withCredentials: true}).then((r) => r.data)
            if (updater?.role) setUpdaterRole(updater.role)
        }
    }

    useEffect(() => {
        updateTags()
        updateUserImg()
    }, [])

    useEffect(() => {
        updateUserImg()
    }, [props.post])

    useEffect(() => {
        updateTags()
    }, [posts])

    const getSearchIcon = () => {
        if (theme === "purple") return searchIcon
        if (theme === "purple-light") return searchPurpleLight
        if (theme === "magenta") return searchMagenta
        if (theme === "magenta-light") return searchMagentaLight
        return searchIcon
    }

    const getSearchImageIcon = () => {
        if (theme === "purple") return searchImage
        if (theme === "purple-light") return searchImagePurpleLight
        if (theme === "magenta") return searchImageMagenta
        if (theme === "magenta-light") return searchImageMagentaLight
        return searchImage
    }

    const getRandomIcon = () => {
        if (theme === "purple") return random
        if (theme === "purple-light") return randomPurpleLight
        if (theme === "magenta") return randomMagenta
        if (theme === "magenta-light") return randomMagentaLight
        return random
    }

    const getRandomMobileIcon = () => {
        if (theme === "purple") return randomMobile
        if (theme === "purple-light") return randomMobilePurpleLight
        if (theme === "magenta") return randomMobileMagenta
        if (theme === "magenta-light") return randomMobileMagentaLight
        return randomMobile
    }

    const getTermsIcon = () => {
        if (theme === "purple") return terms
        if (theme === "purple-light") return termsPurpleLight
        if (theme === "magenta") return termsMagenta
        if (theme === "magenta-light") return termsMagentaLight
        return terms
    }

    const getContactIcon = () => {
        if (theme === "purple") return contact
        if (theme === "purple-light") return contactPurpleLight
        if (theme === "magenta") return contactMagenta
        if (theme === "magenta-light") return contactMagentaLight
        return contact
    }

    const getCodeIcon = () => {
        if (theme === "purple") return code
        if (theme === "purple-light") return codePurpleLight
        if (theme === "magenta") return codeMagenta
        if (theme === "magenta-light") return codeMagentaLight
        return code
    }

    const getSetAvatar = () => {
        if (theme.includes("magenta")) return setAvatarMagenta
        return setAvatar
    }

    const getAddTranslation = () => {
        if (theme.includes("magenta")) return addTranslationMagenta
        return addTranslation
    }

    const getReport = () => {
        if (theme.includes("magenta")) return reportMagenta
        return report
    }

    const getEdit = () => {
        if (theme.includes("magenta")) return editMagenta
        return edit
    }

    const getHistory = () => {
        if (theme.includes("magenta")) return historyMagenta
        return historyIcon
    }

    const getDeleteIcon = () => {
        if (theme.includes("magenta")) return deleteIconMagenta
        return deleteIcon
    }

    const getQuickEdit = () => {
        if (theme.includes("magenta")) return quickEditMagenta
        return quickEdit
    }

    const generateArtistsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.artists.length; i++) {
            const link = functions.getTagLink("artist", props.artists[i].image)
            if (!props.artists[i]) break
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.artists[i].tag)
                setSearchFlag(true)
            }
            jsx.push(<>
                    {link ?
                    <div className="mobileinfo-row">
                        <img className="mobileinfo-img" src={link}/>
                    </div> : null}
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={() => tagClick()}>
                            <span className="tag">{props.artists[i].tag.replaceAll("-", " ")}</span>
                            <span className="tag-count">{props.artists[i].count}</span>
                        </span>
                    </div>
                </>)
        }
        return jsx
    }

    const generateCharactersJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.characters.length; i++) {
            const link = functions.getTagLink("character", props.characters[i].image)
            if (!props.characters[i]) break
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.characters[i].tag)
                setSearchFlag(true)
            }
            jsx.push(<>
                {link ?
                <div className="mobileinfo-row">
                    <img className="mobileinfo-img" src={link}/>
                </div> : null}
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{props.characters[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{props.characters[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.series.length; i++) {
            const link = functions.getTagLink("series", props.series[i].image)
            if (!props.series[i]) break
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.series[i].tag)
                setSearchFlag(true)
            }
            jsx.push(<>
                {link ?
                <div className="mobileinfo-row">
                    <img className="mobileinfo-img" src={link}/>
                </div> : null}
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{props.series[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{props.series[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateTagJSX = () => {
        let jsx = [] as any
        let currentTags = props.tags ? props.tags : tags
        let max = currentTags.length > maxTags ? maxTags : currentTags.length
        for (let i = 0; i < max; i++) {
            if (!currentTags[i]) break
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(currentTags[i].tag)
                setSearchFlag(true)
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{currentTags[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    const getDomain = () => {
        if (props.post.link) {
            const domain = new URL(props.post.link).hostname.replace("www.", "")
            .split(".")?.[0] || ""
            if (domain.toLowerCase() === "yande") return "Yandere"
            return functions.toProperCase(domain)
        }
        return "Unknown"
    }

    const triggerSearch = () => {
        history.push(`/posts`)
        setSearchFlag(true)
    }

    const randomSearch = () => {
        history.push(`/posts`)
        setRandomFlag(true)
    }

    const imageSearch = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const result = await functions.imageSearch(file)
        setImageSearchFlag(result)
        history.push("/posts")
        event.target.value = ""
    }

    const deletePost = async () => {
        setShowDeletePostDialog((prev: boolean) => !prev)
    }

    const editPost = async () => {
        if (props.unverified) return history.push(`/unverified/edit-post/${props.post.postID}`)
        history.push(`/edit-post/${props.post.postID}`)
    }

    const modNext = () => {
        let currentIndex = unverifiedPosts.findIndex((p: any) => p.postID === props.post.postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                history.push(`/unverified/post/${id}`)
            }
        }
        history.push(`/mod-queue`)
    }

    const approvePost = async () => {
        await axios.post("/api/post/approve", {postID: props.post.postID}, {withCredentials: true})
        modNext()
    }

    const rejectPost = async () => {
        await axios.post("/api/post/reject", {postID: props.post.postID}, {withCredentials: true})
        modNext()
    }

    const triggerSetAvatar = () => {
        window.scrollTo(0, 0)
        history.push(`/set-avatar/${props.post.postID}`)
    }

    const triggerQuickEdit = () => {
        if (props.unverified) {
            setQuickEditUnverified(true)
        } else {
            setQuickEditUnverified(false)
        }
        setQuickEditID(props.post.postID)
    }

    const generateUsernameJSX = (type?: string) => {
        let username = type === "uploader" ? props.post.uploader : props.post.updater 
        const role = type === "uploader" ? uploaderRole : updaterRole
        if (role === "admin") {
            return (
                <div className="mobileinfo-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                     <span className="tag-alt admin-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="mobileinfo-user-label" src={adminCrown}/>
                </div>
            )
        } else if (role === "mod") {
            return (
                <div className="mobileinfo-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                    <span className="tag-alt mod-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="mobileinfo-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="tag-alt-link" onClick={() => username ? history.push(`/user/${username}`) : null}>{functions.toProperCase(username) || "deleted"}</span>
    }

    return (
        <div className="mobileinfo" onMouseEnter={() => setEnableDrag(false)}>
            <div className="mobileinfo-container">
            <div className="mobileinfo-content">
                {props.artists ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.artists.length > 1 ? "Artists" : "Artist"}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateArtistsJSX()}
                        <div className="mobileinfo-row">
                            <span className="tag">Title:</span>
                            <span className="tag-alt">{props.post.title || "None"}</span>
                        </div>
                        {props.post.translatedTitle ? 
                        <div className="mobileinfo-row">
                            <span className="tag">Translated:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.translatedTitle)}</span>
                        </div>
                        : null}
                        <div className="mobileinfo-row">
                            <span className="tag">Drawn:</span>
                            <span className="tag-alt">{props.post.drawn ? functions.formatDate(new Date(props.post.drawn)) : "Unknown"}</span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag">Source:</span>
                            <span className="tag-alt-link" onClick={() => window.open(props.post.link, "_blank")}>{getDomain()}</span>
                        </div>
                    </div> </>
                : null}

                {props.characters ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.characters.length > 1 ? "Characters" : "Character"}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateCharactersJSX()}
                    </div> </>
                : null}

                {props.series ? <>
                    <div className="mobileinfo-title-container">
                            <span className="mobileinfo-title">Series</span>
                        </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateSeriesJSX()}
                    </div> </>
                : null}

                {props.tags ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">Tags</span>
                    </div>
                    <div className="mobileinfo-subcontainer">
                        {generateTagJSX()}
                    </div> </> 
                : null}

                {props.post ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">Details</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-row">
                                <img className="mobileinfo-img" src={uploaderImage}/>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Uploader:</span>
                                {generateUsernameJSX("uploader")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Uploaded:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.uploadDate))}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Updater:</span>
                                {generateUsernameJSX("updater")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Updated:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.updatedDate))}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Type:</span>
                                <span className="tag-alt">{functions.toProperCase(props.post.type)}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Restrict:</span>
                                <span className="tag-alt">{functions.toProperCase(props.post.restrict)}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Style:</span>
                                <span className="tag-alt">{functions.toProperCase(props.post.style)}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Favorites:</span>
                                <span className="tag-alt">{props.post.favoriteCount || 0}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Cuteness:</span>
                                <span className="tag-alt">{props.post.cutenessAvg || 500}</span>
                            </div>
                        </div>
                    </div> </>
                : null}

                {props.post && session.username ? 
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerQuickEdit}>
                                <img className="mobileinfo-icon" src={getQuickEdit()}/>
                                <span className="tag">Quick Edit</span>
                            </span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerSetAvatar}>
                                <img className="mobileinfo-icon" src={getSetAvatar()}/>
                                <span className="tag">Set Avatar</span>
                            </span>
                        </div>{/* 
                        <div className="mobileinfo-row">
                            <span className="tag-hover">
                                <img className="mobileinfo-icon" src={getAddTranslation()}/>
                                <span className="tag">Add Translation</span>
                            </span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag-hover">
                                <img className="mobileinfo-icon" src={getReport()}/>
                                <span className="tag">Report</span>
                            </span>
                        </div> */}
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={editPost}>
                                <img className="mobileinfo-icon" src={getEdit()}/>
                                <span className="tag-red">Edit</span>
                            </span>
                        </div>
                        {props.unverified ? <>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={approvePost}>
                                <img className="mobileinfo-icon" src={approveGreen}/>
                                <span className="tag-green">Approve</span>
                            </span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={rejectPost}>
                                <img className="mobileinfo-icon" src={rejectRed}/>
                                <span className="tag-red">Reject</span>
                            </span>
                        </div>
                        </> : null}
                        {/* <div className="mobileinfo-row">
                            <span className="tag-hover">
                                <img className="mobileinfo-icon" src={getHistory()}/>
                                <span className="tag-red">History</span>
                            </span>
                        </div> */}
                        {!props.unverified ?
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={deletePost}>
                                <img className="mobileinfo-icon" src={getDeleteIcon()}/>
                                <span className="tag-red">Delete</span>
                            </span>
                        </div> : null}
                    </div>
                : null}
            </div>
        </div> 
        </div>
    )
}

export default MobileInfo