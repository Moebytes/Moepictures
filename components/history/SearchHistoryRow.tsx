import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useSearchDialogSelector, useSearchDialogActions, useLayoutSelector,
useInteractionActions} from "../../store"
import functions from "../../structures/Functions"
import searchHistoryDelete from "../../assets/icons/delete.png"
import {SearchHistory} from "../../types/Types"
import EffectImage from "../image/EffectImage"
import "./styles/historyrow.less"

interface Props {
    history: SearchHistory
    onDelete?: () => void
}

const SearchHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {deleteSearchHistoryID, deleteSearchHistoryFlag} = useSearchDialogSelector()
    const {setDeleteSearchHistoryID, setDeleteSearchHistoryFlag} = useSearchDialogActions()
    const history = useHistory()

    const deleteSearchHistory = async () => {
        await functions.delete("/api/user/history/delete", {postID: props.history.postID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteSearchHistoryFlag && props.history.postID === deleteSearchHistoryID) {
            deleteSearchHistory()
            setDeleteSearchHistoryFlag(false)
            setDeleteSearchHistoryID(null)
        }
    }, [deleteSearchHistoryFlag, deleteSearchHistoryID, session])

    const deleteSearchHistoryDialog = async () => {
        setDeleteSearchHistoryID(props.history.postID)
    }

    const searchHistoryOptions = () => {
        return (
            <div className="historyrow-options">
                <div className="historyrow-options-container" onClick={deleteSearchHistoryDialog}>
                    <img className="historyrow-options-img" src={searchHistoryDelete}/>
                    <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                </div>
            </div>
        )
    }

    const imgClick = (event: React.MouseEvent) => {
        functions.openPost(props.history.post, event, history, session, setSessionFlag)
    }

    const printMirrors = () => {
        const mapped = Object.values(props.history.post.mirrors || {}) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="historyrow-label-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m, i18n) + append}</span>
        })
    }

    return (
        <div className="historyrow">
            {searchHistoryOptions()}
            <div className="historyrow-container">
                <EffectImage className="historyrow-img" post={props.history.post} onClick={imgClick} height={200}/>
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="historyrow-user-text">{i18n.time.viewed} {functions.prettyDate(props.history.viewDate, i18n)}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.title}: </span>{props.history.post.title || i18n.labels.none}</span>
                        {props.history.post.englishTitle ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sidebar.english}: </span>{props.history.post.englishTitle}</span> : null}
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sort.posted}: </span>{props.history.post.posted ? functions.formatDate(new Date(props.history.post.posted)) : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.tag.artist}: </span>{props.history.post.artist ? props.history.post.artist : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.source}: </span><span className="historyrow-label-link" onClick={() => window.open(props.history.post.source, "_blank")}>{functions.getSiteName(props.history.post.source, i18n)}</span></span>
                        {props.history.post.mirrors ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.mirrors}: </span>{printMirrors()}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchHistoryRow