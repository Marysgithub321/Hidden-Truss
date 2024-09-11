function loadImageFromURL(url, callback) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; // use natural size to avoid blurriness
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        callback(dataURL);
    };
    img.src = url;
}

function generatePriceBreakdown() {
    const imageUrl = document.getElementById("logo2").src;
    loadImageFromURL(imageUrl, function (logoBase64) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        if (logoBase64) {
            const imgProps = { x: 10, y: 5, width: 100, height: 60 };
            doc.addImage(logoBase64, "PNG", imgProps.x, imgProps.y, imgProps.width, imgProps.height);
        }

        // Fetch all necessary elements and their values
        const date = document.getElementById("date").value;
        const jobNumber = document.getElementById("jobNumber").value;
        const customerName = document.getElementById("customerName").value;
        const phoneNumber = document.getElementById("phoneNumber").value;
        const address = document.getElementById("address").value;

        const companyAddress = "Hidden Enterprises Ltd.\n52181 Talbot Line,\nRR1 Aylmer, ON\nN5H 2R1";
        const addressBoxX = 37;
        const addressBoxY = 60;
        const addressBoxWidth = 40;
        const addressBoxHeight = 20;

        doc.rect(addressBoxX, addressBoxY, addressBoxWidth, addressBoxHeight);
        doc.setFontSize(10);
        doc.text(companyAddress, addressBoxX + 2, addressBoxY + 5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Price Breakdown", 167, 40, null, null, "center");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Date: ${date}`, 148, 50);
        doc.line(145, 52, 185, 52);
        doc.text(`Job # ${jobNumber}`, 148, 60);

        const estimateBoxX = 145;
        const estimateBoxY = 45;
        const estimateBoxWidth = 40;
        const estimateBoxHeight = 20;
        doc.rect(estimateBoxX, estimateBoxY, estimateBoxWidth, estimateBoxHeight);

        const customerInfoX = 120;
        const customerInfoY = 70;
        const customerInfoWidth = 80;
        const customerInfoHeight = 40;
        doc.rect(customerInfoX, customerInfoY, customerInfoWidth, customerInfoHeight);

        doc.setFont("helvetica", "bold");
        doc.text(`Name / Address:`, 130, 75);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.line(customerInfoX, 77, customerInfoX + customerInfoWidth, 77);

        const infoLineHeight = 5;
        doc.text(`${customerName}`, 122, 82);

        const addressMaxWidth = customerInfoWidth - 10;
        const addressLines = doc.splitTextToSize(address, addressMaxWidth);
        let currentY = 82 + infoLineHeight;

        addressLines.forEach((line) => {
            doc.text(line, 122, currentY);
            currentY += infoLineHeight;
        });

        doc.text(`${phoneNumber}`, 122, currentY + infoLineHeight - 3);

        let yOffset = 130;
        const headers = [
            "Page",
            "Item",
            "Qty",
            "Rate",
            "Material & Markup",
            "Markup Rate",
            "Total",
        ];
        const headerX = [13, 40, 70, 90, 110, 150, 180];
        const boxX = 10;
        const boxWidth = 190;
        const initialGridHeight = 120; // Initial grid height for the first page
        const subsequentGridHeight = 230; // Grid height for subsequent pages

        // Draw the initial grid
        drawPriceBreakdownGrid(doc, yOffset, boxX, boxWidth, initialGridHeight, headerX, headers);

        const sections = document.querySelectorAll(".materials");
        let totalBeforeTax = 0;
        let lineCounter = 0;
        let isFirstPage = true;

        sections.forEach((section) => {
            const pageDescription = section.querySelector(`[id^=page]`)?.value.trim() || "";
            const numTrusses = parseInt(section.querySelector(`[id^=numTrusses]`)?.value.trim() || "1");
            const perTrussPriceElement = section.querySelector(".totalMaterial");
            const perTrussPrice = parseFloat(perTrussPriceElement?.innerText.replace("$", "").trim() || "0");

            if (pageDescription) {
                yOffset += 5; // Reduce the gap between lines

                // Check if adding the next line would overflow
                if (yOffset + infoLineHeight > 235) {
                    addNewPage(doc, boxX, boxWidth, subsequentGridHeight, headerX, headers);
                    yOffset = 23; // Set yOffset to start below the header for new pages
                    lineCounter = 0;
                    isFirstPage = false;
                }

                doc.text(pageDescription, headerX[0], yOffset);
                doc.text("Truss", headerX[1], yOffset);
                doc.text(numTrusses.toString(), headerX[2], yOffset);
                doc.text(perTrussPrice.toFixed(2), headerX[3], yOffset);
                const markupPerTruss = (perTrussPrice * prices.laborMultiplier).toFixed(2);
                doc.text(markupPerTruss, headerX[4], yOffset);
                doc.text(prices.laborMultiplier.toFixed(2), headerX[5], yOffset);
                doc.text("", headerX[6], yOffset);

                lineCounter++;
            }

            const materials = [
                { name: "2x12", qty: parseFloat(section.querySelector(`[id^=board_2x12]`)?.value.trim() || "0"), rate: prices.board_2x12 },
                { name: "2x10", qty: parseFloat(section.querySelector(`[id^=board_2x10]`)?.value.trim() || "0"), rate: prices.board_2x10 },
                { name: "2x8", qty: parseFloat(section.querySelector(`[id^=board_2x8]`)?.value.trim() || "0"), rate: prices.board_2x8 },
                { name: "2x6", qty: parseFloat(section.querySelector(`[id^=board_2x6]`)?.value.trim() || "0"), rate: prices.board_2x6 },
                { name: "2x4", qty: parseFloat(section.querySelector(`[id^=board_2x4]`)?.value.trim() || "0"), rate: prices.board_2x4 },
                { name: "2x3", qty: parseFloat(section.querySelector(`[id^=board_2x3]`)?.value.trim() || "0"), rate: prices.board_2x3 },
                { name: "Plate", qty: parseFloat(section.querySelector(`[id^=plates]`)?.value.trim() || "0"), rate: prices.plates },
                { name: "Extra", qty: 1, rate: parseFloat(section.querySelector(`[id^=extra]`)?.value.trim() || "0") },
            ];

            let sectionTotal = 0;
            materials.forEach((material) => {
                if (material.qty > 0 && material.rate !== undefined && material.rate > 0) {
                    const totalQty = material.qty * numTrusses;
                    const markup = (totalQty * material.rate).toFixed(2);
                    const total = (totalQty * material.rate * prices.laborMultiplier).toFixed(2);
                    sectionTotal += parseFloat(total);

                    yOffset += 5;

                    // Check if adding the next line would overflow
                    if (yOffset + infoLineHeight > 235) {
                        addNewPage(doc, boxX, boxWidth, subsequentGridHeight, headerX, headers);
                        yOffset = 23; // Reset yOffset for new page
                        lineCounter = 0;
                    }

                    doc.text("", headerX[0], yOffset);
                    doc.text(material.name, headerX[1], yOffset);
                    doc.text(totalQty.toString(), headerX[2], yOffset);
                    doc.text(material.rate.toFixed(2), headerX[3], yOffset);
                    doc.text(markup, headerX[4], yOffset);
                    doc.text("", headerX[5], yOffset);
                    doc.text(total, headerX[6], yOffset);

                    lineCounter++;
                }
            });

            totalBeforeTax += sectionTotal;

            yOffset += 10; // Reduce the space after a section
            lineCounter++;
            if (yOffset + infoLineHeight > 235) {
                addNewPage(doc, boxX, boxWidth, subsequentGridHeight, headerX, headers);
                yOffset = 23;
                lineCounter = 0;
            }
        });

        const extraChargesAmount = parseFloat(document.getElementById("extraCharges").value.trim() || "0");
        if (extraChargesAmount > 0) {
            doc.text("Extra", headerX[1], yOffset);
            doc.text("1", headerX[2], yOffset);
            doc.text(extraChargesAmount.toFixed(2), headerX[3], yOffset);
            doc.text(extraChargesAmount.toFixed(2), headerX[4], yOffset);
            doc.text("", headerX[5], yOffset);
            doc.text(extraChargesAmount.toFixed(2), headerX[6], yOffset);

            totalBeforeTax += extraChargesAmount;
        }

        yOffset += 10;
        const totalsBoxX = 150;
        const totalsBoxY = 240; // Fixed position towards the bottom of the page
        const totalsBoxWidth = 50;
        const totalsBoxHeight = 30;
        const lineHeight = 10;

        doc.rect(totalsBoxX, totalsBoxY, totalsBoxWidth, totalsBoxHeight);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Subtotal:", totalsBoxX + 2, totalsBoxY + lineHeight - 2);
doc.text("GST/HST:", totalsBoxX + 2, totalsBoxY + lineHeight * 2 - 2);
doc.text("Total:", totalsBoxX + 2, totalsBoxY + lineHeight * 3 - 2);

doc.setFont("helvetica", "normal");

const subtotal = totalBeforeTax;
const taxAmount = subtotal * 0.13;
const total = subtotal + taxAmount;

// Format the numbers to include commas and dollar sign
const formatCurrency = (num) => {
    return "$" + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

// Display formatted currency values in the totals box
doc.text(
    formatCurrency(subtotal),
    totalsBoxX + totalsBoxWidth - 2,
    totalsBoxY + lineHeight - 2,
    {
        align: "right",
    }
);
doc.text(
    formatCurrency(taxAmount),
    totalsBoxX + totalsBoxWidth - 2,
    totalsBoxY + lineHeight * 2 - 2,
    {
        align: "right",
    }
);
doc.text(
    formatCurrency(total),
    totalsBoxX + totalsBoxWidth - 2,
    totalsBoxY + lineHeight * 3 - 2,
    {
        align: "right",
    }
);

// Draw lines between the totals
doc.line(totalsBoxX, totalsBoxY + lineHeight, totalsBoxX + totalsBoxWidth, totalsBoxY + lineHeight);
doc.line(totalsBoxX, totalsBoxY + lineHeight * 2, totalsBoxX + totalsBoxWidth, totalsBoxY + lineHeight * 2);

        const gstHstLabelX = 10;
        const gstHstLabelY = 270;
        doc.setFont("helvetica");
        doc.text("GST/HST NO.", gstHstLabelX, gstHstLabelY);
        doc.setFont("helvetica", "normal");
        doc.text("756682902", gstHstLabelX, gstHstLabelY + 5);

        const verseBoxX = 75;
        const verseBoxY = 242;
        const verseBoxWidth = 50;
        const verseBoxHeight = 30;
        doc.rect(verseBoxX, verseBoxY, verseBoxWidth, verseBoxHeight);

        const verseText =
            "There is therefore now no \ncondemnation to them \nwhich are in Christ \nJesus, who walk not after \nthe flesh, but after the \nspirit.\nROM 8:1";
        doc.setFont("times", "italic");
        doc.setFontSize(10);

        const verseTextY = verseBoxY + 4;
        doc.text(verseText, verseBoxX + verseBoxWidth / 2, verseTextY, {
            align: "center",
        });

        doc.save(`truss_breakdown_${customerName}.pdf`);
    });
}

// Function to add a new page and draw a new grid
function addNewPage(doc, boxX, boxWidth, gridHeight, headerX, headers) {
    doc.addPage();
    drawPriceBreakdownGrid(doc, 15, boxX, boxWidth, gridHeight, headerX, headers); // Start drawing grid from yOffset = 15
}

function drawPriceBreakdownGrid(doc, yOffset, boxX, boxWidth, gridHeight, headerX, headers) {
    // Draw the border for the grid
    doc.rect(boxX, yOffset - 10, boxWidth, gridHeight);

    // Draw headers
    headers.forEach((header, i) => {
        doc.text(header, headerX[i], yOffset - 5);
    });

    // Draw line under header labels
    doc.line(boxX, yOffset - 3, boxX + boxWidth, yOffset - 3);

    // Draw vertical lines for the grid
    const gridTopY = yOffset - 10; // Top of the grid
    const gridBottomY = yOffset + gridHeight - 10; // Bottom of the grid

    // Vertical line positions based on column positions
    const verticalLineXPositions = [headerX[1] - 3, headerX[2] - 3, headerX[3] - 3, headerX[4] - 3, headerX[5] - 3, headerX[6] - 3];

    verticalLineXPositions.forEach(xPos => {
        doc.line(xPos, gridTopY, xPos, gridBottomY);
    });
}

document.getElementById("priceBreakdownButton").addEventListener("click", generatePriceBreakdown);
