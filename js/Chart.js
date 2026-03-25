import Chart from "chart.js/auto";

const Charts = {};

export function createChart(title, canvas, type, keys, values) {
    const Config = createConfig(title, type, keys, values);
    const chart = new Chart(document.getElementById(canvas), Config);

    Charts[title] = {chart, Config};
}

export function updateChart(title, keys, values){
    if(!(title in Charts)){
        return;
    }
    keys.forEach(key => Charts["title"].data.labels.push(keys));
    values.forEach(value => Charts["title"].data.datasets[0].data.push(value));
    Charts[title].update();
}

function createConfig(title, type, keys, values) {
    return {
        type,
        data: {
            labels: keys,
            datasets: [{ data: values }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: true
        },
        plugins: {
            title: {
                display: true,
                text: title,
                font: {
                    size: 10,
                    weight: "bold",
                    family: "Arial"
                },
                color: "#333"
            }
        }
    }
}