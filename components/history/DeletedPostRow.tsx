import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions, useLayoutSelector,
useInteractionActions} from "../../store"
import functions from "../../structures/Functions"
import undeleteIcon from "../../assets/icons/revert.png"
import deleteIcon from "../../assets/icons/delete.png"
import {DeletedPost} from "../../types/Types"
import EffectImage from "../image/EffectImage"
import "./styles/historyrow.less"

interface Props {
    post: DeletedPost
    onDelete?: () => void
}

const DeletedPostRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {permaDeletePostID, permaDeletePostFlag} = usePostDialogSelector()
    const {setUndeletePostID, setPermaDeletePostID, setPermaDeletePostFlag} = usePostDialogActions()
    const history = useHistory()

    const undeletePostDialog = async () => {
        setUndeletePostID({postID: props.post.postID})
    }

    const deletePost = async () => {
        await functions.delete("/api/post/delete", {postID: props.post.postID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (permaDeletePostFlag && props.post.postID === permaDeletePostID) {
            deletePost()
            setPermaDeletePostFlag(false)
            setPermaDeletePostID(null)
        }
    }, [permaDeletePostFlag, permaDeletePostID, session])

    const deletePostDialog = async () => {
        setPermaDeletePostID(props.post.postID)
    }

    const deleteHistoryOptions = () => {
        return (
            <div className="historyrow-options">
                <div className="historyrow-options-container" onClick={undeletePostDialog}>
                    <img className="historyrow-options-img" src={undeleteIcon}/>
                    <span className="historyrow-options-text">{i18n.buttons.undelete}</span>
                </div>
                <div className="historyrow-options-container" onClick={deletePostDialog}>
                    <img className="historyrow-options-img" src={deleteIcon}/>
                    <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                </div>
            </div>
        )
    }

    const imgClick = (event: React.MouseEvent) => {
        functions.openPost(props.post, event, history, session, setSessionFlag)
    }

    const printMirrors = () => {
        const mapped = Object.values(props.post.mirrors || {}) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="historyrow-label-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m, i18n) + append}</span>
        })
    }

    return (
        <div className="historyrow">
            {deleteHistoryOptions()}
            <div className="historyrow-container">
                <EffectImage className="historyrow-img" post={props.post} onClick={imgClick} height={200}/>
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="historyrow-user-text" style={{color: "var(--deletedColor)"}}>{i18n.time.deleted} {functions.timeUntil(props.post.deletionDate, i18n)}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.title}: </span>{props.post.title || i18n.labels.none}</span>
                        {props.post.englishTitle ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sidebar.english}: </span>{props.post.englishTitle}</span> : null}
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sort.posted}: </span>{props.post.posted ? functions.formatDate(new Date(props.post.posted)) : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.tag.artist}: </span>{props.post.artist ? props.post.artist : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.source}: </span><span className="historyrow-label-link" onClick={() => window.open(props.post.source, "_blank")}>{functions.getSiteName(props.post.source, i18n)}</span></span>
                        {props.post.mirrors ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.mirrors}: </span>{printMirrors()}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeletedPostRow