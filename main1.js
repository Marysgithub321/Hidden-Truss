// Define default prices
const defaultPrices = {
  board_2x12: 1.85,
  board_2x10: 1.25,
  board_2x8: 1.7,
  board_2x6: 0.87,
  board_2x4: 0.55,
  board_2x3: 0.3,
  plates: 0.06,
  laborMultiplier: 2,
};

let prices = {}; // Declare the prices object

document.addEventListener("DOMContentLoaded", function () {
  // Initialize prices from localStorage or set to default if not present
  prices = JSON.parse(localStorage.getItem("materialPrices")) || defaultPrices;

  // Update input fields with the loaded or default prices
  updatePriceInputs(prices);

  // Add event listeners to all input and textarea fields
  const inputs = document.querySelectorAll("#materialSections input, #materialSections textarea");
  inputs.forEach((input) => {
    input.addEventListener("input", calculateCosts);
    input.addEventListener("keydown", handleEnterKey);
  });

  // Handle "Enter" key navigation between inputs
  const navigableInputs = document.querySelectorAll('.navigable');
  navigableInputs.forEach((input, index) => {
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const nextInput = navigableInputs[index + 1];
        if (nextInput) {
          nextInput.focus();
        }
      }
    });
  });

  // Toggle the dropdown content
  document.querySelector('.dropdown .dropbtn').addEventListener('click', function () {
    const dropdownContent = document.querySelector('.dropdown-content');
    dropdownContent.classList.toggle('hidden');
  });
});

function updatePriceInputs(prices) {
  // Update input fields with the current prices
  document.getElementById("price_2x12").value = prices.board_2x12 || 0;
  document.getElementById("price_2x10").value = prices.board_2x10 || 0;
  document.getElementById("price_2x8").value = prices.board_2x8 || 0;
  document.getElementById("price_2x6").value = prices.board_2x6 || 0;
  document.getElementById("price_2x4").value = prices.board_2x4 || 0;
  document.getElementById("price_2x3").value = prices.board_2x3 || 0;
  document.getElementById("price_plates").value = prices.plates || 0;
  document.getElementById("laborMultiplier").value = prices.laborMultiplier || 1;
}

function updatePrices() {
  // Collect current prices from input fields
  prices = {
    board_2x12: parseFloat(document.getElementById("price_2x12").value) || 0,
    board_2x10: parseFloat(document.getElementById("price_2x10").value) || 0,
    board_2x8: parseFloat(document.getElementById("price_2x8").value) || 0,
    board_2x6: parseFloat(document.getElementById("price_2x6").value) || 0,
    board_2x4: parseFloat(document.getElementById("price_2x4").value) || 0,
    board_2x3: parseFloat(document.getElementById("price_2x3").value) || 0,
    plates: parseFloat(document.getElementById("price_plates").value) || 0,
    laborMultiplier: parseFloat(document.getElementById("laborMultiplier").value) || 1,
  };

  // Save updated prices to localStorage
  localStorage.setItem("materialPrices", JSON.stringify(prices));

  // Display a simple alert
  alert('Prices updated successfully!');
}

function calculateCosts() {
  // Ensure prices is initialized
  if (!prices) return;

  let totalAllMaterial = 0;
  let totalAllMarkup = 0;

  const sections = document.querySelectorAll(".materials");
  sections.forEach((section) => {
    const board_2x12 = parseFloat(section.querySelector(`[id^=board_2x12]`).value) || 0;
    const board_2x10 = parseFloat(section.querySelector(`[id^=board_2x10]`).value) || 0;
    const board_2x8 = parseFloat(section.querySelector(`[id^=board_2x8]`).value) || 0;
    const board_2x6 = parseFloat(section.querySelector(`[id^=board_2x6]`).value) || 0;
    const board_2x4 = parseFloat(section.querySelector(`[id^=board_2x4]`).value) || 0;
    const board_2x3 = parseFloat(section.querySelector(`[id^=board_2x3]`).value) || 0;
    const plates = parseFloat(section.querySelector(`[id^=plates]`).value) || 0;
    const extra = parseFloat(section.querySelector(`[id^=extra]`).value) || 0;
    const numTrusses = parseInt(section.querySelector(`[id^=numTrusses]`).value) || 1;

    const totalMaterial = (
        board_2x12 * prices.board_2x12 +
        board_2x10 * prices.board_2x10 +
        board_2x8 * prices.board_2x8 +
        board_2x6 * prices.board_2x6 +
        board_2x4 * prices.board_2x4 +
        board_2x3 * prices.board_2x3 +
        plates * prices.plates +
        extra
    ).toFixed(2);

    const totalMaterialPerTruss = parseFloat(totalMaterial).toFixed(2);
    const perTrussWithMarkup = (parseFloat(totalMaterialPerTruss) * prices.laborMultiplier).toFixed(2);
    const total = (parseFloat(perTrussWithMarkup) * numTrusses).toFixed(2);

    totalAllMaterial += parseFloat(totalMaterial);
    totalAllMarkup += parseFloat(total);

    section.querySelector(".totalMaterial").innerText = `$${totalMaterialPerTruss}`;
    section.querySelector(".perTruss").innerText = `$${perTrussWithMarkup}`;
    section.querySelector(".total").innerText = `$${total}`;
  });

  const extraChargesAmount = parseFloat(document.getElementById("extraCharges").value) || 0;
  const subtotal = totalAllMarkup + extraChargesAmount;
  const taxAmount = subtotal * 0.13; // Assuming 13% tax rate
  const total = subtotal + taxAmount;

  document.getElementById("subTotal").innerText = `$${subtotal.toFixed(2)}`;
  document.getElementById("taxAmount").innerText = `$${taxAmount.toFixed(2)}`;
  document.getElementById("totalAll").innerText = `$${total.toFixed(2)}`;
}



