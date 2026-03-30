import axios from "axios";
import { ALPHA_VANTAGE_KEY } from "./Environment.js";

// Se vuota viene assegnata  l'origine da cui è stata scaricata la pagina

class Ajax {
	JS_URL = "http://localhost:3030";
	AV_URL = `https://www.alphavantage.co/query?apikey=${ALPHA_VANTAGE_KEY}`;

	sendRequest(method, url, parameters = {}) {
		return axios(
			{
				headers: {
					get: {
						"Accept": "application/json",
						"Content-Type": 'application/x-www-form-urlencoded;charset=utf-8'
					},
					post: {
						"Content-Type": 'application/json; charset=utf-8'
					}
				},
				responseType: "json",
				timeout: 5000,
				method,
				url,
				params: parameters,
				data: parameters
			}
		);
	}

	errore(err) {
		if (!err.response)
			alert("Connection Refused or Server timeout");
		else if (err.response.status == 200)
			alert("Formato dei dati non corretto : " + err.response.data);
		else {
			alert("Server Error: " + err.response.status + " - " + err.response.data)
		}
	}
}

const ajax = new Ajax();
export default ajax;