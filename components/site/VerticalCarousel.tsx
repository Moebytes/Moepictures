import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useCacheSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import CommentRow from "../search/CommentRow"
import ForumPostRow from "../search/ForumPostRow"
import {CommentSearch, ForumPostSearch} from "../../types/Types"
import "./styles/carousel.less"

interface Props {
    type: "comment" | "forumpost"
    items: CommentSearch[] | ForumPostSearch[]
}

const VerticalCarousel: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const history = useHistory()

    const generateJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.items.length; i++) {
            const item = props.items[i]
            if (props.type === "comment") {
                jsx.push(<CommentRow key={i} comment={item as CommentSearch}/>)
            } else if (props.type === "forumpost") {
                jsx.push(<ForumPostRow key={i} forumPost={item as ForumPostSearch}/>)
            }
        }
        return jsx
    }

    return (
        <div className="vertical-carousel">
            {generateJSX()}
        </div>
    )
}

export default VerticalCarousel