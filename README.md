<br/>
<p align="center">
  <a href="https://github.com/itsDevKay/JustWatchAPI-NodeJS">
    <img src="https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/a1/29/40/a1294087-7a6a-27fd-963a-18fd5fe8d59d/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/460x0w.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">JustWatch API</h3>

  <p align="center">
    Unofficial NodeJS wrapper for JustWatch.com. Access data about your favorite shows/movies with this easy to use API.
    <br/>
    <br/>
    <a href="https://github.com/itsDevKay/JustWatchAPI-NodeJS"><strong>Explore the docs »</strong></a>
    <br/>
    <br/>
    <a href="https://github.com/itsDevKay/JustWatchAPI-NodeJS">View Demo</a>
    .
    <a href="https://github.com/itsDevKay/JustWatchAPI-NodeJS/issues">Report Bug</a>
    .
    <a href="https://github.com/itsDevKay/JustWatchAPI-NodeJS/issues">Request Feature</a>
  </p>
</p>

![Contributors](https://img.shields.io/github/contributors/itsDevKay/JustWatchAPI-NodeJS?color=dark-green) ![Forks](https://img.shields.io/github/forks/itsDevKay/JustWatchAPI-NodeJS?style=social) ![Stargazers](https://img.shields.io/github/stars/itsDevKay/JustWatchAPI-NodeJS?style=social) ![Issues](https://img.shields.io/github/issues/itsDevKay/JustWatchAPI-NodeJS) ![License](https://img.shields.io/github/license/itsDevKay/JustWatchAPI-NodeJS) 

## Table Of Contents

* [About the Project](#about-the-project)
* [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Authors](#authors)

## About The Project

This is an unofficial JustWatch API wrapper written in Node.js. It allows you to access detailed information and data about movies and TV shows, including:

- Title
- Images
- Release date
- Genre
- Cast and crew
- Synopsis
- Streaming availability
- Similar Titles

and so much more!

This wrapper is easy to use and can be integrated into any Node.js application. It is also free and open source, so you can use it in any way you want.

## Built With



* [Node.js](https://nodejs.org/en)
* [Puppeteer](https://pptr.dev/)

## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

* npm >= v16.20.0

```sh
npm install npm@latest -g
```

### Installation

1. Clone the repo

```sh
git clone https://github.com/itsDevKay/JustWatchAPI-NodeJS.git
```

2. Install NPM packages

```sh
npm install
```

## Usage

```javascript
import JustWatchAPI from 'JustWatchAPI';
import util from 'util';

let jw = new JustWatchAPI({ 
    puppeteerArgs: [], headless: 'new' 
});
await jw.initialize();

let searchResults = await jw.search({
    searchQuery: "Silicon Valley", 
    language: "en", 
    country: "US" 
});
console.log(util.inspect(searchResults, {depth:null}));
    
// filter for proper item
let itemFullPath = jw.filterSearchResponse(searchResults, "SHOW", "Silicon Valley");

console.log(itemFullPath); 
// /us/tv-show/silicon-valley 
    
// get full item details
const fullTitleDetails = await jw.getDetailsByURL({
    itemFullPath: itemFullPath, 
    platform: 'WEB', 
    language: 'en', 
    country: 'US', 
    episodeMaxLimit: 20
});
console.log(util.inspect(fullTitleDetails, {depth:null}));
    
// Get justwatch id to search similar titles
let justWatchID = fullTitleDetails.data.urlV2.node.id;

console.log(justWatchID); // ts20760
    
// similar titles
const similarTitles = await jw.getSimilarTitleByJWID({
    justWatchID: justWatchID, 
    platform: 'WEB', 
    language: 'en',
    country: 'US', 
    excludeIrrelevantTitles: false, 
    pageType: 'show'
});
console.log(util.inspect(similarTitles, {depth:null}));
```

## Roadmap

See the [open issues](https://github.com/itsDevKay/JustWatchAPI-NodeJS/issues) for a list of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.
* If you have suggestions for adding or removing projects, feel free to [open an issue](https://github.com/itsDevKay/JustWatchAPI-NodeJS/issues/new) to discuss it, or directly create a pull request after you edit the *README.md* file with necessary changes.
* Please make sure you check your spelling and grammar.
* Create individual PR for each suggestion.
* Please also read through the [Code Of Conduct](https://github.com/itsDevKay/JustWatchAPI-NodeJS/blob/main/CODE_OF_CONDUCT.md) before posting your first idea as well.

### Creating A Pull Request

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See [LICENSE](https://github.com/itsDevKay/JustWatchAPI-NodeJS/blob/main/LICENSE.md) for more information.

## Authors

* **Eryn Keanu** - *Full Stack Software Developer* - [Eryn Keanu](https://github.com/itsDevKay/) - *Built JustWatch API*
