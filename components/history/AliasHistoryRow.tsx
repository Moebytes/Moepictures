import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions,
useInteractionActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import aliasHistoryUndo from "../../assets/icons/revert.png"
import aliasHistoryRedo from "../../assets/icons/unrevert.png"
import aliasHistoryDelete from "../../assets/icons/delete.png"
import {AliasHistorySearch} from "../../types/Types"
import "./styles/historyrow.less"

interface Props {
    history: AliasHistorySearch
    onDelete?: () => void
    onEdit?: () => void
}

const AliasHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {deleteAliasHistoryID, deleteAliasHistoryFlag, revertAliasHistoryID, revertAliasHistoryFlag} = useTagDialogSelector()
    const {setDeleteAliasHistoryID, setDeleteAliasHistoryFlag, setRevertAliasHistoryID, setRevertAliasHistoryFlag} = useTagDialogActions()
    const navigate = useNavigate()

    const revertAliasHistory = async () => {
        if (props.history.type === "alias") {
            await functions.http.post("/api/tag/aliasto/undo", {historyID: props.history.historyID}, session, setSessionFlag)
        } else if (props.history.type === "undo alias") {
            await functions.http.post("/api/tag/aliasto", {tag: props.history.source, aliasTo: props.history.target}, session, setSessionFlag)
        } else if (props.history.type === "implication") {
            await functions.http.post("/api/tag/implication/undo", {historyID: props.history.historyID}, session, setSessionFlag)
        } else if (props.history.type === "undo implication") {
            await functions.http.post("/api/tag/implication/redo", {historyID: props.history.historyID}, session, setSessionFlag)
        }
        props.onEdit?.()
    }

    useEffect(() => {
        if (revertAliasHistoryFlag && props.history.historyID === revertAliasHistoryID?.historyID) {
            revertAliasHistory().then(() => {
                setRevertAliasHistoryFlag(false)
                setRevertAliasHistoryID(null)
            }).catch(() => {
                setRevertAliasHistoryFlag(false)
                setRevertAliasHistoryID({failed: true, historyID: props.history.historyID, type: props.history.type})
            })
        }
    }, [revertAliasHistoryFlag, revertAliasHistoryID, session])

    const deleteAliasHistory = async () => {
        await functions.http.delete("/api/alias/history/delete", {historyID: props.history.historyID, type: props.history.type}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteAliasHistoryFlag && props.history.historyID === deleteAliasHistoryID?.historyID) {
            deleteAliasHistory().then(() => {
                setDeleteAliasHistoryFlag(false)
                setDeleteAliasHistoryID(null)
            }).catch(() => {
                setDeleteAliasHistoryFlag(false)
                setDeleteAliasHistoryID({failed: true, historyID: props.history.historyID, type: props.history.type})
            })
        }
    }, [deleteAliasHistoryFlag, deleteAliasHistoryID, session])

    const revertAliasHistoryDialog = async () => {
        setRevertAliasHistoryID({failed: false, historyID: props.history.historyID, type: props.history.type})
    }

    const deleteAliasHistoryDialog = async () => {
        setDeleteAliasHistoryID({failed: false, historyID: props.history.historyID, type: props.history.type})
    }

    const aliasHistoryOptions = () => {
        if (permissions.isMod(session)) {
            return (
                <div className="historyrow-options">
                    {props.history.type?.includes("undo") ?
                    <div className="historyrow-options-container" onClick={revertAliasHistoryDialog}>
                        <img className="historyrow-options-img" src={aliasHistoryRedo}/>
                        <span className="historyrow-options-text">{i18n.buttons.redo}</span>
                    </div> : 
                    <div className="historyrow-options-container" onClick={revertAliasHistoryDialog}>
                        <img className="historyrow-options-img" src={aliasHistoryUndo}/>
                        <span className="historyrow-options-text">{i18n.buttons.undo}</span>
                    </div>}
                    {permissions.isAdmin(session) ?
                    <div className="historyrow-options-container" onClick={deleteAliasHistoryDialog}>
                        <img className="historyrow-options-img" src={aliasHistoryDelete}/>
                        <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                    </div> : null}
                </div>
            )
        }
    }

    const dateTextJSX = () => {
        let targetDate = props.history.date
        let editText = i18n.time.aliased
        if (props.history.type?.includes("implication")) editText = i18n.time.implicated

        return functions.jsx.usernameJSX(props.history.user, {
            containerClass: "historyrow-username-container",
            textClass: "historyrow-user-text",
            imageClass: "historyrow-user-label",
            editText,
            date: targetDate
        }, i18n, navigate)
    }

    const getJSX = () => {
        if (props.history.type === "alias") return (
            <span>
                <span>{props.history.source}</span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => navigate(`/tag/${encodeURIComponent(props.history.target)}`)}> ⇢ {props.history.target}</span>
            </span>
        )
        if (props.history.type === "undo alias") return (
            <span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => navigate(`/tag/${encodeURIComponent(props.history.source)}`)}>{props.history.source} ⇠ </span>
                <span style={{cursor: "pointer"}} onClick={() => navigate(`/tag/${encodeURIComponent(props.history.target)}`)}>{props.history.target}</span>
            </span>
        )
        if (props.history.type === "implication") return (
            <span>
                <span style={{cursor: "pointer"}} onClick={() => navigate(`/tag/${encodeURIComponent(props.history.source)}`)}>{props.history.source}</span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => navigate(`/tag/${encodeURIComponent(props.history.target)}`)}> ⇾ {props.history.target}</span>
            </span>
        )
        if (props.history.type === "undo implication") return (
            <span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => navigate(`/tag/${encodeURIComponent(props.history.source)}`)}>{props.history.source} ⇽ </span>
                <span style={{cursor: "pointer"}} onClick={() => navigate(`/tag/${encodeURIComponent(props.history.target)}`)}>{props.history.target}</span>
            </span>
        )
    }

    return (
        <div className="historyrow" style={{flexDirection: "column"}}>
            {aliasHistoryOptions()}
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    {dateTextJSX()}
                </div>
            </div>
            <div className="historyrow-container-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-label-text">{getJSX()}</span>
                </div>
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-label-text-strong"><span className="historyrow-label-text">{i18n.sidebar.type}: </span>{props.history.type}</span>
                </div>
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-label-text-strong"><span className="historyrow-label-text">{i18n.labels.affectedPosts}: </span>{props.history.affectedPosts?.length || 0}</span>
                </div>
            </div>
            <div className="historyrow-container-row">
                {props.history.reason ?
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.reason}: </span>{props.history.reason}</span>
                </div> : null}
            </div>
        </div>
    )
}

export default AliasHistoryRow