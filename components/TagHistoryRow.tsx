import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, MobileContext, DeleteTagHistoryIDContext, 
RevertTagHistoryIDContext, DeleteTagHistoryFlagContext, RevertTagHistoryFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import tagHistoryRevert from "../assets/purple/revert.png"
import tagHistoryDelete from "../assets/purple/delete.png"
import adminCrown from "../assets/purple/admin-crown.png"
import modCrown from "../assets/purple/mod-crown.png"
import permissions from "../structures/Permissions"
import website from "../assets/purple/support.png"
import fandom from "../assets/purple/fandom.png"
import pixiv from "../assets/purple/pixiv.png"
import twitter from "../assets/purple/twitter.png"
import "./styles/taghistoryrow.less"
import axios from "axios"

interface Props {
    tagHistory: any
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
}

const TagHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {deleteTagHistoryID, setDeleteTagHistoryID} = useContext(DeleteTagHistoryIDContext)
    const {revertTagHistoryID, setRevertTagHistoryID} = useContext(RevertTagHistoryIDContext)
    const {deleteTagHistoryFlag, setDeleteTagHistoryFlag} = useContext(DeleteTagHistoryFlagContext)
    const {revertTagHistoryFlag, setRevertTagHistoryFlag} = useContext(RevertTagHistoryFlagContext)
    const history = useHistory()
    const initialImg = functions.getTagLink(props.tagHistory.type, props.tagHistory.image)
    const [img, setImg] = useState(initialImg)
    const [userRole, setUserRole] = useState("")
    const tag = props.tagHistory.tag

    const updateUserRole = async () => {
        const user = await axios.get("/api/user", {params: {username: props.tagHistory.user}, withCredentials: true}).then((r) => r.data)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateUserRole()
    }, [])

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
        await axios.put("/api/tag/edit", {tag: props.tagHistory.tag, key: props.tagHistory.key, description: props.tagHistory.description,
        image, aliases: props.tagHistory.aliases, implications: props.tagHistory.implications, pixiv: props.tagHistory.pixiv, twitter: props.tagHistory.twitter,
        website: props.tagHistory.website, fandom: props.tagHistory.fandom}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
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
    }, [revertTagHistoryFlag, revertTagHistoryID, props.current])

    const deleteTagHistory = async () => {
        if (props.current) return Promise.reject()
        await axios.delete("/api/tag/history/delete", {params: {tag: props.tagHistory.tag, historyID: props.tagHistory.historyID}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
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
    }, [deleteTagHistoryFlag, deleteTagHistoryID, props.current])

    const revertTagHistoryDialog = async () => {
        setRevertTagHistoryID({failed: false, historyID: props.tagHistory.historyID})
    }

    const deleteTagHistoryDialog = async () => {
        setDeleteTagHistoryID({failed: false, historyID: props.tagHistory.historyID})
    }

    const tagHistoryOptions = () => {
        if (permissions.isStaff(session)) {
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
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.tagHistory.tag}`, "_blank")
        } else {
            history.push(`/tag/${props.tagHistory.tag}`)
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
            if (props.tagHistory.pixiv) {
                jsx.push(<img className="taghistoryrow-social" src={pixiv} onClick={() => window.open(props.tagHistory.pixiv, "_blank")}/>)
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
        const targetDate = props.tagHistory.date ? props.tagHistory.date : props.tagHistory.uploadDate
        const targetUser = props.tagHistory.date ? props.tagHistory.user : props.tagHistory.uploader
        const targetText = props.tagHistory.date ? "Edited" : "Created"
        if (userRole === "admin") {
            return (
                <div className="taghistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="taghistoryrow-user-text admin-color">{targetText} {functions.timeAgo(targetDate)} by {functions.toProperCase(targetUser)}</span>
                    <img className="taghistoryrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="taghistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="taghistoryrow-user-text mod-color">{targetText} {functions.timeAgo(targetDate)} by {functions.toProperCase(targetUser)}</span>
                    <img className="taghistoryrow-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="taghistoryrow-user-text" onClick={userClick} onAuxClick={userClick}>{targetText} {functions.timeAgo(targetDate)} by {functions.toProperCase(targetUser)}</span>
    }


    return (
        <div className="taghistoryrow">
            <div className="taghistoryrow-container">
                <img className="taghistoryrow-img" src={img}/>
                <span className="taghistoryrow-tag-text" onClick={imgClick} onAuxClick={imgClick}>{functions.toProperCase(props.tagHistory.key.replaceAll("-", " "))}</span>
                {socialJSX()}
            </div>
            <div className="taghistoryrow-container-row">
                <div className="taghistoryrow-container">
                    <div className="taghistoryrow-user-container">
                        {dateTextJSX()}
                        <span className="taghistoryrow-text">{props.tagHistory.description || "None"}</span>
                        {props.tagHistory.aliases?.[0] ? <span className="taghistoryrow-text"><span className="taghistoryrow-label-text">Aliases:</span> {props.tagHistory.aliases.map((alias) => alias.replaceAll("-", " ")).join(", ")}</span> : null}
                        {props.tagHistory.implications?.[0] ? <span className="taghistoryrow-text"><span className="taghistoryrow-label-text">Implications:</span> {props.tagHistory.implications.map((implication) => implication.replaceAll("-", " ")).join(", ")}</span> : null}
                        {props.tagHistory.reason ? <span className="taghistoryrow-text"><span className="taghistoryrow-label-text">Reason:</span> {props.tagHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
            {session.username ? tagHistoryOptions() : null}
        </div>
    )
}

export default TagHistoryRow