import * as bootstrap from "bootstrap";
import "maplibre-gl";
import { createChart } from "../lib/Chart.js";
import { LOGO_DEV_KEY, MAPLIBRE_KEY } from "../lib/Environment.js";
import ajax from "../lib/Ajax.js";
import fuzzySearch from "../lib/Search.js";

let Chart, Map, CurrentSymbol, CurrentSuggestion = 0;

document
    .querySelector("a.navbar-brand")
    .addEventListener("click", () => {
        if (!Map?.loaded()) {
            Map?.remove();
        }
        Chart?.destroy();

        document.getElementById("welcomePage").classList.remove("d-none");
        document.getElementById("statContent").classList.add("d-none");
        bootstrap.Dropdown.getOrCreateInstance("#suggestions").hide();
        document.getElementById("search").value = "";
    })

document
    .getElementById("companyName")
    .addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            document.getElementById("saveBtn").click();
        }
    });

document
    .getElementById("saveBtn")
    .addEventListener("click", async function () {
        const Name = document.getElementById("companyName").value;

        if (!Name || Name.length === 0) {
            document.querySelector(".invalid-feedback").style.display = "block";
            return;
        }

        const Reset = () => {
            this.previousElementSibling.style.display = "";
            this.disabled = false;
            this.textContent = "Aggiorna database locale";
            document.getElementById("companyName").value = "";
            document.getElementById("companyDrop").disabled = false;
            document.getElementById("companyDrop").innerHTML = "";
        };

        const ShowAlert = (alert) => {
            document.getElementById(alert).classList.remove("d-none");
            setTimeout(_ => document.getElementById(alert).classList.add("d-none"), 3000);
        }

        document.querySelector(".invalid-feedback").style.display = "none";
        this.previousElementSibling.style.display = "none";
        this.disabled = true;
        this.textContent = "Attendi...";

        const SYMBOL = (await ajax.sendRequest("GET", ajax.AV_URL, { function: "SYMBOL_SEARCH", keywords: Name }).catch(ajax.errore))?.data;
        if (!SYMBOL || !SYMBOL["bestMatches"] || SYMBOL["bestMatches"].length === 0) {
            Reset();
            ShowAlert("errorAlert");
            return;
        }

        document.getElementById("companyList").classList.remove("d-none");

        SYMBOL["bestMatches"].forEach(sy => {
            document.getElementById("companyDrop").innerHTML += `<option data-symbol='${JSON.stringify(sy)}' value=${sy["1. symbol"]}>${sy["2. name"]}</option>`;
        });

        document.getElementById("companyDrop").addEventListener("change", async function () {
            this.disabled = true;
            const SYMB = this.value;

            await delay(1000);

            const WEEKLY = (await ajax.sendRequest("GET", ajax.AV_URL, { function: "TIME_SERIES_WEEKLY", symbol: SYMB }).catch(ajax.errore))?.data;
            if (!WEEKLY || !WEEKLY["Weekly Time Series"] || WEEKLY["Weekly Time Series"].length === 0) {
                Reset();
                ShowAlert("errorAlert");
                return;
            }

            await delay(1000);

            const MONTHLY = (await ajax.sendRequest("GET", ajax.AV_URL, { function: "TIME_SERIES_MONTHLY", symbol: SYMB }).catch(ajax.errore))?.data;
            if (!MONTHLY || !MONTHLY["Monthly Time Series"] || MONTHLY["Monthly Time Series"].length === 0) {
                Reset();
                ShowAlert("errorAlert");
                return;
            }

            await delay(1000);

            const OVERVIEW = (await ajax.sendRequest("GET", ajax.AV_URL, { function: "OVERVIEW", symbol: SYMB }).catch(ajax.errore))?.data;
            if (!OVERVIEW || !OVERVIEW["Symbol"]) {
                Reset();
                ShowAlert("errorAlert");
                return;
            }

            console.log(this.options[this.selectedIndex].dataset.symbol)

            await ajax.sendRequest("POST", getServerURL("SYMBOL_SEARCH"), JSON.parse(this.options[this.selectedIndex].dataset.symbol)).catch(ajax.errore);

            WEEKLY["symbol"] = SYMB;
            await ajax.sendRequest("POST", getServerURL("TIME_SERIES_WEEKLY"), WEEKLY).catch(ajax.errore);

            MONTHLY["symbol"] = SYMB;
            await ajax.sendRequest("POST", getServerURL("TIME_SERIES_MONTHLY"), MONTHLY).catch(ajax.errore);

            await ajax.sendRequest("POST", getServerURL("OVERVIEW"), OVERVIEW).catch(ajax.errore);

            Reset();
            ShowAlert("successAlert");
        })
    });

