
window.$ = function (a) {
    return document.querySelector(a)
}

!function () {
    if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(ready, 1);
    else document.addEventListener("DOMContentLoaded", ready);

    function ready() {
        var style = `
        .dark-overlay {
            width: 100%;
            height: 100%;
            background: #0000004d;
            left: 0;
            top: 0;
            position: fixed;
            z-index: 99;
        }

        .modal {
            min-width: 30px;
            left: 50%;
            top: 50%;
            /* margin: 73px auto; */
            transform: translate(-50%, -50%);
            position: absolute;
            background: rgba(170, 170, 170, .88);
            border-radius: 10px;
            overflow: hidden;
            z-index: 100;
        }`;
        document.body.insertAdjacentHTML("beforeend", '<style>' + style + '</style>')
    }
    var dialog_func;
    window.dialog_close = function (...a) {
        document.querySelector(".dark-overlay").remove()
        document.querySelector(".modal").remove()
    }
    window.dialog_call = function (...a) {
        if (a[0] instanceof Event) {
            a = [this, document.querySelector(".modal"), a[0]]
        }
        if (dialog_func)
            dialog_func(...a);
    }
    window.dialog = function (e, f) {
        var element
        if (e instanceof HTMLElement) {
            element = e
            e = ''
        }
        dialog_func = f
        document.body.insertAdjacentHTML("beforeend", '<div class="dark-overlay"></div><div class="modal">' + e + '</div >')
        var dialog = document.body.lastElementChild
        if (element)
            dialog.appendChild(element)
        if (dialog.querySelector("[dialog_close]") != null) {
            dialog.querySelectorAll("[dialog_close]").forEach(function (item) { item.addEventListener(item.getAttribute("dialog_close") || "click", dialog_close); /*item.removeAttribute("dialog_close")*/ })
        }
        if (dialog.querySelector("[dialog_call]") != null) {
            dialog.querySelectorAll("[dialog_call]").forEach(function (item) { item.addEventListener(item.getAttribute("dialog_call") || "click", dialog_call); /*item.removeAttribute("dialog_call")*/ })
        }
        return dialog;
    }

}();


!function () {
    var childs = [];
    var parent;
    if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(ready, 1);
    else document.addEventListener("DOMContentLoaded", ready);

    function ready() {
        var style = `
.pcmess {
	pointer-events: none;
	height: auto;
	display: block !important;
    position: fixed;
    bottom: 0;
    width:100%; 
    z-index: 1000000000;  
} 
.cmess {    
    pointer-events: none;
    width: fit-content;
    border-radius: 20px;
    background: rgba(170, 170, 170, .88);
    opacity: 0;
    max-width: 90%;
    padding: 4px 6px; 
    transition: opacity 200ms;
    font-size: 14px;
    position: relative;
    bottom: 40px;
    flex-flow: row;
    display: flex;
    z-index: 1000000;  
    margin: auto;
    margin-bottom: 12px;
}

.cmess .cmess-icon {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 26px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased; 
    padding: 0 2px; 
}
 
.cmess .cmess-content {
    display:flex;
    align-items:center;
    text-align:center;
    padding: 0 6px;
	flex: 1;
	line-height: 1.7;
    z-index: 1000000;  
}
`
        document.body.insertAdjacentHTML("beforeend", '<style>' + style + '</style><div class="pcmess"></div>')
        parent = document.body.lastElementChild
    }
    window.mess = function (e, icon = "error") {
        parent.insertAdjacentHTML("beforeend", '<div class="cmess" dir="auto"></div>')
        var element = parent.lastElementChild
        childs.push(element);
        element.innerHTML = '<span class="cmess-content">' + e + '</span><span class="cmess-icon">' + icon + '</span>'
        element.style.opacity = "1";
        setTimeout(messClose, 1500 + (e.length * 60));
    }
    function messClose() {
        var element = childs.shift()
        element.style.opacity = "0";
        setTimeout(function () {
            element.remove();
        }, 400);
    }
}()

function add_config(a) {
    try {
        if (a.trim()[0] == "{") {
            var config = core.c2v.c2v(JSON.parse(a), false)
            if (!config)
                return log(lang.m1)
        } else if (a.slice(0, 8) == "vmess://") {
            var config = core.v2c.parse(a)
            if (!config)
                return log(lang.m1)
        } else {
            return log(lang.m1)
        }
    } catch (error) {
        console.log(error)
        return log(lang.m1)
    }
    var configs = get_config()
    var key = Object.keys(configs)
    key = ((+key[key.length - 1]) + 1) || 0
    configs[key] = config
    localStorage.setItem("configs", JSON.stringify(configs))
    log(lang.m3, "done")
}
function remove_config(i) {
    var configs = get_config()
    delete configs[i]
    localStorage.setItem("configs", JSON.stringify(configs))
}

function get_config() {
    try {
        return JSON.parse(localStorage.getItem("configs") || "{}")
    } catch (error) {
        log(lang.m2)
        localStorage.setItem("configs", "{}")
        return get_config()
    }
}
function config_index(ind) {
    if (ind != undefined) {
        localStorage.setItem("config_index", ind)
    } else {
        return localStorage.getItem("config_index") || 0
    }
}
function config_share(ind) {
    var config = get_config()[ind]
    return core.c2v.stringify(config)
}
// =============================================
function start(cb) {
    try {
        var data = get_config()[config_index()]
        if (!data) {
            cb(true)
            return log(lang.m5)
        }
        core.start(core.c2v.stringify(data), function (e) {
            if (e)
                log(lang.m4)
            cb(e)
        })
    } catch (error) {
        log(e)
    }
}

function reload() {
    window.location.reload()
}
function log(a, b) {
    mess(a, b)
}
var utils = {
    add_config,
    get_config,
    remove_config,
    config_index,
    config_share,
    init: core.init,
    start,
    stop: core.stop,
    log,
    reload
}