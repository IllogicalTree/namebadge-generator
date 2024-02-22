const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const csv = require('csv-parser');
const fontkit = require("fontkit");

function getCenterX(pageWidth, textSize) {
    return (pageWidth - textSize) / 2;
}

async function generatePDFs(csvFilePath, pdfTemplatePath) {

    const pdfBytes = await fs.promises.readFile(pdfTemplatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const fontBytes = await fs.readFileSync('font.ttf');

    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', async data => {
            const forename = data.forename.toLowerCase();
            const surname = data.surname.toLowerCase();

            const [page] = await pdfDoc.copyPages(pdfDoc, [0]);
            const size = page.getSize();
            page.setFont(customFont);

            const forenameSize = 26.8;
            const forenameColour = rgb(0.3215686274509804, 0.23137254901960785, 0.6431372549019608);
            const surnameSize = 18.6;
            const surnameColour = rgb(0.6431372549019608, 0.49019607843137253, 0.7490196078431373);
            let multiplier = 1;
            
            if (customFont.widthOfTextAtSize(forename, forenameSize) > (size.width*0.9) || (customFont.widthOfTextAtSize(surname, surnameSize)) > (size.width*0.9)) {
                multiplier = 0.7;
            };

            page.drawText(forename, {
                x: getCenterX(size.width, customFont.widthOfTextAtSize(forename, forenameSize*multiplier)),
                y: (size.height/2) + 20,
                size: forenameSize*multiplier,
                color: forenameColour,
            });

            page.drawText(surname, {
                x: getCenterX(size.width, customFont.widthOfTextAtSize(surname, surnameSize*multiplier)),
                y: (size.height/2),
                size: surnameSize*multiplier,
                color: surnameColour,
            });

            pdfDoc.addPage(page);

        })
        .on('end', async () => {
            pdfDoc.removePage(0);
            const modifiedPdfBytes = await pdfDoc.save();
            await fs.promises.writeFile(outputFilePath, modifiedPdfBytes);
            console.log('PDF generated successfully.');
        })
}

const csvFilePath = 'names.csv'
const outputFilePath = 'output.pdf'
const pdfTemplatePath = 'template.pdf'

generatePDFs(csvFilePath, pdfTemplatePath)
.catch(error => console.error('Error generating PDFs:', error))