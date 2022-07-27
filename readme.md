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

### Self-hosting

If you want to self host this website the first step is to clone the code and install Node.js v16.6.2 (a newer version might have breaking changes and is not guaranteed to work).

https://nodejs.org/en/ 

The database used is PostgreSQL v14. You should create a new database but you don't need to create any tables as they are created automatically if they don't exist.

https://www.postgresql.org

Images are uploaded to Amazon S3 buckets called "moebooru" and "moebooru-unverified", you should create two buckets with these names.

https://aws.amazon.com/s3/

If you want to instead upload to the local filesystem you can modify the functions in the file `structures/ServerFunctions.ts` to write to the local filesystem instead of uploading to the S3 bucket. In these functions the "file" argument will be a string like `foldername/filename.png` where these are all the folders, you need to create all of these if you are uploading locally.

`["animation", "artist", "character", "comic", "image", "pfp", "series", "tag", "video"]`

Rename the file `.env.example` to `.env` and this is where you should put in your database and aws credentials. `COOKIE_SECRET` should be a string of random characters. `EMAIL_ADDRESS` and `EMAIL_PASSWORD` is the email address used to send people email verification emails, password resets, etc.

In production you should set the `PORT` to 80 (HTTP port) or 443 (HTTPS port). For development omit this and it runs on port 8080 by default.

The other keys in this file are largely optional, for example if you want to fetch data from saucenao in the upload page you should provide a saucenao api key.

Install all of the dependencies for this project by running `npm install`. \
Build the project by running `webpack`. \
Start the project by running the server `node dist/server.js`.

The script `npm start` is a shorthand for building and starting the project. \
In production, you should run this file with pm2 so it automatically restarts if for some reason there was an error: `pm2 start dist/server.js`.

That should be it!