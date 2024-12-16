import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions, 
useLayoutSelector, useFlagSelector, useCacheActions, useInteractionActions, useSearchActions, useTagDialogActions,
useTagDialogSelector, useSearchSelector} from "../store"
import {useHistory, useLocation} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import EditTagDialog from "../dialogs/EditTagDialog"
import CategorizeTagDialog from "../dialogs/CategorizeTagDialog"
import DeleteTagDialog from "../dialogs/DeleteTagDialog"
import TakedownTagDialog from "../dialogs/TakedownTagDialog"
import takedown from "../assets/icons/takedown.png"
import tagHistory from "../assets/icons/tag-history.png"
import tagCategorize from "../assets/icons/tag-category.png"
import tagEdit from "../assets/icons/tag-edit.png"
import tagDelete from "../assets/icons/tag-delete.png"
import restore from "../assets/icons/restore.png"
import website from "../assets/icons/support.png"
import fandom from "../assets/icons/fandom.png"
import pixiv from "../assets/icons/pixiv.png"
import soundcloud from "../assets/icons/soundcloud.png"
import sketchfab from "../assets/icons/sketchfab.png"
import twitter from "../assets/icons/twitter.png"
import Carousel from "../components/Carousel"
import RevertTagHistoryDialog from "../dialogs/RevertTagHistoryDialog"
import historyIcon from "../assets/icons/history-state.png"
import currentIcon from "../assets/icons/current.png"
import jsxFunctions from "../structures/JSXFunctions"
import "./styles/tagpage.less"

interface Props {
    match?: any
}

let limit = 25

