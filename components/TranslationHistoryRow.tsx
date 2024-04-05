import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SessionContext, MobileContext, DeleteTranslationHistoryIDContext, RevertTranslationHistoryIDContext,
DeleteTranslationHistoryFlagContext, RevertTranslationHistoryFlagContext} from "../Context"
import functions from "../structures/Functions"
import translationHistoryRevert from "../assets/icons/revert.png"
import translationHistoryDelete from "../assets/icons/delete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import permissions from "../structures/Permissions"
import cryptoFunctions from "../structures/CryptoFunctions"
import "./styles/translationhistoryrow.less"
import axios from "axios"

interface Props {
    translationHistory: any
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
}

const TranslationHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {deleteTranslationHistoryID, setDeleteTranslationHistoryID} = useContext(DeleteTranslationHistoryIDContext)
    const {revertTranslationHistoryID, setRevertTranslationHistoryID} = useContext(RevertTranslationHistoryIDContext)
    const {deleteTranslationHistoryFlag, setDeleteTranslationHistoryFlag} = useContext(DeleteTranslationHistoryFlagContext)
    const {revertTranslationHistoryFlag, setRevertTranslationHistoryFlag} = useContext(RevertTranslationHistoryFlagContext)
    const history = useHistory()
    const [img, setImg] = useState("")
    const [userRole, setUserRole] = useState("")
    const postID = props.translationHistory.postID
    const order = props.translationHistory.order

    const updateUserRole = async () => {
        const user = await axios.get("/api/user", {params: {username: props.translationHistory.updater}, withCredentials: true}).then((r) => r.data)
        if (user?.role) setUserRole(user.role)
    }

    const updateImage = async () => {
        const thumb = functions.getThumbnailLink(props.translationHistory.post.images[0].type, props.translationHistory.postID, props.translationHistory.order, props.translationHistory.post.images[0].filename, "medium")
        const decrypted = await cryptoFunctions.decryptedLink(thumb)
        setImg(decrypted)
    }

    useEffect(() => {
        updateUserRole()
        updateImage()
    }, [])

    const revertTranslationHistory = async () => {
        if (props.current) return Promise.reject()
        await axios.put("/api/translation/save", {postID: props.translationHistory.postID, order: props.translationHistory.order,
        data: props.translationHistory.data}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        props.onEdit?.()
    }

    useEffect(() => {
        if (revertTranslationHistoryFlag && props.translationHistory.historyID === revertTranslationHistoryID?.historyID) {
            revertTranslationHistory().then(() => {
                setRevertTranslationHistoryFlag(false)
                setRevertTranslationHistoryID(null)
            }).catch(() => {
                setRevertTranslationHistoryFlag(false)
                setRevertTranslationHistoryID({failed: true, historyID: props.translationHistory.historyID})
            })
        }
    }, [revertTranslationHistoryFlag, revertTranslationHistoryID, props.current])

    const deleteTranslationHistory = async () => {
        if (props.current) return Promise.reject()
        await axios.delete("/api/translation/history/delete", {params: {postID, order, historyID: props.translationHistory.historyID}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteTranslationHistoryFlag && props.translationHistory.historyID === deleteTranslationHistoryID?.historyID) {
            deleteTranslationHistory().then(() => {
                setDeleteTranslationHistoryFlag(false)
                setDeleteTranslationHistoryID(null)
            }).catch(() => {
                setDeleteTranslationHistoryFlag(false)
                setDeleteTranslationHistoryID({failed: true, historyID: props.translationHistory.historyID})
            })
        }
    }, [deleteTranslationHistoryFlag, deleteTranslationHistoryID, props.current])

    const revertTranslationHistoryDialog = async () => {
        setRevertTranslationHistoryID({failed: false, historyID: props.translationHistory.historyID})
    }

    const deleteTranslationHistoryDialog = async () => {
        setDeleteTranslationHistoryID({failed: false, historyID: props.translationHistory.historyID})
    }

    const translationhistoryOptions = () => {
        if (permissions.isStaff(session)) {
            return (
                <div className="translationhistoryrow-options">
                    <div className="translationhistoryrow-options-container" onClick={revertTranslationHistoryDialog}>
                        <img className="translationhistoryrow-options-img" src={translationHistoryRevert}/>
                        <span className="translationhistoryrow-options-text">Revert</span>
                    </div>
                    <div className="translationhistoryrow-options-container" onClick={deleteTranslationHistoryDialog}>
                        <img className="translationhistoryrow-options-img" src={translationHistoryDelete}/>
                        <span className="translationhistoryrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="translationhistoryrow-options">
                    <div className="translationhistoryrow-options-container" onClick={revertTranslationHistoryDialog}>
                        <img className="translationhistoryrow-options-img" src={translationHistoryRevert}/>
                        <span className="translationhistoryrow-options-text">Revert</span>
                    </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.translationHistory.postID}`, "_blank")
        } else {
            history.push(`/post/${props.translationHistory.postID}`)
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.translationHistory.updater}`, "_blank")
        } else {
            history.push(`/user/${props.translationHistory.updater}`)
        }
    }


    const dateTextJSX = () => {
        const targetDate = props.translationHistory.updatedDate
        const targetUser = props.translationHistory.updater
        const targetText = "Updated"
        if (userRole === "admin") {
            return (
                <div className="translationhistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="translationhistoryrow-user-text admin-color">{targetText} {functions.timeAgo(targetDate)} by {functions.toProperCase(targetUser)}</span>
                    <img className="translationhistoryrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="translationhistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="translationhistoryrow-user-text mod-color">{targetText} {functions.timeAgo(targetDate)} by {functions.toProperCase(targetUser)}</span>
                    <img className="translationhistoryrow-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="translationhistoryrow-user-text" onClick={userClick} onAuxClick={userClick}>{targetText} {functions.timeAgo(targetDate)} by {functions.toProperCase(targetUser)}</span>
    }

    const translationJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.translationHistory.data.length; i++) {
            const item = props.translationHistory.data[i]
            if (item.transcript === "No data") {
                jsx.push(<span className="translationhistoryrow-tag-text">No data</span>)
            } else {
                jsx.push(<span className="translationhistoryrow-tag-text">{`${item.transcript} -> ${item.translation}`}</span>)
            }
        }
        return jsx
    }


    return (
        <div className="translationhistoryrow">
            {session.username ? translationhistoryOptions() : null}
            <div className="translationhistoryrow-container">
                <img className="translationhistoryrow-img" src={img} onClick={imgClick}/>
            </div>
            <div className="translationhistoryrow-container-row">
                <div className="translationhistoryrow-container">
                    <div className="translationhistoryrow-user-container">
                        {dateTextJSX()}
                        {translationJSX()}
                        {props.translationHistory.reason ? <span className="taghistoryrow-text"><span className="taghistoryrow-label-text">Reason:</span> {props.translationHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TranslationHistoryRow