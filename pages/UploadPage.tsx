import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import uploadIcon from "../assets/purple/upload.png"
import xIcon from "../assets/purple/x.png"
import linkIcon from "../assets/purple/link.png"
import image from "../assets/purple/image.png"
import animated from "../assets/purple/animated.png"
import video from "../assets/purple/video.png"
import comic from "../assets/purple/comic.png"
import explicit from "../assets/purple/explicit.png"
import questionable from "../assets/purple/questionable.png"
import safe from "../assets/purple/safe.png"
import $2d from "../assets/purple/2d.png"
import $3d from "../assets/purple/3d.png"
import pixel from "../assets/purple/pixel.png"
import chibi from "../assets/purple/chibi.png"
import Carousel from "../components/Carousel"
import PostImage from "../components/PostImage"
import {HideNavbarContext, HideSidebarContext, RelativeContext, ThemeContext, EnableDragContext} from "../App"
import fileType from "magic-bytes.js"
import JSZip from "jszip"
import "./styles/uploadpage.less"

const UploadPage: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const [getSelectFilesHover, setSelectFilesHover] = useState(false)
    const [getEnterLinksHover, setEnterLinksHover] = useState(false)
    const [getUploadXHover, setUploadXHover] = useState(false)
    const [displayImage, setDisplayImage] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [acceptedURLs, setAcceptedURLs] = useState([])
    const uploadErrorRef = useRef(null) as any
    const [currentImg, setCurrentImg] = useState(null) as any
    const [type, setType] = useState("image")
    const [restrict, setRestrict] = useState("safe")
    const [style, setStyle] = useState("2D")
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        setRelative(true)
        document.title = "Moebooru: Upload"
    }, [])

    const upload = async (event: any) => {
        const files = event.target.files 
        console.log(files)
        if (!files?.[0]) return
        let acceptedArray = [] as any 
        for (let i = 0; i < files.length; i++) {
            const fileReader = new FileReader()
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: any) => {
                    const bytes = new Uint8Array(f.target.result)
                    const result = fileType(bytes)?.[0]
                    const jpg = result.mime === "image/jpeg"
                    const png = result.mime === "image/png"
                    const gif = result.mime === "image/gif"
                    const mp4 = result.mime === "video/mp4"
                    const zip = result.mime === "application/zip"
                    if (jpg || png || gif || mp4 || zip) {
                        const MB = files[i].size / (1024*1024)
                        const maxSize = jpg ? 5 :
                                        png ? 10 :
                                        gif ? 50 :
                                        mp4 ? 100 : 100
                        if (MB <= maxSize) {
                            if (zip) {
                                const reader = new JSZip()
                                const content = await reader.loadAsync(bytes)
                                for (const filename in content.files) {
                                    const file = content.files[filename]
                                    if (file.dir || filename.startsWith("__MACOSX/")) continue
                                    const data = await file.async("uint8array")
                                    const result = fileType(data)?.[0]
                                    const jpg = result.mime === "image/jpeg"
                                    const png = result.mime === "image/png"
                                    const gif = result.mime === "image/gif"
                                    const mp4 = result.mime === "video/mp4"
                                    if (jpg || png || gif || mp4) {
                                        acceptedArray.push({file: new File([data], filename), ext: result.typename})
                                    } else {
                                        setUploadError(true)
                                        uploadErrorRef.current.innerText = `Supported types in zip: png, jpg, gif, mp4.`
                                        await functions.timeout(1000)
                                        setUploadError(false)
                                        await functions.timeout(1000)
                                    }
                                }
                                resolve()
                            } else {
                                acceptedArray.push({file: files[i], ext: result.typename})
                                resolve()
                            }
                        } else {
                            setUploadError(true)
                            uploadErrorRef.current.innerText = `${result.typename.toUpperCase()} max file size: ${maxSize}MB`
                            await functions.timeout(1000)
                            setUploadError(false)
                            await functions.timeout(1000)
                            resolve()
                        }
                    } else {
                        setUploadError(true)
                        uploadErrorRef.current.innerText = `Supported file types: png, jpg, gif, mp4, zip.`
                        await functions.timeout(1000)
                        setUploadError(false)
                        await functions.timeout(1000)
                        resolve()
                    }
                }
                fileReader.readAsArrayBuffer(files[i])
            })  
        }
        if (acceptedArray.length) {
            let urls = [] as any
            for (let i = 0; i < acceptedArray.length; i++) {
                const url = URL.createObjectURL(acceptedArray[i].file)
                urls.push(`${url}#.${acceptedArray[i].ext}`)
            }
            setCurrentImg(urls[0])
            setAcceptedURLs(urls)
        }
        event.target.value = ""
    }

    const set = (img: string) => {
        setCurrentImg(img)
    }

    const clear = () => {
        setAcceptedURLs([])
        setCurrentImg(null)
        setUploadXHover(false)
    }


    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="upload">
                    <span className="upload-heading">Upload</span>
                    {uploadError ? <div className="upload-row"><span ref={uploadErrorRef} className="upload-text-alt"></span></div> : null}
                    <div className="upload-row">
                        <label htmlFor="file-upload" className="upload-button">
                            <img className="upload-button-img" src={uploadIcon}/>
                            <span className="upload-button-text">Select Files</span>
                        </label>
                        <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
                        <button className="upload-button">
                                <img className="upload-button-img" src={linkIcon}/>
                                <span className="upload-button-text">Enter Links</span>
                        </button>
                        {currentImg ? 
                        <button className="upload-button" onClick={clear}>
                            <img className="upload-button-img" src={xIcon}/>
                        </button>
                        : null}
                    </div>
                    {acceptedURLs.length ?
                    <div className="upload-row">
                        {acceptedURLs.length > 1 ? 
                        <div className="upload-container">
                            <Carousel images={acceptedURLs} set={set}/>
                            <PostImage img={currentImg}/>
                        </div>
                        :
                        <PostImage img={currentImg}/>
                        }
                    </div>
                    : null}
                <span className="upload-heading">Classification</span>
                <span className="upload-text-alt">If there are multiple images, select the rightmost tag that fits.</span>
                <div className="upload-row">
                    <button className={`upload-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                        <img className="upload-button-img" src={image}/>
                        <span className="upload-button-text">Image</span>
                    </button>
                    <button className={`upload-button ${type === "animated" ? "button-selected" : ""}`} onClick={() => setType("animated")}>
                        <img className="upload-button-img" src={animated}/>
                        <span className="upload-button-text">Animated</span>
                    </button>
                    <button className={`upload-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                        <img className="upload-button-img" src={video}/>
                        <span className="upload-button-text">Video</span>
                    </button>
                    <button className={`upload-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                        <img className="upload-button-img" src={comic}/>
                        <span className="upload-button-text">Comic</span>
                    </button>
                </div>
                <div className="upload-row">
                    <button className={`upload-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                        <img className="upload-button-img" src={safe}/>
                        <span className="upload-button-text">Safe</span>
                    </button>
                    <button className={`upload-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                        <img className="upload-button-img" src={questionable}/>
                        <span className="upload-button-text">Questionable</span>
                    </button>
                    <button className={`upload-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                        <img className="upload-button-img" src={explicit}/>
                        <span className="upload-button-text">Explicit</span>
                    </button>
                </div>
                <div className="upload-row">
                    <button className={`upload-button ${style === "2D" ? "button-selected" : ""}`} onClick={() => setStyle("2D")}>
                        <img className="upload-button-img" src={$2d}/>
                        <span className="upload-button-text">2D</span>
                    </button>
                    <button className={`upload-button ${style === "3D" ? "button-selected" : ""}`} onClick={() => setStyle("3D")}>
                        <img className="upload-button-img" src={$3d}/>
                        <span className="upload-button-text">3D</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="upload-button-img" src={pixel}/>
                        <span className="upload-button-text">Pixel</span>
                    </button>
                    <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="upload-button-img" src={chibi}/>
                        <span className="upload-button-text">Chibi</span>
                    </button>
                </div>
                {acceptedURLs.length ? <>
                <span className="upload-heading">Possible Duplicates</span>
                <div className="upload-row">
                    <Carousel images={acceptedURLs}/>
                </div>
                </> : null}
                <div className="upload-container">
                        <div className="upload-container-row">
                            <span className="upload-text-alt">If this is a variation, enter the original post ID: </span>
                            <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                        </div>
                        <div className="upload-container-row">
                            <span className="upload-text-alt">If this is a third-party edit, enter the original post ID: </span>
                            <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                        </div>
                </div>
                <span className="upload-heading">Source</span>
                <div className="upload-container">
                    <span className="upload-link">Fetch from Saucnao</span>
                    <div className="upload-container-row">
                        <span className="upload-text">Title: </span>
                        <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Artist: </span>
                        <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Drawn Date: </span>
                        <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Commentary</span>
                    </div>
                    <div className="upload-container-row">
                        <textarea className="upload-textarea" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                    </div>
                </div>
                <span className="upload-heading">Artist</span>
                <span className="upload-text-alt">If the artist tag does not yet exist, please upload an artist image.</span>
                <div className="upload-container">
                    <div className="upload-container-row">
                        <span className="upload-text">Romanized Artist Tag: </span>
                        <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text margin-right">Artist Image</span>
                        <button className="upload-button">
                                <img className="upload-button-img" src={uploadIcon}/>
                                <span className="upload-button-text">Upload</span>
                        </button>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-link">+ Another artist</span>
                    </div>
                </div>
                <span className="upload-heading">Characters</span>
                <span className="upload-text-alt">If the character tag does not yet exist, please upload a character image.</span>
                <div className="upload-container">
                    <div className="upload-container-row">
                        <span className="upload-text">Romanized Character Tag: </span>
                        <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text margin-right">Character Image</span>
                        <button className="upload-button">
                                <img className="upload-button-img" src={uploadIcon}/>
                                <span className="upload-button-text">Upload</span>
                        </button>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-link">+ Another character</span>
                    </div>
                </div>
                <span className="upload-heading">Series</span>
                <span className="upload-text-alt">If the series tag does not yet exist, please upload a series image.</span>
                <div className="upload-container">
                    <div className="upload-container-row">
                        <span className="upload-text">Romanized Series Tag: </span>
                        <input className="upload-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text margin-right">Series Image</span>
                        <button className="upload-button">
                                <img className="upload-button-img" src={uploadIcon}/>
                                <span className="upload-button-text">Upload</span>
                        </button>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-link">+ Another series</span>
                    </div>
                </div>
                {displayImage && acceptedURLs.length ?
                <div className="upload-row">
                    {functions.isVideo(currentImg) ? 
                    <video autoPlay muted loop disablePictureInPicture className="tag-img-preview" src={currentImg}></video>:
                    <img className="tag-img-preview" src={currentImg}/>}
                </div>
                : null}
                <div className="upload-row">
                    <span className="upload-heading">Tags</span>
                    <div className="upload-button-container">
                        <button className="upload-button" onClick={() => setDisplayImage((prev) => !prev)}>
                            {displayImage ?
                                <span className="upload-button-text" style={{paddingLeft: "0px"}}>- Hide Image</span> :
                                <span className="upload-button-text" style={{paddingLeft: "0px"}}>+ Display Image</span>
                            }
                        </button>
                    </div>
                </div>
                <span className="upload-text-alt">Enter the dashed version of the tag. If the tag doesn't exist, you will be promted to create it.
                If you need help with tags, read the <span className="upload-link" onClick={() => history.push("/help")}>tagging guide.</span></span>
                <div className="upload-container">
                    <div className="upload-container-row">
                        <textarea className="upload-textarea" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                    </div>
                </div>
                <div className="upload-center-row">
                    <button className="upload-button">
                            <span className="upload-button-submit-text">Submit</span>
                    </button>
                </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UploadPage