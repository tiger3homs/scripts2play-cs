function players_list_close() {
    var server_players_list = $("#server_players_list");
    var refresh_button = $("#server_players_list .refresh");
    server_players_list.css({ display: "none" });
    var spinner = refresh_button.children(".fa-spinner")
    var refresh = refresh_button.children(".fa-refresh")
    refresh.css({ display: "inline-block" });
    spinner.css({ display: "none" });
}

function bans_list_close() {
    var server_bans_list = $("#server_bans_list");
    var refresh_button = $("#server_bans_list .refresh");
    server_bans_list.css({ display: "none" });
    var spinner = refresh_button.children(".fa-spinner")
    var refresh = refresh_button.children(".fa-refresh")
    refresh.css({ display: "inline-block" });
    spinner.css({ display: "none" });
}

$(function(){
    $("#my-servers-form").submit(function () {
        var btn = $("#my-servers-form .save-btn3");
        var span = $("span", btn);

        btn.prop("disabled", true);
        $.post("/api?action=rentServer", $(this).serialize(), function (resp) {
            btn.prop("disabled", false);
            try{
                if(resp.data.ok){

                    if(resp.data.gameLinks){
                        $.each(resp.data.gameLinks, function (id, link) {
                            var a = ("#my-server-" + id + " a");
                            console.log(a);
                            a = $(a);

                            a.attr({
                                href: link
                            }).text(link);
                        });
                    }

                    span
                        .text("Saved!")
                        .css({
                            color: "black"
                        });
                    setTimeout(function () {
                        span
                            .text("Save")
                            .css({
                                color: "black"
                            });
                    }, 1500);
                    return;
                }
            }catch (e) {}
            alert("Error");
        });
        return false;
    });

    $("#new-server-form").submit(function (){


        $.post("/api?action=buyServer", $(this).serialize(), function (resp) {
            if(resp.data.ok){
                window.location.reload();
            }
            if (resp.data.err == 'NO_ENOUGH_GOLD') {
                window.location.href = "/gold";
            }
        });

        return false;
    });

    $("#server_players_list .close").click(function () {
        players_list_close();
    });

    $("#server_players_list .refresh").click(function () {
        server_players_list_refresh();
    });

    $("#server_bans_list .close").click(function () {
        bans_list_close();
    });

    $("#server_bans_list .refresh").click(function () {
        server_bans_list_refresh();
    });
    initServerManagerEnhancements();
});

function server_players_list_refresh() {
    var server_players_list = $("#server_players_list");
    var room_id = server_players_list.children("#room_id");
    var room_port = server_players_list.children("#port");
    var spinner = $(this).children(".fa-spinner")
    var refresh = $(this).children(".fa-refresh")
    spinner.css({ display: "inline-block" });
    refresh.css({ display: "none" });
    server_players(room_id.text(), room_port.text(), 1);
}

function server_bans_list_refresh() {
    var server_bans_list = $("#server_bans_list");
    var room_id = server_bans_list.children("#room_id");
    var room_port = server_bans_list.children("#port");
    var spinner = $(this).children(".fa-spinner")
    var refresh = $(this).children(".fa-refresh")
    spinner.css({ display: "inline-block" });
    refresh.css({ display: "none" });
    server_bans(room_id.text(), room_port.text(), 1);
}

function admin_delete(id, room_id) {
    var admins_list = $("#server_admins_"+room_id+" .admins_list");
    admins_list.text('');
    admins_list.attr("class", "fa fa-spinner fa-pulse");
    var admins_message = $("#admins_message_"+room_id);
    $.post("/api?action=rentServerAdminsManage", {method: 'admin_delete', server: room_id, admin: id}, function (resp) {
        if(resp.data.ok){
            $.each(resp.data.admins, function(index, value) {
                var div = $("<div>");
                div.text('#'+value.id+' '+value.name+' ');
                var a = $("<a>");
                a.attr("class", "admin_delete");
                a.attr("onclick", "admin_delete("+value.id+", "+room_id+")");
                a.text("(delete)");
                var br = $("<br>");
                a.append(br);
                div.append(a);
                admins_list.append(div);
            });
            var message = $("#my-servers-tab #server_owner_messages #"+resp.data.ok).text();
            admins_message.text(message);
            admins_message.css({ color: "#b0fb52" });
        }
        if(resp.data.err){
            var message = $("#my-servers-tab #server_owner_messages #"+resp.data.err).text();
            admins_message.text(message);
            admins_message.css({ color: "#ff8181" });
        }
        admins_list.attr("class", "admins_list");
    });
}

