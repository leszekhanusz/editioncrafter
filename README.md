[![DOI](https://zenodo.org/badge/574677398.svg)](https://zenodo.org/badge/latestdoi/574677398)

# EditionCrafter

> **This is a fork of [EditionCrafter](https://github.com/cu-mkp/editioncrafter)**, published on npm as [`@leszekhanusz/editioncrafter`](https://www.npmjs.com/package/@leszekhanusz/editioncrafter). It follows the upstream project and adds the improvements listed below. Its versions are upstream's with a `-media.N` suffix: `1.3.1-media.3` is upstream `1.3.1` with this fork's changes up to its third release.

EditionCrafter is an easy-to-use tool for scholars, educators, and research institutions to publish digital editions in a low-cost and sustainable manner. It can be included in a React app or a HTML website. Please see the [EditionCrafter User's Guide](https://editioncrafter.org/guide/) for installation instructions and documentation. 

## Improvements over upstream EditionCrafter

### 1.3.1-media.10

- **Paragraph spacing**: paragraphs (`tei-p`) no longer have a 1em margin above and below them; projects space them in their own stylesheet if they want to.
- **Notes above the menus**: an open note (the `role="tooltip"` box an asterisk opens) has a `z-index` of 10, so it is drawn over the page's menus instead of under them.

### 1.3.1-media.9

- **Taller pictures**: a figure or music notation picture in the transcription may now be up to 720 pixels high, instead of 360, so a tall picture is no longer shrunk to a thumbnail.

### 1.3.1-media.8

- **Music notation**: a TEI `<notatedMusic>` with a `<graphic>` is shown in the transcription as its picture, centred like a figure, its `<desc>` as the picture's alternative text and caption. It keeps a `tei-notatedmusic` element around it for stylesheets to select. Its picture can be a part of the page cut out by an IIIF image server (`…/x,y,w,h/500,/0/default.jpg`).
- **Additions**: only an addition with `place="above"` is drawn raised and smaller; one written overleaf, in a space or at the end of the line stays on the line, at its size. All additions stay blue.
- **Page selector**: on an empty page (no transcription) the page selector sits at the same height as on a page of text, under the toolbar rather than behind it.

### 1.3.1-media.7

- **Linked elements**: the highlight is subtler, the linked elements simply drawn a little darker, with no background or outline.
- **Page selector**: the empty space above the page selector of a transcription is gone.

### 1.3.1-media.6

- **Linked elements**: hovering an element whose `target` points into the document — a `<metamark target="#add1">`, say — highlights the element it points at, and hovering that element highlights what points at it. Targets may be written `#id` or as a bare id; URLs are ignored. The highlighted elements carry the class `link-highlight`, which a site can restyle.
- **Arrow keys**: ← and → turn the page, as the toolbar arrows do, in the pane the pointer was last over (or the first pane showing a page); with the views linked, the other pane follows. The keys keep their own meaning in text fields, open menus and the image viewer.

### 1.3.1-media.5

- **Help menu**: the Reading Guide is the project's, not EditionCrafter's: a project gives it through the new `readingGuide` prop, as examples written with the same `tei-*` elements as its transcriptions, so they are shown with the project's own stylesheet (a note becomes the same clickable marker as in the text). Without the prop, the menu shows the toolbar buttons only.
- **Help menu**: the toolbar buttons are shown with the icons the toolbar uses, icons and descriptions in two aligned columns; the half-hidden close button is gone, and the menu closes on Escape, on a click outside it, or when the focus moves elsewhere. Clicks inside it, such as on a note, no longer close it.

### 1.3.1-media.4

- **Glossary terms in the text**: in every transcription, a word or phrase that the glossary knows — as a headword or an alternate spelling, whatever its case — can be hovered (or focused with the keyboard) to show its part of speech and meaning in a tooltip, kept within the window. The word is wrapped in a `span.glossary-term` holding a `span.glossary-tooltip` (with `.glossary-tooltip-headword`, `.glossary-tooltip-meaning` and `.glossary-tooltip-pos` inside), so a site can restyle both; by default the word has a dotted underline. Text inside notes is left alone.

### 1.3.1-media.3

- **Glossary**: a heading for each letter of the alphabet, whatever letter the glossary starts with and whether or not its headwords are capitalised (headwords are sorted, accents and case aside).
- **Glossary**: the "Go to" letters scroll to their heading; letters no entry starts with are greyed out, and the alphabet includes W, X and Y.
- **Glossary**: the resource list stays in the toolbar while the glossary is shown, so the reader can go back to a transcription without the browser's Back button.

### 1.3.1-media.2

- **Faster page turns**: all the files of a page are fetched at once; the text is shown without waiting for the image server; pages already loaded are not fetched again; and the previous and next pages are loaded in the background. Turning a page of a three-layer edition went from about 1.3 s to about 60 ms.

### 1.3.1-media.1

- **Video and audio**: a TEI `<media>` element with a `url` is shown where it stands in the transcription as a small button with a film icon (a speaker for an `audio/*` `mimeType`). Clicking it opens the media as a block, with the browser's own controls (fullscreen included) and the element's `<desc>` under it; clicking again closes it and pauses playback.

### Development

- `sass` and `eslint-plugin-react-refresh` are declared as dev dependencies, so a fresh `npm ci` can build the package and run ESLint.
- ESLint leaves the generated sample editions in `static/` alone.

## EditionCrafter in a React App

If you are including EditionCrafter in a React app, add this module to your project:

```
npm add @leszekhanusz/editioncrafter
```

and import it under that name:

```jsx
import EditionCrafter from '@leszekhanusz/editioncrafter'
```

A project that already uses upstream EditionCrafter can switch to this fork without changing its imports, by installing it under the upstream name:

```
npm add @cu-mkp/editioncrafter@npm:@leszekhanusz/editioncrafter
```

The reference section below details all of the props of the EditionCrafter component. Here is an example of use:

```jsx
import EditionCrafter from '@leszekhanusz/editioncrafter'

<EditionCrafter
  documentName='BnF Ms. Fr. 640'
  transcriptionTypes={{
    tc: 'Diplomatic (FR)',
    tcn: 'Normalized (FR)',
    tl: 'Translation (EN)'
  }}
  iiifManifest='https://cu-mkp.github.io/editioncrafter-data/fr640_3r-3v-example/iiif/manifest.json'
  glossaryURL='https://cu-mkp.github.io/editioncrafter-data/fr640_3r-3v-example/glossary.json'
/>
```

## EditionCrafter in an HTML Website

> **Note:** this fork publishes the React component only. The `@cu-mkp/editioncrafter-umd` script below is upstream's, so an HTML page that loads it does not get this fork's improvements; use the React component, for example in an Astro site, to get them.

To include EditionCrafter in your HTML website, you need to create a `div` somewhere on your page, assign it an ID and then pass that ID to EditionCrafter. The reference section details the options for EditionCrafter, which are otherwise the same as the React component. Here is an example of use:

```html
 <div id="ec"></div>

 <script type="text/javascript" src="https://www.unpkg.com/@cu-mkp/editioncrafter-umd" ></script>

 <script type="text/javascript">

     EditionCrafter.viewer({
         id: 'ec',
         documentName: 'BnF Ms. Fr. 640',
         iiifManifest: 'https://cu-mkp.github.io/editioncrafter-data/fr640_3r-3v-example/iiif/manifest.json',
         glossaryURL: 'https://cu-mkp.github.io/editioncrafter-data/fr640_3r-3v-example/glossary.json',
         transcriptionTypes: {
           tc: 'Diplomatic (FR)',
           tcn: 'Normalized (FR)',
           tl: 'Translation (EN)'
         }
     });

 </script>
```

## Structure of this repository

There are two apps in this repo. `editioncrafter` is a React component, while `editioncrafter-umd` wraps the React component into a UMD module for use on non-React pages.

## Storybook

For local development, you can use the Storybook component.

Setup for Storybook was kind of rushed and the process could still be made simpler.

1. Clone the [`edition-crafter-cli`](https://github.com/cu-mkp/editioncrafter-cli) repository if you haven't already, do the usual `npm install`, and run `npm start` to launch a server with a test document.
2. Back here in `editioncrafter`, run `npm run storybook` to launch Storybook. You'll see a component called EditionCrafter in the sidebar, and it should be all set to try.

By default, Storybook doesn't display the hash routing params used by `react-router`. You can use the "Open canvas in new tab" button on the top right to open the component in its own tab:

![screenshot of new tab button](newtab.png)

## Releasing a new version

1. Bump the version in `editioncrafter/package.json` (and its `package-lock.json`) to the next `-media.N`.
2. Add the release's changes to the [list of improvements](#improvements-over-upstream-editioncrafter) above.
3. From `editioncrafter/`, run `npm publish --tag latest`. It builds the package first; a version with a `-media.N` suffix is a pre-release for npm, which therefore asks for the tag explicitly.
4. A newly published version can take a few minutes before npm serves it.

The GitHub workflow that publishes on a release is upstream's: it publishes the `@cu-mkp` packages and is not used by this fork.
