var { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron')

function createWindow() {
    var screen_size = screen.getPrimaryDisplay().workAreaSize
    const win = new BrowserWindow({
        minWidth: 380,
        minHeight: 640,
        width: 380,
        height: 640,
        x: screen_size.width - 380 - 40,
        y: screen_size.height - 640 - 30,
        webPreferences: {
            preload: __dirname + '/preload.js',
            nodeIntegration: true, 
            devTools: !__dirname.includes("app.asar"),
        },
        autoHideMenuBar: true,
        frame: false,
    })

    win.loadFile(__dirname + '/www/index.html')

    ipcMain.handle('close', function () { return win.close() })
    ipcMain.handle('version', function () { return app.getVersion() })


    trayvar = new Tray(__dirname + '/www/icon.ico')
    var contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', click: function () { app.isQuiting = true; app.quit(); } }
    ]);
    trayvar.on('click', function () { win.show(); });
    trayvar.setContextMenu(contextMenu)
    win.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();
        }
    });
    app.on('second-instance', (e, s) => {
        if (win)
            win.show()
    })
}

if (!app.requestSingleInstanceLock()) {
    return app.quit()
}


// close all program when window closed
app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});
// for Boost animation
app.disableHardwareAcceleration();

app.whenReady().then(createWindow)