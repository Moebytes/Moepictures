# Moepictures.moe

**Update - 3/8/2023**
I took down the online website because I can't afford the hosting costs. You can still run it locally using your own database and images. 

Moepictures is an image board site for cute anime art, organized by tags.

<img src="assets/misc/readme.png">

### Searching With Spaces

Moepictures's tags use the dash ("-") as the delimeter, but the search can guess what tags you are looking for even if you use spaces.

### Multiple Images Per Post

Moepictures supports multiple images per post, which is great for comics and posts with lots of variations. We also have parent/child relationships for third-party posts.

### Image Filters

<img src="assets/misc/imagefilters.png">

You can apply image filters such as brightness, contrast, and hue in realtime. There is also a very fun pixelate filter that 
can make everything look like a pixel game. When playing audio, the pixelate filter will work as a bitcrusher.

### Custom Players

Moepictures uses custom gif/video/music/3d players, so you can do many things that aren't normally possible like pausing/seeking 
gifs, reverse playback, and modification of playback speed. 

GIF Player:

<img src="assets/misc/gifplayer.png">

Video Player:

<img src="assets/misc/videoplayer.png">

3D Model Player:

<img src="assets/misc/3dplayer.png">

Music Player:

<img src="assets/misc/musicplayer.png">

The video player has some additional controls over the gif player, such as volume and pitch preservement. The 3d model player has 
controls for wireframe, matcap, shapekeys, and lighting. The music player can playback audio in reverse.

### Translations

<img src="assets/misc/translations.png">

As often images might contain japanese text, adding and viewing translations is also supported!

### Tech Stack

- Languages: Typescript, LESS, SQL
- Front-end: React
- Back-end: Node
- Database: PostgreSQL

### Self-hosting

If you want to self host this website the first step is to clone the code and install Node.js (v20.11.1 to follow the same settings in the project).

https://nodejs.org/en/ 

The database used is PostgreSQL v16. You should create a new database but you don't need to create any tables as they are automatically created if they don't exist.

https://www.postgresql.org

Rename the file `.env.example` to `.env` and this is where you should put in your credentials. `COOKIE_SECRET` should be any string of random characters. `EMAIL_ADDRESS` and `EMAIL_PASSWORD` is the email address used to send people email verification emails, password resets, etc.

To add files locally create folders "moepictures" and "moepictures-unverified" and add the path to `MOEPICTURES_LOCAL` and `MOEPICTURES_LOCAL_UNVERIFIED`, each containing the following subfolders:

`["animation", "artist", "character", "comic", "image", "pfp", "series", "tag", "video", "audio", "model"]`

The site runs on port 8082 by default but it can be configured by changing `PORT`.

The other keys in this file are largely optional, and only if you want to enable that functionality.

Install all of the dependencies for this project by running `npm install`. \
Start the project by running the server `npm start`.

That's pretty much it!
