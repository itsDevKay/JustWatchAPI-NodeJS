import puppeteer from 'puppeteer';
import util from 'util';

export class JustWatchAPI {
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
                    "body": JSON.stringify({
                        "operationName":"GetSuggestedTitles",
                        "variables":{
                            "country":"US",
                            "language":"en",
                            "first":4,
                            "filter":{
                                "searchQuery":searchQuery
                            }
                        },
                        "query":`query GetSuggestedTitles(
                                $country: Country!, 
                                $language: Language!, 
                                $first: Int!, 
                                $filter: TitleFilter
                            ) {
                                popularTitles(country: $country, first: $first, filter: $filter) {
                                    edges {
                                        node {
                                        ...SuggestedTitle
                                        __typename
                                    }
                                    __typename
                                }
                                __typename
                            }
                        }
                        
                        fragment SuggestedTitle on MovieOrShow {
                            id
                            objectType
                            objectId
                            content(country: $country, language: $language) {
                                fullPath
                                title
                                originalReleaseYear
                                posterUrl
                                fullPath
                                __typename
                            }
                            __typename
                        }`
                    }),
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
                "body": JSON.stringify({
                    "operationName":"GetSimilarTitles",
                    "variables":{
                        "platform":"WEB",
                        "language":"en",
                        "country":"US",
                        "filters":{
                            "excludeIrrelevantTitles":false
                        },
                        "titleId":justWatchID,
                        "allowSponsoredRecommendations":{
                            "country":"US",
                            "language":"en",
                            "platform":"WEB",
                            "pageType":"show"
                        }
                    },
                    "query":`query GetSimilarTitles(
                            $country: Country!, 
                            $titleId: ID!, 
                            $language: Language!, 
                            $filters: TitleFilter, 
                            $format: ImageFormat, 
                            $backdropProfile: BackdropProfile, 
                            $platform: Platform! = WEB, 
                            $allowSponsoredRecommendations: SponsoredRecommendationsInput
                        ) {
                            node(id: $titleId) {
                                id
                                ... on MovieOrShow {
                                    similarTitlesV2(
                                        country: $country
                                        filter: $filters
                                        allowSponsoredRecommendations: $allowSponsoredRecommendations
                                    ) {
                                        edges {
                                            node {
                                                ...SimilarTitle
                                                __typename
                                            }
                                            __typename
                                        }
                                        sponsoredAd {
                                            ...SponsoredAdFragment
                                            __typename
                                        }
                                        __typename
                                    }
                                    __typename
                                }
                                __typename
                            }
                        }
                        
                        fragment SimilarTitle on MovieOrShow {
                            id
                            objectId
                            objectType
                            content(country: $country, language: $language) {
                                title
                                posterUrl
                                fullPath
                                backdrops {
                                    backdropUrl
                                    __typename
                                }
                                scoring {
                                    imdbScore
                                    __typename
                                }
                                __typename
                            }
                            watchlistEntry {
                                createdAt
                                __typename
                            }
                            likelistEntry {
                                createdAt
                                __typename
                            }
                            dislikelistEntry {
                                createdAt
                                __typename
                            }
                            ... on Movie {
                                seenlistEntry {
                                createdAt
                                __typename
                            }
                            __typename
                        }
                        ... on Show {
                            seenState(country: $country) {
                                progress
                                seenEpisodeCount
                                __typename
                            }
                            __typename
                        }
                        __typename
                    }
                    fragment SponsoredAdFragment on SponsoredRecommendationAd {
                        bidId
                        holdoutGroup
                        campaign {
                            externalTrackers {
                                type
                                data
                                __typename
                            }
                            hideRatings
                            promotionalImageUrl
                            watchNowLabel
                            watchNowOffer {
                                standardWebURL
                                presentationType
                                monetizationType
                                package {
                                    id
                                    packageId
                                    shortName
                                    clearName
                                    icon
                                    __typename
                                }
                                __typename
                            }
                            node {
                                id
                                ... on MovieOrShow {
                                    content(country: $country, language: $language) {
                                        fullPath
                                        posterUrl
                                        title
                                        originalReleaseYear
                                        scoring {
                                            imdbScore
                                            __typename
                                        }
                                        externalIds {
                                            imdbId
                                            __typename
                                        }
                                        backdrops(format: $format, profile: $backdropProfile) {
                                            backdropUrl
                                            __typename
                                        }
                                        isReleased
                                        __typename
                                    }
                                    objectId
                                    objectType
                                    offers(country: $country, platform: $platform) {
                                        monetizationType
                                        presentationType
                                        package {
                                            id
                                            packageId
                                            __typename
                                        }
                                        id
                                        __typename
                                    }
                                    watchlistEntry {
                                        createdAt
                                        __typename
                                    }
                                    __typename
                                }
                                ... on Show {
                                    seenState(country: $country) {
                                        seenEpisodeCount
                                        __typename
                                    }
                                    __typename
                                }
                                __typename
                            }
                            __typename
                        }
                        __typename
                    }
                `}),
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
                "body": JSON.stringify({
                    "operationName":"GetUrlTitleDetails",
                    "variables":{
                        "platform":"WEB",
                        "fullPath":itemFullPath,
                        "language":"en",
                        "country":"US",
                        "episodeMaxLimit":20,
                        "allowSponsoredRecommendations":{
                            "country":"US",
                            "platform":"WEB",
                            "pageType":"VIEW_TITLE_DETAIL",
                            "language":"en"
                        }
                    },
                    "query":`query GetUrlTitleDetails(
                        $fullPath: String!, 
                        $country: Country!, 
                        $language: Language!, 
                        $episodeMaxLimit: Int, 
                        $platform: Platform! = WEB, 
                        $allowSponsoredRecommendations: SponsoredRecommendationsInput
                    ) {
                        urlV2(fullPath: $fullPath) {
                            id
                            metaDescription
                            metaKeywords
                            metaRobots
                            metaTitle
                            heading1
                            heading2
                            htmlContent
                            node {
                                id
                                __typename
                                ... on MovieOrShowOrSeason {
                                    plexPlayerOffers: offers(
                                        country: $country
                                        platform: $platform
                                        filter: {
                                            packages: [
                                                "pxp"
                                            ]
                                        }
                                    ) {
                                        id
                                        standardWebURL
                                        package {
                                            id
                                            packageId
                                            clearName
                                            technicalName
                                            __typename
                                        }
                                        __typename
                                    }
                                    objectType
                                    objectId
                                    offerCount(country: $country, platform: $platform)
                                    offers(country: $country, platform: $platform) {
                                        monetizationType
                                        elementCount
                                        package {
                                            id
                                            packageId
                                            clearName
                                             __typename
                                        }
                                        __typename
                                    }
                                    watchNowOffer(country: $country, platform: $platform) {
                                        standardWebURL
                                        __typename
                                    }
                                    promotedBundles(country: $country, platform: $platform) {
                                        promotionUrl
                                        __typename
                                    }
                                    availableTo(country: $country, platform: $platform) {
                                        availableCountDown(country: $country)
                                        availableToDate
                                        package {
                                            id
                                            shortName
                                            __typename
                                        }
                                        __typename
                                    }
                                    fallBackClips: content(country: "US", language: "en") {
                                        videobusterClips: clips(providers: [VIDEOBUSTER]) {
                                            ...TrailerClips
                                            __typename
                                        }
                                        dailymotionClips: clips(providers: [DAILYMOTION]) {
                                            ...TrailerClips
                                            __typename
                                        }
                                        __typename
                                    }
                                    content(country: $country, language: $language) {
                                        backdrops {
                                            backdropUrl
                                            __typename
                                        }
                                        fullBackdrops: backdrops(profile: S1920, format: JPG) {
                                            backdropUrl
                                            __typename
                                        }
                                        clips {
                                            ...TrailerClips
                                            __typename
                                        }
                                        videobusterClips: clips(providers: [VIDEOBUSTER]) {
                                            ...TrailerClips
                                            __typename
                                        }
                                        dailymotionClips: clips(providers: [DAILYMOTION]) {
                                            ...TrailerClips
                                            __typename
                                        }
                                        externalIds {
                                            imdbId
                                            __typename
                                        }
                                        fullPath
                                        genres {
                                            translation(language: $language)
                                            __typename
                                            shortName
                                            __typename
                                        }
                                        posterUrl
                                        fullPosterUrl: posterUrl(profile: S718, format: JPG)
                                        runtime
                                        isReleased
                                        scoring {
                                            imdbScore
                                            imdbVotes
                                            tmdbPopularity
                                            tmdbScore
                                            __typename
                                        }
                                        shortDescription
                                        title
                                        originalReleaseYear
                                        originalReleaseDate
                                        upcomingReleases(releaseTypes: DIGITAL) {
                                            releaseCountDown(country: $country)
                                            releaseDate
                                            label
                                            package {
                                                id
                                                packageId
                                                shortName
                                                __typename
                                            }
                                            __typename
                                        }
                                        ... on MovieOrShowContent {
                                            originalTitle
                                            ageCertification
                                            credits {
                                                role
                                                name
                                                characterName
                                                personId
                                                __typename
                                            }
                                            productionCountries
                                            __typename
                                        }
                                        ... on SeasonContent {
                                            seasonNumber
                                            __typename
                                        }
                                        __typename
                                    }
                                    popularityRank(country: $country) {
                                        rank
                                        trend
                                        trendDifference
                                        __typename
                                    }
                                    __typename
                                }
                                ... on MovieOrShow {
                                    watchlistEntry {
                                        createdAt
                                        __typename
                                    }
                                    likelistEntry {
                                        createdAt
                                        __typename
                                    }
                                    dislikelistEntry {
                                        createdAt
                                        __typename
                                    }
                                    customlistEntries {
                                        createdAt
                                        genericTitleList {
                                            id
                                            __typename
                                        }
                                        __typename
                                    }
                                    similarTitlesV2(
                                        country: $country
                                        allowSponsoredRecommendations: $allowSponsoredRecommendations
                                    ) {
                                        sponsoredAd {
                                            bidId
                                            holdoutGroup
                                            campaign {
                                                hideRatings
                                                __typename
                                            }
                                            __typename
                                        }
                                        __typename
                                    }
                                    __typename
                                }
                                ... on Movie {
                                    permanentAudiences
                                    seenlistEntry {
                                        createdAt
                                        __typename
                                    }
                                    __typename
                                }
                                ... on Show {
                                    permanentAudiences
                                    totalSeasonCount
                                    seenState(country: $country) {
                                        progress
                                        seenEpisodeCount
                                        __typename
                                    }
                                    seasons(sortDirection: DESC) {
                                        id
                                        objectId
                                        objectType
                                        totalEpisodeCount
                                        availableTo(country: $country, platform: $platform) {
                                            availableToDate
                                            availableCountDown(country: $country)
                                            package {
                                                id
                                                shortName
                                                __typename
                                            }
                                            __typename
                                        }
                                        content(country: $country, language: $language) {
                                            posterUrl
                                            seasonNumber
                                            fullPath
                                            title
                                            upcomingReleases(releaseTypes: DIGITAL) {
                                                releaseDate
                                                releaseCountDown(country: $country)
                                                package {
                                                    id
                                                    shortName
                                                    __typename
                                                }
                                                __typename
                                            }
                                            isReleased
                                            originalReleaseYear
                                            __typename
                                        }
                                        show {
                                            id
                                            objectId
                                            objectType
                                            watchlistEntry {
                                                createdAt
                                                __typename
                                            }
                                            content(country: $country, language: $language) {
                                                title
                                                __typename
                                            }
                                            __typename
                                        }
                                        __typename
                                    }
                                    recentEpisodes: episodes(
                                        sortDirection: DESC
                                        limit: 1000
                                        releasedInCountry: $country
                                        ) {
                                            id
                                            objectId
                                            content(country: $country, language: $language) {
                                                title
                                                shortDescription
                                                episodeNumber
                                                seasonNumber
                                                isReleased
                                                upcomingReleases {
                                                    releaseDate
                                                    label
                                                    __typename
                                                }
                                                __typename
                                            }
                                            seenlistEntry {
                                                createdAt
                                                __typename
                                            }
                                            __typename
                                        }
                                        __typename
                                    }
                                    ... on Season {
                                        totalEpisodeCount
                                        episodes(limit: $episodeMaxLimit) {
                                            id
                                            objectType
                                            objectId
                                            seenlistEntry {
                                                createdAt
                                                __typename
                                            }
                                            content(country: $country, language: $language) {
                                                title
                                                shortDescription
                                                episodeNumber
                                                seasonNumber
                                                isReleased
                                                upcomingReleases(releaseTypes: DIGITAL) {
                                                releaseDate
                                                label
                                                package {
                                                    id
                                                    packageId
                                                    __typename
                                                }
                                                __typename
                                            }
                                            __typename
                                        }
                                        __typename
                                    }
                                    show {
                                        id
                                        objectId
                                        objectType
                                        totalSeasonCount
                                        customlistEntries {
                                            createdAt
                                            genericTitleList {
                                                id
                                                __typename
                                            }
                                            __typename
                                        }
                                        fallBackClips: content(country: "US", language: "en") {
                                            videobusterClips: clips(providers: [VIDEOBUSTER]) {
                                                ...TrailerClips
                                                __typename
                                            }
                                            dailymotionClips: clips(providers: [DAILYMOTION]) {
                                                ...TrailerClips
                                                __typename
                                            }
                                            __typename
                                        }
                                        content(country: $country, language: $language) {
                                            title
                                            ageCertification
                                            fullPath
                                            genres {
                                                translation(language: $language)
                                                __typename
                                                shortName
                                                __typename
                                            }
                                            credits {
                                                role
                                                name
                                                characterName
                                                personId
                                                __typename
                                            }
                                            productionCountries
                                            externalIds {
                                                imdbId
                                                __typename
                                            }
                                            upcomingReleases(releaseTypes: DIGITAL) {
                                                releaseDate
                                                __typename
                                            }
                                            backdrops {
                                                backdropUrl
                                                __typename
                                            }
                                            posterUrl
                                            isReleased
                                            videobusterClips: clips(providers: [VIDEOBUSTER]) {
                                                ...TrailerClips
                                                __typename
                                            }
                                            dailymotionClips: clips(providers: [DAILYMOTION]) {
                                                ...TrailerClips
                                                __typename
                                            }
                                            __typename
                                        }
                                        seenState(country: $country) {
                                            progress
                                            __typename
                                        }
                                        watchlistEntry {
                                            createdAt
                                            __typename
                                        }
                                        dislikelistEntry {
                                            createdAt
                                            __typename
                                        }
                                        likelistEntry {
                                            createdAt
                                            __typename
                                        }
                                        similarTitlesV2(
                                            country: $country
                                            allowSponsoredRecommendations: $allowSponsoredRecommendations
                                        ) {
                                            sponsoredAd {
                                                bidId
                                                holdoutGroup
                                                campaign {
                                                    hideRatings
                                                    __typename
                                                }
                                                __typename
                                            }
                                            __typename
                                        }
                                        __typename
                                    }
                                    seenState(country: $country) {
                                        progress
                                        __typename
                                    }
                                    __typename
                                }
                            }
                            __typename
                        }
                    }
                    
                    fragment TrailerClips on Clip {
                        sourceUrl
                        externalId
                        provider
                        name
                        __typename
                    }`
                }),
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
                "body": JSON.stringify({
                    "operationName":"GetSuggestedTitles",
                    "variables":{
                        "country":"US","language":"en","first":4,"filter":{
                            "searchQuery":searchQuery
                        }
                    },
                    "query":`query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
                        popularTitles(country: $country, first: $first, filter: $filter) {
                            edges {
                                node {
                                    ...SuggestedTitle
                                    __typename
                                }
                                __typename
                            }
                            __typename
                        }
                    }
                    
                    fragment SuggestedTitle on MovieOrShow {
                        id
                        objectType
                        objectId
                        content(country: $country, language: $language) {
                            fullPath
                            title
                            originalReleaseYear
                            posterUrl
                            fullPath
                            __typename
                        }
                        __typename
                    }
                `}),
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
    
        let response = await this.search(searchQuery);
        // console.log(util.inspect(response, {depth:null}));
    
        //filter for proper item
        let itemFullPath = this.filterSearchResponse(response, objectType, searchQuery);
        // console.log(itemFullPath);
    
        // get full item details
        const fullTitleDetails = await this.getDetailsByURL(itemFullPath);
        // console.log(util.inspect(fullTitleDetails, {depth:null}));
    
        let justWatchID = fullTitleDetails.data.urlV2.node.id;
        // console.log(justWatchID);
    
        // similar titles
        const similarTitles = await this.getSimilarTitleByJWID(justWatchID);
        // console.log(util.inspect(similarTitles, {depth:null}));

        return await similarTitles;
    };

    close = async () => { await this.browser.close(); }
}

let api = new JustWatchAPI({ 
    puppeteerArgs: [], headless: 'new' 
});
await api.initialize();
let similarTitles = await api.runExampleFlow('Boruto', 'SHOW');
console.log(util.inspect(similarTitles, {depth:null}));

await api.close();