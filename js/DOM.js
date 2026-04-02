import * as bootstrap from "bootstrap";
import "maplibre-gl";
import { createChart } from "../lib/Chart.js";
import { LOGO_DEV_KEY, MAPLIBRE_KEY } from "../lib/Environment.js";
import ajax from "../lib/Ajax.js";

let Chart, Map;

document
    .querySelector("button.navbar-toggler")
    .addEventListener("click", () => bootstrap.Dropdown.getOrCreateInstance("#suggestions").hide());

document
    .querySelectorAll("a.nav-link")
    .forEach(btn => {
        btn
            .addEventListener("click", function () {
                const SIBLING = document.querySelector("a.nav-link.active");
                this.classList.add("active", "pe-none");
                this.parentElement.classList.add("border-secondary");
                SIBLING.classList.remove("active", "pe-none");
                SIBLING.parentElement.classList.remove("border-secondary");

                if (this.textContent.includes("JSON")) {
                    document.querySelector(".navbar-toggler-icon").style.backgroundImage = "url('./assets/logo/json-logo.png')";
                }
                else {
                    document.querySelector(".navbar-toggler-icon").style.backgroundImage = "url('./assets/logo/av-logo.png')";
                }
            })
    });

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

        if (Results.length === 0) {
            document.getElementById("statContent").classList.add("d-none");
            document.getElementById("welcomePage").classList.remove("d-none");
            Map?.remove();
            Chart?.destroy();
            return;
        }

        if (Results["Information"]) {
            if (document.querySelector("button.navbar-toggler").style.pointerEvents != "none") {
                alert("Limite di AlphaVantage raggiunto.");
                document.querySelector("a.nav-link.active").remove();
                document.querySelector("a.nav-link").classList.add("active");
                document.getElementById("navContent").remove();
                document.querySelector("button.navbar-toggler").style.pointerEvents = "none";
                document.querySelector(".navbar-toggler-icon").style.backgroundImage = "url('./assets/logo/json-logo.png')";
            }
            return;
        }

        displayInfo(Results[0] ? Results[0]["1. symbol"] : Results["bestMatches"][0]["1. symbol"], Name);
    });

async function showSuggestions(value) {
    document.getElementById("suggestions").innerHTML = "";

    (await ajax.sendRequest("GET", `${getServerURL("SYMBOL_SEARCH")}`).catch(ajax.errore))?.data
        .filter(symbol => symbol["2. name"].includes(value) || symbol["1. symbol"].includes(value))
        .forEach((symbol, i, array) => {
            const Option = document.createElement("li");
            Option.classList.add("dropdown-item", "text-wrap");
            Option.textContent = `${symbol["1. symbol"]} - ${symbol["2. name"]}`;
            Option.addEventListener("click", function () {
                displayInfo(symbol["1. symbol"], symbol["2. name"]);
            });
            document.getElementById("suggestions").append(Option);

            if (i !== array.length - 1) {
                const Divider = document.createElement("div");
                Divider.classList.add("dropdown-divider");
                document.getElementById("suggestions").append(Divider);
            }
        });

    if (document.getElementById("suggestions").childNodes.length === 0) {
        const Option = document.createElement("li");
        Option.classList.add("dropdown-item", "text-wrap");
        Option.textContent = "Nessuna azienda trovata.";
        document.getElementById("suggestions").append(Option);
    }

    bootstrap.Dropdown.getOrCreateInstance("#suggestions").show();
}

async function displayInfo(Symbol, Name) {
    document.getElementById("welcomePage").classList.add("d-none");
    bootstrap.Dropdown.getOrCreateInstance("#suggestions").hide();
    document.getElementById("search").value = "";

    createInfoCard(Symbol);

    const Series = (await ajax.sendRequest("GET", `${getServerURL("TIME_SERIES")}`, { symbol: Symbol }).catch(ajax.errore))?.data;

    const Keys = Object.keys(Series[0]["Monthly Time Series"] || Series["Weekly Time Series"]).reverse();
    const Values = Object.values(Series[0]["Monthly Time Series"] || Series["Weekly Time Series"]).map(stock => stock["1. open"]).reverse();

    Chart = createChart([`Ultimi stock per ${Name}`, `(Ultimo aggiornamento: ${Series[0]["Meta Data"]["3. Last Refreshed"] || Series["Meta Data"]["3. Last Refreshed"]})`], "chartCanvas", "line", Keys, Values);
    document.getElementById("statContent").classList.remove("d-none");
}

async function createInfoCard(Symbol) {
    const Info = (await ajax.sendRequest("GET", `${getServerURL("OVERVIEW")}`, { Symbol }).catch(ajax.errore))?.data[0];
    const Address = (await ajax.sendRequest("GET", `https://api.maptiler.com/geocoding/${encodeURIComponent(Info["Address"])}.json?key=${MAPLIBRE_KEY}`).catch(ajax.errore))?.data;

    const Main = document.getElementById("companyInfo");
    Main.innerHTML = `
        <div class='row align-items-center'>
            <div class='col-md-3 d-flex justify-content-center'>
                <a href='${Info["OfficialSite"]}' title='Sito ufficiale'>
                    <img class='img img-fluid rounded' src='https://img.logo.dev/ticker/${Symbol}?token=${LOGO_DEV_KEY}' alt='${Symbol} Logo'>
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

    document.getElementById("mapModal").addEventListener("shown.bs.modal", () => {
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

document.getElementById("downloadChart").addEventListener("click", () => {
    const Canvas = document.getElementById("chartCanvas");
    const Download = document.createElement("a");
    Download.href = Canvas.toDataURL();
    Download.download = "";
    Download.click();
    URL.revokeObjectURL(Download.href);
});

export function getServerURL(func) {
    const isLocal = document.querySelector("a.nav-link.active").textContent.includes("JSON");
    let locFunc = func;

    if (func === "TIME_SERIES") {
        locFunc += isLocal ? "_MONTHLY" : "_WEEKLY";
    }

    return isLocal ? `${ajax.JS_URL}/${locFunc}` : `${ajax.AV_URL}&function=${locFunc}`;
}