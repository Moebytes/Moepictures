# Moebooru.moe

Moebooru is an image board site for cute anime art, organized by tags. It is inspired from other similar image boards (danbooru, yandere, etc.)

![Image](https://github.com/Tenpi/Moebooru.moe/blob/main/assets/misc/readme.png?raw=true)

### Searching With Spaces

Moebooru's tags use the dash ("-") as the delimeter, but the search can guess what tags you are looking for even if you use spaces.

### Multiple Images Per Post

Moebooru supports multiple images per post, which is great for comics and posts with lots of variations. We also still have the usual parent/child relationships for third-party posts.

### Image Filters

![Image](https://github.com/Tenpi/Moebooru.moe/blob/main/assets/misc/imagefilters.png?raw=true)

You can apply image filters such as brightness, contrast, and hue in realtime. There is also a very fun pixelate filter that 
can make everything look like a pixel game.

### Custom GIF/Video Players

Moebooru uses custom javascript gif/video players, so you can do many things that aren't normally possible like pausing/seeking 
gifs, reverse playback, and modifying playback speed. 

GIF Player:

![Image](https://github.com/Tenpi/Moebooru.moe/blob/main/assets/misc/gifplayer.png?raw=true)

Video Player:

![Image](https://github.com/Tenpi/Moebooru.moe/blob/main/assets/misc/videoplayer.png?raw=true)

The video player has some additional controls over the gif player, such as volume and pitch preservement. 

### Tech Stack

- Languages: Typescript, LESS, HTML, SQL
- Front-end: React
- Bundler: Webpack
- Back-end: Node
- Database: PostgreSQL
- Hosting: AWS