async function delay(ms) {
    return new Promise((res) => setTimeout(_ => res(), 1000));
}

document
    .querySelector("input[type=search]")
    .addEventListener("input", async function () {
        if (!this.value || this.value.length < 3) {
            bootstrap.Dropdown.getOrCreateInstance("#suggestions").hide();
            return;
        }

        if (this.value.length >= 3) {
            showSuggestions(this.value);
        }

        const Name = this.value;
        const Results = (await ajax.sendRequest("GET", `${getServerURL("SYMBOL_SEARCH")}`, { keywords: Name }).catch(ajax.errore))?.data;

        if (!Results || Results.length === 0) {
            return;
        }

        if ((await fuzzySearch(this.value)).length === 1) {
            displayInfo(Results[0]["1. symbol"], Name);
        }
    });

document
    .getElementById("downloadChart")
    .addEventListener("click", () => {
        const Canvas = document.getElementById("chartCanvas");
        const Download = document.createElement("a");
        Download.href = Canvas.toDataURL();
        Download.download = "";
        Download.click();
        URL.revokeObjectURL(Download.href);
    });

document
    .getElementById('search')
    .addEventListener('keydown', function (e) {
        const Items = document.querySelectorAll('#suggestions .dropdown-item');
        if (CurrentSuggestion === -1) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            CurrentSuggestion = (CurrentSuggestion + 1) % Items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            CurrentSuggestion = (CurrentSuggestion - 1 + Items.length) % Items.length;
        } else if (e.key === 'Enter' && CurrentSuggestion >= 0) {
            e.preventDefault();
            Items[CurrentSuggestion].click();
            return;
        } else {
            return;
        }

        Items.forEach(i => i.classList.remove('active'));
        Items[CurrentSuggestion].classList.add('active');
    });

document
    .getElementsByName("chartOptions")
    .forEach(opt => opt.addEventListener("click", function () {
        if (Chart) {
            Chart.config.type = this.value;
            Chart.update();
        }
    }));

document
    .getElementsByName("timeOptions")
    .forEach(opt => opt.addEventListener("click", async function () {
        if (Chart) {
            const Series = (await ajax.sendRequest("GET", `${getServerURL(`TIME_SERIES_${this.value.toUpperCase()}`)}`, { symbol: CurrentSymbol }).catch(ajax.errore))?.data;
            const Keys = Object.keys(Series[0][`${this.value} Time Series`]).reverse();
            const Values = Object.values(Series[0][`${this.value} Time Series`]).map(stock => stock["1. open"]).reverse();
            Chart.config.data = {
                labels: Keys,
                datasets: [{ data: Values }]
            };
            Chart.update();
        }
    }));

async function showSuggestions(value) {
    document.getElementById("suggestions").innerHTML = "";

    (await fuzzySearch(value))
        .forEach((symbol, i, array) => {
            const Option = document.createElement("li");
            Option.classList.add("dropdown-item", "text-wrap");
            Option.textContent = `${symbol["1. symbol"]} - ${symbol["2. name"]}`;
            Option.addEventListener("click", function () {
                displayInfo(symbol["1. symbol"], symbol["2. name"]);
            });
            document.getElementById("suggestions").append(Option);

            if (i === 0) {
                Option.classList.add("active");
            }

            if (i !== array.length - 1) {
                const Divider = document.createElement("div");
                Divider.classList.add("dropdown-divider");
                document.getElementById("suggestions").append(Divider);
            }

            CurrentSuggestion = 0;
        });

    if (document.getElementById("suggestions").childNodes.length === 0) {
        const Option = document.createElement("li");
        Option.classList.add("dropdown-item", "text-wrap");
        Option.textContent = "Nessuna azienda trovata.";
        document.getElementById("suggestions").append(Option);
        CurrentSuggestion = -1;
    }

    bootstrap.Dropdown.getOrCreateInstance("#suggestions").show();
}

