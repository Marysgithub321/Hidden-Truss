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

function generateQuote() {
    const imageUrl = document.getElementById("logo").src;
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
        const totalAll = document.getElementById("totalAll").innerText;
        const taxAmount = document.getElementById("taxAmount").innerText;
        const subTotal = document.getElementById("subTotal").innerText;
        const extraChargesDescription = document.getElementById("extraDescription").value;
        const extraChargesAmount = parseFloat(document.getElementById("extraCharges").value) || 0;

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
        doc.text("Estimate", 173, 40, null, null, "center");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Date: ${date}`, 148, 50);
        doc.line(145, 52, 185, 52);
        doc.text(`Estimate # ${jobNumber}`, 148, 60);

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

        doc.text(`${phoneNumber}`, 122, currentY + infoLineHeight -3);

        let yOffset = 130;
        const headers = ["Truss Page #", "Description", "Qty", "Rate", "Total"];
        const headerX = [13, 50, 110, 140, 170];
        const boxX = 10;
        const boxWidth = 190;
        const gridHeight = 120; // Adjusted height to not cover the entire page

        // Draw the initial grid with validation
        if (validateGridParameters(yOffset, boxX, boxWidth, gridHeight, headerX)) {
            drawQuoteGrid(doc, yOffset, boxX, boxWidth, gridHeight, headerX, headers);
        } else {
            console.error("Invalid grid parameters for initial drawing.");
            return;
        }

        let lineCounter = 0;
        let isFirstPage = true;

        const sections = document.querySelectorAll(".materials");

        sections.forEach((section) => {
            const page_number = section.querySelector(`[id^=page]`).value;
            const description = section.querySelector(`[id^=description]`).value;
            const numTrusses = section.querySelector(`[id^=numTrusses]`).value;
            const perTrussWithMarkup = section.querySelector(".perTruss").innerText;
            const total = section.querySelector(".total").innerText;

            yOffset += 5;
            lineCounter++;

            if ((isFirstPage && lineCounter === 20) || (!isFirstPage && lineCounter % 30 === 0)) {
                doc.addPage();
                yOffset = 20; // Reset yOffset for new page
                lineCounter = 0;
                isFirstPage = false;

                // Draw grid for the new page with validation
                if (validateGridParameters(yOffset, boxX, boxWidth, gridHeight + 60, headerX)) {
                    drawQuoteGrid(doc, yOffset, boxX, boxWidth, gridHeight + 60, headerX, headers);
                } else {
                    console.error("Invalid grid parameters for new page drawing.");
                    return;
                }

                yOffset += 5;
            }

            doc.text(page_number, headerX[0], yOffset);
            doc.text(description, headerX[1], yOffset);
            doc.text(numTrusses, headerX[2], yOffset);
            doc.text(perTrussWithMarkup, headerX[3], yOffset);
            doc.text(total, headerX[4], yOffset);
        });

        if (extraChargesAmount > 0) {
            yOffset += 5;
            lineCounter++;

            if ((isFirstPage && lineCounter === 20) || (!isFirstPage && lineCounter % 30 === 0)) {
                doc.addPage();
                yOffset = 20; // Adjusted yOffset to leave space between header and content
                lineCounter = 0;
                isFirstPage = false;

                if (validateGridParameters(yOffset, boxX, boxWidth, gridHeight + 60, headerX)) {
                    drawQuoteGrid(doc, yOffset, boxX, boxWidth, gridHeight + 60, headerX, headers);
                } else {
                    console.error("Invalid grid parameters for extra charges drawing.");
                    return;
                }
            }

            doc.text(extraChargesDescription, headerX[1], yOffset);
            doc.text("1", headerX[2], yOffset);
            doc.text(extraChargesAmount.toFixed(2), headerX[3], yOffset);
            doc.text(extraChargesAmount.toFixed(2), headerX[4], yOffset);
        }
        // Adjust the totals box position to be at the bottom of the page
const totalsBoxX = 150;
const totalsBoxY = 240;  // Position at the bottom of the page, similar to the verse box
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

// Convert values to float and calculate tax and total
const subtotal = parseFloat(subTotal.replace("$", "") || 0);
const taxAmountValue = subtotal * 0.13;
const totalValue = subtotal + taxAmountValue;

// Format the numbers to include commas and dollar sign
const formatCurrency = (num) => {
    return "$" + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

// Display formatted currency values in the totals box
doc.text(formatCurrency(subtotal), totalsBoxX + totalsBoxWidth - 2, totalsBoxY + lineHeight - 2, {
    align: "right",
});
doc.text(formatCurrency(taxAmountValue), totalsBoxX + totalsBoxWidth - 2, totalsBoxY + lineHeight * 2 - 2, {
    align: "right",
});
doc.text(formatCurrency(totalValue), totalsBoxX + totalsBoxWidth - 2, totalsBoxY + lineHeight * 3 - 2, {
    align: "right",
});

// Draw lines between the totals
doc.line(totalsBoxX, totalsBoxY + lineHeight, totalsBoxX + totalsBoxWidth, totalsBoxY + lineHeight);
doc.line(totalsBoxX, totalsBoxY + lineHeight * 2, totalsBoxX + totalsBoxWidth, totalsBoxY + lineHeight * 2);


        
        // Position the GST/HST label and verse box at the bottom
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

        doc.save(`truss_quote_${customerName}.pdf`);
    });
}

function drawQuoteGrid(doc, yOffset, boxX, boxWidth, gridHeight, headerX, headers) {
    // Debugging output
    console.log("Drawing Grid:", { yOffset, boxX, boxWidth, gridHeight, headerX, headers });

    // Draw the border for the grid
    doc.rect(boxX, yOffset - 10, boxWidth, gridHeight);

    // Draw headers
    headers.forEach((header, i) => {
        doc.text(header, headerX[i], yOffset - 5);
    });

    // Draw line under header labels
    doc.line(boxX, yOffset -3, boxX + boxWidth, yOffset -3);

    // Draw vertical lines for the grid
    const gridTopY = yOffset - 10; // Top of the grid
    const gridBottomY = yOffset + gridHeight - 10; // Bottom of the grid

    // Vertical line positions based on column positions
    const verticalLineXPositions = [headerX[1] - 3, headerX[2] - 3, headerX[3] - 3, headerX[4] - 3];

    verticalLineXPositions.forEach(xPos => {
        if (Number.isFinite(xPos) && Number.isFinite(gridTopY) && Number.isFinite(gridBottomY)) {
            doc.line(xPos, gridTopY, xPos, gridBottomY);
        } else {
            console.error("Invalid arguments for drawing a vertical line:", { xPos, gridTopY, gridBottomY });
        }
    });
}

function validateGridParameters(yOffset, boxX, boxWidth, gridHeight, headerX) {
    if (!Number.isFinite(yOffset) || !Number.isFinite(boxX) || !Number.isFinite(boxWidth) || !Number.isFinite(gridHeight)) {
        console.error("Invalid grid parameters (must be finite numbers):", { yOffset, boxX, boxWidth, gridHeight });
        return false;
    }
    if (!Array.isArray(headerX) || headerX.some(x => !Number.isFinite(x))) {
        console.error("Invalid headerX array (must contain finite numbers):", { headerX });
        return false;
    }
    return true;
}

document.getElementById("getQuoteButton").addEventListener("click", generateQuote);
