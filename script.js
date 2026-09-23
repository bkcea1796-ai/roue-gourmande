(function () {
    "use strict";
    var STORAGE_KEY = "roue_gourmande_v1";

    var slices = [
        { type: "lose", label: "Pas de chance", weight: 9, color: "#8a6a52" },
        {
            type: "win", label: "5 lancers francs", weight: 12, color: "#1f9d8a",
            reward: "Réussissez 5 lancers francs consécutifs pour obtenir 200 FCFA de réduction."
        },
        { type: "lose", label: "Pas de chance", weight: 9, color: "#8a6a52" },
        {
            type: "win", label: "Pierre-feuille-ciseaux", weight: 12, color: "#c9456b",
            reward: "Affrontez le gérant en 3 manches : victoire = 100 FCFA de réduction."
        },
        { type: "lose", label: "Pas de chance", weight: 9, color: "#8a6a52" },
        {
            type: "win", label: "Jeu des ballons", weight: 12, color: "#6b4a8a",
            reward: "Présentez-vous au stand pour tenter le jeu des ballons et remporter un encas."
        },
        { type: "lose", label: "Pas de chance", weight: 9, color: "#8a6a52" },
        {
            type: "win", label: "Pile ou face", weight: 12, color: "#1f9d8a",
            reward: "Devinez juste : 100 FCFA de réduction à la clé."
        },
        { type: "lose", label: "Pas de chance", weight: 9, color: "#8a6a52" },
        {
            type: "jackpot", label: "Crêpe gratuite", weight: 7, color: "#e8b74d",
            reward: "Une crêpe offerte, sans condition, par le stand."
        }
    ];

    var n = slices.length;
    var segAngle = 360 / n;

    // build conic-gradient background
    var stops = [];
    for (var i = 0; i < n; i++) {
        stops.push(slices[i].color + " " + (i * segAngle) + "deg " + ((i + 1) * segAngle) + "deg");
    }
    document.getElementById("wheel").style.background = "conic-gradient(" + stops.join(",") + ")";

    // build labels
    var labelsHost = document.getElementById("wheelLabels");
    for (var j = 0; j < n; j++) {
        var el = document.createElement("div");
        el.className = "seg-label";
        var angle = j * segAngle + segAngle / 2;
        var radius = 32;
        var radians = (angle - 90) * Math.PI / 180;
        var x = 50 + Math.cos(radians) * radius;
        var y = 50 + Math.sin(radians) * radius;
        el.style.left = x + "%";
        el.style.top = y + "%";
        el.style.transform = "translate(-50%, -50%) rotate(" + (angle + 90) + "deg)";
        el.textContent = slices[j].label;
        labelsHost.appendChild(el);
    }

    // unbiased weighted pick via cumulative distribution
    function weightedPick(list) {
        var total = 0;
        for (var k = 0; k < list.length; k++) total += list[k].weight;
        var r = Math.random() * total;
        for (var m = 0; m < list.length; m++) {
            if (r < list[m].weight) return m;
            r -= list[m].weight;
        }
        return list.length - 1; // safety net against float rounding
    }

    function show(id) {
        ["screen-locked", "screen-rules", "screen-wheel", "screen-result"].forEach(function (s) {
            document.getElementById(s).classList.toggle("hidden", s !== id);
        });
    }

    function renderResult(slice) {
        var emoji = document.getElementById("resEmoji");
        var title = document.getElementById("resTitle");
        var body = document.getElementById("resBody");
        var flag = document.getElementById("resFlag");

        if (slice.type === "lose") {
            emoji.textContent = "😔";
            title.textContent = "Pas de chance cette fois-ci";
            body.textContent = "Merci d'avoir tenté votre chance ! Vous repartez sans lot, mais avec de bonnes crêpes en poche.";
            flag.textContent = "Un seul tour est autorisé par personne.";
        } else if (slice.type === "jackpot") {
            emoji.textContent = "🎉";
            title.textContent = "Jackpot : " + slice.label + " !";
            body.textContent = slice.reward;
            flag.textContent = "Présentez cet écran au gérant du stand pour récupérer votre gain.";
        } else {
            emoji.textContent = "🏆";
            title.textContent = "Gagné : " + slice.label;
            body.textContent = slice.reward;
            flag.textContent = "Présentez cet écran au gérant du stand pour jouer votre mini-jeu.";
        }
    }

    function lockAndSave(slice) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                label: slice.type === "lose" ? "Pas de chance" : slice.label,
                type: slice.type,
                date: new Date().toISOString()
            }));
        } catch (e) { /* storage unavailable — result still shown for this session */ }
    }

    function spin() {
        var btn = document.getElementById("spinBtn");
        btn.disabled = true;

        var idx = weightedPick(slices);
        var center = idx * segAngle + segAngle / 2;
        var margin = Math.max(2, segAngle * 0.2);
        var jitter = (Math.random() * (segAngle - margin * 2)) - (segAngle - margin * 2) / 2;
        var extraSpins = 6;
        var rotation = extraSpins * 360 + ((360 - center) % 360) + jitter;

        var wheel = document.getElementById("wheel");
        wheel.style.transform = "rotate(" + rotation + "deg)";

        setTimeout(function () {
            var slice = slices[idx];
            lockAndSave(slice);
            renderResult(slice);
            show("screen-result");
        }, 4300);
    }

    document.getElementById("startBtn").addEventListener("click", function () {
        show("screen-wheel");
    });
    document.getElementById("spinBtn").addEventListener("click", spin);

    // on load: check if this device already played
    (function init() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                var data = JSON.parse(saved);
                document.getElementById("lockedText").textContent =
                    "Résultat obtenu : " + data.label + ".";
                show("screen-locked");
                return;
            }
        } catch (e) { /* if storage fails, fall through to rules screen */ }
        show("screen-rules");
    })();
})();