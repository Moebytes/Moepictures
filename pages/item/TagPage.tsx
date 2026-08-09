/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions, 
useLayoutSelector, useFlagSelector, useCacheActions, useInteractionActions, useSearchActions, useTagDialogActions,
useTagDialogSelector, useSearchSelector} from "../../store"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import moeText from "../../moetext/MoeText"
import permissions from "../../structures/Permissions"

import HeartIcon from "../../assets/svg/heart.svg"
import HistoryIcon from "../../assets/svg/history.svg"
import CategorizeIcon from "../../assets/svg/category.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import TakedownIcon from "../../assets/svg/takedown.svg"
import RestoreIcon from "../../assets/svg/restore.svg"
import HistoryThinIcon from "../../assets/svg/history-thin.svg"
import CurrentIcon from "../../assets/svg/current.svg"

import website from "../../assets/icons/website.png"
import fandom from "../../assets/icons/fandom.png"
import wikipedia from "../../assets/icons/wikipedia.png"
import pixiv from "../../assets/icons/pixiv.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import twitter from "../../assets/icons/twitter.png"
import Carousel from "../../components/site/Carousel"
import Related from "../../components/post/Related"
import {Tag, TagHistory, PostSearch, Alias, Implication} from "../../types/Types"
import "./styles/tagpage.less"

let limit = 25

