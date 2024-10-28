import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext,
MobileContext, EnableDragContext, HelpTabContext} from "../Context"
import mainImg from "../assets/misc/mainimg.png"
import imagefiltersImg from "../assets/misc/imagefilters.png"
import gifPlayerImg from "../assets/misc/gifplayer.png"
import videoPlayerImg from "../assets/misc/videoplayer.png"
import musicPlayerImg from "../assets/misc/musicplayer.png"
import $3dPlayerImg from "../assets/misc/3dplayer.png"
import favoritesImg from "../assets/misc/favorites.png"
import favgroupsImg from "../assets/misc/favgroups.png"
import groupsImg from "../assets/misc/groups.png"
import cutenessMeterImg from "../assets/misc/cutenessmeter.png"
import translationsImg from "../assets/misc/translations.png"
import uploadImg from "../assets/misc/upload.png"
import taggingImg from "../assets/misc/tagging.png"
import searchingImg from "../assets/misc/searching.png"
import imageSearchingImg from "../assets/misc/imagesearching.png"
import upscalingImg from "../assets/misc/upscaling.png"
import emojisImg from "../assets/misc/emojis.png"
import compressingImg from "../assets/misc/compressing.png"
import variationsImg from "../assets/misc/variations.png"
import thirdPartyImg from "../assets/misc/thirdparty.png"
import aliasesImg from "../assets/misc/aliases.png"
import implicationsImg from "../assets/misc/implications.png"
import captchaImg from "../assets/misc/captcha.png"
import pixivDownloaderImg from "../assets/misc/pixiv-downloader.png"
import setAvatarImg from "../assets/misc/set-avatar.png"
import musicImg from "../assets/misc/music.png"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import bookmarkletImg from "../assets/icons/bookmarklet.png"
import functions from "../structures/Functions"
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
    const history = useHistory()

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
        if (helpTab === "help") {
            window.history.pushState(null, document.title, window.location.pathname + window.location.search)
        } else {
            window.location.hash = helpTab
        }
    }, [helpTab])

    const openLink = (url: string) => {
        window.open(url, "_blank", "noreferrer")
    }

    const getBookmarklet = () => {
        return `javascript:location.href="${functions.getDomain()}/upload?link="+encodeURIComponent(location.href)`
    }

    const getContainerJSX = () => {
        if (helpTab === "help") {
            return (
                <><span className="help-heading">Help</span>
                <span className="help-text">Welcome to Moepictures!</span>
                <span className="help-text">
                    Moepictures is an image board organized by tags, dedicated exclusively to showcasing the most cute and moe artworks. While the majority of content is (and will likely be)
                    2d art, we also accept many other artforms including animations, music, and 3d models. <br/><br/>

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
                    <span className="help-alt">+Tag 1 +Tag 2</span> - Include posts containing either Tag 1 or Tag 2. <br/>
                    <span className="help-alt">*Tag 1 *Tag 2</span> - Match all tags that contain Tag 1 and Tag 2. <br/><br/>

                    Special searches: <br/>
                    <span className="help-alt">pixiv:id</span> - Search for post matching the pixiv id (if it exists). <br/>
                    <span className="help-alt">twitter:id</span> - Search for post matching the twitter id (if it exists). <br/>
                    <span className="help-alt">source:link</span> - Search all post links and mirrors for the specified link. <br/>
                    <span className="help-alt">hash:hash</span> - Search for post matching the perceptual hash. <br/>
                    <span className="help-alt">favorites:user</span> - Search for favorites of the user (if public). <br/>
                    <span className="help-alt">favgroup:user:name</span> - Search for favgroup of a user (if public). <br/>
                    <span className="help-alt">group:name</span> - Search for a group by its name. <br/>
                    <span className="help-alt">uploads:user</span> - Search for uploads of a user. <br/>
                    <span className="help-alt">history:user</span> - Get your search history (only works on yourself!) <br/>
                    <span className="help-alt">comments:user</span> - (Comments page) get all comments by the user. <br/>
                    <span className="help-alt">social:link</span> - (Tags page) find an artist by their social link. <br/><br/>

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
                    <span className="help-alt">paid reward available</span> - the post has a paid reward available. <br/>
                    <span className="help-alt">third party edit</span> - the post is a third party edit. <br/>
                    <span className="help-alt">third party source</span> - the source of the post was not posted by the original artist. <br/><br/>

                    In results, posts may have different border colors which mean the following: <br/>
                    <span className="help-alt">pink</span> - the post is favorited. <br/>
                    <span className="help-alt">purple</span> - the post is favgrouped. <br/>
                    <span className="help-alt">red</span> - the post is edit locked. <br/>
                    <span className="help-alt">green</span> - the post contains third party posts. <br/>
                    <span className="help-alt">orange</span> - the post is in a group. <br/>
                    <span className="help-alt">blue</span> - the post contains multiple variations. <br/>
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

                    You can also search for images by dragging and dropping an image into the left portion of the webpage or by pasting an 
                    image from your clipboard. Dropping  an image into the right portion of the webpage or pasting in the upload page will 
                    upload the image instead.
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
        if (helpTab === "music") {
            return (
                <><span className="help-heading">Music</span>
                <span className="help-text">
                    The music player is available globally (apart from having the per-post player which is also synced). This means 
                    that when you play a song you can navigate to any page on the site and it will continue to play. To stop playback,
                    click the stop button on the left of the player or reload the page on a non-music post.
                </span>
                <div className="help-img-container"><img className="help-img" src={musicImg}/></div></>
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
        if (helpTab === "favgroups") {
            return (
                <><span className="help-heading">Favorite Groups</span>
                <span className="help-text">
                    Favorite groups are like your own custom category of "favorites" - you can specify a name and 
                    a privacy for each favorite group. And like groups, these also store the ordering of the posts and 
                    may be reordered on their page. There isn't a sorting for favorite groups, but you may search them 
                    with <span className="help-alt">favgroup:user:name</span>.
                </span>
                <div className="help-img-container"><img className="help-img" src={favgroupsImg}/></div></>
            )
        }
        if (helpTab === "cuteness") {
            return (
                <><span className="help-heading">Cuteness</span>
                <span className="help-text">
                    The rating system on Moepictures is called cuteness. When you rate an
                    image you should rate the amount of cuteness the image evokes. The scale is from 0 (Not cute) to 500 (Pretty
                    cute) to 1000 (Insanely cute).
                </span>
                <div className="help-img-container"><img className="help-img" src={cutenessMeterImg}/></div></>
            )
        }
        if (helpTab === "translations") {
            return (
                <><span className="help-heading">Translations</span>
                <span className="help-text">
                    Translations can be added to any post containing non-english text. This is useful so that non-speakers 
                    can understand the post's context and any jokes. <br/><br/>

                    If you want to translate a post, I recommend using an OCR app to obtain text more easily. For japanese, 
                    KanjiTomo is a good option: 
                    <a className="help-link" onClick={() => openLink("https://www.kanjitomo.net/")} style={{marginLeft: "10px"}}>{mobile ? "KanjiTomo" : "https://www.kanjitomo.net"}</a>
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
                    Art with other subjects (animals, food, backgrounds, etc). is not allowed. <br/>
                    ⇾ It should be moe/cute! This is the primary focus of the site. <br/>
                    ⇾ No duplicates are allowed. Variations of the same image should be added to the original post. <br/>
                    ⇾ Color palette should be pleasant to look at, ie. there are no oversaturated colors that clash too much. <br/>
                    ⇾ The drawing should be clean overall and shouldn't look messy or have obvious mistakes. <br/>
                    ⇾ The perspective, proportions, and anatomy shouldn't look weird. <br/>
                    ⇾ Animations shouldn't look too stuttery. <br/>
                    ⇾ All posts require the source link from where it was obtained from. <br/>
                    ⇾ All tags should be romanized. Titles and commentary don't have to be romanized but may be translated. <br/>
                    ⇾ For images, adding an upscaled version is required. <br/>
                    ⇾ Resolution: Keep original images under 2000x2000px and upscaled images under 8000x8000px. <br/>
                    ⇾ (Music only) The audio file must have a song cover in its metadata. <br/>
                    ⇾ Compress / re-encode files (maintaining high quality) to be storage efficient. <br/>
                    ⇾ No hentai. We only allow light nudity and suggestiveness. <br/>
                    ⇾ No AI-generated works. We only want art created by passionate humans. <br/>
                    ⇾ No paid content. This includes anime clips, manga and doujinshi scans, and paid artist rewards. Support artists for their work!<br/><br/>
                    </span>

                    Please classify uploads into the appropriate category. We have three levels of categorization: <br/>
                    <span className="help-alt">Type</span> - The type of post. This can be <span className="help-alt">image, animation, comic, video, audio, or 3d model.</span><br/>
                    Most of these are self-explanatory, but the distinction between an image and a comic is that comics contain various panels, 
                    text, and speech balloons.<br/><br/>

                    <span className="help-alt">Restrict</span> - An image content rating that may be used to broadly restrict content you don't want to see.<br/>
                    <span className="help-alt">safe</span> - Pretty safe with no content that is too suggestive.<br/>
                    <span className="help-alt">questionable</span> - Revealing or tight clothing (eg. swimsuits, tights), suggestive poses and ecchi.<br/><br/>

                    <span className="help-alt">Style</span> - These are some very common art styles.<br/>
                    <span className="help-alt">2d</span> - The vast majority of 2d art, or music that doesn't fit into any other categories.<br/>
                    <span className="help-alt">3d</span> - 3d models or incorporates 3d models in some way.<br/>
                    <span className="help-alt">chibi</span> - Art made in chibi or super deformed style.<br/>
                    <span className="help-alt">pixel</span> - Art made in pixel art style or chiptune music.<br/><br/>

                    Third party ID - Specify a post ID on the site and this post will be added as a child to that post. This is only used for third party edits. 
                    For post variations, simply include them in the same post as multiple images are supported.<br/><br/>

                    Please provide source information for all posts. You can fill in these fields: <br/>
                    <span className="help-alt">title</span> - The original title of the work as posted on social media.<br/>
                    <span className="help-alt">translated title</span> - A title english translation, as titles are very commonly in japanese.<br/>
                    <span className="help-alt">artist</span> - Name of the artist (doesn't have to be romanized) - not the same as their artist tag, which will have to be romanized.<br/>
                    <span className="help-alt">drawn date</span> - The original date the work was posted.<br/>
                    <span className="help-alt">link</span> - The primary link to the work, preferably where the artist posted it themselves.<br/>
                    <span className="help-alt">bookmarks</span> - The amount of pixiv bookmarks or "likes" if it's a different site.<br/>
                    <span className="help-alt">commentary</span> - The original description of the work as posted on social media.<br/>
                    <span className="help-alt">translated commentary</span> - A commentary english translation, as they are very commonly written in japanese.<br/>
                    <span className="help-alt">mirrors</span> - Reposts of the work posted on different sites. Include the artists own reposts.<br/>
                    <span className="help-alt">buy link</span> - If a paid reward is available, you may post the link to buy here.<br/><br/>

                    Tags are divided into five categories. <br/>
                    <span className="help-alt">artist</span> - Preferably the twitter username of the artist, otherwise their romanized name.<br/>
                    <span className="help-alt">character</span> - The character name with their series in parentheses: character-(series-name). Use "no-character" if not applicable.<br/>
                    <span className="help-alt">series</span> - The series (anime, manga, video game, etc.) the character belongs to. Use "no-series" if not applicable.<br/>
                    <span className="help-alt">meta</span> - These are just tags with special uses, like unknown-artist and transparent.<br/>
                    <span className="help-alt">tag</span> - Every tag is a small description of a feature that appears in the work. Check the tagging tab for more detailed help with tagging.<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={uploadImg}/></div></>
            )
        }
        if (helpTab === "tagging") {
            return (
                <><span className="help-heading">Tagging</span>
                <span className="help-text">
                    Every post should be tagged with the features it contains, and although you don’t have to be exceedingly thorough some 
                    level of effort placed on tags is required. Aim for at least 10-20 tags. Anything below that is insufficient, and above that 
                    starts getting into excessive territory.<br/><br/>

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
                    ⇾ Special Tags (text, transparent, translated, no-audio, with-audio, etc). <br/><br/>
                    </span>

                    If the post was already tagged on a different site you may copy over the tags and fix them up. There's no 
                    need to fully re-invent the wheel. <br/><br/>

                    New tags that don't exist yet are created on post upload, and actually added once the post is approved. Once the 
                    tag is up, you may edit its more detailed image/description/links in the tags page. Not all of these fields will be available to 
                    edit, and will depend on the type of tag. <br/><br/>

                    <span className="help-alt">Tag</span> - The name of the tag. Artist tags may be changed whenever they update their twitter name, but 
                    modify other tags only if necessary.<br/>
                    <span className="help-alt">Website</span> - A website link, usually of the anime/video game or personal website of an artist.<br/>
                    <span className="help-alt">Social</span> - The primary social media account of the artist where they upload their works, depending on 
                    the type of artist this is usually pixiv/soundcloud/sketchfab. <br/>
                    <span className="help-alt">Twitter</span> - Their twitter/x account, as the majority of people also have one. We also prefer to use their 
                    twitter username as their tag name.<br/>
                    <span className="help-alt">Fandom</span> - For character tags, this can be a link to the fandom wiki of the character (or any other wiki).<br/>
                    <span className="help-alt">Image</span> - A tag image, usually profile picture of the artist or logo of the series. Please provide one for 
                    artist, characters, and series.<br/>
                    <span className="help-alt">Description</span> - A longer description of the tag, going into more detail about what its about. Very useful for tags 
                    that are not very self-explanatory.<br/>
                    <span className="help-alt">Aliases</span> - Aliases are alternate names that will resolve to this tag. They do not have to be romanized, unlike tags.<br/>
                    <span className="help-alt">Implications</span> - Implications are "parent" tags automatically added when this tag is added to a post.<br/>
                    <span className="help-alt">Pixiv Tags</span> - This should correspond to the tags used on pixiv, and there may be multiple of them. Almost always are in japanese.<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={taggingImg}/></div></>
            )
        }
        if (helpTab === "upscaling") {
            return (
                <><span className="help-heading">Upscaling</span>
                <span className="help-text">
                    Images, animations, and videos may have an upscaled version. For images, providing one is required. <br/><br/>

                    You can download the app that we use for upscaling here: <br/>
                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Waifu2x-GUI/releases")}>{mobile ? "Waifu2x GUI" : "https://github.com/Moebits/Waifu2x-GUI/releases"}</a><br/><br/>

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
                    Compressing/re-encoding posts is advised for faster loading and better space efficiency. All compressions should be 
                    high quality and should not leave behind any artifacts. <br/><br/>

                    You can download the app that we use for compressing here: <br/>
                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Image-Compressor/releases")}>{mobile ? "Image Compressor" : "https://github.com/Moebits/Image-Compressor/releases"}</a><br/><br/>

                    These are the recommended formats for each type of post: <br/>
                    <span className="help-alt">
                    Images ⇾ Progressive JPG or WEBP for transparent images. Avoid AVIF for high decoding time and PNG for massive filesizes. <br/>
                    Animations ⇾ Animated WEBP is preferred over GIF. <br/>
                    Videos ⇾ MP4 with H.264 codec, WEBM with VP9 codec, or MP4 with AV1 codec. Avoid H.265 codec for poor browser support. <br/>
                    Music ⇾ MP3 with cover art. Avoid WAV as it doesn't support cover art.<br/>
                    3D Models ⇾ GLB or FBX. Avoid OBJ, as it needs separate texture loading we don't support. <br/><br/>
                    </span>

                    The compressing settings that we commonly use are quality at 95% with progressive turned on. Please downscale original posts to 
                    be under 2000x2000px, as anything bigger will result in an upscaled post that is way too large.<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={compressingImg}/></div></>
            )
        }
        if (helpTab === "pixiv-downloads") {
            return (
                <><span className="help-heading">Pixiv Downloads</span>
                <span className="help-text">
                    The vast majority of posts come from the Japanese art website <a className="help-link" onClick={() => openLink("https://www.pixiv.net/")}>Pixiv.</a><br/><br/>

                    However, it can take awhile to manually the download the art that you like, so we also have an app that makes it easy to download lots of posts at once. It 
                    can download illustrations, manga, ugoira (animations), and novels. (However at this time, we don't support uploading textual content like novels).<br/>

                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Pixiv-Downloader/releases")}>{mobile ? "Pixiv Downloader" : "https://github.com/Moebits/Pixiv-Downloader/releases"}</a><br/><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={pixivDownloaderImg}/></div></>
            )
        }
        if (helpTab === "bookmarklet") {
            return (
                <><span className="help-heading">Bookmarklet</span>
                <span className="help-text">
                    Drag and drop our bookmarklet into your browser's bookmark bar to quickly upload to Moepictures from 
                    another site. <br/><br/>

                    <a style={{width: "auto", height: "60px"}} className="help-link" href={getBookmarklet()}
                    onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img src={bookmarkletImg} alt="Upload to Moepictures"/>
                    </a><br/><br/>

                    It supports the same sites as using "Enter Links" does, which are the following:<br/>
                    <a className="help-link" onClick={() => openLink("https://www.pixiv.net/")}>Pixiv</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.deviantart.com/")}>Deviantart</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.reddit.com/")}>Reddit</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.pinterest.com/")}>Pinterest</a><br/>
                    <a className="help-link" onClick={() => openLink("https://medibang.com/")}>ARTStreet</a><br/>
                    <a className="help-link" onClick={() => openLink("https://danbooru.donmai.us/")}>Danbooru</a><br/>
                    <a className="help-link" onClick={() => openLink("https://gelbooru.com/")}>Gelbooru</a><br/>
                    <a className="help-link" onClick={() => openLink("https://yande.re/")}>Yandere</a><br/>
                    <a className="help-link" onClick={() => openLink("https://konachan.com/")}>Konachan</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.zerochan.net/")}>Zerochan</a><br/>
                    <a className="help-link" onClick={() => openLink("https://e-shuushuu.net/")}>E-Shuushuu</a><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={""}/></div></>
            )
        }
        if (helpTab === "variations") {
            return (
                <><span className="help-heading">Variations</span>
                <span className="help-text">
                    Variations of the same image are combined into a single post. You can add a variation to an existing post by editing it (use the full fledged 
                    edit, not tag/source edit). All variations of an image should be created by the original artist, otherwise it is considered a third party edit instead. <br/><br/>

                    If an image has significantly different tags to the main post (eg. different characters), it's better to make it it's own post and associate the posts by 
                    creating a group. This doesn't include multiple pages of a sequential manga/comic. Please use variations and not groups for these.
                </span>
                <div className="help-img-container"><img className="help-img" src={variationsImg}/></div></>
            )
        }
        if (helpTab === "third-party-edits") {
            return (
                <><span className="help-heading">Third Party Edits</span>
                <span className="help-text">
                    Third party edits are modifications to a work not done/endorsed by the original artist. For
                    example, an animation of an artwork done by someone else. Third party edits behave like their own post,
                    and are also added to the original post in a separate section. Also known as child posts, but third party edits are the 
                    only thing we use them for.
                </span>
                <div className="help-img-container"><img className="help-img" src={thirdPartyImg}/></div></>
            )
        }
        if (helpTab === "groups") {
            return (
                <><span className="help-heading">Groups</span>
                <span className="help-text">
                    Groups are a way to associate several related posts that have very different tags, so variations are not a great way to 
                    combine them. This is useful when an artist posts a pixiv post containing multiple artworks of different characters, or for 
                    a series of posts/comic strips that are related but not sequential. If it's a manga/comic with sequential pages, we still prefer to 
                    use variations for it. <br/><br/>

                    If all the posts in the group have the same source then name the group like <span className="help-alt">Sitename PostID</span>, eg. 
                    Pixiv 123456 and make the description a link to it. Otherwise name it a translated name of the post series. You can provide the original 
                    untranslated name in the group description.
                </span>
                <div className="help-img-container"><img className="help-img" src={groupsImg}/></div></>
            )
        }
        if (helpTab === "aliases") {
            return (
                <><span className="help-heading">Aliases</span>
                <span className="help-text">
                    A tag can have multiple aliases that point to the same result. This is to
                    facilitate better searching for synonyms like "with audio" and "has audio". Unlike tags, aliases can include non-ASCII characters 
                    so it's possible to add an alias in Japanese in order to enable Japanese searching. Existing tags can also be aliased to another tag,
                    but this is an action that will need approval. <br/><br/>

                    <span className="help-alt">Aliasing To</span><br/>
                    It's supported to take an existing tag, delete it, and then add it as an alias to another tag. This is called 
                    aliasing to. As aliasing to is a destructive action, they will have to be approved by mods. <br/><br/>

                    To make this more clear, the tag that you start the "alias to" on will be deleted and added as an alias to the other tag. This 
                    is the aliasor. The tag that you type in the box is the aliasee, and is the tag that will receive this new alias. Every post 
                    that was under the old tag will be moved to the new tag.<br/>
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
        if (helpTab === "users") {
            return (
                <><span className="help-heading">Users</span>
                <span className="help-text">
                    Moepictures has various user account levels that progressively give you more 
                    permissions and removes restrictions. <br/><br/>

                    <span className="help-alt">No account</span> - Can only view the site and the posts rated "safe".<br/>
                    <span className="help-alt">User</span> - Access to favorites, favorite groups, comments/forum/messages, and can submit uploads/edits/translations for approval. Can also view the "questionable" posts.<br/>
                    <span className="help-alt">Premium</span> - This is an add-on to your user level that lets you also access the premium features, such as upscaled images and search history.<br/>
                    <span className="help-alt">Contributor</span> - Can edit posts and tags without passing through the mod queue. Given to members with a great 
                    track record of contributions that we don't want to inhibit with the queue.<br/>
                    <span className="help-alt">Curator</span> - Can upload posts without passing through the mod queue. Given to members who consistently submit high quality posts 
                    that we don't want to inhibit with the queue.<br/>
                    <span className="help-alt">Mod</span> - Access to the mod queue and can approve uploads/edits/aliasing, can replace images on posts, can change the category of tags, and can ban users.<br/>
                    <span className="help-alt">Admin</span> - Access to our most powerful tools such as bulk uploading and bulk tagging. Can permanently delete posts and promote users to 
                    a higher level.<br/>
                    <span className="help-alt">System</span> - This is only for our bot account that sends out message notifications.<br/><br/>


                    Since mods and admins can potentially make very destructive changes to the site, we require them to enable 2FA on their accounts.<br/><br/>

                    <span className="help-alt">Avatars</span><br/>
                    You can only pick an avatar from the images that are on the site. This is the simplest way to enforce an "anime avatars only" policy! 
                    If the image you want to use as an avatar doesn't exist yet (but anime of course), try uploading it. <br/><br/>

                    You can change your avatar by clicking on "set avatar" on the sidebar of any post, and you can remove it in your account settings. 
                    Please do this on PC, as the mobile touch controls are known to be a bit finicky.
                </span>
                <div className="help-img-container"><img className="help-img" src={setAvatarImg}/></div></>
            )
        }
        if (helpTab === "commenting") {
            return (
                <><span className="help-heading">Commenting</span>
                <span className="help-text">
                    Do not behave badly participating in comments, forum threads, or sending messages. 
                    These are some general guidelines for all the comment sections: <br/>
                    <span className="help-alt">
                    ⇾ No spam, gibberish, or extremely off-topic comments. <br/>
                    ⇾ No foul language (if you somehow bypassed the filter). <br/>
                    ⇾ No unnecessary rudeness or impoliteness, please be kind. <br/>
                    ⇾ No otherwise distasteful/inappropriate comments. <br/><br/>
                    </span>

                    Quotes are supported and we have a syntax that makes it easy to do quotes. Nested quotes are not supported. <br/>
                    <span className="help-alt">
                    &gt;&gt;&gt;[id] User said:<br/>
                    &gt; Comment <br/><br/>
                    </span>

                    Emojis can also be added to messages using their special identifier. <br/>
                    <span className="help-alt">
                    emoji:emojiName<br/><br/>
                    </span>

                    To highlight text wrap it in double asterisks. <br/>
                    <span className="help-alt">
                    **Highlighted text**<br/><br/>
                    </span>

                    You can mention users and they will receive a notification. <br/>
                    <span className="help-alt">
                    @username<br/><br/>
                    </span>

                    Any image or video links posted in the comment are automatically displayed.
                </span>
                <div className="help-img-container"><img className="help-img" src={emojisImg}/></div></>
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
                    ⇾ Vandalizing posts, tags, or translations. <br/><br/>
                    </span>

                    We also don't allow profane or inappropriate usernames. We will inquire you to change your 
                    username to something more appropriate, otherwise you might also get banned if there is no response.
                </span></>
            )
        }
        if (helpTab === "captcha") {
            return (
                <><span className="help-heading">Captcha</span>
                <span className="help-text">
                    We don't condone the scraping of our website for purposes of AI-training, and we take 
                    various measures to make it harder like captchas and encrypting images. Hopefully 
                    this shouldn't be triggered by regular browsing. <br/><br/>
                    
                    Although there is nothing we can to prevent your work being scraped on Pixiv/Twitter etc, on
                    our website we do what we can to mitigate it.<br/><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={captchaImg}/></div></>
            )
        }
        if (helpTab === "account-deletion") {
            return (
                <><span className="help-heading">Account Deletion</span>
                <span className="help-text">
                    Since Moepictures is heavily focused on user contributions, when you delete your account we won't  
                    remove your public contributions like submitted posts and edits. The account that uploaded them will be 
                    anonymized and show up as "deleted". The rest of your account data will be deleted. <br/><br/>
                </span></>
            )
        }
        if (helpTab === "copyright-removal") {
            return (
                <><span className="help-heading">Copyright Removal</span>
                <span className="help-text">
                    If your work is up on Moepictures then it means that we love your work and we always make sure to source 
                    posts back to you.<br/><br/>

                    With that said, we respect your rights and if you don't want your work to be here anymore, 
                    you may submit a copyright removal form at <a className="help-link" onClick={() => history.push("/copyright-removal")}>{mobile ? "Copyright Form" : `${functions.getDomain()}/copyright-removal`}</a> or email us at moepictures.moe@gmail.com.<br/><br/>

                    After verifying that you are the artist, your works will be promptly removed, and if requested we will also prevent your future works from being uploaded.<br/><br/>

                    We are sad to see you go.<br/>
                </span></>
            )
        }
    }
    
    return (
        <>
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
                        <span className="help-nav-text" onClick={() => setHelpTab("music")}>Music</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("translations")}>Translations</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("favorites")}>Favorites</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("favgroups")}>Favorite Groups</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("cuteness")}>Cuteness</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("uploading")}>Uploading</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("tagging")}>Tagging</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("upscaling")}>Upscaling</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("compressing")}>Compressing</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("pixiv-downloads")}>Pixiv Downloads</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("bookmarklet")}>Bookmarklet</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("variations")}>Variations</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("third-party-edits")}>Third Party Edits</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("groups")}>Groups</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("aliases")}>Aliases</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("implications")}>Implications</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("users")}>Users</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("commenting")}>Commenting</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("bans")}>Bans</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("captcha")}>Captcha</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("account-deletion")}>Account Deletion</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("copyright-removal")}>Copyright Removal</span>
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