function admin_add(room_id) {
    var admin_id_input = $("#admin_id_"+room_id);
    var admin_id = admin_id_input.val();
    admin_id_input.val('');
    if (admin_id) {
        admin_id = admin_id.replace(/#/g, '') * 1;
        var admins_list = $("#server_admins_"+room_id+" .admins_list");
        admins_list.text('');
        admins_list.attr("class", "fa fa-spinner fa-pulse");
        var admins_message = $("#admins_message_"+room_id);
        $.post("/api?action=rentServerAdminsManage", {method: 'admin_add', server: room_id, admin: admin_id}, function (resp) {
            if(resp.data.ok) {
                var message = $("#my-servers-tab #server_owner_messages #"+resp.data.ok).text();
                admins_message.text(message);
                admins_message.css({ color: "#b0fb52" });
            }
            if(resp.data.err) {
                var message = $("#my-servers-tab #server_owner_messages #"+resp.data.err).text();
                admins_message.text(message);
                admins_message.css({ color: "#ff8181" });
            }
            if (resp.data.admins) {
                $.each(resp.data.admins, function(index, value) {
                    var div = $("<div>");
                    div.text('#'+value.id+' '+value.name+' ');
                    var a = $("<a>");
                    a.attr("class", "admin_delete");
                    a.attr("onclick", "admin_delete("+value.id+", "+room_id+")");
                    a.text("(delete)");
                    var br = $("<br>");
                    a.append(br);
                    div.append(a);
                    admins_list.append(div);
                });
            }
            admins_list.attr("class", "admins_list");
        });
    }
}

function initServerManagerEnhancements() {
    var table = document.querySelector('#my-servers-form table');
    if (!table) {
        return;
    }

    var serverGroups = buildServerGroups(table);
    setupCollapsibleSections(serverGroups);
    setupMapSelection(serverGroups);
    setupModePresets(serverGroups);
}

function buildServerGroups(table) {
    var groups = [];
    var headers = table.querySelectorAll('tr.myserver');

    Array.prototype.forEach.call(headers, function (headerRow) {
        var serverId = headerRow.dataset.server;
        if (!serverId) {
            return;
        }

        var detailRows = [];
        var pointer = headerRow.nextElementSibling;

        while (pointer && !pointer.classList.contains('myserver')) {
            detailRows.push(pointer);
            pointer = pointer.nextElementSibling;
        }

        groups.push({
            id: serverId,
            header: headerRow,
            details: detailRows
        });
    });

    return groups;
}

function setupCollapsibleSections(groups) {
    var storageKey = 'pcs-myservers-collapsed';
    var storedState = {};

    try {
        var raw = localStorage.getItem(storageKey);
        if (raw) {
            storedState = JSON.parse(raw);
        }
    } catch (err) {
        storedState = {};
    }

    groups.forEach(function (group) {
        if (!group.details.length) {
            return;
        }

        group.details.forEach(function (row) {
            row.classList.add('myserver-details');
        });

        var toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'myserver-toggle-btn';
        toggleButton.innerHTML = '<span class="myserver-collapse-icon" aria-hidden="true">▾</span>';
        toggleButton.setAttribute('aria-label', 'Toggle server details');

        var statusCell = group.header.cells[0];
        statusCell.insertBefore(toggleButton, statusCell.firstChild);

        var isCollapsed = Boolean(storedState[group.id]);
        applyCollapsedState(group, toggleButton, isCollapsed);

        toggleButton.addEventListener('click', function (event) {
            event.preventDefault();
            isCollapsed = !isCollapsed;
            storedState[group.id] = isCollapsed;
            if (!isCollapsed) {
                delete storedState[group.id];
            }
            saveCollapseState(storageKey, storedState);
            applyCollapsedState(group, toggleButton, isCollapsed);
        });
    });
}

function applyCollapsedState(group, toggleButton, isCollapsed) {
    group.header.classList.toggle('myserver-row--collapsed', isCollapsed);
    toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
    group.details.forEach(function (row) {
        row.classList.toggle('myserver-details--hidden', isCollapsed);
    });
}

function saveCollapseState(storageKey, state) {
    var entries = Object.keys(state).filter(function (key) {
        return state[key];
    });

    if (!entries.length) {
        localStorage.removeItem(storageKey);
        return;
    }

    var payload = {};
    entries.forEach(function (key) {
        payload[key] = true;
    });

    try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {}
}

function setupMapSelection(groups) {
    groups.forEach(function (group) {
        var mapSelect = group.header.querySelector('select[name="server[' + group.id + '][map]"]');
        if (!mapSelect || mapSelect.dataset.enhanced === 'true') {
            return;
        }

        mapSelect.dataset.enhanced = 'true';

        var wrapper = document.createElement('div');
        wrapper.className = 'map-search-wrapper';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'map-search-input';
        input.placeholder = 'Search maps...';

        var dropdown = document.createElement('div');
        dropdown.className = 'map-search-dropdown';

        var options = [];
        for (var index = 0; index < mapSelect.options.length; index++) {
            (function () {
                var option = mapSelect.options[index];
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'map-search-option';
                button.textContent = option.textContent.trim();
                button.dataset.value = option.value || option.textContent.trim();

                button.addEventListener('click', function () {
                    mapSelect.value = option.value;
                    triggerSyntheticEvent(mapSelect, 'change');
                    input.value = option.textContent.trim();
                    closeDropdown();
                });

                dropdown.appendChild(button);
                options.push(button);
            })();
        }

        var parent = mapSelect.parentNode;
        parent.insertBefore(wrapper, mapSelect);
        wrapper.appendChild(input);
        wrapper.appendChild(dropdown);
        wrapper.appendChild(mapSelect);
        mapSelect.classList.add('map-search-select-hidden');

        function syncFromSelect() {
            var selected = mapSelect.options[mapSelect.selectedIndex];
            input.value = selected ? selected.textContent.trim() : '';
        }

        function openDropdown() {
            dropdown.classList.add('open');
        }

        function closeDropdown() {
            dropdown.classList.remove('open');
        }

        input.addEventListener('focus', function () {
            openDropdown();
        });

        input.addEventListener('input', function () {
            var query = input.value.trim().toLowerCase();
            options.forEach(function (button) {
                var match = button.textContent.toLowerCase().indexOf(query) !== -1;
                button.classList.toggle('hidden', !match);
            });
        });

        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                var currentValue = input.value.trim().toLowerCase();
                var firstVisible = null;
                for (var i = 0; i < options.length; i++) {
                    var button = options[i];
                    if (button.classList.contains('hidden')) {
                        continue;
                    }
                    if (!firstVisible) {
                        firstVisible = button;
                    }
                    if (button.textContent.toLowerCase() === currentValue) {
                        firstVisible = button;
                        break;
                    }
                }
                if (firstVisible) {
                    firstVisible.click();
                } else {
                    closeDropdown();
                }
            } else if (event.key === 'Escape') {
                closeDropdown();
                input.blur();
            }
        });

        input.addEventListener('blur', function () {
            setTimeout(closeDropdown, 120);
        });

        mapSelect.addEventListener('change', syncFromSelect);
        syncFromSelect();
    });
}

