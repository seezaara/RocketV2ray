!function () {

    try {
        var userdata = JSON.parse(localStorage.getItem("userdata") || '')
        utils.init({
            handle: userdata.handle.split("\n"),
            bypass: userdata.bypass.split("\n"),
            dns: userdata.dns.split(","),
            host: userdata.socks5.split(":")[0],
            port: userdata.socks5.split(":")[1],
            vpn: userdata.mode,
        })
    } catch (e) {
        var userdata = { "language": "fa", "dns": "1.1.1.1,8.8.8.8", "socks5": "127.0.0.1:58694", "handle": "0.0.0.0/0", "bypass": "10.0.0.0/8\n172.16.0.0/16\n192.168.0.0/16", "mode": "on", "site": "on" }
        localStorage.setItem("userdata", JSON.stringify(userdata))
    }
    setlanguage(userdata.language)

    var button_parent = $(".button_parent")



    load()
    function load() {
        var configs = utils.get_config()
        var ind = utils.config_index()
        var lists = ""
        for (const i in configs) {
            var config = utils.get_data_format(JSON.parse(configs[i]), false) 
            lists +=
                `<div class="item ${i.slice(-2, -1) == "s" ? "sub" : ""} ${i.slice(-1) == "c" ? "cus" : ""} ${ind == i ? "active" : ""}" data-ind="${i}">
            <div class="item-color"></div>
            <div class="item-sub icon"></div>
            <div class="item-cus icon"></div>
            <div class="item-title fillf">
                <div class="title-name">${config.ps}</div>
                <div class="title-ip">${config.add}:${config.port}</div>
            </div>
            <div class="item-share icon"></div> 
            <div class="item-code icon"></div> 
            <div class="item-delete icon"></div>
        </div>`
        }
        $(".list").innerHTML = lists

    }
    api("version").then(function (e) {
        $(".version").innerHTML = "V" + e
        $(".version").addEventListener("click", function () {
            openExternal("https://github.com/seezaara/RocketV2ray/releases")
        })
    })
    $(".refresh").addEventListener("click", async function () {
        if (cannot()) {
            return utils.log(lang.m11)
        }
        if (await utils.refresh_subscription()) {
            log(lang.m3, "done")
        }
        load()
    })

    $(".add").addEventListener("click", async function () {
        const text = clipboard.readText()
        if (await utils.add_config(text, true)) {
            log(lang.m3, "done")
        }
        load()
    })

    $(".list").addEventListener("click", function (event) {
        var ind = event.target.closest(".item")
        if (!ind)
            return
        ind = ind.getAttribute("data-ind")
        if (event.target.closest(".item-delete") && utils.config_index() != ind) {
            utils.remove_config(ind)
            load()
        }
        if (event.target.closest(".item-title")) {
            if (cannot()) {
                return utils.log(lang.m11)
            }
            utils.config_index(ind)
            load()
        }
        if (event.target.closest(".item-share")) {
            const text = utils.config_share(ind, false)
            clipboard.writeText(text)
            utils.log(lang.m7, "done")
        }
        if (event.target.closest(".item-code")) {
            const text = utils.config_share(ind, true)
            clipboard.writeText(text)
            utils.log(lang.m7, "done")
        }
    })

    $(".test").innerHTML = lang.m8

    function cannot() {
        return button_parent.classList.contains("wait") || button_parent.classList.contains("active")
    }

    $(".test").addEventListener("click", test)
    var hasdelay
    function test() {
        $(".test").innerHTML = lang.m10
        ping(function (e, p) {
            if (e) {
                $(".test").innerHTML = e
            } else {
                $(".test").innerHTML = lang.m9 + p + "ms"
            }
        })
        if (hasdelay) {
            clearTimeout(hasdelay)
            hasdelay = undefined
        }
        hasdelay = setTimeout(() => {
            $(".test").innerHTML = lang.m8
            hasdelay = undefined
        }, 15000);
    }

    $(".close").addEventListener("click", function () {
        api("close")
    })
    $(".power").addEventListener("click", function () {
        if (button_parent.classList.contains("wait")) {
            return utils.log(lang.m6)
        }
        button_parent.classList.add("wait")
        if (button_parent.classList.contains("active")) {
            utils.stop(function (e) {
                button_parent.classList.remove("wait")
                if (!e) {
                    button_parent.classList.remove("active")
                }
            })
        } else {
            utils.start(function (e) {
                button_parent.classList.remove("wait")
                if (!e) {
                    button_parent.classList.add("active")
                    test()
                    if (userdata.site) {
                        setTimeout(() => {
                            openExternal("https://youtu.be/oLKcXNZdG2M");
                        }, 3000);
                    }
                }
            })
        }
    })
    // ==================================================
    function subs_list() {
        var subs = utils.get_subscription()
        var lists = ""
        for (const i in subs) {
            lists +=
                `<div class="item" data-ind="${i}">
                    <div class="item-title fillf">
                        <div class="title-name">${subs[i]}</div> 
                    </div>
                    <div class="item-delete icon" onclick="dialog_call(this)"></div>
                </div>`
        }
        return lists
    }
    $(".subscription").addEventListener("click", function () {
        const lists = subs_list()
        var p =
            `<div style="width: 340px;">
            <style>
                .modal {
                    background-color: var(--dialog) !important;
                }
        
                .modal .material-icons {
                    color: var(--icon);
                }
    
                .modal {
                    color: var(--text);
                }
    
                .modal [dialog_close] {
                    background-color: transparent;
                }
     
            </style>
            <div style="width: 30px;height: 30px;padding: 3px;margin: 15px;">
                <span class="material-icons" dialog_close="">close</span>
            </div>
            <div class="erorrmessage"></div>
            <div class="list fillf" style="margin: 15px; height:400px">${lists}</div>
        </div> `

        dialog(p, function (e) {
            const item = e.parentNode
            const list = item.parentNode
            var ind = e.parentNode.getAttribute("data-ind")
            remove_subscription(ind)
            list.innerHTML = subs_list()
        })
    })
    $(".setting").addEventListener("click", function () {
        var langs = ''
        for (var i of languages) {
            langs += '<option value="' + i + '"  ' + (userdata.language == i ? "selected" : '') + '>' + i + '</option>'
        }
        var p =
            `<div style="width: 340px;">
            <style>
                .modal {
                    background-color: var(--dialog) !important;
                }
    
                .modal .title {
                    color: var(--icon);
                    width: 45px;
                    height: 20px;
                    font-size: 19px
                }
    
                .modal td *:first-child {
                    vertical-align: middle;
                }
    
                .modal .material-icons {
                    color: var(--icon);
                }
    
                .modal {
                    color: var(--text);
                }
    
                .modal [dialog_close] {
                    background-color: transparent;
                }
    
                .modal input[type="text"],
                .modal select {
                    height: 35px;
                    width: 95%;
                    background-color: var(--item);
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    padding: 4px 8px;
                    color: var(--text);  
                    box-sizing: border-box;
                }
    
                .modal textarea {
                    width: 95%;
                    background-color: var(--item);
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    padding: 4px 8px;
                    color: var(--text);
                    box-sizing: border-box;
                }
    
                .modal input[type="submit"] ,
                .modal input[type="button"],
                .modal button {
                    cursor: pointer;
                    width: 100%;
                    padding: 5px;
                    background-color: var(--item);
                    border: none;
                    border-radius: 5px;
                    font-size: 20px;
                    color: var(--text);
                }
     
    
                /* // ===========================================switch */
    
                input[type="checkbox"][switch] {
                    position: relative;
                    display: inline-block;
                    appearance: none;
                    margin: 0;
                    padding: 0;
                    width: 3em;
                    height: 1.7em;
                    border-radius: 2em;
                    cursor: pointer;
                    background-color: var(--item);
                    -webkit-transition: .4s;
                    transition: .4s;
                }
    
                input[type="checkbox"][switch]:checked {
                    background-color: var(--active);
                }
                input[type="checkbox"][switch]:checked:before {
                    background-color: white;
                }
    
                input[type="checkbox"][switch]:before {
                    border-radius: 50%;
                    position: absolute;
                    content: "";
                    height: 1.3em;
                    width: 1.3em;
                    left: .2em;
                    bottom: .2em;
                    background-color: var(--icon);
                    -webkit-transition: .1s;
                    transition: .1s;
                }
    
                input[type="checkbox"][switch]:checked:before {
                    -webkit-transform: translateX(1.3em);
                    -ms-transform: translateX(1.3em);
                    transform: translateX(1.3em);
                }
            </style>
            <div style="width: 30px;height: 30px;padding: 3px;margin: 15px;">
                <span class="material-icons" dialog_close="">close</span>
            </div>
            <div class="erorrmessage"></div>
            <div style="margin: 15px;">
                <form action="" dialog_call="submit">
                    <table>
                        <tr>
                            <td class="title">language</td>
                            <td>
                                <select name="language">
                                ${langs}
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td class="title">DNS</td>
                            <td>
                                <input type="text" placeholder="display name" name="dns" value="${userdata.dns}">
                            </td>
                        </tr>
                        <tr>
                            <td class="title">socks5</td>
                            <td>
                                <input type="text" placeholder="display name" name="socks5" value="${userdata.socks5}">
                            </td>
                        </tr>
                        <tr>
                            <td class="title">handle</td>
                            <td>
                                <textarea name="handle" id="" style=" resize: none;height:84px;">${userdata.handle}</textarea>
                            </td>
                        </tr>
                        <tr>
                            <td class="title">bypass</td>
                            <td>
                                <textarea name="bypass" id="" style=" resize: none;height:84px;">${userdata.bypass}</textarea>
                            </td>
                        </tr>

                        <tr>
                            <td><input style="font-size: 13px;" switch type="checkbox" name="mode" ${userdata.mode ? "checked" : ''}>
                            </td>
                            <td>
                                <label for="">
                                    vpn mode
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <td><input style="font-size: 13px;" switch type="checkbox" name="site" ${userdata.site ? "checked" : ''}>
                            </td>
                            <td>
                                <label for="">
                                    show YouTube video after connected
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <br>
                                <div class="alignv"><input type="button" value="reset setting" dialog_call="click"></div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2"> 
                                <div class="alignv"><input type="submit" value="save"></div>
                            </td>
                        </tr>
                    </table>
                </form>
            </div>
        </div> `

        dialog(p, function (e) {
            event.preventDefault();
            if (cannot()) {
                return utils.log(lang.m11)
            }
            if (e.value == "reset setting") {
                localStorage.removeItem("userdata")
            } else {
                var data = new FormData(e)
                var object = {};
                data.forEach((value, key) => {
                    if (key.substring(key.length - 2) == '[]') {
                        key = key.substring(0, key.length - 2)
                        if (!Array.isArray(object[key])) {
                            object[key] = [value];
                            return
                        }
                        object[key].push(value)
                        return;
                    }
                    object[key] = value;
                });
                dialog_close()
                localStorage.setItem("userdata", JSON.stringify(object))
            }
            utils.reload()
        })
    })
}()