const TagPage: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setSidebarText, setHeaderText, setActiveDropdown, setActionBanner} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setPosts, setNavigationPosts} = useCacheActions()
    const {tagFlag} = useFlagSelector()
    const {setTagFlag, setTagFavoriteFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {editTagObj, editTagFlag, deleteTagID, deleteTagFlag, revertTagHistoryID, revertTagHistoryFlag} = useTagDialogSelector()
    const {setEditTagObj, setEditTagFlag, setTakedownTag, setDeleteTagID, setDeleteTagFlag, setRevertTagHistoryID, setRevertTagHistoryFlag, setCategorizeTag} = useTagDialogActions()
    const [tag, setTag] = useState(null as Tag | TagHistory | null)
    const [tagPosts, setTagPosts] = useState([] as PostSearch[])
    const [postImages, setPostImages] = useState([] as string[])
    const [appendImages, setAppendImages] = useState([] as string[])
    const [postIndex, setPostIndex] = useState(0)
    const [relatedTags, setRelatedTags] = useState([] as string[])
    const [historyID, setHistoryID] = useState(null as string | null)
    const [featuredImage, setFeaturedImage] = useState("")
    const [favorited, setFavorited] = useState(false)
    const [count, setCount] = useState(0)
    const navigate = useNavigate()
    const location = useLocation()
    let {tag: tagName} = useParams() as {tag: string}

    tagName = decodeURIComponent(tagName)

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setSidebarText("")
        document.title = `${functions.util.toProperCase(tagName.replaceAll("-", " "))}`
        setHeaderText(`${functions.util.toProperCase(tagName.replaceAll("-", " "))}`)
        const historyParam = new URLSearchParams(window.location.search).get("history")
        setHistoryID(historyParam)
    }, [location])

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const tagInfo = async () => {
        let tag = null as Tag | TagHistory | null
        if (historyID) {
            tag = await functions.http.get("/api/tag/history", {tag: tagName, historyID}, session, setSessionFlag).then((r) => r[0])
        } else {
            tag = await functions.http.get("/api/tag", {tag: tagName}, session, setSessionFlag) as Tag
        }
        if (!tag) return functions.dom.replaceLocation("/404")
        if (tag.hidden) {
            if (!session.cookie) return
            if (!permissions.isMod(session)) return functions.dom.replaceLocation("/404")
        }
        if (tag.r18) {
            if (!session.cookie) return
            if (!session.showR18) return functions.dom.replaceLocation("/403")
        }
        const tagCount = await functions.http.get("/api/tag/counts", {tags: [tagName]}, session, setSessionFlag).then((r) => Number(r?.[0]?.count || 0))
        setTag(tag)
        setCount(tagCount)
        if (tag.featuredPost) {
            const featuredImage = functions.link.getThumbnailLink(tag.featuredPost.images[0], "massive", session, mobile)
            const decrypted = await functions.crypto.decryptThumb(featuredImage, session, `featured-${featuredImage}`, true)
            if ((!session.username && tag.featuredPost.rating !== functions.r13()) || 
                (!session.showR18 && tag.featuredPost.rating !== functions.r18()) ||
                tag.featuredPost.deleted) {
                setFeaturedImage("")
            } else {
                setFeaturedImage(decrypted)
            }
        } else {
            setFeaturedImage("")
        }
    }

    const updateRelatedTags = async () => {
        const related = await functions.http.get("/api/tag/related", {tag: tagName}, session, setSessionFlag)
        setRelatedTags(related)
    }

    const getFavorite = async () => {
        if (!session.username) return
        const tagFavorite = await functions.http.get("/api/tagfavorite", {tag: tagName}, session, setSessionFlag)
        setFavorited(tagFavorite ? true : false)
    }

    const updatePosts = async () => {
        let rating = functions.post.isR18(ratingType) ? functions.r18() : "all"
        let uploads = await functions.http.get("/api/search/posts", {query: tagName, type: "all", rating, style: "all", sort: "date", limit}, session, setSessionFlag)
        const images = uploads.map((p) => functions.link.getThumbnailLink(p.images[0], "medium", session, mobile))
        setTagPosts(uploads)
        setPostImages(images)
    }

    const updateOffset = async () => {
        if (!tag) return
        let uploads = tagPosts
        let offset = tagPosts.length
        let rating = functions.post.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.http.get("/api/search/posts", {query: tag.tag, type: "all", rating, style: "all", sort: "date", limit, offset}, session, setSessionFlag)
        uploads.push(...result)
        const images = result.map((p) => functions.link.getThumbnailLink(p.images[0], "medium", session, mobile))
        setTagPosts(uploads)
        setAppendImages(images)
    }

    useEffect(() => {
        tagInfo()
        updateRelatedTags()
        getFavorite()
        // updatePosts()
    }, [tagName, ratingType, historyID, session])

    useEffect(() => {
        if (tagFlag) {
            tagInfo()
            setTagFlag(false)
        }
    }, [tagFlag, historyID, session])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const set = (img: string, index: number, newTab: boolean) => {
        setPostIndex(index)
        const post = tagPosts[index]
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            navigate(`/post/${post.postID}/${post.slug}`)
        }
        setPosts(tagPosts)
        setNavigationPosts(tagPosts)
    }

    const searchTag = (event: React.MouseEvent, alias?: string) => {
        if (!tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${alias ? alias : tag.tag}`, "_blank")
        } else {
            navigate("/posts")
            setSearch(alias ? alias : tag.tag)
            setSearchFlag(true)
        }
    }

    const tagSocialJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (tag.type === "artist") {
            if (tag.website) {
                jsx.push(<img className="tag-social" src={website} onClick={() => window.open(tag.website!, "_blank", "noreferrer")}/>)
            }
            if (tag.social?.includes("pixiv.net")) {
                jsx.push(<img className="tag-social" src={pixiv} onClick={() => window.open(tag.social!, "_blank", "noreferrer")}/>)
            } else if (tag.social?.includes("soundcloud.com")) {
                jsx.push(<img className="tag-social" src={soundcloud} onClick={() => window.open(tag.social!, "_blank", "noreferrer")}/>)
            } else if (tag.social?.includes("sketchfab.com")) {
                jsx.push(<img className="tag-social" src={sketchfab} onClick={() => window.open(tag.social!, "_blank", "noreferrer")}/>)
            }
            if (tag.twitter) {
                jsx.push(<img className="tag-social" src={twitter} onClick={() => window.open(tag.twitter!, "_blank", "noreferrer")}/>)
            }
        }
        if (tag.type === "character") {
            if (tag.fandom) {
                jsx.push(<img className="tag-social" src={fandom} onClick={() => window.open(tag.fandom!, "_blank", "noreferrer")}/>)
            }
        }
        if (tag.type === "series") {
            if (tag.website) {
                jsx.push(<img className="tag-social" src={website} onClick={() => window.open(tag.website!, "_blank", "noreferrer")}/>)
            }
            if (tag.twitter) {
                jsx.push(<img className="tag-social" src={twitter} onClick={() => window.open(tag.twitter!, "_blank", "noreferrer")}/>)
            }
            if (tag.wikipedia) {
                jsx.push(<img className="tag-social" src={wikipedia} onClick={() => window.open(tag.wikipedia!, "_blank", "noreferrer")}/>)
            }
        }
        return jsx
    }

    const showTagHistory = async () => {
        if (!tag) return
        window.scrollTo(0, 0)
        navigate(`/tag/history/${tag.tag}`)
    }

    const editTag = async () => {
        if (!editTagObj) return
        let image = null as number[] | ["delete"] | null
        if (editTagObj.image) {
            if (editTagObj.image === "delete") {
                image = ["delete"]
            } else {
                const arrayBuffer = await fetch(editTagObj.image).then((r) => r.arrayBuffer())
                const bytes = new Uint8Array(arrayBuffer)
                image = Object.values(bytes)
            }
        }
        try {
            await functions.http.put("/api/tag/edit", {tag: editTagObj.tag, key: editTagObj.key, description: editTagObj.description,
            image: image!, aliases: editTagObj.aliases, implications: editTagObj.implications, pixivTags: editTagObj.pixivTags, danbooruTag: editTagObj.danbooruTag,
            social: editTagObj.social, twitter: editTagObj.twitter, website: editTagObj.website, fandom: editTagObj.fandom, wikipedia: editTagObj.wikipedia, 
            r18: editTagObj.r18 ?? false, featuredPost: editTagObj.featuredPost, reason: editTagObj.reason!}, session, setSessionFlag)
            if (editTagObj.tag === editTagObj.key) setTagFlag(true)
            navigate(`/tag/${encodeURIComponent(editTagObj.key!)}`)
        } catch (err: any) {
            if (err.message.includes("No permission to edit implications") || err.message.includes("No permission to rename tag")) {
                await functions.http.post("/api/tag/edit/request", {tag: editTagObj.tag, key: editTagObj.key, description: editTagObj.description, image, aliases: editTagObj.aliases, 
                implications: editTagObj.implications, pixivTags: editTagObj.pixivTags, danbooruTag: editTagObj.danbooruTag, social: editTagObj.social, twitter: editTagObj.twitter, website: editTagObj.website, fandom: editTagObj.fandom, 
                wikipedia: editTagObj.wikipedia, r18: editTagObj.r18!, featuredPost: editTagObj.featuredPost, reason: editTagObj.reason}, session, setSessionFlag)
                setEditTagObj({tag: editTagObj.tag, failed: "implication"})
            } else {
                setEditTagObj({tag: editTagObj.tag, failed: true})
            }
        }
    }

    useEffect(() => {
        if (!tag) return
        if (editTagFlag && editTagObj?.tag === tag.tag) {
            editTag()
            setEditTagFlag(false)
            setEditTagObj(null)
        }
    }, [editTagFlag, session])

    const showTagEditDialog = async () => {
        if (!tag) return
        if (!session.emailVerified) {
            return setActionBanner("verification-required")
        }
        setEditTagObj({
            failed: false,
            tag: tag.tag,
            key: tag.tag,
            description: tag.description,
            image: tag.image ? functions.link.getTagLink(tag) : null,
            aliases: tag.aliases?.[0] ? tag.aliases.map((a: Alias | string | null) => 
            typeof a === "string" ? a as string : a?.alias || "") : [],
            implications: tag.implications?.[0] ? tag.implications.map((i: Implication | string | null) => 
            typeof i === "string" ? i : i?.implication || "") : [],
            pixivTags: tag.pixivTags?.[0] ? tag.pixivTags : [],
            danbooruTag: tag.danbooruTag,
            type: tag.type,
            social: tag.social,
            twitter: tag.twitter,
            website: tag.website,
            fandom: tag.fandom,
            wikipedia: tag.wikipedia,
            r18: tag.r18,
            featuredPost: tag.featuredPost?.postID,
            reason: ""
        })
    }

    const deleteTag = async () => {
        if (!tag) return
        await functions.http.delete("/api/tag/delete", {tag: tag.tag}, session, setSessionFlag)
        navigate("/tags")
    }

    useEffect(() => {
        if (!tag) return
        if (deleteTagFlag && deleteTagID === tag.tag) {
            deleteTag()
            setDeleteTagFlag(false)
            setDeleteTagID(null)
        }
    }, [deleteTagFlag, session])

    const showTagDeleteDialog = async () => {
        if (!tag) return
        if (!session.emailVerified) {
            return setActionBanner("verification-required")
        }
        setDeleteTagID(tag.tag)
    }

    const showTagCategorizeDialog = async () => {
        if (!tag) return
        if (!session.emailVerified) {
            return setActionBanner("verification-required")
        }
        setCategorizeTag({tag: tag.tag, type: tag.type})
    }

    const favoriteTag = async () => {
        if (!tag) return
        await functions.http.post("/api/tagfavorite/toggle", {tag: tag.tag}, session, setSessionFlag)
        getFavorite()
        setTagFavoriteFlag(true)
    }

    const tagOptionsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (session.username) {
            jsx.push(favorited ? 
                <HeartIcon className="tag-social-pink" onClick={() => favoriteTag()}/> :
                <HeartIcon className="tag-social" onClick={() => favoriteTag()}/>)
            
            jsx.push(<HistoryIcon className="tag-social" onClick={() => showTagHistory()}/>)
            jsx.push(<CategorizeIcon className="tag-social" onClick={() => showTagCategorizeDialog()}/>)
            jsx.push(<EditIcon className="tag-social" onClick={() => showTagEditDialog()}/>)
            jsx.push(<DeleteIcon className="tag-social" onClick={() => showTagDeleteDialog()}/>)
        }
        if (permissions.isMod(session)) {
            jsx.push(tag.banned ?
                <RestoreIcon className="tag-social" onClick={() => setTakedownTag(tag)}/> :
                <TakedownIcon className="tag-social" onClick={() => setTakedownTag(tag)}/>)
        }
        return jsx
    }

    const pixivTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (tag.pixivTags?.[0]) {
            for (let i = 0; i < tag.pixivTags.length; i++) {
                jsx.push(<button className="tag-pixtag-button" onClick={() => window.open(`https://www.pixiv.net/tags/${tag.pixivTags?.[i]}/artworks`, "_blank", "noreferrer")}>{tag.pixivTags[i]}</button>)
            }
        }
        if (jsx.length) {
            return <div className="tag-pixtag-button-container">{jsx}</div>
        } else {
            return null
        }
    }

    const tagAliasJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (tag.aliases?.[0]) {
            for (let i = 0; i < tag.aliases.length; i++) {
                const item = tag.aliases[i]
                let alias = typeof item === "string" ? item : item?.alias 
                if (!alias) continue
                jsx.push(<button className="tag-alias-button" onClick={(event) => searchTag(event, alias)}>{alias.replaceAll("-", " ")}</button>)
            }
        }
        if (jsx.length) {
            return <div className="tag-alias-button-container">{jsx}</div>
        } else {
            return null
        }
    }

    const tagImplicationJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!tag) return jsx
        if (tag.implications?.[0]) {
            for (let i = 0; i < tag.implications.length; i++) {
                const item = tag.implications[i]
                let implication = typeof item === "string" ? item : item?.implication 
                if (!implication) continue
                let implicationSpace = implication.replaceAll("-", " ")
                if (i !== tag.implications.length - 1) implication += ", "
                jsx.push(<span className="tag-text-alt" onClick={() => navigate(`/tag/${encodeURIComponent(implication)}`)}>{implicationSpace}</span>)
            }
        }
        if (jsx.length) {
            return (
                <div className="tag-row">
                    <span className="tag-text-italic">{i18n.pages.tag.implication}</span>
                    {jsx}
                </div>
            )
        } else {
            return null
        }
    }

    const relatedTagJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (relatedTags.length) {
            for (let i = 0; i < relatedTags.length; i++) {
                let relatedTag = relatedTags[i].replaceAll("-", " ")
                if (i !== relatedTags.length - 1) relatedTag += ", "
                jsx.push(<span className="tag-text-alt" onClick={() => navigate(`/tag/${encodeURIComponent(relatedTags[i])}`)}>{relatedTag}</span>)
            }
        }
        if (jsx.length) {
            return (
                <div className="tag-row">
                    <span className="tag-text-italic">{i18n.pages.tag.relatedTags}</span>
                    {jsx}
                </div>
            )
        } else {
            return null
        }
    }

    const postsJSX = () => {
        if (!tag) return
        if (!permissions.isMod(session) && tag.banned) return null 
        if (tagPosts.length) {
            return (
                <div className="tag-column">
                    <span><span className="tag-label" onClick={searchTag} onAuxClick={searchTag}>{i18n.sort.posts}</span> <span className="tag-label-alt">{count}</span></span>
                    <Carousel images={postImages} noKey={true} set={set} index={postIndex} update={updateOffset} appendImages={appendImages} height={250}/>
                </div>
            )
        }
    }

    const revertTagHistory = async () => {
        if (!tag) return
        const history = tag as TagHistory
        let image = null as number[] | ["delete"] | null
        if (!tag.image) {
            image = ["delete"]
        } else {
            const imageLink = functions.link.getTagLink(tag)
            const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
            const bytes = new Uint8Array(arrayBuffer)
            image = Object.values(bytes)
        }
        await functions.http.put("/api/tag/edit", {tag: tag.tag, key: history.key, description: tag.description, image,
        aliases: history.aliases, implications: history.implications, pixivTags: tag.pixivTags, social: tag.social,
        twitter: tag.twitter, website: tag.website, fandom: tag.fandom, wikipedia: tag.wikipedia, type: tag.type, featuredPost: tag.featuredPost?.postID,
        r18: tag.r18 ?? false}, session, setSessionFlag)
        if (tag.tag === history.key) setTagFlag(true)
        navigate(`/tag/${encodeURIComponent(history.key)}`)
    }

    useEffect(() => {
        if (revertTagHistoryFlag && historyID === revertTagHistoryID?.historyID) {
            setRevertTagHistoryID(null)
            revertTagHistory().then(() => {
                setRevertTagHistoryFlag(false)
            }).catch((err) => {
                setRevertTagHistoryFlag(false)
                if (err.message.includes("No permission to edit implications")) return setRevertTagHistoryID({failed: "implication", historyID})
                if (err.message.includes("No permission to rename tag")) return setRevertTagHistoryID({failed: "rename", historyID})
                setRevertTagHistoryID({failed: true, historyID})
            })
        }
    }, [revertTagHistoryFlag, revertTagHistoryID, historyID, tag, session])

    const revertTagHistoryDialog = async () => {
        setRevertTagHistoryID({failed: false, historyID})
    }

    const currentHistory = (key?: string) => {
        navigate(`/tag/${encodeURIComponent(key ? key : tagName)}`)
        setHistoryID(null)
        setTagFlag(true)
    }

    const getHistoryButtons = () => {
        return (
            <div className="history-button-container">
                <button className="history-button" onClick={() => navigate(`/tag/history/${tagName}`)}>
                    <HistoryThinIcon className="history-button-icon"/>
                    <span>History</span>
                </button>
                {session.username ? <button className="history-button" onClick={revertTagHistoryDialog}>
                    <span>⌫Revert</span>
                </button> : null}
                <button className="history-button" onClick={() => currentHistory()}>
                    <CurrentIcon className="history-button-icon"/>
                    <span>Current</span>
                </button>
            </div>
        )
    }

    const getTagName = () => {
        if (!tag) return
        if (historyID && (tag as TagHistory).key) return functions.util.toProperCase((tag as TagHistory).key.replaceAll("-", " "))
        return functions.util.toProperCase(tag.tag.replaceAll("-", " "))
    }

    const featuredClick = (event: React.MouseEvent) => {
        if (!tag || !tag.featuredPost) return
        functions.post.openPost(tag.featuredPost, event, navigate, session, setSessionFlag)
    }

    return (
        <>
        <TitleBar historyID={historyID}/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {tag ? 
                <div className="tag-page">
                    {historyID ? getHistoryButtons() : null}
                    <div className="tag-row-container">
                        {featuredImage ?
                        <div className="tag-container" style={{justifyContent: "center", alignItems: "center"}}>
                            <img className="tag-featured-img" src={featuredImage} onClick={featuredClick} onAuxClick={featuredClick}/>
                        </div> : null}
                        <div className="tag-container">
                            <div className="tag-row">
                                {tag.image ?
                                <div className="tag-img-container">
                                    <img className="tag-img" src={functions.link.getTagLink(tag)}/>
                                </div> : null}
                                <span className={`tag-heading ${functions.tag.getTagColor(tag)}`}>{getTagName()}</span>
                                {tagSocialJSX()}
                                {tagOptionsJSX()}
                            </div>
                            {pixivTagsJSX()}
                            {tagAliasJSX()}
                            {tag.banned ? <div className="tag-row">
                                <span className="tag-text strikethrough-color">{i18n.pages.tag.bannedArtist}</span>
                            </div> : null}
                            <div className="tag-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <span className="tag-text">{moeText.renderCommentaryText(tag.description)}</span>
                            </div>
                            {tagImplicationJSX()}
                            {relatedTagJSX()}
                        </div>
                    </div>
                    <Related tag={tag.tag} count={count}/>
                    {/* {postsJSX()} */}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TagPage