[![scrape-html-web](https://i.imgur.com/is50IvG.png)](#)

# scrape-html-web

Extract content from a static HTML website.

> ESM, CJS
> Node >=16

_When you install Scrape HTML Web, no version of Chromium will be downloaded, unlike, for example, Puppeteer.
This makes it a fast and light library._

_Access to all websites is not guaranteed, this may depend on the authorization they have._

_The library is asynchronous._

**Note:**
_two dependencies are included in order to work:_

- [axios](https://www.npmjs.com/package/axios/v/1.6.1) - retrieve the web page
- [cheerio](https://www.npmjs.com/package/cheerio/v/1.0.0-rc.12) - manage content scraping based you have formatted selectors

## Installation

To use Scrape HTML Web in your project, run:

```
npm install scrape-html-web
or
yarn add scrape-html-web
```

## Usage

```javascript
import { scrapeHtmlWeb } from "scrape-html-web";
//or
const { scrapeHtmlWeb } = require("scrape-html-web");

//example
const options = {
  url: "https://nodejs.org/en/blog/",
  bypassCors: true // avoids running errors in esm
  mainSelector: ".blog-index",
  childrenSelector: [
    { key: "date", selector: "time", type: "text" },
    // by default, the first option that is taken into consideration is att
    { key: "version", selector: "a", type: "text" },
    { key: "link", selector: "a", attr: "href" },
  ],
};

(async () => {
  const data = await scrapeHtmlWeb(options);
  console.log(data);
})();
```

## Response

```javascript
//Example response

[
  {
    date: "04 Nov",
    version: "Node v18.12.1 (LTS)",
    link: "/en/blog/release/v18.12.1/",
  },
  {
    date: "04 Nov",
    version: "Node v19.0.1 (Current)",
    link: "/en/blog/release/v19.0.1/",
  },
  ...{
    date: "11 Jan",
    version: "Node v17.3.1 (Current)",
    link: "/en/blog/release/v17.3.1/",
  },
  {
    date: "11 Jan",
    version: "Node v12.22.9 (LTS)",
    link: "/en/blog/release/v12.22.9/",
  },
];
```

## options

- [url](#url) - urls to scraper site web _required_
- [bypassCors](#bypassCors) - Url to bypass cors errors in ESM
- [mainSelector](#mainselector) - indicates the main selector where to start scraping _required_
- [list](#list) - indicates that we need to iterate through a list of elements containing **mainSelector**, default is **True** _not required_
- [childrenSelector](#childrenselector) - is an array made up of parameters to define the object we expect to receive _required_

#### url

```javascript
const options = {
  url: "https://nodejs.org/en/blog/" //url from which you want to extrapolate the data,
  ...
};
```

#### bypassCors

```javascript
const options = {
  bypassCors: {
    customURI: "https://api.allorigins.win/get?url=",
    paramExstract: "contents",
  }, // bypass cors error in ESM
  ...
};
const options = {
  bypassCors: true,
  ...
};
```

You can use the default URL or use a custom one.

1. If you pass a Boolean without specifying anything, the default URL will be used, which is the following: https://api.allorigins.win/get?url=

2. it is also possible to pass a custom URL indicating the following parameters:

   \- **customURI:** Custom URL \*\* _*required*_

   \- **paramExstract:** Any extraction parameter deriving from the call \*\* *\_*not required*\_*

#### mainSelector

```javascript
const options = {
   ...
   mainSelector: ".blog-index" //the parent selector where you want to start from,
   ...
};

//Extract **HTML**:

//example HTML
<ul class="blog-index">
    <li>
      <time datetime="2022-11-04T22:34:29+0000">04 Nov</time>
      <a href="/en/blog/release/v18.12.1/">Node v18.12.1 (LTS)</a>
    </li>
    <li>
      <time datetime="2022-11-04T18:05:19+0000">04 Nov</time>
      <a href="/en/blog/release/v19.0.1/">Node v19.0.1 (Current)</a>
    </li>
</ul>
```

#### list

```javascript
const options = {
  ...
  list: true|false
  // if false it will only loop once over the parent element
  // if true it will loop through all elements below the parent element
  ...
};
```

#### childrenSelector

```javascript
const options = {
  ...
  childrenSelector: [
    { key: "date", selector: "time", type: "text" },
    { key: "version", selector: "a", type: "text" },
    { key: "link", selector: "a", attr: "href" },
  ],
};
```

- **key:** is the name of the key \*\* _required_

- **selector:** is the name of the selector that is searched for in the HTML that is contained by the parent \*\* _required_

- **attr:** indicates what kind of attribute you want to get \*\* _not required_

  > Some of the more common attributes are − [ className, tagName, id, href, title, rel, src, style ]

- **type:** indicates the type of value to be obtained \*\* _not required_ (Default: "Text")

  > possible values: [ **text** , **html** ]

  **_optional_**

- [replace](#replace) - with this parameter it is possible to have text or html inside a selector.
  It is possible to provide it with either a RegExp or a custom function \*\* _not required_

- canBeEmpty: - by default it is set to **false** ( grants the ability to leave the value of an element blank ) \*\* _not required_

  > { key: "title", selector: ".title", type: "text", canBeEmpty: true }, Example response: {title: ''} if text in selector is empty

##### replace

```javascript
const options = {
  url: "https://nodejs.org/en/blog/",
  mainSelector: ".blog-index",
  childrenSelector: [
    {
      key: "date",
      selector: "time",
      type: "text",
      replace: (text) => text + " 2022",
      /* I pass a custom function that adds the
      "2022" test to the date I get from the selector */
    },
    {
      key: "version",
      selector: "a",
      type: "html",
      replace: /[{()}]/g,
      /* I pass a regex to remove
      the round paraesthesia within the html */
    },
    {
      key: "link",
      selector: "a",
      attr: "href",
    },
  ],
};

(async () => {
  const data = await scrapeHtmlWeb(options);

  console.log("example 2 :", data);
})();
//Example response

[
  {
    date: "04 Nov 2022",
    version: '<a href="/en/blog/release/v18.12.1/">Node v18.12.1 LTS</a>',
    link: "/en/blog/release/v18.12.1/",
  },
  {
    date: "04 Nov 2022",
    version: '<a href="/en/blog/release/v19.0.1/">Node v19.0.1 Current</a>',
    link: "/en/blog/release/v19.0.1/",
  },
  ...{
    date: "11 Jan 2022",
    version: '<a href="/en/blog/release/v17.3.1/">Node v17.3.1 Current</a>',
    link: "/en/blog/release/v17.3.1/",
  },
  {
    date: "11 Jan 2022",
    version: '<a href="/en/blog/release/v12.22.9/">Node v12.22.9 LTS</a>',
    link: "/en/blog/release/v12.22.9/",
  },
];
```

#### ❤️ Support

If you make any profit from this or you just want to encourage me, you can offer me a coffee and I'll try to accommodate you.

<a href="https://www.buymeacoffee.com/simoneGatt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png" alt="Buy Me A Coffee"></a>

#### Please note: 🙏

_This library was created for educational purposes and excludes the intention to take information for which authorization to do so is not granted_
