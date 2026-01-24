// DOM
const carDataKey = "carMaintenanceCarData";

const exportPdfBtn = document.getElementById("exportPdfBtn");
const yearEl = document.getElementById("year");
const brandInput = document.getElementById("brand");
const modelInput = document.getElementById("model");
const carYearInput = document.getElementById("carYear");

const form = document.getElementById("repairForm");
const currentList = document.getElementById("currentList");
const closeYearBtn = document.getElementById("closeYear");

const btnHistory = document.getElementById("btnHistory");
const historySection = document.getElementById("historySection");
const maintenanceSection = document.getElementById("maintenanceSection");

const yearSelect = document.getElementById("yearSelect");
const deleteYearBtn = document.getElementById("deleteYearBtn");
const historyDetailDiv = document.getElementById("historyDetail");
const backBtn = document.getElementById("backToMaintenance");
const savedCar = JSON.parse(localStorage.getItem(carDataKey));

if (savedCar) {
    brandInput.value = savedCar.brand;
    modelInput.value = savedCar.model;
    carYearInput.value = savedCar.year;
}


// Año actual
const currentYear = new Date().getFullYear();
yearEl.textContent = currentYear;

// Datos
let currentYearData = JSON.parse(localStorage.getItem("carMaintenanceCurrentYear")) || [];
let history = JSON.parse(localStorage.getItem("carMaintenanceHistory")) || [];

// Render ficha anual
function renderCurrent() {
    currentList.innerHTML = "";
    currentYearData.forEach((r, i) => {
        currentList.innerHTML += `
            <tr>
                <td>${r.date}</td>
                <td>${r.km}</td>
                <td>${r.type}</td>
                <td>${r.notes}</td>
                <td>${parseFloat(r.price).toFixed(2)}</td>
                <td><button onclick="remove(${i})">❌</button></td>
            </tr>
        `;
    });
}

function remove(index) {
    currentYearData.splice(index, 1);
    localStorage.setItem("carMaintenanceCurrentYear", JSON.stringify(currentYearData));
    renderCurrent();
}

// Añadir reparación
form.addEventListener("submit", e => {
    e.preventDefault();
    currentYearData.push({
        date: date.value,
        km: km.value,
        type: type.value,
        notes: notes.value,
        price: price.value
    });
    localStorage.setItem("carMaintenanceCurrentYear", JSON.stringify(currentYearData));
    form.reset();
    renderCurrent();
});

// Cerrar año
closeYearBtn.addEventListener("click", () => {
    if (currentYearData.length === 0) {
        return alert("No hay reparaciones para guardar.");
    }

    if (!brandInput.value || !modelInput.value || !carYearInput.value) {
        return alert("Completa los datos del vehículo.");
    }

    const maintenanceYear = prompt("Introduce el año del registro (ej. 2025):");

    if (!maintenanceYear) return;

    if (!/^\d{4}$/.test(maintenanceYear)) {
        return alert("Introduce un año válido (4 cifras).");
    }

    if (history.some(h => h.name === maintenanceYear)) {
        return alert("Ya existe un registro para ese año.");
    }

    history.push({
        name: maintenanceYear,
        car: {
            brand: brandInput.value,
            model: modelInput.value,
            year: carYearInput.value
        },
        records: currentYearData
    });

    localStorage.setItem("carMaintenanceHistory", JSON.stringify(history));
    localStorage.removeItem("carMaintenanceCurrentYear");

    currentYearData = [];
    renderCurrent();

    alert(`Registro del año ${maintenanceYear} guardado correctamente.`);
});


// Registro histórico
function renderYearSelector() {
    yearSelect.innerHTML = "";
    history.forEach((h, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.text = h.name;
        yearSelect.add(opt);
    });
    renderYearDetail(yearSelect.value);
}

yearSelect.addEventListener("change", () => {
    renderYearDetail(yearSelect.value);
});

function renderYearDetail(index) {
    const h = history[index];
    if (!h) return;

    let total = h.records.reduce((s, r) => s + parseFloat(r.price), 0);

    historyDetailDiv.innerHTML = `
        <h3>${h.car.brand} ${h.car.model} (${h.car.year})</h3>
        <table>
            <tr>
                <th>Fecha</th><th>Kms</th><th>Reparación</th><th>Obs.</th><th>Precio</th>
            </tr>
            ${h.records.map(r => `
                <tr>
                    <td>${r.date}</td>
                    <td>${r.km}</td>
                    <td>${r.type}</td>
                    <td>${r.notes}</td>
                    <td>${parseFloat(r.price).toFixed(2)}</td>
                </tr>
            `).join("")}
        </table>
        <div class="total">Total: €${total.toFixed(2)}</div>
    `;
}

