import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {ThemeContext, EnableDragContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, DownloadFlagContext, DownloadURLsContext, DisableZoomContext, SpeedContext,
ReverseContext, MobileContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import {createFFmpeg, fetchFile} from "@ffmpeg/ffmpeg"
import functions from "../structures/Functions"
import loading from "../assets/purple/loading.gif"
import loadingMagenta from "../assets/magenta/loading.gif"
import Slider from "react-slider"
import gifReverseIcon from "../assets/purple/gif-reverse.png"
import gifSpeedIcon from "../assets/purple/gif-speed.png"
import gifClearIcon from "../assets/purple/gif-clear.png"
import gifPlayIcon from "../assets/purple/gif-play.png"
import gifPauseIcon from "../assets/purple/gif-pause.png"
import gifRewindIcon from "../assets/purple/gif-rewind.png"
import gifFastforwardIcon from "../assets/purple/gif-fastforward.png"
import gifFullscreenIcon from "../assets/purple/gif-fullscreen.png"
import videoReverseIcon from "../assets/purple/video-reverse.png"
import videoSpeedIcon from "../assets/purple/video-speed.png"
import videoClearIcon from "../assets/purple/video-clear.png"
import videoPlayIcon from "../assets/purple/video-play.png"
import videoPauseIcon from "../assets/purple/video-pause.png"
import videoRewindIcon from "../assets/purple/video-rewind.png"
import videoFastforwardIcon from "../assets/purple/video-fastforward.png"
import videoPreservePitchIcon from "../assets/purple/video-preservepitch.png"
import videoPreservePitchOnIcon from "../assets/purple/video-preservepitch-on.png"
import videoFullscreenIcon from "../assets/purple/video-fullscreen.png"
import videoVolumeIcon from "../assets/purple/video-volume.png"
import videoVolumeLowIcon from "../assets/purple/video-volume-low.png"
import videoVolumeMuteIcon from "../assets/purple/video-volume-mute.png"
import imageZoomInIcon from "../assets/purple/image-zoom-in.png"
import imageZoomOutIcon from "../assets/purple/image-zoom-out.png"
import imageZoomOffIcon from "../assets/purple/image-zoom-off.png"
import imageZoomOffEnabledIcon from "../assets/purple/image-zoom-off-enabled.png"
import imageFullscreenIcon from "../assets/purple/image-fullscreen.png"
import gifFrames from "gif-frames"
import JSZip from "jszip"
import {TransformWrapper, TransformComponent} from "react-zoom-pan-pinch"
import path from "path"
import "./styles/postimage.less"
import mime from "mime-types"
const ffmpeg = createFFmpeg()

interface Props {
    audio: string
    coverImg: string
    width?: number
    height?: number
    scale?: number
    noKeydown?: boolean
    comicPages?: any
}

const PostSong: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {disableZoom, setDisableZoom} = useContext(DisableZoomContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const lightnessRef = useRef<HTMLImageElement>(null)
    const gifOverlayRef = useRef<HTMLImageElement>(null)
    const gifLightnessRef = useRef<HTMLImageElement>(null)
    const videoOverlayRef = useRef<HTMLCanvasElement>(null)
    const videoLightnessRef = useRef<HTMLImageElement>(null)
    const ref = useRef<any>(null)
    const gifRef = useRef<HTMLCanvasElement>(null)
    const gifControls = useRef<HTMLDivElement>(null)
    const gifSpeedRef = useRef(null) as any
    const gifSliderRef = useRef<any>(null)
    const gifSpeedSliderRef = useRef<any>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const backFrameRef = useRef<HTMLImageElement>(null)
    const videoCanvasRef = useRef<HTMLCanvasElement>(null)
    const videoControls = useRef<HTMLDivElement>(null)
    const videoSliderRef = useRef<any>(null)
    const videoSpeedRef = useRef(null) as any
    const videoVolumeRef = useRef(null) as any
    const videoSpeedSliderRef = useRef<any>(null)
    const videoVolumeSliderRef = useRef<any>(null)
    const imageControls = useRef<HTMLDivElement>(null)
    const zoomRef = useRef(null) as any
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [videoLoaded, setVideoLoaded] = useState(false)
    const [gifData, setGIFData] = useState(null) as any
    const [reverseVideo, setReverseVideo] = useState(null) as any
    const [videoData, setVideoData] = useState(null) as any
    const [backFrame, setBackFrame] = useState(null) as any
    const [secondsProgress, setSecondsProgress] = useState(0)
    const [progress, setProgress] = useState(0)
    const [dragProgress, setDragProgress] = useState(0) as any
    const {reverse, setReverse} = useContext(ReverseContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const [volume, setVolume] = useState(0)
    const [previousVolume, setPreviousVolume] = useState(0)
    const [paused, setPaused] = useState(false)
    const [preservePitch, setPreservePitch] = useState(true)
    const [duration, setDuration] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [dragging, setDragging] = useState(false)
    const [encodingOverlay, setEncodingOverlay] = useState(false)
    const [seekTo, setSeekTo] = useState(null) as any

    return (
        <div className="post-image-container">
            <div className="post-image-box" ref={containerRef}>
                <div className="post-image-filters" ref={fullscreenRef}>
                    <audio src={props.audio} controls loop></audio>
                </div>
            </div>
        </div>
    )
}

export default PostSong