import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions,
useFilterSelector, useInteractionActions} from "../../store"
import functions from "../../structures/Functions"
import tagHistoryRevert from "../../assets/icons/revert.png"
import tagHistoryDelete from "../../assets/icons/delete.png"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import permissions from "../../structures/Permissions"
import website from "../../assets/icons/support.png"
import fandom from "../../assets/icons/fandom.png"
import pixiv from "../../assets/icons/pixiv.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import twitter from "../../assets/icons/twitter.png"
import crypto from "crypto"
import "./styles/historyrow.less"
import {TagHistory} from "../../types/Types"

interface Props {
    tagHistory: TagHistory
    historyIndex: number
    previousHistory: TagHistory | null
    currentHistory: TagHistory
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
    exact?: boolean
}

const TagHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {deleteTagHistoryID, revertTagHistoryID, deleteTagHistoryFlag, revertTagHistoryFlag} = useTagDialogSelector()
    const {setDeleteTagHistoryID, setRevertTagHistoryID, setDeleteTagHistoryFlag, setRevertTagHistoryFlag} = useTagDialogActions()
    const history = useHistory()
    const [img, setImg] = useState("")
    const [userRole, setUserRole] = useState("")
    const tag = props.tagHistory.tag
    let prevHistory = props.previousHistory || Boolean(props.exact)
    const imageFiltersRef = useRef<HTMLDivElement>(null)

    const updateImage = () => {
        if (!props.tagHistory.image) return
        const img = functions.getTagLink(props.tagHistory.type, props.tagHistory.image, props.tagHistory.imageHash)
        setImg(img)
    }

    const updateUserRole = async () => {
        const user = await functions.get("/api/user", {username: props.tagHistory.user}, session, setSessionFlag)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateImage()
        updateUserRole()
    }, [props.tagHistory, session])

    const revertTagHistory = async () => {
        if (props.current) return Promise.reject()
        let image = null as number[] | ["delete"] | null
        if (!props.tagHistory.image) {
            image = ["delete"]
        } else {
            const imageLink = functions.getTagLink(props.tagHistory.type, props.tagHistory.image, props.tagHistory.imageHash)
            const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
            const bytes = new Uint8Array(arrayBuffer)
            image = Object.values(bytes)
        }
        await functions.put("/api/tag/edit", {tag: props.tagHistory.tag, key: props.tagHistory.key, description: props.tagHistory.description, image, 
        aliases: props.tagHistory.aliases, implications: props.tagHistory.implications, pixivTags: props.tagHistory.pixivTags, social: props.tagHistory.social, 
        twitter: props.tagHistory.twitter, website: props.tagHistory.website, fandom: props.tagHistory.fandom, type: props.tagHistory.type, r18: props.tagHistory.r18 ?? false,
        featuredPost: props.tagHistory.featuredPost?.postID}, session, setSessionFlag)
        if (props.tagHistory.key !== props.tagHistory.tag) {
            history.push(`/tag/history/${props.tagHistory.key}`)
        } else {
            props.onEdit?.()
        }
    }

    useEffect(() => {
        if (revertTagHistoryFlag && props.tagHistory.historyID === revertTagHistoryID?.historyID) {
            revertTagHistory().then(() => {
                setRevertTagHistoryFlag(false)
                setRevertTagHistoryID(null)
            }).catch((err) => {
                setRevertTagHistoryFlag(false)
                if (err.response?.data.includes("No permission to edit implications")) return setRevertTagHistoryID({failed: "implication", historyID: props.tagHistory.historyID})
                setRevertTagHistoryID({failed: true, historyID: props.tagHistory.historyID})
            })
        }
    }, [revertTagHistoryFlag, revertTagHistoryID, session, props.current])

    const deleteTagHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.delete("/api/tag/history/delete", {tag: props.tagHistory.tag, historyID: props.tagHistory.historyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteTagHistoryFlag && props.tagHistory.historyID === deleteTagHistoryID?.historyID) {
            deleteTagHistory().then(() => {
                setDeleteTagHistoryFlag(false)
                setDeleteTagHistoryID(null)
            }).catch(() => {
                setDeleteTagHistoryFlag(false)
                setDeleteTagHistoryID({failed: true, historyID: props.tagHistory.historyID})
            })
        }
    }, [deleteTagHistoryFlag, deleteTagHistoryID, session, props.current])

    const revertTagHistoryDialog = async () => {
        setRevertTagHistoryID({failed: false, historyID: props.tagHistory.historyID})
    }

    const deleteTagHistoryDialog = async () => {
        setDeleteTagHistoryID({failed: false, historyID: props.tagHistory.historyID})
    }

    const tagHistoryOptions = () => {
        if (session.banned) return null
        if (permissions.isMod(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertTagHistoryDialog}>
                        <img className="historyrow-options-img" src={tagHistoryRevert}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                    <div className="historyrow-options-container" onClick={deleteTagHistoryDialog}>
                        <img className="historyrow-options-img" src={tagHistoryDelete}/>
                        <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertTagHistoryDialog}>
                        <img className="historyrow-options-img" src={tagHistoryRevert}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        let historyIndex = props.current ? "" : `?history=${props.tagHistory.historyID}`
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.tagHistory.tag}${historyIndex}`, "_blank")
        } else {
            history.push(`/tag/${props.tagHistory.tag}${historyIndex}`)
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.tagHistory.user}`, "_blank")
        } else {
            history.push(`/user/${props.tagHistory.user}`)
        }
    }

    const socialJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (props.tagHistory.type === "artist") {
            if (props.tagHistory.website) {
                jsx.push(<img className="historyrow-social" src={website} onClick={() => window.open(props.tagHistory.website!, "_blank")}/>)
            }
            if (props.tagHistory.social?.includes("pixiv.net")) {
                jsx.push(<img className="historyrow-social" src={pixiv} onClick={() => window.open(props.tagHistory.social!, "_blank")}/>)
            } else if (props.tagHistory.social?.includes("soundcloud.com")) {
                jsx.push(<img className="historyrow-social" src={soundcloud} onClick={() => window.open(props.tagHistory.social!, "_blank")}/>)
            } else if (props.tagHistory.social?.includes("sketchfab.com")) {
                jsx.push(<img className="historyrow-social" src={sketchfab} onClick={() => window.open(props.tagHistory.social!, "_blank")}/>)
            }
            if (props.tagHistory.twitter) {
                jsx.push(<img className="historyrow-social" src={twitter} onClick={() => window.open(props.tagHistory.twitter!, "_blank")}/>)
            }
        }
        if (props.tagHistory.type === "character") {
            if (props.tagHistory.fandom) {
                jsx.push(<img className="historyrow-social" src={fandom} onClick={() => window.open(props.tagHistory.fandom!, "_blank")}/>)
            }
        }
        if (props.tagHistory.type === "series") {
            if (props.tagHistory.website) {
                jsx.push(<img className="historyrow-social" src={website} onClick={() => window.open(props.tagHistory.website!, "_blank")}/>)
            }
            if (props.tagHistory.twitter) {
                jsx.push(<img className="historyrow-social" src={twitter} onClick={() => window.open(props.tagHistory.twitter!, "_blank")}/>)
            }
        }
        return jsx
    }

    const dateTextJSX = () => {
        let firstHistory = props.historyIndex === Number(props.tagHistory.historyCount)
        if (props.exact) firstHistory = false
        let targetDate = props.tagHistory.date
        const editText = firstHistory ? i18n.time.uploaded : i18n.time.edited
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (userRole === "premium-curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (userRole === "curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (userRole === "premium-contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (userRole === "contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text contributor-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (userRole === "premium") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.tagHistory.user) || i18n.user.deleted}</span>
    }

    const descriptionDiffJSX = () => {
        let newDescription = props.tagHistory.description || i18n.labels.none
        if (!prevHistory) return <span className="tag-reg">{newDescription}</span>
        let oldDescription = props.previousHistory?.description || i18n.labels.none
    
        const oldWords = oldDescription.split(/([^\s\n]+|\s+|\n)/g).filter(Boolean)
        const newWords = newDescription.split(/([^\s\n]+|\s+|\n)/g).filter(Boolean)
    
        // Longest Common Subsequence (LCS) algorithm
        const lcs = (a: string[], b: string[]) => {
            const dp = Array(a.length + 1)
                .fill(null)
                .map(() => Array(b.length + 1).fill(0))
    
            for (let i = 1; i <= a.length; i++) {
                for (let j = 1; j <= b.length; j++) {
                    if (a[i - 1] === b[j - 1]) {
                        dp[i][j] = dp[i - 1][j - 1] + 1
                    } else {
                        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
                    }
                }
            }
    
            const sequence: [number, number][] = []
            let i = a.length
            let j = b.length
            while (i > 0 && j > 0) {
                if (a[i - 1] === b[j - 1]) {
                    sequence.unshift([i - 1, j - 1])
                    i--
                    j--
                } else if (dp[i - 1][j] > dp[i][j - 1]) {
                    i--
                } else {
                    j--
                }
            }
            return sequence
        }
    
        const sequence = lcs(oldWords, newWords)
        let result: React.ReactElement[] = []
        let i = 0
        let j = 0
        sequence.forEach(([oldIndex, newIndex]) => {
            while (i < oldIndex) {
                result.push(<span className="tag-remove-color" key={`remove-${i}`}>{oldWords[i]}</span>)
                i++
            }
            while (j < newIndex) {
                result.push(<span className="tag-add-color" key={`add-${j}`}>{newWords[j]}</span>)
                j++
            }
            result.push(<span className="tag-reg-color" key={`unchanged-${i}`}>{oldWords[i]}</span>)
            i++
            j++
        })
        while (i < oldWords.length) {
            result.push(<span className="tag-remove-color" key={`remove-${i}`}>{oldWords[i]}</span>)
            i++
        }
        while (j < newWords.length) {
            result.push(<span className="tag-add-color" key={`add-${j}`}>{newWords[j]}</span>)
            j++
        }
        return <span className="tag-reg-color">{result}</span>
    }

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        let changes = props.tagHistory.changes || {}
        if (changes.type) {
            jsx.push(<span className="historyrow-text"><span className={`historyrow-label-text ${functions.getTagColor(props.tagHistory)}`}>{i18n.labels.category}:</span> {props.tagHistory.type}</span>)
        }
        if (!prevHistory || changes.tag) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.name}:</span> {props.tagHistory.tag}</span>)
        }
        if (!prevHistory || changes.description) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text" style={{marginRight: "5px"}}>{i18n.labels.description}:</span>{descriptionDiffJSX()}</span>)
        }
        if ((!prevHistory && props.tagHistory.website) || changes.website) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.website}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.website!, "_blank")}>{props.tagHistory.website}</span></span>)
        }
        if ((!prevHistory && props.tagHistory.social) || changes.social) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.social}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.social!, "_blank")}>{props.tagHistory.social}</span></span>)
        }
        if ((!prevHistory && props.tagHistory.twitter) || changes.twitter) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.twitter}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.twitter!, "_blank")}>{props.tagHistory.twitter}</span></span>)
        }
        if ((!prevHistory && props.tagHistory.fandom) || changes.fandom) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.fandom}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.fandom!, "_blank")}>{props.tagHistory.fandom}</span></span>)
        }
        if (!prevHistory || changes.aliases) {
            if (props.tagHistory.aliases?.[0]) {
                const aliases = props.tagHistory.aliases.map((a) => a.replaceAll("-", " "))
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.sort.aliases}:</span> {aliases.join(", ")}</span>)
            }
        }
        if (!prevHistory || changes.implications) {
            if (props.tagHistory.implications?.[0]) {
                const implications = props.tagHistory.implications.map((i) => i.replaceAll("-", " "))
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.implications}:</span> {implications.join(", ")}</span>)
            }
        }
        if (!prevHistory || changes.pixivTags) {
            if (props.tagHistory.pixivTags?.[0]) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.pixivTags}:</span> {props.tagHistory.pixivTags.join(", ")}</span>)
            }
        }
        if ((!prevHistory && props.tagHistory.featuredPost) || changes.featuredPost) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.featured}:</span> {props.tagHistory.featuredPost?.postID}</span>)
        }
        if ((!prevHistory && props.tagHistory.r18) || changes.r18) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">R18:</span> {props.tagHistory.r18 ? i18n.buttons.yes : i18n.buttons.no}</span>)
        }
        if (!jsx.length && !props.tagHistory.imageChanged) {
            jsx.push(<span className="historyrow-text">{i18n.labels.noData}</span>)
        }
        return jsx
    }

    useEffect(() => {
        if (!imageFiltersRef.current) return
        imageFiltersRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [brightness, contrast, hue, saturation, blur])

    return (
        <div className="historyrow">
            {session.username ? tagHistoryOptions() : null}
            <div className="historyrow-container" ref={imageFiltersRef}>
                <img className="historyrow-img-small" src={img} onClick={imgClick} onAuxClick={imgClick}/>
                <span className={`historyrow-tag-text ${functions.getTagColor(props.tagHistory)}`} onClick={imgClick} onAuxClick={imgClick}>{functions.toProperCase(props.tagHistory.key.replaceAll("-", " "))}</span>
                {socialJSX()}
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {dateTextJSX()}
                        {props.tagHistory.imageChanged ? <span className="historyrow-text-strong">[{i18n.labels.imageUpdated}]</span> : null}
                        {diffJSX()}
                        {props.tagHistory.reason ? <span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.reason}:</span> {props.tagHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TagHistoryRow