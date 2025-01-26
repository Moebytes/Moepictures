import React from "react"
import {useHistory} from "react-router-dom"
import functions from "../../structures/Functions"
import {useLayoutSelector, useSessionSelector, useThemeSelector} from "../../store"
import "./styles/parent.less"
import Carousel from "../site/Carousel"
import {ChildPost} from "../../types/Types"

interface Props {
    post: ChildPost
}

const Parent: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const history = useHistory()
    const post = props.post.post
    const image = functions.getThumbnailLink(post.images[0], "tiny", session, mobile)

    const click = (img: string, index: number) => {
        history.push(`/post/${post.postID}/${post.slug}`)
    }

    return (
        <div className="parent">
            <div className="parent-title">{i18n.post.parentPost}</div>
            <div className="parent-container">
                <Carousel images={[image]} set={click} noKey={true}/>
            </div>
        </div>
    )
}

export default Parent