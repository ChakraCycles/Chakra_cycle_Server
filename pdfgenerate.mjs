import puppeteer from 'puppeteer';
import ejs from 'ejs';
import dotenv from 'dotenv';
dotenv.config();

let html;
export async function generatePDF(name, code) {
    const browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ] ,
        executablePath: 
        process.env.NODE_ENV  === "production" 
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),

    });
    try {
        const page = await browser.newPage();

        await page.setContent(code);
        await page.emulateMediaType('screen');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });
        await browser.close();
       

        console.log("PDF generated successfully!");
        return pdfBuffer;
    } catch (e) {
        console.error("An error occurred:", e);
        resizeBy.send("Something wnet wrong while runnning puppeteer!");
        throw e; // Rethrow the error
    }
}

export async function renderData(yourname, yourdob, firstcat, secondcat, thirdcat, marganum, year, marganumber, birth, callback) {
    const data = {
        yourname,
        yourdob,
        firstcat,
        secondcat,
        thirdcat,
        marganum,
        year,
        marganumber,
        birth
    };
    html = await ejs.renderFile('template.ejs', data);

    const response = await generatePDF(yourname, html);

   // Now, you can send the PDF file as a download
   return response;
}

export default renderData;