async function displayInfo(Symbol, Name) {
    if (!Map?.loaded()) {
        Map?.remove();
    }
    Chart?.destroy();

    CurrentSymbol = Symbol;

    document.getElementById("welcomePage").classList.add("d-none");
    bootstrap.Dropdown.getOrCreateInstance("#suggestions").hide();
    document.getElementById("search").value = "";
    document.getElementById("companyInfo").innerHTML = "";

    createInfoCard(Symbol);

    const Time = document.querySelector("input[name=timeOptions]:checked").value;
    const Series = (await ajax.sendRequest("GET", `${getServerURL(`TIME_SERIES_${Time.toUpperCase()}`)}`, { symbol: Symbol }).catch(ajax.errore))?.data;

    const Keys = Object.keys(Series[0][`${Time} Time Series`]).reverse();
    const Values = Object.values(Series[0][`${Time} Time Series`]).map(stock => stock["1. open"]).reverse();

    Chart = createChart([`Ultimi stock per ${Name}`, `(Ultimo aggiornamento: ${Series[0]["Meta Data"]["3. Last Refreshed"]})`], "chartCanvas", document.querySelector("input[name=chartOptions]:checked").value, Keys, Values);
    document.getElementById("statContent").classList.remove("d-none");
}

async function createInfoCard(Symbol) {
    const Info = (await ajax.sendRequest("GET", `${getServerURL("OVERVIEW")}`, { Symbol }).catch(ajax.errore))?.data[0];

    if (!Info) {
        alert("Informazioni non trovate sul database.");
        return;
    }

    const Address = (await ajax.sendRequest("GET", `https://api.maptiler.com/geocoding/${encodeURIComponent(Info["Address"])}.json?key=${MAPLIBRE_KEY}`).catch(ajax.errore))?.data;

    const Main = document.getElementById("companyInfo");
    Main.innerHTML = `
        <div class='row align-items-center'>
            <div class='col-md-3 d-flex justify-content-center'>
                <a href='${Info["OfficialSite"]}' title='Sito ufficiale'>
                    <img class='img img-fluid rounded shadow' src='https://img.logo.dev/ticker/${Symbol}?token=${LOGO_DEV_KEY}' alt='${Symbol} Logo'>
                </a>
            </div>
            <div class='col-md-9 d-flex align-items-center'>
                <div class='h-100'>
                    <h3 class='h3 my-2'>
                        ${Info["Name"]} 
                        <button class='bg-transparent border-0 rounded' title='Mostra sulla mappa' data-bs-toggle='modal' data-bs-target="#mapModal">
                            <i class='bi bi-geo-alt'></i>
                        </button>
                    </h3>
                    <p class='my-2'>${Info["Description"]}</p>
                </div>
            </div>
        </div>
        <div class="modal fade" id="mapModal" tabindex="-1" aria-label="Map modal" aria-hidden="true" data-bs-theme="dark">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content border-0 p-0">
                    <div class="modal-header border-0 pb-0">
                        <div>${Address.features[0]["place_name"]}</div>
                        <button type="button" class="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-3">
                        <div id="map" class='rounded' style="height:520px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document
        .getElementById("mapModal")
        .addEventListener("shown.bs.modal", () => {
            Map = new maplibregl.Map({
                container: "map",
                center: Address.features[0].center,
                zoom: 13,
                interactive: false,
                style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPLIBRE_KEY}`
            });

            new maplibregl.Marker({
                draggable: false,
                anchor: "center"
            })
                .setPopup(new maplibregl.Popup().setHTML(`<span class='text-black'>Sede ${Info["Name"]}</span>`))
                .setLngLat(Address.features[0].center)
                .addTo(Map);
        }, { once: true });
}

export function getServerURL(func) {
    return `${ajax.JS_URL}/${func}`;
}