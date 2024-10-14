import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, SessionFlagContext, MobileContext, DeleteTagHistoryIDContext, 
RevertTagHistoryIDContext, DeleteTagHistoryFlagContext, RevertTagHistoryFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import tagHistoryRevert from "../assets/icons/revert.png"
import tagHistoryDelete from "../assets/icons/delete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import permissions from "../structures/Permissions"
import website from "../assets/icons/support.png"
import fandom from "../assets/icons/fandom.png"
import pixiv from "../assets/icons/pixiv.png"
import soundcloud from "../assets/icons/soundcloud.png"
import sketchfab from "../assets/icons/sketchfab.png"
import twitter from "../assets/icons/twitter.png"
import crypto from "crypto"
import "./styles/taghistoryrow.less"

interface Props {
    tagHistory: any
    historyIndex: number
    previousHistory: any
    currentHistory: any
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
}

const TagHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteTagHistoryID, setDeleteTagHistoryID} = useContext(DeleteTagHistoryIDContext)
    const {revertTagHistoryID, setRevertTagHistoryID} = useContext(RevertTagHistoryIDContext)
    const {deleteTagHistoryFlag, setDeleteTagHistoryFlag} = useContext(DeleteTagHistoryFlagContext)
    const {revertTagHistoryFlag, setRevertTagHistoryFlag} = useContext(RevertTagHistoryFlagContext)
    const history = useHistory()
    const [img, setImg] = useState("")
    const [userRole, setUserRole] = useState("")
    const [hasImageUpdate, setHasImageUpdate] = useState(false)
    const [hasAnyUpdate, setHasAnyUpdate] = useState(true)
    const tag = props.tagHistory.tag

    const updateImage = () => {
        const img = functions.getTagLink(props.tagHistory.type, props.tagHistory.image)
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
        let image = null as any
        if (!props.tagHistory.image) {
            image = ["delete"]
        } else {
            const imageLink = functions.getTagLink(props.tagHistory.type, props.tagHistory.image)
            const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
            const bytes = new Uint8Array(arrayBuffer)
            image = Object.values(bytes)
        }
        await functions.put("/api/tag/edit", {tag: props.tagHistory.tag, key: props.tagHistory.key, description: props.tagHistory.description,
        image, aliases: props.tagHistory.aliases, implications: props.tagHistory.implications, social: props.tagHistory.social, twitter: props.tagHistory.twitter,
        website: props.tagHistory.website, fandom: props.tagHistory.fandom}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (revertTagHistoryFlag && props.tagHistory.historyID === revertTagHistoryID?.historyID) {
            revertTagHistory().then(() => {
                setRevertTagHistoryFlag(false)
                setRevertTagHistoryID(null)
            }).catch(() => {
                setRevertTagHistoryFlag(false)
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
                <div className="taghistoryrow-options">
                    <div className="taghistoryrow-options-container" onClick={revertTagHistoryDialog}>
                        <img className="taghistoryrow-options-img" src={tagHistoryRevert}/>
                        <span className="taghistoryrow-options-text">Revert</span>
                    </div>
                    <div className="taghistoryrow-options-container" onClick={deleteTagHistoryDialog}>
                        <img className="taghistoryrow-options-img" src={tagHistoryDelete}/>
                        <span className="taghistoryrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="taghistoryrow-options">
                    <div className="taghistoryrow-options-container" onClick={revertTagHistoryDialog}>
                    <img className="taghistoryrow-options-img" src={tagHistoryRevert}/>
                    <span className="taghistoryrow-options-text">Revert</span>
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
        let jsx = [] as any
        if (props.tagHistory.type === "artist") {
            if (props.tagHistory.website) {
                jsx.push(<img className="taghistoryrow-social" src={website} onClick={() => window.open(props.tagHistory.website, "_blank")}/>)
            }
            if (props.tagHistory.social?.includes("pixiv.net")) {
                jsx.push(<img className="taghistoryrow-social" src={pixiv} onClick={() => window.open(props.tagHistory.social, "_blank")}/>)
            } else if (props.tagHistory.social?.includes("soundcloud.com")) {
                jsx.push(<img className="taghistoryrow-social" src={soundcloud} onClick={() => window.open(props.tagHistory.social, "_blank")}/>)
            } else if (props.tagHistory.social?.includes("sketchfab.com")) {
                jsx.push(<img className="taghistoryrow-social" src={sketchfab} onClick={() => window.open(props.tagHistory.social, "_blank")}/>)
            }
            if (props.tagHistory.twitter) {
                jsx.push(<img className="taghistoryrow-social" src={twitter} onClick={() => window.open(props.tagHistory.twitter, "_blank")}/>)
            }
        }
        if (props.tagHistory.type === "character") {
            if (props.tagHistory.fandom) {
                jsx.push(<img className="taghistoryrow-social" src={fandom} onClick={() => window.open(props.tagHistory.fandom, "_blank")}/>)
            }
        }
        if (props.tagHistory.type === "series") {
            if (props.tagHistory.website) {
                jsx.push(<img className="taghistoryrow-social" src={website} onClick={() => window.open(props.tagHistory.website, "_blank")}/>)
            }
            if (props.tagHistory.twitter) {
                jsx.push(<img className="taghistoryrow-social" src={twitter} onClick={() => window.open(props.tagHistory.twitter, "_blank")}/>)
            }
        }
        return jsx
    }

    const dateTextJSX = () => {
        let firstHistory = props.historyIndex === Number(props.tagHistory.historyCount)
        let targetDate = firstHistory ? props.tagHistory.createDate : props.tagHistory.date
        if (!targetDate) targetDate = props.tagHistory.date
        const editText = firstHistory ? "Uploaded" : "Edited"
        if (userRole === "admin") {
            return (
                <div className="taghistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="taghistoryrow-user-text admin-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="taghistoryrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="taghistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="taghistoryrow-user-text mod-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="taghistoryrow-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="taghistoryrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
    }

    const calculateImageDiff = async () => {
        if (!props.previousHistory) return false
        const img = functions.getTagLink(props.tagHistory.type, props.tagHistory.image)
        const previous = functions.getTagLink(props.previousHistory.type, props.previousHistory.image)

        const imgBuffer = await functions.getBuffer(img)
        const previousBuffer = await functions.getBuffer(previous)

        const imgMD5 = crypto.createHash("md5").update(Buffer.from(imgBuffer) as any).digest("hex")
        const previousMD5 = crypto.createHash("md5").update(Buffer.from(previousBuffer) as any).digest("hex")

        if (imgMD5 !== previousMD5) return true
        return false
    }

    useEffect(() => {
        calculateImageDiff().then((answer) => {
            setHasImageUpdate(answer)
            if (!answer && !diffJSX().length && !props.tagHistory.reason) setHasAnyUpdate(false)
        })
    }, [props.previousHistory, props.tagHistory])

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!props.previousHistory || (props.previousHistory?.description !== props.tagHistory.description)) {
            jsx.push(<span className="taghistoryrow-text">{props.tagHistory.description || "None"}</span>)
        }
        if (!props.previousHistory || (props.previousHistory?.aliases !== props.tagHistory.aliases)) {
            if (props.tagHistory.aliases?.[0]) {
                jsx.push(<span className="taghistoryrow-text"><span className="taghistoryrow-label-text">Aliases:</span> {props.tagHistory.aliases.map((alias: string) => alias.replaceAll("-", " ")).join(", ")}</span>)
            }
        }
        if (!props.previousHistory || (props.previousHistory?.implications !== props.tagHistory.implications)) {
            if (props.tagHistory.implications?.[0]) {
                jsx.push(<span className="taghistoryrow-text"><span className="taghistoryrow-label-text">Implications:</span> {props.tagHistory.implications.map((implication: string) => implication.replaceAll("-", " ")).join(", ")}</span>)
            }
        }
        return jsx
    }

    if (!hasAnyUpdate) return null

    return (
        <div className="taghistoryrow">
            {session.username ? tagHistoryOptions() : null}
            <div className="taghistoryrow-container">
                <img className="taghistoryrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}/>
                <span className="taghistoryrow-tag-text" onClick={imgClick} onAuxClick={imgClick}>{functions.toProperCase(props.tagHistory.key.replaceAll("-", " "))}</span>
                {socialJSX()}
            </div>
            <div className="taghistoryrow-container-row">
                <div className="taghistoryrow-container">
                    <div className="taghistoryrow-user-container">
                        {dateTextJSX()}
                        {hasImageUpdate ? <span className="taghistoryrow-text-strong">[Image Updated]</span> : null}
                        {diffJSX()}
                        {props.tagHistory.reason ? <span className="taghistoryrow-text"><span className="taghistoryrow-label-text">Reason:</span> {props.tagHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TagHistoryRow