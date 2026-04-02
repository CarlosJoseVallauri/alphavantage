import ajax from "./Ajax.js";
import { getServerURL } from "../js/DOM.js";

//TODO: Update and switch to plain JSON-Server
export default async function fuzzySearch(value){
    const Data = (await ajax.sendRequest("GET", `${getServerURL("SYMBOL_SEARCH")}`).catch(ajax.errore))?.data;

    if(Data["Information"]){
        return [];
    }
    
    return Data.filter(symbol => symbol["2. name"].toLowerCase().includes(value.toLowerCase()) || symbol["1. symbol"].toLowerCase().includes(value.toLowerCase()))
}