function setupModePresets(groups) {
    var MODE_PRESETS = [
        {
            key: 'public',
            label: 'Public',
            checkboxes: {
                enabled: true,
                public: true,
                mp_clanwar: true,
                amx_giveammo: true,
                mp_friendlyfire: false,
                mp_autoteambalance: true,
                mp_afkbomb: true,
                afk_kick: true,
                perks: true,
                statistics: true,
                chickens: true,
                rnd_death: true,
                votekick: true,
                bonus_slot: true,
                tfb: true,
                statsx: true,
                dib3: true,
                rwd_grenadedrop: true
            },
            cvars: {
                mp_rs_rounds: '200',
                pb_maxbots: '6',
                minimal_skill: '0',
                ping_limit: '1000',
                mp_roundtime: '1.75',
                mp_buytime: '0.25',
                mp_c4timer: '35',
                mp_freezetime: '0',
                mp_startmoney: '16000',
                csem_sank_cd: '300',
                limit_hegren: '1',
                limit_sgren: '1',
                limit_flash: '2'
            }
        },
        {
            key: 'competitive',
            label: '5v5',
            checkboxes: {
                enabled: true,
                public: false,
                mp_clanwar: true,
                nobombscore_enabled: true,
                bonus_slot: true,
                mp_friendlyfire: true,
                rwd_grenadedrop: true
            },
            cvars: {
                mp_rs_rounds: '25',
                pb_maxbots: '0',
                minimal_skill: '0',
                ping_limit: '1000',
                mp_roundtime: '1.75',
                mp_buytime: '0.25',
                mp_c4timer: '35',
                mp_freezetime: '15',
                mp_startmoney: '800',
                csem_sank_cd: '300',
                limit_hegren: '1',
                limit_sgren: '1',
                limit_flash: '2'
            }
        },
        {
            key: 'deathmatch',
            label: 'Deathmatch',
            checkboxes: {
                enabled: true,
                public: true,
                mp_friendlyfire: true,
                mp_autoteambalance: true,
                mp_afkbomb: true,
                afk_kick: true,
                statistics: true,
                votekick: true,
                bonus_slot: true,
                tfb: true,
                statsx: true,
                dib3: false,
                rwd_grenadedrop: true
            },
            cvars: {
                mp_rs_rounds: '200',
                pb_maxbots: '6',
                minimal_skill: '0',
                ping_limit: '1000',
                mp_roundtime: '2.5',
                mp_buytime: '0.5',
                mp_c4timer: '35',
                mp_freezetime: '0',
                mp_startmoney: '1000',
                csem_sank_cd: '300',
                limit_hegren: '1',
                limit_sgren: '1',
                limit_flash: '2'
            }
        }
    ];

    groups.forEach(function (group) {
        var cvarsCell = group.details.reduce(function (acc, row) {
            return acc || row.querySelector('.my-server-cvars');
        }, null);

        if (!cvarsCell) {
            return;
        }

        var container = document.createElement('div');
        container.className = 'mode-presets';

        var label = document.createElement('span');
        label.className = 'mode-presets__label';
        label.textContent = 'Mode presets:';
        container.appendChild(label);

        MODE_PRESETS.forEach(function (preset) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'mode-presets__button';
            button.textContent = preset.label;

            button.addEventListener('click', function () {
                applyModePreset(group.id, preset, button);
            });

            container.appendChild(button);
        });

        cvarsCell.insertBefore(container, cvarsCell.firstChild);
    });
}

