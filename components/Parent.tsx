import React from "react"
import {useHistory} from "react-router-dom"
import functions from "../structures/Functions"
import {useThemeSelector} from "../store"
import "./styles/parent.less"
import Carousel from "./Carousel"

interface Props {
    post: any
}

const Parent: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const history = useHistory()
    const image = functions.getThumbnailLink(props.post.post.images[0].type, props.post.parentID, props.post.post.images[0].order, props.post.post.images[0].filename, "small")

    const click = (img: string, index: number) => {
        history.push(`/post/${props.post.parentID}/${props.post.slug}`)
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