function removeSection(sectionNumber) {
  const section = document.getElementById(`section_${sectionNumber}`);
  section.parentNode.removeChild(section);
  calculateCosts(); // Recalculate costs after removing a section
}

// Add event listeners to extra charges fields
document.getElementById("extraCharges").addEventListener("input", calculateCosts);
document.getElementById("extraDescription").addEventListener("input", calculateCosts);

function handleEnterKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const formElements = Array.from(document.querySelectorAll(".navigable"));
    const currentIndex = formElements.indexOf(event.target);
    const nextElement = formElements[currentIndex + 1];
    if (nextElement) {
      nextElement.focus();
    }
  }
}

// Add event listeners to existing input fields on page load
document.addEventListener("DOMContentLoaded", function () {
  const inputs = document.querySelectorAll("#materialSections input, #materialSections textarea");
  inputs.forEach((input) => {
    input.addEventListener("input", calculateCosts);
    input.addEventListener("keydown", handleEnterKey);
  });
});

document.getElementById("addPageButton").addEventListener("click", function () {
  const container = document.getElementById("materialSections");
  const sectionNumber = container.children.length + 1; // Unique number for new sections
  const sectionHtml = `
    <section id="section_${sectionNumber}" class="section-material">
      <div class="materials" id="materials_${sectionNumber}">
        <div class="input-group">
          <label for="page_${sectionNumber}">Page #</label>
          <input type="text" id="page_${sectionNumber}" class="navigable" maxlength="50" />
        </div>
        <div class="input-group">
          <label for="description_${sectionNumber}">Description</label>
          <input type="text" id="description_${sectionNumber}" class="navigable" maxlength="50" />
        </div>
        <div class="input-group">
          <label for="board_2x12_${sectionNumber}">2x12 (board ft):</label>
          <input type="number" id="board_2x12_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        <div class="input-group">
          <label for="board_2x10_${sectionNumber}">2x10 (board ft):</label>
          <input type="number" id="board_2x10_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        <div class="input-group">
          <label for="board_2x8_${sectionNumber}">2x8 (board ft):</label>
          <input type="number" id="board_2x8_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        <div class="input-group">
          <label for="board_2x6_${sectionNumber}">2x6 (board ft):</label>
          <input type="number" id="board_2x6_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        <div class="input-group">
          <label for="board_2x4_${sectionNumber}">2x4 (board ft):</label>
          <input type="number" id="board_2x4_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        <div class="input-group">
          <label for="board_2x3_${sectionNumber}">2x3 (board ft):</label>
          <input type="number" id="board_2x3_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        <div class="input-group">
          <label for="plates_${sectionNumber}">Plates:</label>
          <input type="number" id="plates_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        <div class="input-group">
          <label for="extra_${sectionNumber}">Extra Charge:</label>
          <input type="number" id="extra_${sectionNumber}" class="navigable" value="" step="1" />
        </div>
        
        <div class="input-group">
          <label for="numTrusses_${sectionNumber}">Number of Trusses:</label>
          <input type="number" id="numTrusses_${sectionNumber}" class="navigable" value="1" step="1" min="1" />
        </div>
        <button onclick="removeSection(${sectionNumber})">Remove</button>
        <section class="cost">
          <h2>Costs</h2>
          <p>Total Material Per Truss: <span class="totalMaterial">$0.00</span></p>
          <p>Per Truss Material and Markup: <span class="perTruss">$0.00</span></p>
          <p>Total: <span class="total">$0.00</span></p>
        </section>
      </div>
    </section>
  `;
  container.insertAdjacentHTML("beforeend", sectionHtml); // Append the new section

  // Add event listeners to the new input fields
  const newSection = document.getElementById(`section_${sectionNumber}`);
  const inputs = newSection.querySelectorAll("input, textarea");
  inputs.forEach((input) => {
    input.addEventListener("input", calculateCosts);
    input.addEventListener("keydown", handleEnterKey);
  });
});