function applyModePreset(serverId, preset, triggerButton) {
    if (preset.checkboxes) {
        Object.keys(preset.checkboxes).forEach(function (name) {
            var selector;
            if (name === 'enabled' || name === 'public') {
                selector = 'input[name="server[' + serverId + '][' + name + ']"]';
            } else {
                selector = 'input[name="server[' + serverId + '][cvars][' + name + ']"]';
            }

            var checkbox = document.querySelector(selector);
            if (checkbox) {
                checkbox.checked = Boolean(preset.checkboxes[name]);
                triggerSyntheticEvent(checkbox, 'change');
            }
        });
    }

    if (preset.cvars) {
        Object.keys(preset.cvars).forEach(function (name) {
            var select = document.querySelector('select[name="server[' + serverId + '][cvars][' + name + ']"]');
            if (select) {
                select.value = preset.cvars[name];
                triggerSyntheticEvent(select, 'change');
                return;
            }

            var input = document.querySelector('input[name="server[' + serverId + '][cvars][' + name + ']"]');
            if (input) {
                input.value = preset.cvars[name];
                triggerSyntheticEvent(input, 'input');
            }
        });
    }

    if (triggerButton) {
        triggerButton.classList.add('mode-presets__button--applied');
        setTimeout(function () {
            triggerButton.classList.remove('mode-presets__button--applied');
        }, 1200);
    }
}

