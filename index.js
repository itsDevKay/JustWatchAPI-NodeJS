import puppeteer from 'puppeteer';
import util from 'util';

class JustWatchAPI {
    constructor({ puppeteerArgs, headless }) {
        let args = ['--disable-web-security', ...puppeteerArgs]
        // console.log(args);
        this.puppeteerConfig = {
            headless: headless,
            args: args,
        };
        this.page;
        this.browser;
    }

    initialize = async () => {
        // poster
        // https://images.justwatch.com/poster/255300096/s718/the-book-of-boba-fett.jpg
        // backdrop
        // https://images.justwatch.com/backdrop/258529090/s1920/the-book-of-boba-fett.jpg
    
    
        // Launch the browser and open a new blank page
        this.browser = await puppeteer.launch(this.puppeteerConfig);
        var [page] = await this.browser.pages();
        this.page = page;
        
        await this.page.setBypassCSP(true);
        // Navigate the page to a URL
        await this.page.goto('https://developer.chrome.com/');
    
        // Set screen size
        await this.page.setViewport({width: 1080, height: 1024}); 
    };
    

    stressTester = async (searchQuery) => {
        const response = await this.page.evaluate(async (searchQuery) => {
            /*
             * 773 requests at 250ms interval before running into
             * 429 (Too Many Requests). 
             * 
             * Data was still being able to continue and get back, 
             * just had the 429 response come and go for requests.
             * 429 was persistent until the loop stopped at 1000.
             * Was unable to pickup a pattern. 429 response
             * was scattered.
             * 
             * -----
             * Attempted another test with a 500ms interval, once
             * again aiming for 1000 requests.
             * 
             * Ran into 429 response at request #726. 
             * 
             * For the purposes of actual testing i'll use a 500ms
             * delay and use a timeout of 60 seconds before running
             * again.
             */
            async function stressTester(searchQuery) {
                let response = await fetch("https://apis.justwatch.com/graphql", {
                    "credentials": "omit",
                    "headers": {
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0",
                        "Accept": "*/*",
                        "Accept-Language": "en-US,en;q=0.5",
                        "content-type": "application/json",
                        "App-Version": "3.7.1-web-web",
                        "DEVICE-ID": "XFpiKlykEe6wTkKWjpYncw",
                        "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-site"
                    },
                    "referrer": "https://www.justwatch.com/",
                    "body": `{\"operationName\":\"GetSuggestedTitles\",\"variables\":{\"country\":\"US\",\"language\":\"en\",\"first\":4,\"filter\":{\"searchQuery\":\"${searchQuery}\"}},\"query\":\"query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {\\n  popularTitles(country: $country, first: $first, filter: $filter) {\\n    edges {\\n      node {\\n        ...SuggestedTitle\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment SuggestedTitle on MovieOrShow {\\n  id\\n  objectType\\n  objectId\\n  content(country: $country, language: $language) {\\n    fullPath\\n    title\\n    originalReleaseYear\\n    posterUrl\\n    fullPath\\n    __typename\\n  }\\n  __typename\\n}\\n\"}`,
                    "method": "POST",
                    "mode": "cors"
                })
                let data = await response.json()
                console.log(data)
                return data
            }
    
            function timeout(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
    
            async function runLoop(x, ms) {
                for (let i=0; i < x; i++) {
                    await timeout(ms);
                    await stressTester(searchQuery);
                    console.log(i);
                }
            }
    
            runLoop(1000, 500);
        }, searchQuery);
    }
    
    getSimilarTitleByJWID = async (justWatchID) => {
        const similarTitles = await this.page.evaluate(async (justWatchID) => {
            let response = await fetch("https://apis.justwatch.com/graphql", {
                "credentials": "omit",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "content-type": "application/json",
                    "App-Version": "3.7.1-web-web",
                    "DEVICE-ID": "XFpiKlykEe6wTkKWjpYncw",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-site"
                },
                "referrer": "https://www.justwatch.com/",
                "body": `{\"operationName\":\"GetSimilarTitles\",\"variables\":{\"platform\":\"WEB\",\"language\":\"en\",\"country\":\"US\",\"filters\":{\"excludeIrrelevantTitles\":false},\"titleId\":\"${justWatchID}\",\"allowSponsoredRecommendations\":{\"country\":\"US\",\"language\":\"en\",\"platform\":\"WEB\",\"pageType\":\"show\"}},\"query\":\"query GetSimilarTitles($country: Country!, $titleId: ID!, $language: Language!, $filters: TitleFilter, $format: ImageFormat, $backdropProfile: BackdropProfile, $platform: Platform! = WEB, $allowSponsoredRecommendations: SponsoredRecommendationsInput) {\\n  node(id: $titleId) {\\n    id\\n    ... on MovieOrShow {\\n      similarTitlesV2(\\n        country: $country\\n        filter: $filters\\n        allowSponsoredRecommendations: $allowSponsoredRecommendations\\n      ) {\\n        edges {\\n          node {\\n            ...SimilarTitle\\n            __typename\\n          }\\n          __typename\\n        }\\n        sponsoredAd {\\n          ...SponsoredAdFragment\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment SimilarTitle on MovieOrShow {\\n  id\\n  objectId\\n  objectType\\n  content(country: $country, language: $language) {\\n    title\\n    posterUrl\\n    fullPath\\n    backdrops {\\n      backdropUrl\\n      __typename\\n    }\\n    scoring {\\n      imdbScore\\n      __typename\\n    }\\n    __typename\\n  }\\n  watchlistEntry {\\n    createdAt\\n    __typename\\n  }\\n  likelistEntry {\\n    createdAt\\n    __typename\\n  }\\n  dislikelistEntry {\\n    createdAt\\n    __typename\\n  }\\n  ... on Movie {\\n    seenlistEntry {\\n      createdAt\\n      __typename\\n    }\\n    __typename\\n  }\\n  ... on Show {\\n    seenState(country: $country) {\\n      progress\\n      seenEpisodeCount\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment SponsoredAdFragment on SponsoredRecommendationAd {\\n  bidId\\n  holdoutGroup\\n  campaign {\\n    externalTrackers {\\n      type\\n      data\\n      __typename\\n    }\\n    hideRatings\\n    promotionalImageUrl\\n    watchNowLabel\\n    watchNowOffer {\\n      standardWebURL\\n      presentationType\\n      monetizationType\\n      package {\\n        id\\n        packageId\\n        shortName\\n        clearName\\n        icon\\n        __typename\\n      }\\n      __typename\\n    }\\n    node {\\n      id\\n      ... on MovieOrShow {\\n        content(country: $country, language: $language) {\\n          fullPath\\n          posterUrl\\n          title\\n          originalReleaseYear\\n          scoring {\\n            imdbScore\\n            __typename\\n          }\\n          externalIds {\\n            imdbId\\n            __typename\\n          }\\n          backdrops(format: $format, profile: $backdropProfile) {\\n            backdropUrl\\n            __typename\\n          }\\n          isReleased\\n          __typename\\n        }\\n        objectId\\n        objectType\\n        offers(country: $country, platform: $platform) {\\n          monetizationType\\n          presentationType\\n          package {\\n            id\\n            packageId\\n            __typename\\n          }\\n          id\\n          __typename\\n        }\\n        watchlistEntry {\\n          createdAt\\n          __typename\\n        }\\n        __typename\\n      }\\n      ... on Show {\\n        seenState(country: $country) {\\n          seenEpisodeCount\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\"}`,
                "method": "POST",
                "mode": "cors"
            });
            let data = response.json();
            return await data;
        }, justWatchID);
        return await similarTitles;
    }
    