const TagPage: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setSidebarText, setHeaderText, setActiveDropdown} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setPosts} = useCacheActions()
    const {tagFlag} = useFlagSelector()
    const {setTagFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {editTagObj, editTagFlag, deleteTagID, deleteTagFlag, revertTagHistoryID, revertTagHistoryFlag} = useTagDialogSelector()
    const {setEditTagObj, setEditTagFlag, setTakedownTag, setDeleteTagID, setDeleteTagFlag, setRevertTagHistoryID, setRevertTagHistoryFlag, setCategorizeTag} = useTagDialogActions()
    const [tag, setTag] = useState(null) as any
    const [tagPosts, setTagPosts] = useState([]) as any
    const [postImages, setPostImages] = useState([]) as any
    const [appendImages, setAppendImages] = useState([]) as any
    const [postIndex, setPostIndex] = useState(0)
    const [relatedTags, setRelatedTags] = useState([]) as any
    const [historyID, setHistoryID] = useState(null as any)
    const [count, setCount] = useState(0)
    const history = useHistory()
    const location = useLocation()
    const tagName = props?.match.params.tag

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setSidebarText("")
        document.title = `${functions.toProperCase(tagName.replaceAll("-", " "))}`
        setHeaderText(`${functions.toProperCase(tagName.replaceAll("-", " "))}`)
        const historyParam = new URLSearchParams(window.location.search).get("history")
        setHistoryID(historyParam)
    }, [location])

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const tagInfo = async () => {
        let tag = null as any
        if (historyID) {
            tag = await functions.get("/api/tag/history", {tag: tagName, historyID}, session, setSessionFlag)
        } else {
            tag = await functions.get("/api/tag", {tag: tagName}, session, setSessionFlag)
        }
        if (!tag) return functions.replaceLocation("/404")
        if (tag.hidden) {
            if (!session.cookie) return
            if (!permissions.isMod(session)) return functions.replaceLocation("/404")
        }
        if (tag.r18) {
            if (!session.cookie) return
            if (!session.showR18) return functions.replaceLocation("/403")
        }
        const tagCount = await functions.get("/api/tag/counts", {tags: [tagName]}, session, setSessionFlag).then((r) => Number(r?.[0]?.count || 0))
        setTag(tag)
        setCount(tagCount)
    }

    const updateRelatedTags = async () => {
        const related = await functions.get("/api/tag/related", {tag: tagName}, session, setSessionFlag)
        setRelatedTags(related)
    }

    const updatePosts = async () => {
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        let uploads = await functions.get("/api/search/posts", {query: tagName, type: "all", rating, style: "all", sort: "date", limit}, session, setSessionFlag)
        const images = uploads.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "large"))
        setTagPosts(uploads)
        setPostImages(images)
    }

    const updateOffset = async () => {
        let uploads = tagPosts
        let offset = tagPosts.length
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.get("/api/search/posts", {query: tag.tag, type: "all", rating, style: "all", sort: "date", limit, offset}, session, setSessionFlag)
        uploads.push(...result)
        const images = result.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "large"))
        setTagPosts(uploads)
        setAppendImages(images)
    }

    useEffect(() => {
        tagInfo()
        updateRelatedTags()
        updatePosts()
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
            history.push(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(tagPosts)
    }

    const searchTag = (event: React.MouseEvent, alias?: string) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open("/posts", "_blank")
        } else {
            history.push("/posts")
        }
        setSearch(alias ? alias : tag.tag)
        setSearchFlag(true)
    }

    const tagSocialJSX = () => {
        let jsx = [] as any
        if (tag.type === "artist") {
            if (tag.website) {
                jsx.push(<img className="tag-social" src={website} onClick={() => window.open(tag.website, "_blank", "noreferrer")}/>)
            }
            if (tag.social?.includes("pixiv.net")) {
                jsx.push(<img className="tag-social" src={pixiv} onClick={() => window.open(tag.social, "_blank", "noreferrer")}/>)
            } else if (tag.social?.includes("soundcloud.com")) {
                jsx.push(<img className="tag-social" src={soundcloud} onClick={() => window.open(tag.social, "_blank", "noreferrer")}/>)
            } else if (tag.social?.includes("sketchfab.com")) {
                jsx.push(<img className="tag-social" src={sketchfab} onClick={() => window.open(tag.social, "_blank", "noreferrer")}/>)
            }
            if (tag.twitter) {
                jsx.push(<img className="tag-social" src={twitter} onClick={() => window.open(tag.twitter, "_blank", "noreferrer")}/>)
            }
        }
        if (tag.type === "character") {
            if (tag.fandom) {
                jsx.push(<img className="tag-social" src={fandom} onClick={() => window.open(tag.fandom, "_blank", "noreferrer")}/>)
            }
        }
        if (tag.type === "series") {
            if (tag.website) {
                jsx.push(<img className="tag-social" src={website} onClick={() => window.open(tag.website, "_blank", "noreferrer")}/>)
            }
            if (tag.twitter) {
                jsx.push(<img className="tag-social" src={twitter} onClick={() => window.open(tag.twitter, "_blank", "noreferrer")}/>)
            }
        }
        return jsx
    }

    const showTagHistory = async () => {
        window.scrollTo(0, 0)
        history.push(`/tag/history/${tag.tag}`)
    }

    const editTag = async () => {
        let image = null as any
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
            await functions.put("/api/tag/edit", {tag: tag.tag, key: editTagObj.key, description: editTagObj.description,
            image, aliases: editTagObj.aliases, implications: editTagObj.implications, pixivTags: editTagObj.pixivTags, social: editTagObj.social, twitter: editTagObj.twitter,
            website: editTagObj.website, fandom: editTagObj.fandom, r18: editTagObj.r18, reason: editTagObj.reason}, session, setSessionFlag)
            history.push(`/tag/${editTagObj.key}`)
            setTagFlag(true)
        } catch (err: any) {
            if (err.response?.data.includes("No permission to edit implications")) {
                await functions.post("/api/tag/edit/request", {tag: tag.tag, key: editTagObj.key, description: editTagObj.description, image, aliases: editTagObj.aliases, 
                implications: editTagObj.implications, pixivTags: editTagObj.pixivTags, social: editTagObj.social, twitter: editTagObj.twitter, website: editTagObj.website, fandom: editTagObj.fandom, 
                r18: editTagObj.r18, reason: editTagObj.reason}, session, setSessionFlag)
                setEditTagObj({tag: tag.tag, failed: "implication"})
            } else {
                setEditTagObj({tag: tag.tag, failed: true})
            }
        }
    }

    useEffect(() => {
        if (editTagFlag && editTagObj?.tag === tag.tag) {
            editTag()
            setEditTagFlag(false)
            setEditTagObj(null)
        }
    }, [editTagFlag, session])

    const showTagEditDialog = async () => {
        setEditTagObj({
            failed: false,
            tag: tag.tag,
            key: tag.tag,
            description: tag.description,
            image: tag.image ? functions.getTagLink(tag.type, tag.image, tag.imageHash) : null,
            aliases: tag.aliases?.[0] ? tag.aliases.map((a: any) => a.alias ? a.alias : a) : [],
            implications: tag.implications?.[0] ? tag.implications.map((i: any) => i.implication ? i.implication : i) : [],
            pixivTags: tag.pixivTags?.[0] ? tag.pixivTags : [],
            type: tag.type,
            social: tag.social,
            twitter: tag.twitter,
            website: tag.website,
            fandom: tag.fandom,
            r18: tag.r18,
            reason: ""
        })
    }

    const deleteTag = async () => {
        await functions.delete("/api/tag/delete", {tag: tag.tag}, session, setSessionFlag)
        history.push("/tags")
    }

    useEffect(() => {
        if (deleteTagFlag && deleteTagID === tag.tag) {
            deleteTag()
            setDeleteTagFlag(false)
            setDeleteTagID(null)
        }
    }, [deleteTagFlag, session])

    const showTagDeleteDialog = async () => {
        setDeleteTagID(tag.tag)
    }

    const showTagCategorizeDialog = async () => {
        setCategorizeTag({tag: tag.tag, type: tag.type})
    }

    const tagOptionsJSX = () => {
        let jsx = [] as any
        if (session.username) {
            jsx.push(<img className="tag-social" src={tagHistory} onClick={() => showTagHistory()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="tag-social" src={tagCategorize} onClick={() => showTagCategorizeDialog()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="tag-social" src={tagEdit} onClick={() => showTagEditDialog()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="tag-social" src={tagDelete} onClick={() => showTagDeleteDialog()} style={{filter: getFilter()}}/>)
        }
        if (permissions.isMod(session)) {
            jsx.push(<img className="tag-social" src={tag.banned ? restore : takedown} onClick={() => setTakedownTag(tag)} style={{filter: getFilter()}}/>)
        }
        return jsx
    }

    const pixivTagsJSX = () => {
        let jsx = [] as any
        if (tag.pixivTags?.[0]) {
            for (let i = 0; i < tag.pixivTags.length; i++) {
                jsx.push(<button className="tag-pixtag-button" onClick={() => window.open(`https://www.pixiv.net/en/tags/${tag.pixivTags[i]}/artworks`, "_blank", "noreferrer")}>{tag.pixivTags[i]}</button>)
            }
        }
        if (jsx.length) {
            return <div className="tag-pixtag-button-container">{jsx}</div>
        } else {
            return null
        }
    }

    const tagAliasJSX = () => {
        let jsx = [] as any
        if (tag.aliases?.[0]) {
            for (let i = 0; i < tag.aliases.length; i++) {
                let alias = tag.aliases[i]?.alias ? tag.aliases[i].alias : tag.aliases[i]
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
        let jsx = [] as any
        if (tag.implications?.[0]) {
            for (let i = 0; i < tag.implications.length; i++) {
                let implication = tag.implications[i]?.implication ? tag.implications[i].implication : tag.implications[i]
                let implicationSpace = implication.replaceAll("-", " ")
                if (i !== tag.implications.length - 1) implication += ", "
                jsx.push(<span className="tag-text-alt" onClick={() => history.push(`/tag/${implication}`)}>{implicationSpace}</span>)
            }
        }
        if (jsx.length) {
            return (
                <div className="tag-row">
                    <span className="tag-text-italic">This tag implies the following: </span>
                    {jsx}
                </div>
            )
        } else {
            return null
        }
    }

    const relatedTagJSX = () => {
        let jsx = [] as any
        if (relatedTags.length) {
            for (let i = 0; i < relatedTags.length; i++) {
                let relatedTag = relatedTags[i].replaceAll("-", " ")
                if (i !== relatedTags.length - 1) relatedTag += ", "
                jsx.push(<span className="tag-text-alt" onClick={() => history.push(`/tag/${relatedTags[i]}`)}>{relatedTag}</span>)
            }
        }
        if (jsx.length) {
            return (
                <div className="tag-row">
                    <span className="tag-text-italic">Related tags: </span>
                    {jsx}
                </div>
            )
        } else {
            return null
        }
    }

    const postsJSX = () => {
        if (!permissions.isMod(session) && tag.banned) return null 
        if (tagPosts.length) {
            return (
                <div className="tag-column">
                    <span><span className="tag-label" onClick={searchTag}>{i18n.sort.posts}</span> <span className="tag-label-alt">{count}</span></span>
                    <Carousel images={postImages} noKey={true} set={set} index={postIndex} update={updateOffset} appendImages={appendImages} height={250}/>
                </div>
            )
        }
    }

    const revertTagHistory = async () => {
        let image = null as any
        if (!tag.image) {
            image = ["delete"]
        } else {
            const imageLink = functions.getTagLink(tag.type, tag.image, tag.imageHash)
            const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
            const bytes = new Uint8Array(arrayBuffer)
            image = Object.values(bytes)
        }
        await functions.put("/api/tag/edit", {tag: tag.tag, key: tag.key, description: tag.description, image,
        aliases: tag.aliases, implications: tag.implications, pixivTags: tag.pixivTags, social: tag.social,
        twitter: tag.twitter, website: tag.website, fandom: tag.fandom, category: tag.type}, session, setSessionFlag)
        currentHistory(tag.key)
    }

    useEffect(() => {
        if (revertTagHistoryFlag && historyID === revertTagHistoryID?.historyID) {
            revertTagHistory().then(() => {
                setRevertTagHistoryFlag(false)
                setRevertTagHistoryID(null)
            }).catch((err) => {
                setRevertTagHistoryFlag(false)
                if (err.response?.data.includes("No permission to edit implications")) return setRevertTagHistoryID({failed: "implication", historyID})
                setRevertTagHistoryID({failed: true, historyID})
            })
        }
    }, [revertTagHistoryFlag, revertTagHistoryID, historyID, tag, session])

    const revertTagHistoryDialog = async () => {
        setRevertTagHistoryID({failed: false, historyID})
    }

    const currentHistory = (key?: string) => {
        history.push(`/tag/${key ? key : tagName}`)
        setHistoryID(null)
        setTagFlag(true)
    }

    const getHistoryButtons = () => {
        return (
            <div className="history-button-container">
                <button className="history-button" onClick={() => history.push(`/tag/history/${tagName}`)}>
                    <img src={historyIcon}/>
                    <span>History</span>
                </button>
                {session.username ? <button className="history-button" onClick={revertTagHistoryDialog}>
                    <span>⌫Revert</span>
                </button> : null}
                <button className="history-button" onClick={() => currentHistory()}>
                    <img src={currentIcon}/>
                    <span>Current</span>
                </button>
            </div>
        )
    }

    const getTagName = () => {
        if (historyID && tag.key) return functions.toProperCase(tag.key.replaceAll("-", " "))
        return functions.toProperCase(tag.tag.replaceAll("-", " "))
    }

    return (
        <>
        <CategorizeTagDialog/>
        <EditTagDialog/>
        <DeleteTagDialog/>
        <TakedownTagDialog/>
        <RevertTagHistoryDialog/>
        <TitleBar historyID={historyID}/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {tag ? 
                <div className="tag-page">
                    {historyID ? getHistoryButtons() : null}
                    <div className="tag-row">
                        {tag.image ?
                        <div className="tag-img-container">
                            <img className="tag-img" src={functions.getTagLink(tag.type, tag.image, tag.imageHash)}/>
                        </div> : null}
                        <span className={`tag-heading ${functions.getTagColor(tag)}`}>{getTagName()}</span>
                        {tagSocialJSX()}
                        {tagOptionsJSX()}
                    </div>
                    {pixivTagsJSX()}
                    {tagAliasJSX()}
                    {tag.banned ? <div className="tag-row">
                        <span className="tag-text strikethrough-color">{i18n.pages.tag.bannedArtist}</span>
                    </div> : null}
                    <div className="tag-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="tag-text">{jsxFunctions.renderCommentaryText(tag.description)}</span>
                    </div>
                    {tagImplicationJSX()}
                    {relatedTagJSX()}
                    {postsJSX()}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TagPage