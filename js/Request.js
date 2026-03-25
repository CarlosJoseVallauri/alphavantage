import ajax from "../lib/Ajax.js";

const result = (await ajax.sendRequest("GET", ajax.JS_URL + "/GLOBAL_QUOTE", {
    symbol: "IBM"
}))?.data;

console.log(result);