    getDetailsByURL = async (itemFullPath) => {
        const fullTitleDetails = await this.page.evaluate(async (itemFullPath) => {
            let response = await fetch("https://apis.justwatch.com/graphql", {
                "credentials": "omit",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "content-type": "application/json",
                    "App-Version": "3.7.1-web-web",
                    "DEVICE-ID": "XFpiKlykEe6wTkKWjpYncw",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-site"
                },
                "referrer": "https://www.justwatch.com/",
                "body": `{\"operationName\":\"GetUrlTitleDetails\",\"variables\":{\"platform\":\"WEB\",\"fullPath\":\"${itemFullPath}\",\"language\":\"en\",\"country\":\"US\",\"episodeMaxLimit\":20,\"allowSponsoredRecommendations\":{\"country\":\"US\",\"platform\":\"WEB\",\"pageType\":\"VIEW_TITLE_DETAIL\",\"language\":\"en\"}},\"query\":\"query GetUrlTitleDetails($fullPath: String!, $country: Country!, $language: Language!, $episodeMaxLimit: Int, $platform: Platform! = WEB, $allowSponsoredRecommendations: SponsoredRecommendationsInput) {\\n  urlV2(fullPath: $fullPath) {\\n    id\\n    metaDescription\\n    metaKeywords\\n    metaRobots\\n    metaTitle\\n    heading1\\n    heading2\\n    htmlContent\\n    node {\\n      id\\n      __typename\\n      ... on MovieOrShowOrSeason {\\n        plexPlayerOffers: offers(\\n          country: $country\\n          platform: $platform\\n          filter: {packages: [\\\"pxp\\\"]}\\n        ) {\\n          id\\n          standardWebURL\\n          package {\\n            id\\n            packageId\\n            clearName\\n            technicalName\\n            __typename\\n          }\\n          __typename\\n        }\\n        objectType\\n        objectId\\n        offerCount(country: $country, platform: $platform)\\n        offers(country: $country, platform: $platform) {\\n          monetizationType\\n          elementCount\\n          package {\\n            id\\n            packageId\\n            clearName\\n            __typename\\n          }\\n          __typename\\n        }\\n        watchNowOffer(country: $country, platform: $platform) {\\n          standardWebURL\\n          __typename\\n        }\\n        promotedBundles(country: $country, platform: $platform) {\\n          promotionUrl\\n          __typename\\n        }\\n        availableTo(country: $country, platform: $platform) {\\n          availableCountDown(country: $country)\\n          availableToDate\\n          package {\\n            id\\n            shortName\\n            __typename\\n          }\\n          __typename\\n        }\\n        fallBackClips: content(country: \\\"US\\\", language: \\\"en\\\") {\\n          videobusterClips: clips(providers: [VIDEOBUSTER]) {\\n            ...TrailerClips\\n            __typename\\n          }\\n          dailymotionClips: clips(providers: [DAILYMOTION]) {\\n            ...TrailerClips\\n            __typename\\n          }\\n          __typename\\n        }\\n        content(country: $country, language: $language) {\\n          backdrops {\\n            backdropUrl\\n            __typename\\n          }\\n          fullBackdrops: backdrops(profile: S1920, format: JPG) {\\n            backdropUrl\\n            __typename\\n          }\\n          clips {\\n            ...TrailerClips\\n            __typename\\n          }\\n          videobusterClips: clips(providers: [VIDEOBUSTER]) {\\n            ...TrailerClips\\n            __typename\\n          }\\n          dailymotionClips: clips(providers: [DAILYMOTION]) {\\n            ...TrailerClips\\n            __typename\\n          }\\n          externalIds {\\n            imdbId\\n            __typename\\n          }\\n          fullPath\\n          genres {\\n            translation(language: $language)\\n            __typename\\n            shortName\\n            __typename          }\\n          posterUrl\\n          fullPosterUrl: posterUrl(profile: S718, format: JPG)\\n          runtime\\n          isReleased\\n          scoring {\\n            imdbScore\\n            imdbVotes\\n            tmdbPopularity\\n            tmdbScore\\n            __typename\\n          }\\n          shortDescription\\n          title\\n          originalReleaseYear\\n          originalReleaseDate\\n          upcomingReleases(releaseTypes: DIGITAL) {\\n            releaseCountDown(country: $country)\\n            releaseDate\\n            label\\n            package {\\n              id\\n              packageId\\n              shortName\\n              __typename\\n            }\\n            __typename\\n          }\\n          ... on MovieOrShowContent {\\n            originalTitle\\n            ageCertification\\n            credits {\\n              role\\n              name\\n              characterName\\n              personId\\n              __typename\\n            }\\n            productionCountries\\n            __typename\\n          }\\n          ... on SeasonContent {\\n            seasonNumber\\n            __typename\\n          }\\n          __typename\\n        }\\n        popularityRank(country: $country) {\\n          rank\\n          trend\\n          trendDifference\\n          __typename\\n        }\\n        __typename\\n      }\\n      ... on MovieOrShow {\\n        watchlistEntry {\\n          createdAt\\n          __typename\\n        }\\n        likelistEntry {\\n          createdAt\\n          __typename\\n        }\\n        dislikelistEntry {\\n          createdAt\\n          __typename\\n        }\\n        customlistEntries {\\n          createdAt\\n          genericTitleList {\\n            id\\n            __typename\\n          }\\n          __typename\\n        }\\n        similarTitlesV2(\\n          country: $country\\n          allowSponsoredRecommendations: $allowSponsoredRecommendations\\n        ) {\\n          sponsoredAd {\\n            bidId\\n            holdoutGroup\\n            campaign {\\n              hideRatings\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      ... on Movie {\\n        permanentAudiences\\n        seenlistEntry {\\n          createdAt\\n          __typename\\n        }\\n        __typename\\n      }\\n      ... on Show {\\n        permanentAudiences\\n        totalSeasonCount\\n        seenState(country: $country) {\\n          progress\\n          seenEpisodeCount\\n          __typename\\n        }\\n        seasons(sortDirection: DESC) {\\n          id\\n          objectId\\n          objectType\\n          totalEpisodeCount\\n          availableTo(country: $country, platform: $platform) {\\n            availableToDate\\n            availableCountDown(country: $country)\\n            package {\\n              id\\n              shortName\\n              __typename\\n            }\\n            __typename\\n          }\\n          content(country: $country, language: $language) {\\n            posterUrl\\n            seasonNumber\\n            fullPath\\n            title\\n            upcomingReleases(releaseTypes: DIGITAL) {\\n              releaseDate\\n              releaseCountDown(country: $country)\\n              package {\\n                id\\n                shortName\\n                __typename\\n              }\\n              __typename\\n            }\\n            isReleased\\n            originalReleaseYear\\n            __typename\\n          }\\n          show {\\n            id\\n            objectId\\n            objectType\\n            watchlistEntry {\\n              createdAt\\n              __typename\\n            }\\n            content(country: $country, language: $language) {\\n              title\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        recentEpisodes: episodes(\\n          sortDirection: DESC\\n          limit: 1000\\n          releasedInCountry: $country\\n        ) {\\n          id\\n          objectId\\n          content(country: $country, language: $language) {\\n            title\\n            shortDescription\\n            episodeNumber\\n            seasonNumber\\n            isReleased\\n            upcomingReleases {\\n              releaseDate\\n              label\\n              __typename\\n            }\\n            __typename\\n          }\\n          seenlistEntry {\\n            createdAt\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      ... on Season {\\n        totalEpisodeCount\\n        episodes(limit: $episodeMaxLimit) {\\n          id\\n          objectType\\n          objectId\\n          seenlistEntry {\\n            createdAt\\n            __typename\\n          }\\n          content(country: $country, language: $language) {\\n            title\\n            shortDescription\\n            episodeNumber\\n            seasonNumber\\n            isReleased\\n            upcomingReleases(releaseTypes: DIGITAL) {\\n              releaseDate\\n              label\\n              package {\\n                id\\n                packageId\\n                __typename\\n              }\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        show {\\n          id\\n          objectId\\n          objectType\\n          totalSeasonCount\\n          customlistEntries {\\n            createdAt\\n            genericTitleList {\\n              id\\n              __typename\\n            }\\n            __typename\\n          }\\n          fallBackClips: content(country: \\\"US\\\", language: \\\"en\\\") {\\n            videobusterClips: clips(providers: [VIDEOBUSTER]) {\\n              ...TrailerClips\\n              __typename\\n            }\\n            dailymotionClips: clips(providers: [DAILYMOTION]) {\\n              ...TrailerClips\\n              __typename\\n            }\\n            __typename\\n          }\\n          content(country: $country, language: $language) {\\n            title\\n            ageCertification\\n            fullPath\\n            genres {\\n              translation(language: $language)\\n              __typename\\n            shortName\\n            __typename            }\\n            credits {\\n              role\\n              name\\n              characterName\\n              personId\\n              __typename\\n            }\\n            productionCountries\\n            externalIds {\\n              imdbId\\n              __typename\\n            }\\n            upcomingReleases(releaseTypes: DIGITAL) {\\n              releaseDate\\n              __typename\\n            }\\n            backdrops {\\n              backdropUrl\\n              __typename\\n            }\\n            posterUrl\\n            isReleased\\n            videobusterClips: clips(providers: [VIDEOBUSTER]) {\\n              ...TrailerClips\\n              __typename\\n            }\\n            dailymotionClips: clips(providers: [DAILYMOTION]) {\\n              ...TrailerClips\\n              __typename\\n            }\\n            __typename\\n          }\\n          seenState(country: $country) {\\n            progress\\n            __typename\\n          }\\n          watchlistEntry {\\n            createdAt\\n            __typename\\n          }\\n          dislikelistEntry {\\n            createdAt\\n            __typename\\n          }\\n          likelistEntry {\\n            createdAt\\n            __typename\\n          }\\n          similarTitlesV2(\\n            country: $country\\n            allowSponsoredRecommendations: $allowSponsoredRecommendations\\n          ) {\\n            sponsoredAd {\\n              bidId\\n              holdoutGroup\\n              campaign {\\n                hideRatings\\n                __typename\\n              }\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        seenState(country: $country) {\\n          progress\\n          __typename\\n        }\\n        __typename\\n      }\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment TrailerClips on Clip {\\n  sourceUrl\\n  externalId\\n  provider\\n  name\\n  __typename\\n}\\n\"}`,
                "method": "POST",
                "mode": "cors"
            });
            let data = response.json();
            return await data;
        }, itemFullPath);
        return await fullTitleDetails;
    }
    
    search = async (searchQuery) => {
        const response = await this.page.evaluate(async (searchQuery) => {
            let response = await fetch("https://apis.justwatch.com/graphql", {
                "credentials": "omit",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "content-type": "application/json",
                    "App-Version": "3.7.1-web-web",
                    "DEVICE-ID": "XFpiKlykEe6wTkKWjpYncw",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-site"
                },
                "referrer": "https://www.justwatch.com/",
                "body": `{\"operationName\":\"GetSuggestedTitles\",\"variables\":{\"country\":\"US\",\"language\":\"en\",\"first\":4,\"filter\":{\"searchQuery\":\"${searchQuery}\"}},\"query\":\"query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {\\n  popularTitles(country: $country, first: $first, filter: $filter) {\\n    edges {\\n      node {\\n        ...SuggestedTitle\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment SuggestedTitle on MovieOrShow {\\n  id\\n  objectType\\n  objectId\\n  content(country: $country, language: $language) {\\n    fullPath\\n    title\\n    originalReleaseYear\\n    posterUrl\\n    fullPath\\n    __typename\\n  }\\n  __typename\\n}\\n\"}`,
                "method": "POST",
                "mode": "cors"
            });
            let data = response.json();
            return await data;
        }, searchQuery);
        return await response;
    }
    
    filterSearchResponse = (response, objectType, searchQuery) => {
        //console.log(util.inspect(response.data.popularTitles.edges, {depth:null}));
        let searchResults = response.data.popularTitles.edges;
        //console.log(searchResults[0]);
        let filteredItems = searchResults.filter(i => {
            return i.node.objectType === objectType && i.node.content.title.toLowerCase().includes(searchQuery.toLowerCase());
        })[0];
        let itemContent = filteredItems.node.content;
        let itemFullPath = itemContent.fullPath;
        //console.log(itemFullPath);
    
        return itemFullPath; 
    }
    
    
    runExampleFlow = async (searchQuery, objectType) => {
        // poster
        // https://images.justwatch.com/poster/255300096/s718/the-book-of-boba-fett.jpg
        // backdrop
        // https://images.justwatch.com/backdrop/258529090/s1920/the-book-of-boba-fett.jpg
    
        let response = await this.search(page, searchQuery);
        //console.log(util.inspect(response, {depth:null}));
    
        //filter for proper item
        let itemFullPath = this.filterSearchResponse(response, objectType, searchQuery);
    
        // get full item details
        const fullTitleDetails = await this.getDetailsByURL(page, itemFullPath);
    
        //console.log(util.inspect(fullTitleDetails, {depth:null}));
        let justWatchID = fullTitleDetails.data.urlV2.node.id;
    
        // similar titles
        const similarTitles = await this.getSimilarTitleByJWID(page, justWatchID);
    
        console.log(util.inspect(similarTitles, {depth:null}));
    };

    close = async () => { await this.browser.close(); }
}

let api = new JustWatchAPI({ 
    puppeteerArgs: [], headless: false 
});
await api.initialize();
let searchResults = await api.search('Boruto', 'SHOW');

console.log(util.inspect(searchResults, {depth:null}));
await api.close();