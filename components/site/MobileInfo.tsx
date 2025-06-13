import React, {useEffect, useState} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import {useThemeSelector, useSearchActions, useSearchSelector, 
useFlagActions, useInteractionActions, useCacheActions, useCacheSelector, useActiveActions,
useSessionSelector, useSessionActions, usePostDialogActions, useGroupDialogActions,
usePostDialogSelector} from "../../store"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import setAvatar from "../../assets/icons/setavatar.png"
import addNote from "../../assets/icons/note-toggle-on.png"
import report from "../../assets/icons/report.png"
import edit from "../../assets/icons/edit.png"
import historyIcon from "../../assets/icons/history.png"
import tagEdit from "../../assets/icons/tag-outline.png"
import sourceEdit from "../../assets/icons/history-search.png"
import deleteIcon from "../../assets/icons/delete.png"
import undeleteIcon from "../../assets/icons/undelete.png"
import takedown from "../../assets/icons/takedown.png"
import restore from "../../assets/icons/restore.png"
import rejectRed from "../../assets/icons/reject-red.png"
import approveGreen from "../../assets/icons/approve-green.png"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import tagIcon from "../../assets/icons/tag.png"
import hashIcon from "../../assets/icons/hash.png"
import website from "../../assets/icons/website.png"
import pixiv from "../../assets/icons/pixiv.png"
import twitter from "../../assets/icons/twitter.png"
import deviantart from "../../assets/icons/deviantart.png"
import artstation from "../../assets/icons/artstation.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import youtube from "../../assets/icons/youtube.png"
import bandcamp from "../../assets/icons/bandcamp.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import fandom from "../../assets/icons/fandom.png"
import wikipedia from "../../assets/icons/wikipedia.png"
import danbooru from "../../assets/icons/danbooru.png"
import gelbooru from "../../assets/icons/gelbooru.png"
import safebooru from "../../assets/icons/safebooru.png"
import yandere from "../../assets/icons/yandere.png"
import konachan from "../../assets/icons/konachan.png"
import zerochan from "../../assets/icons/zerochan.png"
import eshuushuu from "../../assets/icons/eshuushuu.png"
import animepictures from "../../assets/icons/animepictures.png"
import group from "../../assets/icons/group.png"
import parent from "../../assets/icons/parent.png"
import compressIcon from "../../assets/icons/compress.png"
import upscaleIcon from "../../assets/icons/waifu2x.png"
import lockIcon from "../../assets/icons/lock-red.png"
import unlockIcon from "../../assets/icons/unlock-red.png"
import privateIcon from "../../assets/icons/private.png"
import unprivateIcon from "../../assets/icons/unprivate.png"
import appealIcon from "../../assets/icons/appeal.png"
import infoIcon from "../../assets/icons/info.png"
import splitIcon from "../../assets/icons/split.png"
import joinIcon from "../../assets/icons/join.png"
import snapshotIcon from "../../assets/icons/snapshot.png"
import functions from "../../structures/Functions"
import path from "path"
import {PostSearch, PostHistory, UnverifiedPost, MiniTag, TagGroupCategory} from "../../types/Types"
import "./styles/mobileinfo.less"

interface Props {
    post?: PostSearch | PostHistory | UnverifiedPost
    artists?: MiniTag[] 
    characters?: MiniTag[]  
    series?: MiniTag[]
    meta?: MiniTag[]
    tags?: MiniTag[]
    tagGroups?: TagGroupCategory[]
    unverified?: boolean
    order?: number
}

