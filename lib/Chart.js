import Chart from "chart.js/auto";

export function createChart(title, canvas, type, keys, values) {
    return new Chart(document.getElementById(canvas), createConfig(title, type, keys, values));
}

export function updateChart(id, keys, values) {
    const chart = Chart.getChart(id);
    if (!chart) {
        return;
    }
    keys.forEach(key => chart.data.labels.push(key));
    values.forEach(value => chart.data.datasets[0].data.push(value));
    chart.update();
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
                    beginAtZero: true,
                    ticks: {
                        color: "#ABB"
                    }
                },
                x: {
                    ticks: {
                        color: "#ABB"
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 20,
                        weight: "bold",
                        family: "system-ui"
                    },
                    color: "#ABB"
                },
                legend: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false
        },
    }
}