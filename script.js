document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // VARIABLES DOM
    // ==========================
    const carDataKey = "carMaintenanceCarData";
    const exportPdfBtn = document.getElementById("exportPdfBtn");

    const yearEl = document.getElementById("year");
    const brandInput = document.getElementById("brand");
    const modelInput = document.getElementById("model");
    const carYearInput = document.getElementById("carYear");
    const plateInput = document.getElementById("plate");
    const carPhotoInput = document.getElementById("carPhotoInput");
    const carPhotoPreview = document.getElementById("carPhotoPreview");
    const selectPhotoBtn = document.getElementById("selectPhotoBtn");

    const form = document.getElementById("repairForm");
    const dateInput = document.getElementById("date");
    const kmInput = document.getElementById("km");
    const typeSelect = document.getElementById("type");
    const customTypeInput = document.getElementById("customType"); // para "Otros"
    const notesInput = document.getElementById("notes");
    const priceInput = document.getElementById("price");
    const currentList = document.getElementById("currentList");
    const closeYearBtn = document.getElementById("closeYear");

    const btnHistory = document.getElementById("btnHistory");
    const historySection = document.getElementById("historySection");
    const maintenanceSection = document.getElementById("maintenanceSection");
    const yearSelect = document.getElementById("yearSelect");
    const editYearBtn = document.getElementById("editYearBtn");
    const deleteYearBtn = document.getElementById("deleteYearBtn");
    const historyDetailDiv = document.getElementById("historyDetail");
    const backBtn = document.getElementById("backToMaintenance");

    const STORAGE_KEYS = {
        history: "carMaintenanceHistory",
        currentYear: "carMaintenanceCurrentYear",
        carData: carDataKey
    };

    let editIndex = -1;
    let currentYearData = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentYear)) || [];
    let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [];

    yearEl.textContent = new Date().getFullYear();

// ==========================
// GUARDAR DATOS VEHÍCULO AUTOMÁTICAMENTE
// ==========================
[brandInput, modelInput, carYearInput, plateInput].forEach(input => {
    input.addEventListener("input", saveCarData);
     input.addEventListener("change", saveCarData);
});

window.addEventListener("beforeunload", saveCarData);

    // ==========================
    // CARGAR DATOS COCHE
    // ==========================
    const savedCar = JSON.parse(localStorage.getItem(carDataKey));
    if (savedCar) {
        brandInput.value = savedCar.brand || "";
        modelInput.value = savedCar.model || "";
        carYearInput.value = savedCar.year || "";
        plateInput.value = savedCar.plate || "";
        if (savedCar.photo) carPhotoPreview.src = savedCar.photo;
    }

    function saveCarData() {
        localStorage.setItem(carDataKey, JSON.stringify({
            brand: brandInput.value,
            model: modelInput.value,
            year: carYearInput.value,
            plate: plateInput.value,
            photo: carPhotoPreview.src || ""
        }));
    }

    // ==========================
// FOTO REDUCIDA PARA MÓVIL
// ==========================
selectPhotoBtn.addEventListener("click", () => carPhotoInput.click());

carPhotoInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxWidth = 400;  // ancho máximo
            const maxHeight = 300; // alto máximo
            let ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.7); // compresión JPEG
            carPhotoPreview.src = dataUrl;
            saveCarData(); // guardar en localStorage
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});


    // ==========================
    // TIPOS REPARACIÓN
    // ==========================
    const repairTypes = ["Aceite Motor","Filtro Aceite","Filtro Aire","Filtro Habitáculo","Filtro Combustible",
        "Pastillas Frenos","Discos Frenos","Liquido Frenos","Neumáticos","Batería","Correa Distribución",
        "Correa Auxiliar","Bomba Agua","Amortiguadores","Escape","Calentadores o Bujías",
        "Dirección y Transmisión","Anticongelante","Aire Acondicionado","Electrónica","Rótulas","Pre ITV","Otros"];

    repairTypes.forEach(t => {
        const o = document.createElement("option");
        o.value = t;
        o.text = t;
        typeSelect.add(o);
    });

    typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "Otros") {
            customTypeInput.style.display = "block";
            customTypeInput.required = true;
        } else {
            customTypeInput.style.display = "none";
            customTypeInput.required = false;
            customTypeInput.value = "";
        }
    });

    // ==========================
    // RENDER ACTUAL
    // ==========================
    function renderCurrent() {
        currentList.innerHTML = "";
        currentYearData.forEach((r, i) => {
            currentList.innerHTML += `
            <tr>
                <td>${formatDate(r.date)}</td>
                <td>${r.km}</td>
                <td>${r.type}</td>
                <td>${r.notes}</td>
                <td>${parseFloat(r.price).toFixed(2)}</td>
                <td><button onclick="removeRepair(${i})">❌</button></td>
                <td><button onclick="editRepair(${i})">✏️</button></td>
            </tr>`;
        });
    }

    window.removeRepair = function(index) {
        currentYearData.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.currentYear, JSON.stringify(currentYearData));
        renderCurrent();
        updateGrandTotal();
    };

    window.editRepair = function(index) {
        const r = currentYearData[index];
        dateInput.value = r.date;
        kmInput.value = r.km;
        notesInput.value = r.notes;
        priceInput.value = r.price;

        if (repairTypes.includes(r.type)) {
            typeSelect.value = r.type;
            customTypeInput.style.display = "none";
        } else {
            typeSelect.value = "Otros";
            customTypeInput.style.display = "block";
            customTypeInput.value = r.type;
        }

        editIndex = index;
        form.querySelector("button").textContent = "Guardar cambios";
    };

    // ==========================
    // GUARDAR REPARACIÓN
    // ==========================
    form.addEventListener("submit", e => {
        e.preventDefault();
        const repairData = {
            date: dateInput.value,
            km: kmInput.value,
            type: typeSelect.value === "Otros" ? customTypeInput.value : typeSelect.value,
            notes: notesInput.value,
            price: priceInput.value
        };

        if (editIndex === -1) currentYearData.push(repairData);
        else {
            currentYearData[editIndex] = repairData;
            editIndex = -1;
        }

        localStorage.setItem(STORAGE_KEYS.currentYear, JSON.stringify(currentYearData));
        form.reset();
        customTypeInput.style.display = "none";
        form.querySelector("button").textContent = "Añadir Reparación";
        renderCurrent();
        updateGrandTotal();
    });

    // ==========================
    // CERRAR AÑO
    // ==========================
    closeYearBtn.addEventListener("click", () => {
        saveCarData(); // 🔥 MUY IMPORTANTE

        if (currentYearData.length === 0) return alert("No hay reparaciones");

        const maintenanceYear = prompt("Año del registro:");
        if (!maintenanceYear) return;

        history.push({
            name: maintenanceYear,
            car: {
                brand: brandInput.value,
                model: modelInput.value,
                year: carYearInput.value,
                plate: plateInput.value,
               photo: carPhotoPreview.src || (savedCar ? savedCar.photo : "")

            },
            records: currentYearData
        });

        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
        localStorage.removeItem(STORAGE_KEYS.currentYear);
        currentYearData = [];
        renderCurrent();
        updateGrandTotal();
        saveCarData();

    });

    // ==========================
    // HISTÓRICO
    // ==========================
    function renderYearSelector() {
        yearSelect.innerHTML = "";
        history.sort((a,b)=>parseInt(a.name)-parseInt(b.name));
        history.forEach((h,i)=>{
            const opt=document.createElement("option");
            opt.value=i;
            opt.text=h.name;
            yearSelect.add(opt);
        });
        renderYearDetail(yearSelect.value);
    }

    function renderYearDetail(index) {
        index = parseInt(index);
        const h = history[index];

        if (!h) {
            historyDetailDiv.innerHTML = "No hay registro seleccionado";
            return;
        }

        const savedCar = JSON.parse(localStorage.getItem("carMaintenanceCarData")) || {};

const plate = h.car.plate || savedCar.plate || "No indicada";

        let total = h.records.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);

        historyDetailDiv.innerHTML = `
            <h3>${h.car.brand} ${h.car.model} (${h.car.year}) - Matrícula: ${h.car.plate || "No indicada"}</h3>
            <table>
                <tr><th>Fecha</th><th>Kms</th><th>Reparación</th><th>Observaciones</th><th>Precio</th></tr>
                ${h.records.map(r => `
                    <tr>
                        <td>${formatDate(r.date)}</td>
                        <td>${r.km}</td>
                        <td>${r.type}</td>
                        <td>${r.notes}</td>
                        <td>${parseFloat(r.price).toFixed(2)} €</td>
                    </tr>`).join("")}
            </table>
            <div class="total">Total del año: <strong>${total.toFixed(2)} €</strong></div>
        `;
    }

    yearSelect.addEventListener("change", () => renderYearDetail(yearSelect.value));

    btnHistory.addEventListener("click", ()=>{
        maintenanceSection.classList.add("hidden");
        historySection.classList.remove("hidden");
        renderYearSelector();
        updateGrandTotal();
    });

    backBtn.addEventListener("click", ()=>{
        historySection.classList.add("hidden");
        maintenanceSection.classList.remove("hidden");
    });

    // ==========================
    // TOTAL GENERAL
    // ==========================
    function updateGrandTotal() {
        let total = 0;
        history.forEach(y=> y.records.forEach(r=> total+=parseFloat(r.price)||0));
        document.getElementById("grandTotal").textContent = total.toFixed(2)+" €";
    }

    // ==========================
    // EXPORTAR PDF
    // ==========================
    exportPdfBtn.addEventListener("click", () => {
    const i = parseInt(yearSelect.value);
    if (isNaN(i)) return alert("Selecciona un registro");

    const h = history[i];
    if (!h) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(14);
    doc.text("Registro de Mantenimiento", 10, y); y += 10;

    doc.setFontSize(11);
    doc.text(`Vehículo: ${h.car.brand} ${h.car.model}`, 10, y); y += 7;
    doc.text(`Año vehículo: ${h.car.year}`, 10, y); y += 7;
    doc.text(`Matrícula: ${h.car.plate || "-"}`, 10, y); y += 7;
    doc.text(`Registro año: ${h.name}`, 10, y); y += 10;

    // Cabecera tabla
    doc.setFont(undefined, "bold");
    doc.text("Fecha | Km | Reparación | Observaciones | Precio €", 10, y); y += 7;
    doc.setFont(undefined, "normal");

 h.records.forEach(r => {
    const line = `${formatDate(r.date)} | ${r.km} | ${r.type} | ${r.notes || "-"} | ${parseFloat(r.price).toFixed(2)} €`;
    doc.text(line, 10, y);
    y += 7;

    if (y > 280) {
        doc.addPage();
        y = 10;
    }
});


    const total = h.records.reduce((s,r)=> s + (parseFloat(r.price)||0), 0);
    y += 5;
    doc.text(`TOTAL: ${total.toFixed(2)} €`, 10, y);

    doc.save(`Mantenimiento_${h.name}.pdf`);
});

    // ==========================
    // EDITAR / BORRAR AÑO
    // ==========================
    editYearBtn.addEventListener("click", ()=>{
        saveCarData(); // 🔥 guardar coche al cargar edición

        const i = parseInt(yearSelect.value);
        if (isNaN(i)) return alert("Selecciona un registro");
        const h = history[i];
        if (!h) return;
        if (!confirm("Se cargará el año en la ficha anual para editarlo.")) return;

        const savedCar = JSON.parse(localStorage.getItem("carMaintenanceCarData")) || {};

brandInput.value = h.car.brand || savedCar.brand || "";
modelInput.value = h.car.model || savedCar.model || "";
carYearInput.value = h.car.year || savedCar.year || "";
plateInput.value = h.car.plate || savedCar.plate || "";
carPhotoPreview.src = h.car.photo || savedCar.photo || "";

saveCarData(); // 🔥 MUY IMPORTANTE


        currentYearData = [...h.records];
        localStorage.setItem(STORAGE_KEYS.currentYear, JSON.stringify(currentYearData));

        history.splice(i,1);
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));

        historySection.classList.add("hidden");
        maintenanceSection.classList.remove("hidden");

        renderCurrent();
        form.querySelector("button").textContent = "Añadir Reparación"; // Botón siempre añadir
        editIndex = -1;
    });

    deleteYearBtn.addEventListener("click", ()=>{
        const i = parseInt(yearSelect.value);
        if (isNaN(i)) return alert("Selecciona un registro");
        if (!confirm("¿Seguro que quieres borrar este año?")) return;

        history.splice(i,1);
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));

        renderYearSelector();
        updateGrandTotal();
    });

    renderCurrent();
    updateGrandTotal();
    saveCarData();

});


