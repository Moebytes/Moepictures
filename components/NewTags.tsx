import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useSessionSelector, useSessionActions} from "../store"
import functions from "../structures/Functions"
import "./styles/newtags.less"

interface Props {
    post: any
}

const NewTags: React.FunctionComponent<Props> = (props) => {
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [rawNewTags, setRawNewTags] = useState([]) as any
    const [newTags, setNewTags] = useState([]) as any
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
                        <span className="new-tags-text">Tag: {newTags[i].tag}</span>
                    </div>
                    {newTags[i].image ?
                    <div className="new-tags-row">
                        <img className="new-tags-img" src={functions.getUnverifiedTagLink(newTags[i].type, newTags[i].image)}/>
                    </div> : null}
                    <div className="new-tags-row">
                        <span className="new-tags-text">Description: {newTags[i].description || "No description"}</span>
                    </div>
                </div>
            )
        }
        return jsx
    }

    if (!newTags.length) return null 

    return (
        <div className="new-tags">
        <div className="new-tags-title">New Tags</div>
            {generateTagsJSX()}
        </div>
    )
}

export default NewTags