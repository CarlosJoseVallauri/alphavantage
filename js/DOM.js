import * as bootstrap from "bootstrap";
import { createChart } from "./Chart.js";
import "./Request.js";

document
    .querySelectorAll("a.nav-link")
    .forEach(btn => {
        btn
            .addEventListener("click", function(){
                const SIBLING = document.querySelector("a.nav-link.active");
                this.classList.add("active", "pe-none");
                this.parentElement.classList.remove("border-secondary");
                SIBLING.classList.remove("active", "pe-none");
                SIBLING.parentElement.classList.add("border-secondary");

                if(this.textContent.includes("JSON")){
                    document.querySelector(".navbar-toggler-icon").style.backgroundImage = "url('./assets/logo/json-logo.png')";
                }
                else{
                    document.querySelector(".navbar-toggler-icon").style.backgroundImage = "url('./assets/logo/av-logo.png')";
                }
            })
    });

//createChart("Example", "chartCanvas", "pie", [1, 2, 3, 4, 5], [5, 4, 3, 2, 1]);