const MobileInfo: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {noteMode} = useSearchSelector()
    const {setSearchFlag, setNoteMode, setNoteDrawingEnabled} = useSearchActions()
    const {posts, unverifiedPosts, tags} = useCacheSelector()
    const {setTags} = useCacheActions()
    const {setEnableDrag} = useInteractionActions()
    const {setRandomFlag, setImageSearchFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setTagEditID, setSourceEditID, setPrivatePostID, setLockPostID, setUpscalePostID, setCompressPostID, 
    setDeletePostID, setTakedownPostID, setChildPostObj, setUndeletePostID, setAppealPostID, setPostInfoID,
    setSplitPostID, setJoinPostID, setEditThumbnailID} = usePostDialogActions()
    const {setActionBanner} = useActiveActions()
    const {setGroupPostID} = useGroupDialogActions()
    const [maxTags, setMaxTags] = useState(23)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderImagePost, setUploaderImagePost] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [approverRole, setApproverRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTags = async () => {
        const tags = await functions.parseTags(posts, session, setSessionFlag)
        setTags(tags)
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await functions.get("/api/user", {username: props.post.uploader}, session, setSessionFlag)
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image, uploader.imageHash) : favicon)
            setUploaderImagePost(uploader?.imagePost || "")
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
    }, [session])

    useEffect(() => {
        updateUserImg()
    }, [props.post])

    useEffect(() => {
        updateTags()
    }, [posts])

    const generateArtistsJSX = () => {
        if (!props.artists) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.artists.length; i++) {
            const link = functions.getTagLink("artist", props.artists[i].image, props.artists[i].imageHash)
            if (!props.artists[i]) break
            const tagClick = () => {
                if (!props.artists) return
                navigate(`/tag/${props.artists[i].tag}`)
            }
            const artistSocials = () => {
                if (!props.artists) return
                let jsx = [] as React.ReactElement[] 
                if (props.artists[i].website) {
                    jsx.push(<img className="mobileinfo-social" src={website} onClick={() => window.open(props.artists?.[i].website!, "_blank")}/>)
                }
                if (props.artists[i].social?.includes("pixiv.net")) {
                    jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.artists?.[i].social!, "_blank")}/>)
                } else if (props.artists[i].social?.includes("soundcloud.com")) {
                    jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.artists?.[i].social!, "_blank")}/>)
                } else if (props.artists[i].social?.includes("sketchfab.com")) {
                    jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.artists?.[i].social!, "_blank")}/>)
                }
                if (props.artists[i].twitter) {
                    jsx.push(<img className="mobileinfo-social" src={twitter} onClick={() => window.open(props.artists?.[i].twitter!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                    {link ?
                    <div className="mobileinfo-row">
                        <img className="mobileinfo-img" src={link}/>
                    </div> : null}
                    <div className="mobileinfo-row">
                        <span className="tag-hover">
                            <span className="tag artist-tag-color" onClick={() => tagClick()}>{props.artists[i].tag.replaceAll("-", " ")}</span>
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
            const link = functions.getTagLink("character", props.characters[i].image, props.characters[i].imageHash)
            if (!props.characters[i]) break
            const tagClick = () => {
                if (!props.characters) return
                navigate(`/tag/${props.characters[i].tag}`)
            }
            const characterSocials = () => {
                if (!props.characters) return
                let jsx = [] as React.ReactElement[] 
                if (props.characters[i].fandom) {
                    jsx.push(<img className="mobileinfo-social" src={fandom} onClick={() => window.open(props.characters?.[i].fandom!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="mobileinfo-row">
                    <img className="mobileinfo-img" src={link}/>
                </div> : null}
                <div className="mobileinfo-row">
                    <span className="tag-hover">
                        <span className="tag character-tag-color" onClick={() => tagClick()}>{props.characters[i].tag.replaceAll("-", " ")}</span>
                        {characterSocials()}
                        <span className={`tag-count ${props.characters[i].count === "1" ? "artist-tag-color" : ""}`}>{props.characters[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        if (!props.series) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.series.length; i++) {
            const link = functions.getTagLink("series", props.series[i].image, props.series[i].imageHash)
            if (!props.series[i]) break
            const tagClick = () => {
                if (!props.series) return
                navigate(`/tag/${props.series[i].tag}`)
            }
            const seriesSocials = () => {
                if (!props.series) return
                let jsx = [] as React.ReactElement[] 
                if (props.series[i].website) {
                    jsx.push(<img className="mobileinfo-social" src={website} onClick={() => window.open(props.series?.[i].website!, "_blank")}/>)
                }
                if (props.series[i].twitter) {
                    jsx.push(<img className="mobileinfo-social" src={twitter} onClick={() => window.open(props.series?.[i].twitter!, "_blank")}/>)
                }
                if (props.series[i].wikipedia) {
                    jsx.push(<img className="mobileinfo-social" src={wikipedia} onClick={() => window.open(props.series?.[i].wikipedia!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="mobileinfo-row">
                    <img className="mobileinfo-img" src={link}/>
                </div> : null}
                <div className="mobileinfo-row">
                    <span className="tag-hover">
                        <span className="tag series-tag-color" onClick={() => tagClick()}>{props.series[i].tag.replaceAll("-", " ")}</span>
                        {seriesSocials()}
                        <span className={`tag-count ${props.series[i].count === "1" ? "artist-tag-color" : ""}`}>{props.series[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateMetaJSX = () => {
        if (!props.meta) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.meta.length; i++) {
            if (!props.meta[i]) break
            const tagClick = () => {
                if (!props.meta) return
                navigate(`/tag/${props.meta[i].tag}`)
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover">
                        <span className="tag meta-tag-color" onClick={() => tagClick()}>{props.meta[i].tag.replaceAll("-", " ")}</span>
                        <span className={`tag-count ${props.meta[i].count === "1" ? "artist-tag-color" : ""}`}>{props.meta[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    const organizeTags = (tags: MiniTag[]) => {
        if (!tags?.length) return [] as MiniTag[]
        const meta = tags.filter((t) => t.type === "meta")
        const appearance = tags.filter((t) => t.type === "appearance")
        const outfit = tags.filter((t) => t.type === "outfit")
        const accessory = tags.filter((t) => t.type === "accessory")
        const action = tags.filter((t) => t.type === "action")
        const scenery = tags.filter((t) => t.type === "scenery")
        const other = tags.filter((t) => t.type === "tag")
        return [...meta, ...appearance, ...outfit, ...accessory, ...action, ...scenery, ...other.reverse()]
    }

    const generateTagGroupJSX = () => {
        if (!props.tagGroups) return null
        let jsx = [] as React.ReactElement[]
        for (const tagGroup of props.tagGroups) {
            let currentTags = organizeTags(tagGroup.tags)
            if (!currentTags.length) continue
            jsx.push(
                <div key={`tagGroup-${tagGroup.name}`} className="mobileinfo-title-container">
                    <span className="mobileinfo-title">{functions.toProperCase(tagGroup.name.replaceAll("-", " "))}</span>
                </div>
            )
            for (let i = 0; i < currentTags.length; i++) {
                if (!currentTags[i]) break
                const tagClick = () => {
                    navigate(`/tag/${currentTags[i].tag}`)
                }
                jsx.push(
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={() => tagClick()}>
                            <span className={`tag ${functions.getTagColor(currentTags[i])}`}>{currentTags[i].tag.replaceAll("-", " ")}</span>
                            <span className={`tag-count ${currentTags[i].count === "1" ? "artist-tag-color" : ""}`}>{currentTags[i].count}</span>
                        </span>
                    </div>
                )
            }
        }
        return jsx
    }

    const generateTagJSX = () => {
        if (props.tagGroups?.length) return generateTagGroupJSX()
        let jsx = [] as React.ReactElement[]
        let currentTags = props.tags ? organizeTags([...(props.meta || []), ...props.tags]) : tags
        let max = props.tags ? currentTags.length : Math.min(currentTags.length, 100)
        for (let i = 0; i < max; i++) {
            if (!currentTags[i]) break
            const tagClick = () => {
                navigate(`/tag/${currentTags[i].tag}`)
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className={`tag ${functions.getTagColor(currentTags[i])}`}>{currentTags[i].tag.replaceAll("-", " ")}</span>
                        <span className={`tag-count ${currentTags[i].count === "1" ? "artist-tag-color" : ""}`}>{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
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

    const copyHash = (pixelHash?: boolean) => {
        if (!props.post || !props.order) return
        const image = props.post.images[props.order-1]
        if (typeof image === "string") return
        navigator.clipboard.writeText(pixelHash ? image.pixelHash : image.hash)
        setActionBanner("copy-hash")
    }

    const triggerSearch = () => {
        navigate(`/posts`)
        setSearchFlag(true)
    }

    const randomSearch = () => {
        navigate(`/posts`)
        setRandomFlag(true)
    }

    const imageSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const result = await functions.imageSearch(file, session, setSessionFlag)
        setImageSearchFlag(result)
        navigate("/posts")
        event.target.value = ""
    }

    const deletePost = async () => {
        if (!props.post) return
        setDeletePostID({post: props.post, unverified: props.unverified})
    }

    const undeletePost = async () => {
        if (!props.post) return
        setUndeletePostID({postID: props.post.postID, unverified: props.unverified})
    }

    const appealPost = async () => {
        if (!props.post) return
        setAppealPostID(props.post.postID)
    }

    const editPost = async () => {
        if (!props.post) return
        if (props.unverified) return navigate(`/unverified/edit-post/${props.post.postID}`)
        navigate(`/edit-post/${props.post.postID}/${props.post.slug}`)
    }

    const privatePost = async () => {
        if (!props.post || !props.artists) return
        setPrivatePostID({post: props.post, artists: props.artists})
    }

    const lockPost = async () => {
        if (!props.post) return
        setLockPostID({post: props.post, unverified: props.unverified})
    }

    const modNext = () => {
        let currentIndex = unverifiedPosts.findIndex((p) => p.postID === props.post?.postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                navigate(`/unverified/post/${id}`)
            }
        }
        navigate(`/mod-queue`)
    }

    const upscalingDialog = () => {
        if (!props.post) return
        setUpscalePostID({post: props.post, unverified: props.unverified})
    }

    const compressingDialog = () => {
        if (!props.post) return
        setCompressPostID({post: props.post, unverified: props.unverified})
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
        navigate(`/set-avatar/${props.post.postID}/${props.post.slug}`)
    }

    const triggerTagEdit = () => {
        if (!props.post || !props.artists || !props.characters || !props.series || !props.meta || !props.tags) return
        setTagEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            meta: props.meta, tags: props.tags, tagGroups: props.tagGroups,
            unverified: props.unverified, order: props.order || 1})
    }

    const triggerSourceEdit = () => {
        if (!props.post || !props.artists || !props.characters || !props.series || !props.meta || !props.tags || !props.order) return
        setSourceEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            meta: props.meta, tags: props.tags, tagGroups: props.tagGroups,
            unverified: props.unverified, order: props.order || 1})
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
            if (props.post.source.includes("eshuushuu")) {
                jsx.push(<img className="sidebar-social" src={eshuushuu} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("animepictures")) {
                jsx.push(<img className="sidebar-social" src={animepictures} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("youtube")) {
                jsx.push(<img className="sidebar-social" src={youtube} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
            if (props.post.source.includes("bandcamp")) {
                jsx.push(<img className="sidebar-social" src={bandcamp} onClick={() => window.open(props.post?.source, "_blank")}/>)
            }
        }
        return (
            <div className="mobileinfo-row">
                <span className="tag">{i18n.labels.source}:</span>
                <span className={`tag-alt-link ${props.post.hidden ? "strikethrough" : ""}`} onClick={() => window.open(props.post?.source, "_blank")}>{functions.getSiteName(props.post.source, i18n)}</span>
                {jsx}
            </div>
        )
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
            if (props.post.mirrors.eshuushuu) {
                jsx.push(<img className="sidebar-social" src={eshuushuu} onClick={() => window.open(props.post?.mirrors?.eshuushuu, "_blank")}/>)
            }
            if (props.post.mirrors.animepictures) {
                jsx.push(<img className="sidebar-social" src={animepictures} onClick={() => window.open(props.post?.mirrors?.animepictures, "_blank")}/>)
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
                <div className="mobileinfo-row">
                    <span className="tag">{i18n.labels.mirrors}:</span>
                    {jsx}
                </div>
            )
        }
        return null
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
        if (!props.post) return
        setTakedownPostID({post: props.post, unverified: props.unverified})
    }

    const getPostInfo = async () => {
        if (!props.post) return
        setPostInfoID({post: props.post, order: props.order || 1})
    }

    const editThumbnail = async () => {
        if (!props.post) return
        setEditThumbnailID({post: props.post, order: props.order || 1, unverified: props.unverified})
    }

    const triggerSplit = async () => {
        if (!permissions.isAdmin(session) || !props.post) return
        setSplitPostID({post: props.post, order: props.order || 1})
    }

    const triggerJoin = async () => {
        if (!permissions.isAdmin(session) || !props.post) return
        setJoinPostID({post: props.post, unverified: props.unverified})
    }

    const postHistory = () => {
        if (!props.post) return
        window.scrollTo(0, 0)
        navigate(`/post/history/${props.post.postID}/${props.post.slug}`)
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
                <div className="mobileinfo-username-container" onClick={() => username ? navigate(`/user/${username}`) : null}>
                     <span className="tag-alt admin-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="mobileinfo-user-label" src={adminCrown}/>
                </div>
            )
        } else if (role === "mod") {
            return (
                <div className="mobileinfo-username-container" onClick={() => username ? navigate(`/user/${username}`) : null}>
                    <span className="tag-alt mod-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="mobileinfo-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="tag-alt-link" onClick={() => username ? navigate(`/user/${username}`) : null}>{functions.toProperCase(username) || "deleted"}</span>
    }

    const copyTagsJSX = () => {
        if (!session) return
        if (session.captchaNeeded) return null
        if (props.artists && props.characters && props.series && props.tags) {
            return (
                <div className="mobileinfo-subcontainer-column">
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={() => copyTags()} onContextMenu={(event) => {event.preventDefault(); copyTags(true, true)}}>
                            <img className="mobileinfo-icon" src={tagIcon}/>
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
            if (!location.pathname.includes("/post/") && !location.pathname.includes("/edit-post")) return
            const toggleCaptcha = () => {
                sessionStorage.setItem("ignoreCaptcha", "false")
                history.go(0)
            }
            return (
                <div className="mobileinfo-subcontainer-column">
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={toggleCaptcha}>
                            <img className="mobileinfo-icon" src={tagIcon}/>
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
                <div className="mobileinfo-subcontainer">
                    {originalSize ? 
                    <div className="mobileinfo-row">
                        <span className="tag artist-tag-color">{i18n.labels.size}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{originalSize}</span>
                    </div> : null}
                    {originalExt ? 
                    <div className="mobileinfo-row">
                        <span className="tag artist-tag-color">{i18n.labels.fileType}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{originalExt}</span>
                    </div> : null}
                    {upscaledSize ? 
                    <div className="mobileinfo-row">
                        <span className="tag artist-tag-color">{i18n.labels.upscaledSize}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{upscaledSize}</span>
                    </div> : null}
                    {upscaledExt ? 
                    <div className="mobileinfo-row">
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
            <div className="mobileinfo-row">
                <span className="tag">{i18n.tag.artist}:</span>
                <span className="tag-alt">{props.post.artist || "None"}</span>
            </div>
            )
        }
    }

    const openPost = async (postID: string, event: React.MouseEvent) => {
        functions.openPost(postID, event, navigate, session, setSessionFlag)
    }

    return (
        <div className="mobileinfo" onMouseEnter={() => setEnableDrag(false)}>
            <div className="mobileinfo-container">
            <div className="mobileinfo-content">

                {copyTagsJSX()}
                {tagCaptchaJSX()}
                {filetypeJSX()}

                {props.post && props.artists ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.artists.length > 1 ? i18n.navbar.artists : i18n.tag.artist}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateArtistsJSX()}
                        {noTagsArtist()}
                        <div className="mobileinfo-row">
                            <span className="tag">{i18n.labels.title}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.title || "None"}</span>
                        </div>
                        {props.post.englishTitle ? 
                        <div className="mobileinfo-row">
                            <span className="tag">{i18n.sidebar.english}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{functions.toProperCase(props.post.englishTitle)}</span>
                        </div>
                        : null}
                        <div className="mobileinfo-row">
                            <span className="tag">{i18n.tag.artist}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.artist || "?"}</span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag">{i18n.sort.posted}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.posted ? functions.formatDate(new Date(props.post.posted)) : "Unknown"}</span>
                        </div>
                        {generateSourceJSX()}
                        <div className="mobileinfo-row">
                            <span className="tag">{i18n.sort.bookmarks}:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.bookmarks ? props.post.bookmarks : "?"}</span>
                        </div>
                        {generateMirrorsJSX()}
                    </div> </>
                : null}

                {props.characters ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.characters.length > 1 ? i18n.navbar.characters : i18n.tag.character}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateCharactersJSX()}
                    </div> </>
                : null}

                {props.series ? <>
                    <div className="mobileinfo-title-container">
                            <span className="mobileinfo-title">{i18n.tag.series}</span>
                        </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateSeriesJSX()}
                    </div> </>
                : null}

                {props.tags ? <>
                     {!props.tagGroups?.length ? <div className="mobileinfo-title-container">
                             <span className="mobileinfo-title">{i18n.navbar.tags}</span>
                    </div> : null}
                     <div className="mobileinfo-subcontainer">
                         {generateTagJSX()}
                     </div> </>
                : null}

                {props.tagGroups?.length && props.meta ? <>
                    <div className="mobileinfo-title-container">
                            <span className="mobileinfo-title">{i18n.tag.meta}</span>
                        </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateMetaJSX()}
                    </div> </>
                : null}

                {props.post ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{i18n.sidebar.details}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-row">
                                <img className="mobileinfo-img" src={uploaderImage} onClick={(event) => openPost(uploaderImagePost, event)}/>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.uploader}:</span>
                                {generateUsernameJSX("uploader")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.uploaded}:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.uploadDate))}</span>
                            </div>
                        </div>
                        {props.post.uploadDate !== props.post.updatedDate ? 
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.updater}:</span>
                                {generateUsernameJSX("updater")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.updated}:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.updatedDate))}</span>
                            </div>
                        </div> : null}
                        {props.post.uploader !== props.post.approver ?
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.approver}:</span>
                                {generateUsernameJSX("approver")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.approved}:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.approveDate))}</span>
                            </div>
                        </div> : null}
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.type}:</span>
                                <span className="tag-alt">{i18n.sortbar.type[props.post.type]}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.rating}:</span>
                                <span className="tag-alt">{i18n.sortbar.rating[props.post.rating]}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sidebar.style}:</span>
                                <span className="tag-alt">{i18n.sortbar.style[props.post.style]}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sort.favorites}:</span>
                                <span className="tag-alt">{(props.post as PostSearch).favoriteCount || 0}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">{i18n.sort.cuteness}:</span>
                                <span className="tag-alt">{(props.post as PostSearch).cuteness || 500}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={() => copyHash()} onAuxClick={() => copyHash()} onContextMenu={(event) => {event.preventDefault(); setTimeout(() => copyHash(true), 100)}}>
                                    <img className="mobileinfo-icon" src={hashIcon} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.copyHash}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={getPostInfo}>
                                    <img className="mobileinfo-icon" src={infoIcon} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.getInfo}</span>
                                </span>
                            </div>
                        </div>
                    </div></>
                : null}

                {props.post && session.username ? 
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerTagEdit}>
                                    <img className="mobileinfo-icon" src={tagEdit} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.tagEdit}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerSourceEdit}>
                                    <img className="mobileinfo-icon" src={sourceEdit} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.sourceEdit}</span>
                                </span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            {!props.unverified && !functions.isR18(props.post.rating) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerSetAvatar}>
                                    <img className="mobileinfo-icon" src={setAvatar} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.setAvatar}</span>
                                </span>
                            </div> : null}
                            {!props.unverified ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerAddNote}>
                                    <img className="mobileinfo-icon" src={addNote} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.addNote}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {!props.unverified ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerParent}>
                                    <img className="sidebar-icon" src={parent} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.addParent}</span>
                                </span>
                            </div> : null}
                            {!props.unverified ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerGroup}>
                                    <img className="sidebar-icon" src={group} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.addGroup}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {!props.unverified && permissions.isAdmin(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerSplit}>
                                    <img className="mobileinfo-icon" src={splitIcon} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.splitVariations}</span>
                                </span>
                            </div> : null}
                            {!props.unverified && permissions.isAdmin(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerJoin}>
                                    <img className="mobileinfo-icon" src={joinIcon} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.joinChildPosts}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {permissions.isMod(session) && (props.post.type !== "image" && props.post.type !== "comic") ? 
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={editThumbnail}>
                                    <img className="mobileinfo-icon" src={snapshotIcon} style={{filter: getFilter()}}/>
                                    <span className="tag">{i18n.sidebar.editThumbnail}</span>
                                </span>
                            </div> : null}
                            {!props.unverified && permissions.canPrivate(session, props.artists) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={privatePost}>
                                    <img className="mobileinfo-icon" src={props.post.private ? unprivateIcon : privateIcon} style={{filter: getFilter()}}/>
                                    <span className="tag">{props.post.private ? i18n.sidebar.unprivate : i18n.sort.private}</span>
                                </span>
                            </div> : null}
                            {!props.unverified && permissions.isMod(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerTakedown}>
                                    <img className="mobileinfo-icon" src={props.post.hidden ? restore : takedown} style={{filter: getFilter()}}/>
                                    <span className="tag">{props.post.hidden ? i18n.sidebar.restore : i18n.sidebar.takedown}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {props.unverified ? <>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={compressingDialog}>
                                    <img className="sidebar-icon" src={compressIcon}/>
                                    <span className="tag">{i18n.buttons.compress}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={upscalingDialog}>
                                    <img className="sidebar-icon" src={upscaleIcon}/>
                                    <span className="tag">{i18n.buttons.upscale}</span>
                                </span>
                            </div></> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {props.unverified ? <>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={approvePost}>
                                    <img className="mobileinfo-icon" src={approveGreen}/>
                                    <span className="tag-green">{i18n.buttons.approve}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={rejectPost}>
                                    <img className="mobileinfo-icon" src={rejectRed}/>
                                    <span className="tag-red">{i18n.buttons.reject}</span>
                                </span>
                            </div>
                            </> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={editPost}>
                                    <img className="mobileinfo-icon" src={edit}/>
                                    <span className="tag-red">{i18n.buttons.edit}</span>
                                </span>
                            </div>
                            {!props.unverified && permissions.isMod(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={lockPost}>
                                    <img className="mobileinfo-icon" src={props.post.locked ? unlockIcon : lockIcon}/>
                                    <span className="tag-red">{props.post.locked ? i18n.sidebar.unlock : i18n.sidebar.lock}</span>
                                </span>
                            </div> : null}
                            {!props.unverified ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={postHistory}>
                                    <img className="mobileinfo-icon" src={historyIcon}/>
                                    <span className="tag-red">{i18n.sidebar.history}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {props.unverified && props.post.deleted && !(props.post as UnverifiedPost).appealed ?
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={appealPost}>
                                    <img className="mobileinfo-icon" src={appealIcon}/>
                                    <span className="tag-red">{i18n.buttons.appeal}</span>
                                </span>
                            </div> : null}
                            {!(permissions.isMod(session) && props.unverified) || props.post.deleted ?
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={deletePost}>
                                    <img className="mobileinfo-icon" src={deleteIcon}/>
                                    <span className="tag-red">{i18n.buttons.delete}</span>
                                </span>
                            </div> : null}
                            {permissions.isMod(session) && props.post.deleted ?
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={undeletePost}>
                                    <img className="mobileinfo-icon" src={undeleteIcon}/>
                                    <span className="tag-red">{i18n.buttons.undelete}</span>
                                </span>
                            </div> : null}
                        </div>
                    </div>
                : null}
            </div>
        </div> 
        </div>
    )
}

export default MobileInfo