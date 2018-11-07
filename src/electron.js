const { default: electron, app, BrowserWindow } = require('electron');
const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');

const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({width: 900, height: 680});
  mainWindow.loadURL('http://localhost:3000/');
  mainWindow.on('closed', () => mainWindow = null);

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


}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});