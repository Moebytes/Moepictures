import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useSessionSelector, useSessionActions} from "../store"
import "./styles/taghover.less"
import functions from "../structures/Functions"

interface Props {
    active: boolean
    tag: string
    x: number
    y: number
}

let timer = null as any

const TagHover: React.FunctionComponent<Props> = (props) => {
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [active, setActive] = useState(props.active)
    const [img, setImg] = useState("")
    const [description, setDescription] = useState("No description.")
    const history = useHistory()

    useEffect(() => {
        if (props.active) {
            clearTimeout(timer)
            timer = setTimeout(() => {
                if (props.active) setActive(true)
            }, 500)
        } else {
            setActive(false)
        }
    }, [props.active])

    const updateMetadata = async () => {
        const tag = await functions.get("/api/tag", {tag: props.tag}, session, setSessionFlag)
        if (tag) {
            setDescription(tag.description)
            if (tag.image) setImg(functions.getTagLink(tag.type, tag.image, tag.imageHash))
        }
    }

    useEffect(() => {
        updateMetadata()
    }, [])

    useEffect(() => {
        updateMetadata()
    }, [props.tag, session])

    if (active && description) return (
        <div className="taghover" style={{left: `100px`}}>
            <div className="taghover-container">
                {img ? <img className="taghover-img" src={img}/> : null}
                <span className="taghover-desc">{description}</span>
            </div>
        </div>
    )
    return null
}

export default TagHover