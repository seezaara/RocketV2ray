
//======================================== debug 
// var debugconfig = get_config()
// // ======================================== update database for old versions app 
// if (typeof debugconfig[0] == "object") {
//     var newconfig = {}
//     for (const i in debugconfig) {
//         newconfig[i] = JSON.stringify(core.tools.url2config({ data: debugconfig[i] }))
//     }
//     localStorage.setItem("configs", JSON.stringify(newconfig))
// }
//========================================================================
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

async function add_config(a, must = false, issub) {
    try {
        if (a.trim()[0] == "{" && must) {
            var config = core.tools.url2config({ config: JSON.parse(a) })
            if (!config)
                return log(lang.m1)
            add_config_storage(config)
        } else if (a.includes("://")) {
            for (var url of a.trim().split("\n")) {
                url = url.trim()
                if (url != "") {
                    if (must && (url.startsWith("http://") || url.startsWith("https://"))) {
                        await add_subscription_storage(url.trim())
                    } else {
                        var config = core.tools.url2config({ url: url.trim() })
                        if (!config)
                            return log(lang.m1)
                        add_config_storage(config, issub)
                    }
                }
            }
        } else {
            return log(lang.m1)
        }
    } catch (error) {
        console.log(error)
        log(lang.m1)
        return false
    }
    return true
}
async function add_subscription_storage(url) {
    var subscriptions = get_subscription()
    var key = Object.keys(subscriptions)
    var values = Object.values(subscriptions)
    if (!values.includes(url)) {
        key = ((+key[key.length - 1]) + 1) || 0
        subscriptions[key] = url
        localStorage.setItem("subscriptions", JSON.stringify(subscriptions))
    }
    await refresh_subscription()
}
function remove_subscription(i) {
    var subscriptions = get_subscription()
    delete subscriptions[i]
    localStorage.setItem("subscriptions", JSON.stringify(subscriptions))
}

function get_subscription() {
    try {
        return JSON.parse(localStorage.getItem("subscriptions") || "{}")
    } catch (error) {
        log(lang.m2)
        localStorage.setItem("subscriptions", "{}")
        return get_subscription()
    }
}

async function refresh_subscription() {
    var configs = utils.get_config()
    for (const i in configs) {
        if (i.slice(-1) == "s") {
            delete configs[i]
        }
    }
    localStorage.setItem("configs", JSON.stringify(configs))
    var subscriptions = get_subscription()
    var all = []
    var count = 0
    for (const i in subscriptions) {
        const item = subscriptions[i]
        all.push(fetch(item).then(async function (data) {
            if (data.status == 200) {
                count++
                return add_config(await data.text(), false, true)
            }
        }).catch(function () {
            log(lang.m12)
        }))
    }
    await Promise.all(all)
    return count
}


//================================================================

function add_config_storage(config, sub) {
    var configs = get_config()
    var key = Object.keys(configs)
    key = (parseInt(key[key.length - 1]) + 1) || 0
    configs[key + (sub ? "s" : "n")] = JSON.stringify(config)
    localStorage.setItem("configs", JSON.stringify(configs))
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

function config_share(ind, code) {
    var config = get_config()[ind]
    if (code)
        return config
    else
        return core.tools.config2url(JSON.parse(config))
}
// =============================================
function start(cb) {
    try {
        var config = get_config()[config_index()]
        if (!config) {
            cb(true)
            return log(lang.m5)
        }
        core.start(JSON.parse(config), function (e) {
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
    refresh_subscription,
    remove_subscription,
    get_subscription,
    add_config,
    get_config,
    get_data_format: core.tools.config2url,
    remove_config,
    config_index,
    config_share,
    init: core.init,
    start,
    stop: core.stop,
    log,
    reload
}