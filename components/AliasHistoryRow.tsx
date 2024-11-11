import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {SessionContext, MobileContext, SessionFlagContext, DeleteAliasHistoryIDContext, 
DeleteAliasHistoryFlagContext, RevertAliasHistoryIDContext, RevertAliasHistoryFlagContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import aliasHistoryUndo from "../assets/icons/revert.png"
import aliasHistoryRedo from "../assets/icons/unrevert.png"
import aliasHistoryDelete from "../assets/icons/delete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import premiumCuratorStar from "../assets/icons/premium-curator-star.png"
import curatorStar from "../assets/icons/curator-star.png"
import premiumContributorPencil from "../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../assets/icons/contributor-pencil.png"
import premiumStar from "../assets/icons/premium-star.png"
import "./styles/historyrow.less"
import path from "path"

interface Props {
    history: any
    onDelete?: () => void
    onEdit?: () => void
}

const AliasHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteAliasHistoryID, setDeleteAliasHistoryID} = useContext(DeleteAliasHistoryIDContext)
    const {deleteAliasHistoryFlag, setDeleteAliasHistoryFlag} = useContext(DeleteAliasHistoryFlagContext)
    const {revertAliasHistoryID, setRevertAliasHistoryID} = useContext(RevertAliasHistoryIDContext)
    const {revertAliasHistoryFlag, setRevertAliasHistoryFlag} = useContext(RevertAliasHistoryFlagContext)
    const [userRole, setUserRole] = useState("")
    const history = useHistory()

    const updateUserRole = async () => {
        const user = await functions.get("/api/user", {username: props.history.user}, session, setSessionFlag)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateUserRole()
    }, [props.history, session])

    const revertAliasHistory = async () => {
        if (props.history.type === "alias") {
            await functions.post("/api/tag/aliasto/undo", {historyID: props.history.historyID}, session, setSessionFlag)
        } else if (props.history.type === "undo alias") {
            await functions.post("/api/tag/aliasto", {tag: props.history.source, aliasTo: props.history.target}, session, setSessionFlag)
        } else if (props.history.type === "implication") {
            await functions.post("/api/tag/implication/undo", {historyID: props.history.historyID}, session, setSessionFlag)
        } else if (props.history.type === "undo implication") {
            await functions.post("/api/tag/implication/redo", {historyID: props.history.historyID}, session, setSessionFlag)
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
        await functions.delete("/api/alias/history/delete", {historyID: props.history.historyID, type: props.history.type}, session, setSessionFlag)
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
                        <span className="historyrow-options-text">Redo</span>
                    </div> : 
                    <div className="historyrow-options-container" onClick={revertAliasHistoryDialog}>
                        <img className="historyrow-options-img" src={aliasHistoryUndo}/>
                        <span className="historyrow-options-text">Undo</span>
                    </div>}
                    {permissions.isAdmin(session) ?
                    <div className="historyrow-options-container" onClick={deleteAliasHistoryDialog}>
                        <img className="historyrow-options-img" src={aliasHistoryDelete}/>
                        <span className="historyrow-options-text">Delete</span>
                    </div> : null}
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.history.user}`, "_blank")
        } else {
            history.push(`/user/${props.history.user}`)
        }
    }

    const dateTextJSX = () => {
        let targetDate = props.history.date
        let editText = "Aliased"
        if (props.history.type?.includes("implication")) editText = "Implicated"
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (userRole === "premium-curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user)}</span>
                    <img className="historyrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (userRole === "curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user)}</span>
                    <img className="historyrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (userRole === "premium-contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user)}</span>
                    <img className="historyrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (userRole === "contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text contributor-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user)}</span>
                    <img className="historyrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (userRole === "premium") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user)}</span>
                    <img className="historyrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.history.user) || "deleted"}</span>
    }

    const getJSX = () => {
        if (props.history.type === "alias") return (
            <span>
                <span>{props.history.source}</span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => history.push(`/tag/${props.history.target}`)}> ⇢ {props.history.target}</span>
            </span>
        )
        if (props.history.type === "undo alias") return (
            <span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => history.push(`/tag/${props.history.source}`)}>{props.history.source} ⇠ </span>
                <span style={{cursor: "pointer"}} onClick={() => history.push(`/tag/${props.history.target}`)}>{props.history.target}</span>
            </span>
        )
        if (props.history.type === "implication") return (
            <span>
                <span style={{cursor: "pointer"}} onClick={() => history.push(`/tag/${props.history.source}`)}>{props.history.source}</span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => history.push(`/tag/${props.history.target}`)}> ⇾ {props.history.target}</span>
            </span>
        )
        if (props.history.type === "undo implication") return (
            <span>
                <span style={{cursor: "pointer", color: "var(--text-strong)"}} onClick={() => history.push(`/tag/${props.history.source}`)}>{props.history.source} ⇽ </span>
                <span style={{cursor: "pointer"}} onClick={() => history.push(`/tag/${props.history.target}`)}>{props.history.target}</span>
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
            <div className="historyrow-container-row">
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-label-text">{getJSX()}</span>
                </div>
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-label-text-strong"><span className="historyrow-label-text">Type: </span>{props.history.type}</span>
                </div>
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-label-text-strong"><span className="historyrow-label-text">Affected Posts: </span>{props.history.affectedPosts?.length || 0}</span>
                </div>
            </div>
            <div className="historyrow-container-row">
                {props.history.reason ?
                <div className="historyrow-container-fullwidth">
                    <span className="historyrow-text"><span className="historyrow-label-text-strong">Reason: </span>{props.history.reason}</span>
                </div> : null}
            </div>
        </div>
    )
}

export default AliasHistoryRow