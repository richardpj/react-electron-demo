# React-Electron Boilerplate

## Summary

The aim of this project is to enable electron development utilising create-react-app without ejecting. The advantage of this approach is enabling the use of a modern front-end framework in Electron while preserving the the easy development experience utilising the create-react-app cli and development server including great error reporting, linting, hot-reloading and other great features.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

It can produce web output, binaries and installers using [Electron](https://electronjs.org/).

The build uses [Electron Builder](https://www.electron.build/).

The approach has been adapted from [this article](https://medium.com/@kitze/%EF%B8%8F-from-react-to-an-electron-app-ready-for-production-a0468ecb1da3)

## Table of Contents

- #### [Summary](#summary)
- #### [Steps to Reproduce](#steps-to-reproduce)
  - #### [Prerequisites](#prerequisites)
  - #### [1. Create React App](#1-create-react-app)
  - #### [2. Running the App in Electron](#2-running-the-app-in-electron)
  - #### [3. Enabling Debugging](#3-enabling-debugging)
  - #### [4. Building and Packaging](#4-building-and-packaging)

## Steps to Reproduce

### Prerequisites

This is a fairly difficult setup due to library authors favouring convention without configuration support and neither libary was built to work with the other. As such I'm mentioning the versions of each platform/library that I used here as this may not be identically repeatable. Understanding the changes I've made here will make it easier to adapt in the future.

- [Node](https://nodejs.org/en/) 8.12.0
- [Yarn](https://yarnpkg.com/en/) 1.10.1

The rest of the library/platform versions can be found in the package.json.

### 1. Create React App

First use create-react-app to bootstrap the project.

```sh
yarn create react-app [project]
```
Next recognise that neither react-scripts nor the main react libraries are actually dependencies. They are either used only in the build or packed into the shippable script generated in the build so all can be moved to devDependencies in the package.json. This is important as the electron build will pick up all dependencies and install them in each built artifact. So only runtime dependencies of the nodejs boostrap script should be in dependencies.

### 2. Running the App in Electron

First add a nodejs file to bootstrap the electron app. Add it at:
```sh
/public/electron.js
```
Below are the contents of electron.js:

```js
const { default: electron, app, BrowserWindow } = require('electron');
// Modules to control application life and create native browser window.

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600});

    // and load the index.html of the app.
    const startUrl = 'http://localhost:3000/';

    mainWindow.loadURL(startUrl);
    
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
```
Next install the run script tools as devDependencies.
```sh
yarn add electron concurrently cross-env wait-on --dev
```
Finally modify the package.json to point to the app entry point and create a command line tot run the app.
```json
"main": "public/electron.js",
"scripts": {
  "//...etc": "...",
  "electron": "concurrently \"cross-env BROWSER=none yarn start\" \"wait-on http://localhost:3000 && electron .\""
}
```
Now you can run the app with:
```sh
yarn run electron
```
...and witness the hot-reloading goodness!

### 3. Enabling Debugging

Copy the electron bootstrap file from ```/public``` to ```/src```. The original file will be used to boot the final app. I favour creating a separate bootstrap file for debugging. This approach allows the exclusion of all run/debug tooling from the final build artifact which is preferable imho.

Modify ```public/electron.js``` to refer to the index.html file that will be packed into the final dployment artifact.

```js
const path = require('path');
const url = require('url');
//...
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../build/index.html'),
    protocol: 'file:',
    slashes: true
  }));
```

Modify ```src/electron.js``` to import ```electron-devtools-installer``` and install the React and Redux Devtools.

```js
const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');
//...
  function createWindow() {
    
    mainWindow = new BrowserWindow({width: 900, height: 680});
    mainWindow.loadURL('http://localhost:3000/');
    mainWindow.on('closed', () => mainWindow = null);
//---> INSERT BELOW
  installExtension(REACT_DEVELOPER_TOOLS)
    .then(name => {
        console.log(`Added Extension: ${name}`);
    })
    .catch(err => {
        console.log('An error occurred: ', err);
    });

  installExtension(REDUX_DEVTOOLS)
    .then(name => {
        console.log(`Added Extension: ${name}`);
    })
    .catch(err => {
        console.log('An error occurred: ', err);
    });
//--->
}

```

Additionally you need to modify the paths generated by ```create-react-app```. Currently it generates absolute paths. This is incompatible with react devtools and will cause errors in the packed app. To do this prefix paths with the website name ```'.'``` by adding the below to the ```package.json```.

```json
"homepage": ".",
```
Now you can execute ```yarn run electron``` and show the chrome devtools (using the electron debugger app menus). The React and Redux devtools tabs will now be accesible.

### 4. Building and Packaging

Finally let's add electron-builder to our project and create some binaries and installers.

```sh
yarn add electron-builder --dev
```

Then we need to configure the electron build. By convention additonal build assets (such as desktop icons etc) are meant to be placed in a folder named ```build```. Our react build output is in this folder so we need to tell electron-builder to use another folder (in this case ```assets```). We'll also indicate that the ```build``` folder is the only folder that we want included in the built artifact. To do this we add the following build configuration to the ```package.json```.
```json
"build": {
    "files": [
      "build/**/*"
    ],
    "directories": {
      "buildResources": "assets"
    }
  },
```
Next we need to create npm scripts in the ```package.json``` to run the build for us. Additionally we'll create a pre- script to ensure that the react build runs before the electron packaging.
```json
  "prepack": "yarn run build",
  "pack": "electron-builder build  -w",
```
In this case I'm producing a windows installer (as I'm using windows).

That's all she wrote. Happy hacking...