# ide-ai-assistant
The example of how to build the Theia-based applications with the ide-ai-assistant.
# License Header
/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 ********************************************************************************/

## Getting started

Please install all necessary [prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites).

To install and build the extensions and apps use the command 

    yarn

For the Backend to work a API KEY to OpenAI needs to be provided.
This can be done by creating a file `backend/secrets.env` as this is ignored by git, then set `API_KEY = [YOUR KEY]`.

There are several ways to start the program. 

## Running the browser app with plugins
If you want to run the Theia browser app with the plugins and the backend, we recommend using 

    yarn start 

or 
    
launching with the vscode configuration `Theia IDE` and starting the backend workspace seperatly
Vscode will also automatically launch chrome.

## Running the browser example

    yarn start:browser

*or:*

    cd browser-app
    yarn start

*or:* launch `IDE (Backend)` configuration from VS code.

Open http://localhost:3000 in the browser.

## Running the Electron example

    yarn build:electron
    yarn start:electron

*or:*

    yarn build:electron
    cd electron-app
    yarn start

*or:* launch `Start Electron Backend` configuration from VS code.


## Running the tests

    yarn test

*or* run the tests of a specific package with

    cd [workspace you want to test]
    yarn test


## Developing with the browser example

Start watching all packages, including `browser-app`, of your application with

    yarn watch

*or* watch only specific packages with

    cd ide-ai-assistant
    yarn watch

and the browser example.

    cd browser-app
    yarn watch

Run the example as [described above](#Running-the-browser-example)
## Developing with the Electron example

Start watching all packages, including `electron-app`, of your application with

    yarn watch

*or* watch only specific packages with

    cd ide-ai-assistant
    yarn watch

and the Electron example.

    cd electron-app
    yarn watch

Run the example as [described above](#Running-the-Electron-example)

## Publishing ide-ai-assistant

Create a npm user and login to the npm registry, [more on npm publishing](https://docs.npmjs.com/getting-started/publishing-npm-packages).

    npm login

Publish packages with lerna to update versions properly across local packages, [more on publishing with lerna](https://github.com/lerna/lerna#publish).

    npx lerna publish