function triggerSyntheticEvent(element, eventName) {
    if (!element) {
        return;
    }

    var event;
    if (typeof Event === 'function') {
        event = new Event(eventName, { bubbles: true });
    } else {
        event = document.createEvent('Event');
        event.initEvent(eventName, true, true);
    }

    element.dispatchEvent(event);
}

function pin_add(room_id) {
    var pin_input = $("#pin_"+room_id);
    var pin = pin_input.val();
    pin_input.val('');
    if (pin) {
        var add_spinner = $("#pin_add_spinner_"+room_id);
        var add_check = $("#pin_add_check_"+room_id);
        add_spinner.css({ display: "inline-block" });
        $.post("/api?action=rentServerPinManage", {method: 'pin_add', server: room_id, pin: pin}, function (resp) {
            if(resp.data.ok){
                pin_input.val(resp.data.ok);
                add_spinner.css({ display: "none" });
                add_check.css({ display: "inline-block" });
                setTimeout(function () {
                    add_check.css({ display: "none" });
                }, 5000);
            }
        });
    }
}

function pin_delete(room_id) {
    var pin_input = $("#pin_"+room_id);
    var pin = pin_input.val();
    pin_input.val('');
    var delete_spinner = $("#pin_delete_spinner_"+room_id);
    var delete_check = $("#pin_delete_check_"+room_id);
    delete_spinner.css({ display: "inline-block" });
    $.post("/api?action=rentServerPinManage", {method: 'pin_delete', server: room_id}, function (resp) {
        if(resp.data.ok){
            delete_spinner.css({ display: "none" });
            delete_check.css({ display: "inline-block" });
            setTimeout(function () {
                delete_check.css({ display: "none" });
            }, 5000);
        }
    });
}

function server_reboot(event, server_id) {
    var element = $(event);
    var spinner = element.children(".fa-spinner");
    var check = element.children(".fa-check");
    spinner.css({ display: "inline-block" });
    $.post("/api?action=serverReboot", { server_id: server_id }, function (resp) {
        if(resp.data.ok){
            check.css({ color: "green", display: "inline-block" });
            spinner.css({ display: "none" });
            setTimeout(function () {
                check.css({ display: "none" });
            }, 5000);
        }
        if(resp.data.err){
            alert(resp.data.err);
        }
    });
}

function restart_round(event, server_id) {
    var element = $(event);
    var spinner = element.children(".fa-spinner");
    var check = element.children(".fa-check");
    spinner.css({ display: "inline-block" });
    $.post("/api?action=restartRound", { server_id: server_id }, function (resp) {
        if(resp.data.ok){
            check.css({ color: "green", display: "inline-block" });
            spinner.css({ display: "none" });
            setTimeout(function () {
                check.css({ display: "none" });
            }, 5000);
        }
        if(resp.data.err){
            alert(resp.data.err);
        }
    });
}

function server_players(server_id, server_port, event = 0) {
    var server_players_list = $("#server_players_list");
    var port = server_players_list.children("#port");
    var room_id = server_players_list.children("#room_id");
    var players_list = server_players_list.children(".players_list");
    var no_players = server_players_list.children(".no_players");
    var refresh_button = $("#server_players_list .refresh");
    var spinner = refresh_button.children(".fa-spinner")
    var refresh = refresh_button.children(".fa-refresh")
    no_players.css({ display: "none" });
    players_list.html('<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>');

    $.get("/api?action=getRentServerOnline&port=" + server_port, function (resp) {
        if (resp.data){
            players_list.html(null);
            room_id.text(server_id);
            port.text(server_port);
            if (Object.keys(resp.data).length == 0) {
                no_players.css({ display: "inline-block" });
            } else {
                var players_list_html = "";
                $.each(resp.data, function(index, value) {
                    players_list_html += '[' + value.rank + '] ' + value.player_name + '&nbsp;';
                    if (value.country != 'xx') {
                        players_list_html += '<span class="flag-icon flag-icon-' + value.country + '" style="margin-right: 3px;" alt="' + value.country + '" title="' + value.country + '"></span>';
                    }
                    players_list_html += '<a class="server_player_action" alt="Kick and ban for 15 minutes" title="Kick and ban for 15 minutes" \
                    onclick="server_player_kick('+ server_id +', \'' + value.player_id + '\', \'' + value.player_name + '\')">kick</a>';
                    players_list_html += ' | ';
                    players_list_html += '<a class="server_player_action" alt="Kick and permanent ban" title="Kick and permanent ban" \
                    onclick="server_player_ban('+ server_id +', \'' + value.player_id + '\', \'' + value.player_name + '\')">ban</a>';
                    players_list_html += '<br>';
                });
                players_list.html(players_list_html);
            }
            spinner.css({ display: "none" });
            refresh.css({ display: "inline-block" });
        }
    });

    if (event == 0 && (room_id.text() == server_id || room_id.text() == '')) {
        if (server_players_list.is(':hidden')) {
            server_players_list.css({ display: "inline-block" });
            bans_list_close();
        } else {
            players_list_close();
        }
    }
}

