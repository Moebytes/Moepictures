import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useNoteDialogSelector, useNoteDialogActions, useLayoutSelector,
useFilterSelector, useInteractionActions} from "../../store"
import functions from "../../structures/Functions"
import noteHistoryRevert from "../../assets/icons/revert.png"
import noteHistoryDelete from "../../assets/icons/delete.png"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import permissions from "../../structures/Permissions"
import {NoteHistory, Note} from "../../types/Types"
import EffectImage from "../image/EffectImage"
import "./styles/historyrow.less"

interface Props {
    previousHistory: NoteHistory | null
    noteHistory: NoteHistory
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
    exact?: boolean
}

const NoteHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {deleteNoteHistoryID, revertNoteHistoryID, deleteNoteHistoryFlag, revertNoteHistoryFlag} = useNoteDialogSelector()
    const {setDeleteNoteHistoryID, setRevertNoteHistoryID, setDeleteNoteHistoryFlag, setRevertNoteHistoryFlag} = useNoteDialogActions()
    const navigate = useNavigate()
    const [userRole, setUserRole] = useState("")
    const postID = props.noteHistory.postID
    const order = props.noteHistory.order
    let prevHistory = props.previousHistory || Boolean(props.exact)
    const imageFiltersRef = useRef<HTMLDivElement>(null)

    const updateUserRole = async () => {
        const user = await functions.get("/api/user", {username: props.noteHistory.updater}, session, setSessionFlag)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateUserRole()
    }, [props.noteHistory, session])

    const revertNoteHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.put("/api/note/save", {postID: props.noteHistory.postID, order: props.noteHistory.order,
        data: props.noteHistory.notes}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (revertNoteHistoryFlag && props.noteHistory.historyID === revertNoteHistoryID?.historyID) {
            revertNoteHistory().then(() => {
                setRevertNoteHistoryFlag(false)
                setRevertNoteHistoryID(null)
            }).catch(() => {
                setRevertNoteHistoryFlag(false)
                setRevertNoteHistoryID({failed: true, historyID: props.noteHistory.historyID})
            })
        }
    }, [revertNoteHistoryFlag, revertNoteHistoryID, session, props.current])

    const deleteNoteHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.delete("/api/note/history/delete", {postID, order, historyID: props.noteHistory.historyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteNoteHistoryFlag && props.noteHistory.historyID === deleteNoteHistoryID?.historyID) {
            deleteNoteHistory().then(() => {
                setDeleteNoteHistoryFlag(false)
                setDeleteNoteHistoryID(null)
            }).catch(() => {
                setDeleteNoteHistoryFlag(false)
                setDeleteNoteHistoryID({failed: true, historyID: props.noteHistory.historyID})
            })
        }
    }, [deleteNoteHistoryFlag, deleteNoteHistoryID, session, props.current])

    const revertNoteHistoryDialog = async () => {
        const post = await functions.get("/api/post", {postID: props.noteHistory.postID}, session, setSessionFlag)
        if (!post) return
        if (post.locked && !permissions.isMod(session)) return setRevertNoteHistoryID({failed: "locked", historyID: props.noteHistory.historyID})
        setRevertNoteHistoryID({failed: false, historyID: props.noteHistory.historyID})
    }

    const deleteNoteHistoryDialog = async () => {
        setDeleteNoteHistoryID({failed: false, historyID: props.noteHistory.historyID})
    }

    const notehistoryOptions = () => {
        if (session.banned) return null
        if (permissions.isMod(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertNoteHistoryDialog}>
                        <img className="historyrow-options-img" src={noteHistoryRevert}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                    <div className="historyrow-options-container" onClick={deleteNoteHistoryDialog}>
                        <img className="historyrow-options-img" src={noteHistoryDelete}/>
                        <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertNoteHistoryDialog}>
                        <img className="historyrow-options-img" src={noteHistoryRevert}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        let historyIndex = props.current ? "" : `?note=${props.noteHistory.historyID}&order=${props.noteHistory.order}`
        functions.openPost(props.noteHistory.post, event, navigate, session, setSessionFlag, historyIndex)
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.noteHistory.updater}`, "_blank")
        } else {
            navigate(`/user/${props.noteHistory.updater}`)
        }
    }


    const dateTextJSX = () => {
        const targetDate = props.noteHistory.updatedDate
        const targetUser = props.noteHistory.updater
        const editText = i18n.time.updated
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (userRole === "premium-curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser)}</span>
                    <img className="historyrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (userRole === "curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser)}</span>
                    <img className="historyrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (userRole === "premium-contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser)}</span>
                    <img className="historyrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (userRole === "contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text contributor-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser)}</span>
                    <img className="historyrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (userRole === "premium") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser)}</span>
                    <img className="historyrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(targetUser) || i18n.user.deleted}</span>
    }

    const printNote = (note: Note) => {
        if (note.character) return `${functions.toProperCase(i18n.tag.character)} -> ${note.characterTag}`
        return `${note.transcript} -> ${note.translation}`
    }

    const diffText = () => {
        if (!prevHistory) {
            if (props.noteHistory.notes[0].transcript === "No data") return []
            return props.noteHistory.notes.map((item) => printNote(item))
        }
        let noteChanges = props.noteHistory.addedEntries?.length || props.noteHistory.removedEntries?.length
        if (!noteChanges) return []

        const replaceKey = (i: string) => i.replace("Character", functions.toProperCase(i18n.tag.character))
        const addedJSX = props.noteHistory.addedEntries.map((i: string) => <span className="tag-add">+{replaceKey(i)}</span>)
        const removedJSX = props.noteHistory.removedEntries.map((i: string) => <span className="tag-remove">-{replaceKey(i)}</span>)

        if (![...addedJSX, ...removedJSX].length) return []
        return [...addedJSX, ...removedJSX]
    }

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        const diffs = diffText()
        for (let i = 0; i < diffs.length; i++) {
            jsx.push(<span className="historyrow-text">{diffs[i]}</span>)
        }
        if (!jsx.length && !props.noteHistory.styleChanged) {
            jsx.push(<span className="historyrow-text">{i18n.labels.noData}</span>)
        }
        return jsx
    }

    return (
        <div className="historyrow">
            {session.username ? notehistoryOptions() : null}
            <div className="historyrow-container" ref={imageFiltersRef}>
                <EffectImage className="historyrow-img" post={props.noteHistory.post} order={props.noteHistory.order} onClick={imgClick} height={200}/>
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {dateTextJSX()}
                        {props.noteHistory.styleChanged ? <span className="historyrow-text-strong">[{i18n.labels.styleUpdated}]</span> : null}
                        {diffJSX()}
                        {props.noteHistory.reason ? <span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.reason}:</span> {props.noteHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NoteHistoryRow