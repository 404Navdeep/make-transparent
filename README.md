# Make Transparent!
A small TypeScript tool that takes images from a Pinterest board, downloads them, and removes their backgrounds using a Replicate-compatible background-removal API.
---
## Usage
### Requirements 
- NodeJS installed
- NPM installed
- A Pinterest account cookies (only for private boards)
- A Hack Club AI/ Replicate API key
### Installation
We are officially of npm registory!! (Make Transparen)[https://www.npmjs.com/package/make-transparent]

1. Run: ``npm i -g make-trasparent`` to install Make Transparent Globaly
2. Run: ``npx playwright install chromium`` to install the chromium browser for playwright.
4. Get ur api key from: ai.hackclub.com btw (really cool free ai)
   The background remover uses `lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1` through the Hack Club Replicate proxy.

> Your API key is saved locally at:
> Windows:
> ``%USERPROFILE%\make-transparent\config.json``
> Linux/macOS:
> ``~/make-transparent/config.json``

5. Then run ``make-transparent -- "https://www.pinterest.com/USERNAME/BOARD"`` to run.
---
## Features
- Extracts all images from pinterest boards.
- Removes bg from them
- Vola u have them ready for stickers
---
## Output
Processed images are saved in ``og/`` and ``tp/`` folders.
- ``og/`` contains the orginal downloaded images
- ``tp/`` contains the images with thier backgrounds removed
## Conclusion
This thing was made to help me in my smol school stickers buisness that runs my canteen needs so yeah. I get orders of stickers mainly from pinterest and stickers mostly so making this gets the individual downloading and removing bg hassle out of the way. This was also made as a example project for ShipSmol!