function server_bans(server_id, server_port, event = 0) {
    var server_bans_list = $("#server_bans_list");
    var port = server_bans_list.children("#port");
    var room_id = server_bans_list.children("#room_id");
    var players_list = server_bans_list.children(".players_list");
    var no_players = server_bans_list.children(".no_players");
    var refresh_button = $("#server_bans_list .refresh");
    var spinner = refresh_button.children(".fa-spinner")
    var refresh = refresh_button.children(".fa-refresh")
    no_players.css({ display: "none" });
    players_list.html('<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>');
    $.get("/api?action=getServerBansRent&port=" + server_port, { server_id: server_id }, function (resp) {
        if (resp.data){
            players_list.html(null);
            room_id.text(server_id);
            port.text(server_port);
            if (Object.keys(resp.data).length == 0) {
                no_players.css({ display: "inline-block" });
            } else {
                var players_list_html = "";
                $.each(resp.data, function(xash_id, data) {
                    players_list_html += '<a href=/rating/search/'+xash_id+' target=_BLANK>' + data['nickname'] + '</a> - ' + data['until'] + ' | <a class="unban_player_action" onclick="server_player_unban('+ server_id +', \'' + xash_id + '\')">unban</a><br>';
                });
                players_list.html(players_list_html);
            }
            spinner.css({ display: "none" });
            refresh.css({ display: "inline-block" });
        }
    });

    if (event == 0 && (room_id.text() == server_id || room_id.text() == '')) {
        if (server_bans_list.is(':hidden')) {
            server_bans_list.css({ display: "inline-block" });
            players_list_close();
        } else {
            bans_list_close();
        }
    }
}

function server_player_kick(server_id, player_id, nickname) {
    $.post("/api?action=rentPlayerKick", { server: server_id, player_id: player_id, nickname: nickname }, function (resp) {
        if (resp.data.ok){
            server_players_list_refresh();
        }
    });
}

function server_player_ban(server_id, player_id, nickname) {
    $.post("/api?action=rentPlayerBan", { server: server_id, player_id: player_id, nickname: nickname }, function (resp) {
        if (resp){
            server_players_list_refresh();
        }
    });
}

function server_player_unban(server_id, player_id) {
    $.post("/api?action=rentPlayerUnban", { server: server_id, player_id: player_id }, function (resp) {
        if (resp.data.ok){
            server_bans_list_refresh();
        }
    });
}

function prolongServer(server) {
    $.post("/api?action=prolongServer", {server: server}, function (resp) {
        if(resp.data.ok){
            window.location.reload();
        }
        if(resp.data.err){
            if (resp.data.err == 'NO_ENOUGH_GOLD') {
                window.location.href = "/gold";
            } else {
                alert(resp.data.err);
            }
        }
    });
    return false;
}

function promoteServer(server, time) {
    $.post("/api?action=promoteServer", {server: server, time: time}, function (resp) {
        if(resp.data.ok){
            window.location.reload();
        }
        if(resp.data.err){
            if (resp.data.err == 'NO_ENOUGH_GOLD') {
                window.location.href = "/gold";
            } else if (resp.data.err == 'NO_SERVER_TIME') {
                alert('Server rent time is less than requested promote time!');
            } else {
                alert(resp.data.err);
            }
        }
    });
    return false;
}
