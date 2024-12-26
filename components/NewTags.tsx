import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions} from "../store"
import functions from "../structures/Functions"
import "./styles/newtags.less"
import {PostFull, Tag, UnverifiedPost} from "../types/Types"

interface Props {
    post: PostFull | UnverifiedPost
}

const NewTags: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [rawNewTags, setRawNewTags] = useState([] as string[])
    const [newTags, setNewTags] = useState([] as Tag[])
    const history = useHistory()

    const updateNewTags = async () => {
        if (!rawNewTags.length) return setNewTags([])
        const tags = await functions.get("/api/tag/list/unverified", {tags: rawNewTags}, session, setSessionFlag)
        setNewTags(tags)
    }

    useEffect(() => {
        updateNewTags()
    }, [rawNewTags])

    const updateRawNewTags = async () => {
        const tagMap = await functions.tagsCache(session, setSessionFlag)
        let notExists = [] as any
        for (let i = 0; i < props.post.tags.length; i++) {
            const exists = tagMap[props.post.tags[i]]
            if (!exists) notExists.push(props.post.tags[i])
        }
        setRawNewTags(notExists)
    }

    useEffect(() => {
        updateRawNewTags()
    }, [])

    useEffect(() => {
        updateRawNewTags()
    }, [props.post, session])

    const generateTagsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < newTags.length; i++) {
            jsx.push(
                <div className="new-tags-container">
                    <div className="new-tags-row">
                        <span className="new-tags-text">{i18n.tag.tag}: {newTags[i].tag}</span>
                    </div>
                    {newTags[i].image ?
                    <div className="new-tags-row">
                        <img className="new-tags-img" src={functions.getUnverifiedTagLink(newTags[i].type, newTags[i].image)}/>
                    </div> : null}
                    <div className="new-tags-row">
                        <span className="new-tags-text">{i18n.labels.description}: {newTags[i].description || i18n.labels.none}</span>
                    </div>
                </div>
            )
        }
        return jsx
    }

    if (!newTags.length) return null 

    return (
        <div className="new-tags">
        <div className="new-tags-title">{i18n.labels.newTags}</div>
            {generateTagsJSX()}
        </div>
    )
}

export default NewTags