// Borrar registro
deleteYearBtn.addEventListener("click", () => {
    const i = yearSelect.value;
    if (confirm("¿Eliminar este registro?")) {
        history.splice(i, 1);
        localStorage.setItem("carMaintenanceHistory", JSON.stringify(history));
        renderYearSelector();
        historyDetailDiv.innerHTML = "";
    }
});

// Navegación
btnHistory.addEventListener("click", () => {
    maintenanceSection.classList.add("hidden");
    historySection.classList.remove("hidden");
    renderYearSelector();
});

backBtn.addEventListener("click", () => {
    historySection.classList.add("hidden");
    maintenanceSection.classList.remove("hidden");
    renderCurrent();
});

renderCurrent();
exportPdfBtn.addEventListener("click", () => {
    const index = yearSelect.value;
    const h = history[index];
    if (!h) return alert("No hay registro seleccionado.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;

    // Título
    doc.setFontSize(16);
    doc.text("Registro de Mantenimiento", 10, y);
    y += 10;

    // Datos del coche
    doc.setFontSize(12);
    doc.text(`Marca: ${h.car.brand}`, 10, y); y += 7;
    doc.text(`Modelo: ${h.car.model}`, 10, y); y += 7;
    doc.text(`Año del coche: ${h.car.year}`, 10, y); y += 7;
    doc.text(`Año de mantenimiento: ${h.name}`, 10, y); y += 10;

    // Cabecera tabla
    doc.setFontSize(10);
    doc.text("Fecha", 10, y);
    doc.text("Kms", 35, y);
    doc.text("Reparación", 60, y);
    doc.text("Obs.", 110, y);
    doc.text("Precio", 160, y);
    y += 5;

    let total = 0;

    h.records.forEach(r => {
        if (y > 280) {
            doc.addPage();
            y = 10;
        }

        doc.text(r.date, 10, y);
        doc.text(String(r.km), 35, y);
        doc.text(r.type.substring(0, 20), 60, y);
        doc.text(r.notes.substring(0, 20), 110, y);
        doc.text(`${parseFloat(r.price).toFixed(2)} €`, 160, y);

        total += parseFloat(r.price);
        y += 6;
    });

    y += 10;
    doc.setFontSize(12);
    doc.text(`Gasto total: €${total.toFixed(2)}`, 10, y);

    // Nombre del archivo
    const fileName = `Mantenimiento_${h.car.brand}_${h.car.model}_${h.name}.pdf`;
    doc.save(fileName);
});
function saveCarData() {
    const carData = {
        brand: brandInput.value,
        model: modelInput.value,
        year: carYearInput.value
    };
    localStorage.setItem(carDataKey, JSON.stringify(carData));
}

brandInput.addEventListener("input", saveCarData);
modelInput.addEventListener("input", saveCarData);
carYearInput.addEventListener("input", saveCarData);
// 1. Lista de tipos de reparación
const repairTypes = [
    "Aceite Motor",
    "Aceite Caja Cambios",
    "Filtro Aceite",
    "Filtro Aire",
    "Filtro Habitáculos",
    "Filtro Combustible",
    "Pastillas Frenos",
    "Discos Frenos",
    "Liquido Frenos",
    "Neumáticos",
    "Batería",
    "Dirección y Transmisión",
    "Anticongelante",
    "Correa Distribución",
    "Correa Auxiliar",
    "Bomba Agua",
    "Amortiguadores",
    "Escape",
    "Calentadores o Bujías",
    "Aire Acondicionado",
    "Electrónica",
    "Pre ITV",
    "Otros"
];

// 2. Obtener select
const typeSelect = document.getElementById("type");

// 3. Llenar select al iniciar
repairTypes.forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.text = t;
    typeSelect.add(option);
});

// 4. Guardar tipo seleccionado al añadir reparación
form.addEventListener("submit", e => {
    e.preventDefault();

    currentYearData.push({
        date: date.value,
        km: km.value,
        type: typeSelect.value, // <-- aquí usamos el select
        notes: notes.value,
        price: price.value
    });

    localStorage.setItem("carMaintenanceCurrentYear", JSON.stringify(currentYearData));
    form.reset();
    renderCurrent();
});