function formatDate(d) {
    if (!d) return "-";
    const parts = d.split("-"); // [YYYY, MM, DD]
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
// ==========================
// EXPORTAR E IMPORTAR DATOS JSON
// ==========================
const exportBtn = document.getElementById("exportDataBtn");
const importBtn = document.getElementById("importDataBtn");
const importFileInput = document.getElementById("importFileInput");

// Exportar todos los datos (coche + histórico + año actual)
exportBtn.addEventListener("click", () => {
    const data = {
        car: JSON.parse(localStorage.getItem("carMaintenanceCarData")) || {},
        history: JSON.parse(localStorage.getItem("carMaintenanceHistory")) || [],
        currentYear: JSON.parse(localStorage.getItem("carMaintenanceCurrentYear")) || []
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MantenimientoCoche_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// Importar datos JSON
importBtn.addEventListener("click", () => {
    importFileInput.click();
});

importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const importedData = JSON.parse(ev.target.result);

            if (importedData.car) localStorage.setItem("carMaintenanceCarData", JSON.stringify(importedData.car));
            if (importedData.history) localStorage.setItem("carMaintenanceHistory", JSON.stringify(importedData.history));
            if (importedData.currentYear) localStorage.setItem("carMaintenanceCurrentYear", JSON.stringify(importedData.currentYear));

            alert("Datos importados correctamente. La página se recargará para aplicar los cambios.");
            location.reload(); // recarga la página para reflejar los datos
        } catch (err) {
            alert("Error al importar datos: archivo no válido.");
        }
    };
    reader.readAsText(file);
});
