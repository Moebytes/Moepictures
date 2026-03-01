/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useNoteDialogSelector, useNoteDialogActions, useLayoutSelector,
useFilterSelector, useInteractionActions} from "../../store"
import functions from "../../functions/Functions"
import noteHistoryRevert from "../../assets/svg/revert.svg"
import noteHistoryDelete from "../../assets/svg/delete.svg"
import permissions from "../../structures/Permissions"
import {NoteHistory, Note} from "../../types/Types"
import TinyImage from "../image/TinyImage"
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
    const postID = props.noteHistory.postID
    const order = props.noteHistory.order
    let hasChanges = functions.compare.hasHistoryChanges(props.noteHistory)
    const imageFiltersRef = useRef<HTMLDivElement>(null)

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    const getRedIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "#f71e75")
    }

    const revertNoteHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.http.put("/api/note/save", {postID: props.noteHistory.postID, order: props.noteHistory.order,
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
        await functions.http.delete("/api/note/history/delete", {postID, order, historyID: props.noteHistory.historyID}, session, setSessionFlag)
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
        const post = await functions.http.get("/api/post", {postID: props.noteHistory.postID}, session, setSessionFlag, true)
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
                        <img className="historyrow-options-img" src={getIcon(noteHistoryRevert)}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                    {permissions.isAdmin(session) ?
                    <div className="historyrow-options-container" onClick={deleteNoteHistoryDialog}>
                        <img className="historyrow-options-img" src={getRedIcon(noteHistoryDelete)}/>
                        <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                    </div> : null}
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertNoteHistoryDialog}>
                        <img className="historyrow-options-img" src={getIcon(noteHistoryRevert)}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        let historyIndex = props.current ? "" : `?note=${props.noteHistory.historyID}&order=${props.noteHistory.order}`
        functions.post.openPost(props.noteHistory.post, event, navigate, session, setSessionFlag, historyIndex)
    }

    const dateTextJSX = () => {
        const targetDate = props.noteHistory.updatedDate
        const editText = i18n.time.updated
        
        return functions.jsx.usernameJSX(props.noteHistory.updater, {
            containerClass: "historyrow-username-container",
            textClass: "historyrow-user-text",
            imageClass: "historyrow-user-label",
            editText,
            date: targetDate
        }, i18n, navigate)
    }

    const printNote = (note: Note) => {
        if (note.character) return `${functions.util.toProperCase(i18n.tag.character)} -> ${note.characterTag}`
        return `${note.transcript} -> ${note.translation}`
    }

    const diffText = () => {
        if (!props.noteHistory.notes[0]) return []
        if (!hasChanges) return props.noteHistory.notes.map((item) => printNote(item))
        let noteChanges = props.noteHistory.addedEntries?.length || props.noteHistory.removedEntries?.length
        if (!noteChanges) return []

        const replaceKey = (i: string) => i.replace("Character", functions.util.toProperCase(i18n.tag.character))
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
                <TinyImage className="historyrow-img" post={props.noteHistory.post} order={props.noteHistory.order} onClick={imgClick} height={200}/>
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