const form = document.getElementById("electricityForm");
const historyBody = document.getElementById("history");
const result = document.getElementById("result");

let records = [];

form.addEventListener("submit", async function (event) {
event.preventDefault();

const date = document.getElementById("date").value;
const previous = Number(document.getElementById("previous").value);
const current = Number(document.getElementById("current").value);
const tariff = Number(document.getElementById("tariff").value);

if (
    !date ||
    !Number.isFinite(previous) ||
    !Number.isFinite(current) ||
    !Number.isFinite(tariff) ||
    previous < 0 ||
    current < previous ||
    tariff < 0
) {
    result.textContent = "Please enter valid meter readings and tariff.";
    return;
}

result.textContent = "Calculating using Java backend...";

try {
    const url =
        "http://localhost:8080/calculate" +
        "?previous=" + encodeURIComponent(previous) +
        "&current=" + encodeURIComponent(current) +
        "&tariff=" + encodeURIComponent(tariff);

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Calculation failed.");
    }

    const units = data.units;
    const bill = data.bill;
    const status = units > 50 ? "High Usage ⚠️" : "Normal ✅";

    document.getElementById("units").textContent =
        units.toFixed(2) + " kWh";

    document.getElementById("bill").textContent =
        "₹" + bill.toFixed(2);

    document.getElementById("status").textContent = status;

    result.textContent =
        "Reading Date: " + date +
        " | Units Consumed: " + units.toFixed(2) + " kWh" +
        " | Estimated Bill: ₹" + bill.toFixed(2) +
        " | Status: " + status +
        " | Calculated by Java Backend";

    records.unshift({
        date: date,
        units: units,
        bill: bill,
        status: status
    });

    renderHistory();

} catch (error) {
    result.textContent =
        "Unable to connect to Java backend. Please check that the Java server is running. Details: " +
        error.message;
}

});

function renderHistory() {
historyBody.replaceChildren();

records.forEach(function (record) {
    const row = document.createElement("tr");

    [
        record.date,
        record.units.toFixed(2),
        "₹" + record.bill.toFixed(2),
        record.status
    ].forEach(function (value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    });

    historyBody.appendChild(row);
});

}

document.getElementById("exportBtn").addEventListener("click", function () {
if (records.length === 0) {
alert("No records available to export.");
return;
}

const csvRows = [
    ["Date", "Units Consumed (kWh)", "Estimated Bill (INR)", "Status"],
    ...records.map(record => [
        record.date,
        record.units.toFixed(2),
        record.bill.toFixed(2),
        record.status
    ])
];

const csv = csvRows.map(row =>
    row.map(value =>
        '"' + String(value).replace(/"/g, '""') + '"'
    ).join(",")
).join("\r\n");

const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
});

const downloadUrl = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = downloadUrl;
link.download = "electricity-history.csv";
link.click();

setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

});