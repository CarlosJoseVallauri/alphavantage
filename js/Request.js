import ajax from "../lib/Ajax.js";

const result = (await ajax.sendRequest("GET", ajax.JS_URL + "/GLOBAL_QUOTE", {
    symbol: "IBM"
}).catch(ajax.errore))?.data;

console.log(result);