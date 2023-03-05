var { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron')

function createWindow() {
    var screen_size = screen.getPrimaryDisplay().workAreaSize
    const win = new BrowserWindow({
        minWidth: 360,
        minHeight: 600,
        width: 360,
        height: 600,
        x: screen_size.width - 360 - 50,
        y: screen_size.height - 600 - 40,
        webPreferences: {
            preload: __dirname + '/preload.js',
            nodeIntegration: true,
            contextIsolation: true,
            devTools: false,
        },
        autoHideMenuBar: true,
        frame: false,
    })

    win.loadFile(__dirname + '/www/index.html')

    ipcMain.handle('close', function () { return win.close() })


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