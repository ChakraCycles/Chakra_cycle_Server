import puppeteer from 'puppeteer';
import ejs from 'ejs';
import dotenv from 'dotenv';
dotenv.config();

let html;
export async function generatePDF(code) {
    const browser = await puppeteer.launch({  
       
        headless: true,
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            // "--single-process",
            "--no-zygote",
        ] ,
        timeout: 6000000,
        protocolTimeout: 6000000,
        executablePath: 
        process.env.NODE_ENV  === "production" 
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),

    });
    // console.log(code);
    try {

        const page = await browser.newPage();

        await page.setContent(code);
        await page.emulateMediaType('screen');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        await browser.close();
        return pdfBuffer;
        
    } catch (e) {
        console.error("An error occurred:", e);
        // resizeBy.send("Something went wrong while runnning puppeteer!");
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

    const response = await generatePDF(html);
   return response;
}


export async function renderYatra(year, chakra, inputmain,months, callback) {
    const data = {
        year,
        chakra,
        inputmain,
        months
    };
    html = await ejs.renderFile('templateYatra.ejs', data);
    // console.log(html);
    const response = await generatePDF(html);

    // Now, you can send the PDF file as a download
    return response;
}

export default {renderYatra , renderData};

