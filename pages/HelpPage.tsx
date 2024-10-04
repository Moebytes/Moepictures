import React, {useContext, useEffect, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext,
MobileContext, EnableDragContext, HelpTabContext} from "../Context"
import mainImg from "../assets/misc/mainimg.png"
import imagefiltersImg from "../assets/misc/imagefilters.png"
import gifPlayerImg from "../assets/misc/gifplayer.png"
import videoPlayerImg from "../assets/misc/videoplayer.png"
import musicPlayerImg from "../assets/misc/musicplayer.png"
import $3dPlayerImg from "../assets/misc/3dplayer.png"
import favoritesImg from "../assets/misc/favorites.png"
import cutenessMeterImg from "../assets/misc/cutenessmeter.png"
import translationsImg from "../assets/misc/translations.png"
import searchingImg from "../assets/misc/searching.png"
import imageSearchingImg from "../assets/misc/imagesearching.png"
import upscalingImg from "../assets/misc/upscaling.png"
import compressingImg from "../assets/misc/compressing.png"
import variationsImg from "../assets/misc/variations.png"
import thirdPartyImg from "../assets/misc/thirdparty.png"
import aliasesImg from "../assets/misc/aliases.png"
import implicationsImg from "../assets/misc/implications.png"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import "./styles/helppage.less"

const HelpPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {helpTab, setHelpTab} = useContext(HelpTabContext)

    const urlState = () => {
        if (window.location.hash) setHelpTab(window.location.hash.replace("#", ""))
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Help"
        window.scrollTo(0, 0)
        urlState()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (helpTab === "help") {
            window.history.pushState(null, document.title, window.location.pathname + window.location.search)
        } else {
            window.location.hash = helpTab
        }
    }, [helpTab])

    const openLink = (url: string) => {
        window.open(url, "_blank", "noreferrer")
    }

    const getContainerJSX = () => {
        if (helpTab === "help") {
            return (
                <><span className="help-heading">Help</span>
                <span className="help-text">Welcome to Moepictures!</span>
                <span className="help-text">
                    Moepictures is an image board organized by tags, dedicated exclusively to showcasing the cutest and most moe artworks. While the majority of content is (and will likely be)
                    2d art, we also have many other artforms including animations, music, and 3d models. <br/><br/>

                    Click on a category on the left to view the help for that specific topic.
                </span>
                <div className="help-img-container"><img className="help-img" src={mainImg}/></div></>
            )
        }
        if (helpTab === "searching") {
            return (
                <><span className="help-heading">Searching</span>
                <span className="help-text">
                    The tags on Moepictures use a dash ("-") as a delimeter, but you can also search with spaces because the search can guess what tags you are searching for.
                    If you encounter a problem with this, use dashed versions of the tags. These are examples
                    of valid searches: <br/>
                    <span className="help-alt">
                    Tag 1 Tag 2 Tag 3 <br/>
                    Tag-1 Tag-2 Tag-3 <br/><br/>
                    </span>

                    Special tag modifiers: <br/>
                    <span className="help-alt">-Tag 1 -Tag 2</span> - Exclude posts containing Tag 1 and Tag 2. <br/>
                    <span className="help-alt">+Tag 1 +Tag 2</span> - Include posts containing either Tag 1 or Tag 2. <br/><br/>

                    Special searches: <br/>
                    <span className="help-alt">pixiv:id</span> - Search for post matching the pixiv id (if it exists). <br/><br/>

                    These are some tags with special uses: <br/>
                    <span className="help-alt">original</span> - the drawing is original, ie. not fanart. <br/>
                    <span className="help-alt">self post</span> - the post was uploaded by its original creator. <br/>
                    <span className="help-alt">official art</span> - this is official art without a publicized artist. <br/>
                    <span className="help-alt">unknown artist</span> - the artist is not known. <br/>
                    <span className="help-alt">unknown character</span> - the character is unknown and might not be original. <br/>
                    <span className="help-alt">unknown series</span> - the series is unknown. <br/>
                    <span className="help-alt">no character</span> - no character or not applicable. <br/>
                    <span className="help-alt">no series</span> - not part of any series or not applicable. <br/>
                    <span className="help-alt">needs tags</span> - current post tags are insufficient. <br/>
                    <span className="help-alt">text</span> - the post contains text. <br/>
                    <span className="help-alt">transparent</span> - the post has transparency. <br/>
                    <span className="help-alt">translated</span> - the post has complete translations. <br/>
                    <span className="help-alt">untranslated</span> - the post is untranslated. <br/>
                    <span className="help-alt">partially translated</span> - the post is only partially translated. <br/>
                    <span className="help-alt">check translation</span> - needs re-checking of the translations. <br/>
                    <span className="help-alt">no audio</span> - the post is a video with no audio. <br/>
                    <span className="help-alt">with audio</span> - the post is a video that has audio. <br/>
                    <span className="help-alt">multiple artists</span> - the post has multiple artists. <br/>
                    <span className="help-alt">bad pixiv id</span> - the pixiv post was deleted. <br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={searchingImg}/></div></>
            )
        }
        if (helpTab === "image-searching") {
            return (
                <><span className="help-heading">Image Searching</span>
                <span className="help-text">
                    Every image uploaded to Moepictures is hashed with a perceptual hash algorithm, and images that look the same should 
                    yield similar hashes irrespective of their resolution. <br/><br/>

                    When you do an image search your upload is perceptually hashed and we try to find a close match. Usually 
                    this is pretty accurate at finding matching images. If you upload a video, song, or 3d model, the hash is only 
                    computed on the first frame, song cover, or model screenshot. <br/><br/>

                    You can also search for images by dragging and dropping an image into the left portion of the webpage.
                </span>
                <div className="help-img-container"><img className="help-img" src={imageSearchingImg}/></div></>
            )
        }
        if (helpTab === "filters") {
            return (
                <><span className="help-heading">Filters</span>
                <span className="help-text">
                    You can apply custom filters such as brightness, contrast, hue, and sharpen. Some filters like pixelate and 
                    blur will ruin most images, and are purely for fun. <br/><br/>

                    For audio, the pixelate filter will behave as a bitcrusher and will reduce the sample rate of the audio.
                </span>
                <div className="help-img-container"><img className="help-img" src={imagefiltersImg}/></div></>
            )
        }
        if (helpTab === "custom-players") {
            return (
                <><span className="help-heading">Custom Players</span>
                <span className="help-text">
                    Moepictures has custom players for animations, videos, music, and 3d models, which allows additionally functionality 
                    not available natively such as reverse playback and modification of the playback speed. <br/><br/>

                    The music player also has controls for changing the pitch of the audio. The 3d model player has options to enable 
                    wireframe, matcap, and edit shapekeys and lighting.
                </span>
                <div className="help-img-container"><img className="help-img" src={videoPlayerImg}/></div></>
            )
        }
        if (helpTab === "favorites") {
            return (
                <><span className="help-heading">Favorites</span>
                <span className="help-text">
                    If you like an image, you can add it to your favorites for easier access later on.
                    By default, your favorites are public but they can be made private in your account
                    settings. <br/><br/>

                    By setting the post sort to "favorites" or "reverse favorites", you can quickly view all the 
                    posts that you have favorited.
                </span>
                <div className="help-img-container"><img className="help-img" src={favoritesImg}/></div></>
            )
        }
        if (helpTab === "cuteness") {
            return (
                <><span className="help-heading">Cuteness</span>
                <span className="help-text">
                    The rating system on Moepictures is called cuteness. When you rate an
                    image you are not rating the quality, instead you are rating the amount
                    of cuteness the image evokes. The scale is from 0 (Not cute) to 500 (Pretty
                    cute) to 1000 (Insanely cute).
                </span>
                <div className="help-img-container"><img className="help-img" src={cutenessMeterImg}/></div></>
            )
        }
        if (helpTab === "translations") {
            return (
                <><span className="help-heading">Translations</span>
                <span className="help-text">
                    Translations can be added to any post containing non-english text. This is useful so that non-speakers of 
                    the foreign language can understand the post's context and any jokes. <br/><br/>

                    If you want to translate a post, I recommend using an OCR app to obtain text more easily. For japanese, 
                    KanjiTomo is a good option: <br/>
                    <a className="help-link" onClick={() => openLink("https://www.kanjitomo.net/")}>https://www.kanjitomo.net/</a>
                </span>
                <div className="help-img-container"><img className="help-img" src={translationsImg}/></div></>
            )
        }
        if (helpTab === "uploading") {
            return (
                <><span className="help-heading">Uploading</span>
                <span className="help-text">
                    Moepictures allows uploading images, comics, animations, videos, music, and 3d models.<br/><br/>
                    Please read carefully through all of the uploading guidelines. <br/>
                    <span className="help-alt">
                    ⇾ Must be drawn in the anime art style. No photographs/art drawn in other styles. <br/>
                    ⇾ The main subject should be a girl. Boys are only allowed in minor roles. 
                    Art with any other subjects (animals, food, backgrounds, etc). is not allowed. <br/>
                    ⇾ (Music only) The song should include elements that make it sound kawaii. <br/>
                    ⇾ *It should be moe/cute!* This is the primary focus of the site. <br/>
                    ⇾ No duplicates are allowed. Variations of the same image should be added to the original post. <br/>
                    ⇾ Sketches and unfinished art may be allowed only if they are good. <br/>
                    ⇾ Color palette should be pleasant to look at, ie. there are no oversaturated colors that clash too much. <br/>
                    ⇾ The drawing should be clean overall and shouldn't look messy or have obvious mistakes. <br/>
                    ⇾ The perspective, proportions, and anatomy shouldn't look weird. <br/>
                    ⇾ Animations shouldn't look stuttery. <br/>
                    ⇾ Source information is required for all posts. <br/>
                    ⇾ For images, adding an upscaled post is required. <br/>
                    ⇾ Compress / re-encode files (maintaining high quality) to be storage efficient. <br/>
                    ⇾ All tags should be romanized. Titles and commentary don't have to be romanized. <br/>
                    ⇾ No hentai. We only allow light nudity and suggestiveness. <br/>
                    ⇾ No AI/bot generated works. We only want art with human love and passion. <br/>
                    ⇾ No paid rewards. Please support artists for their hard work.
                    </span>
                </span></>
            )
        }
        if (helpTab === "tagging") {
            return (
                <><span className="help-heading">Tagging</span>
                <span className="help-text">
                    You don’t have to be exceedingly thorough but some effort placed on tags is required. <br/><br/>
                    These are some guidelines on what features to tag: <br/>
                    <span className="help-alt">
                    ⇾ Clothing (school-uniform, sailor-uniform, coat, skirt, leggings, etc). <br/>
                    ⇾ Hair Color (blonde-hair, red-hair, blue-hair, etc). <br/>
                    ⇾ Hair Length (short-hair, medium-hair, long-hair, etc). <br/>
                    ⇾ Hair Styles (twintails, ponytail, braid, etc). <br/>
                    ⇾ Special Accessories (hat, ribbon, bracelet, etc). <br/>
                    ⇾ Expressions (smiling, crying, surprised, etc). <br/>
                    ⇾ Actions (sleeping, running, eating, etc). <br/>
                    ⇾ Body Parts (small-breasts, long-legs, etc). <br/>
                    ⇾ Objects (coffee, umbrella, flower, etc). <br/>
                    ⇾ Environment (daytime, nighttime, sunrise, sunset, snow, rain, fog, etc). <br/>
                    ⇾ Special Tags (text, transparent, translated, no-audio, with-audio, etc). <br/>
                    </span>
                </span></>
            )
        }
        if (helpTab === "upscaling") {
            return (
                <><span className="help-heading">Upscaling</span>
                <span className="help-text">
                    Images, animations, and videos may have an upscaled version. For images, providing one is required. <br/><br/>

                    You can download the app that we use for upscaling here: <br/>
                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Waifu2x-GUI/releases")}>https://github.com/Moebits/Waifu2x-GUI/releases</a><br/><br/>

                    Although the original upscaler is Waifu2x, better upscalers have come out since. Currently the best upscaler and the 
                    one that we use is REAL-CUGAN with a scale factor of 4x. If the image doesn't have transparency, also turn on "compress to jpg" 
                    in settings and set the JPG quality to at least 95.<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={upscalingImg}/></div></>
            )
        }
        if (helpTab === "compressing") {
            return (
                <><span className="help-heading">Compressing</span>
                <span className="help-text">
                    Compressing / re-encoding posts is advised for faster loading and better space efficieny. All compressions should be 
                    high quality and should not leave behind any artifacts. <br/><br/>

                    You can download the app that we use for compressing here: <br/>
                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Image-Compressor/releases")}>https://github.com/Moebits/Image-Compressor/releases</a><br/><br/>

                    For re-encoding videos, you can use handbrake: <br/>
                    <a className="help-link" onClick={() => openLink("https://handbrake.fr/")}>https://handbrake.fr/</a><br/><br/>

                    These are the recommended formats for each type of post: <br/>
                    <span className="help-alt">
                    Images ⇾ Progressive JPG or WEBP for transparent images. Avoid AVIF for high decoding time and PNG for massive filesizes. <br/>
                    Animations ⇾ Animated WEBP is preferred over GIF. <br/>
                    Videos ⇾ MP4 with H.264 codec, WEBM with VP9 codec, or MP4 with AV1 codec. Avoid H.265 codec for poor browser support. <br/>
                    Music ⇾ MP3 with cover art. <br/>
                    3D Models ⇾ GLB or FBX. Avoid OBJ, as it needs separate texture loading we don't support. <br/><br/>
                    </span>

                    The compressing settings that we commonly use are quality at 95% with progressive turned on. <br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={compressingImg}/></div></>
            )
        }
        if (helpTab === "variations") {
            return (
                <><span className="help-heading">Variations</span>
                <span className="help-text">
                    Variations of the same image are combined into a single post. You can add a variation to an existing post 
                    by editing it. All variations of an image should be created by the original artist, otherwise it is considered a third party edit instead.
                    If an image has significantly different tags to the main post (eg. different characters), it's better to make it it's own post.
                </span>
                <div className="help-img-container"><img className="help-img" src={variationsImg}/></div></>
            )
        }
        if (helpTab === "third-party-edits") {
            return (
                <><span className="help-heading">Third Party Edits</span>
                <span className="help-text">
                    Third party edits are modifications to a work not done/endorsed by the original artist. For
                    example, an animation of an artwork done by someone else. Third party edits behave like their own separate post,
                    but each third party edit is added to the original post in a separate section and doesn't appear directly in search.
                </span>
                <div className="help-img-container"><img className="help-img" src={thirdPartyImg}/></div></>
            )
        }
        if (helpTab === "aliases") {
            return (
                <><span className="help-heading">Aliases</span>
                <span className="help-text">
                    A tag can have multiple aliases that point to the same result. This is to
                    facilitate better searching for synonyms like "with audio" and "has audio". Unlike tags, aliases can include non-ASCII characters 
                    so it's possible to add an alias in Japanese in order to enable Japanese searching. Existing tags can also be aliased to another tag,
                    but this is an action that will need approval.
                </span>
                <div className="help-img-container"><img className="help-img" src={aliasesImg}/></div></>
            )
        }
        if (helpTab === "implications") {
            return (
                <><span className="help-heading">Implications</span>
                <span className="help-text">
                    A tag can have implications which are tags that are automatically added to posts if they don't already exist. For instance, 
                    you can add an implication that the tag "red hat" implies "hat" and any post uploaded containing the "red hat" tag will also be 
                    given the "hat" tag. These are mainly useful to aid in tagging so you don't have to type out all the broader tags.
                </span>
                <div className="help-img-container"><img className="help-img" src={implicationsImg}/></div></>
            )
        }
        if (helpTab === "commenting") {
            return (
                <><span className="help-heading">Commenting</span>
                <span className="help-text">
                    Do not behave badly participating in comments, forum threads, or sending messages. 
                    These are some general guidelines for all the comment sections: <br/>
                    <span className="help-alt">
                    ⇾ No spam, jibberish, or extremely off-topic comments. <br/>
                    ⇾ No excessive rudeness in arguments. <br/>
                    ⇾ No otherwise distasteful comments. <br/><br/>
                    </span>

                    Quotes are supported and we have a syntax that makes it easy to do quotes. <br/>
                    <span className="help-alt">
                    &gt;&gt;&gt;[id] User said:<br/>
                    &gt; Comment <br/><br/>
                    </span>
                    Nested quoting is not supported yet. If you see a comment that is breaking the rules, please report it.
                </span></>
            )
        }
        if (helpTab === "bans") {
            return (
                <><span className="help-heading">Bans</span>
                <span className="help-text">
                    If you break the rules severely or consistently, you might get banned. If you get banned, you 
                    will still be able to browse the site but most interactions will get disabled. <br/><br/>

                    These are some actions that may get you banned: <br/>
                    <span className="help-alt">
                    ⇾ Misconduct in the comments, forum threads, or private messages. <br/>
                    ⇾ Spam uploading meme or very low quality posts. <br/>
                    ⇾ Vandalizing posts, tags, or translations. <br/>
                    </span>
                </span></>
            )
        }
        if (helpTab === "account-deletion") {
            return (
                <><span className="help-heading">Account Deletion</span>
                <span className="help-text">
                    Because Moepictures is heavily focused on user contributions, when you delete your account we won't  
                    remove your contributions like submitted posts. The account that uploaded them will be anonymized and 
                    show up as "deleted". The rest of your account data and comments will be deleted, however if someone quoted you 
                    in the comments some of your comments might still be remain.
                </span></>
            )
        }
    }
    
    return (
        <>
        <DragAndDrop/>
        <CaptchaDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="help">
                    <div className="help-nav">
                        <span className="help-nav-text" onClick={() => setHelpTab("help")}>Help</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("searching")}>Searching</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("image-searching")}>Image Searching</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("filters")}>Filters</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("custom-players")}>Custom Players</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("translations")}>Translations</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("favorites")}>Favorites</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("cuteness")}>Cuteness</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("uploading")}>Uploading</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("tagging")}>Tagging</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("upscaling")}>Upscaling</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("compressing")}>Compressing</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("variations")}>Variations</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("third-party-edits")}>Third Party Edits</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("aliases")}>Aliases</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("implications")}>Implications</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("commenting")}>Commenting</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("bans")}>Bans</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("account-deletion")}>Account Deletion</span>
                    </div>
                    <div className="help-container">
                        {getContainerJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default HelpPage