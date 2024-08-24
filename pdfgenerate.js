const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config(); 

let html;
 async function generatePDF(code , papersize) {
    const browser = await puppeteer.launch({

        headless: true,
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            // "--single-process",
            "--no-zygote",
            "--allow-file-access-from-file",
            "--enable-local-file-accesses"
        ],
        timeout: 6000000,
        protocolTimeout: 6000000,
        executablePath:
            process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),

    });
    // console.log(code);
    try {

        const page = await browser.newPage();

        await page.setContent(code);
        await page.emulateMediaType('screen');
        const pdfBuffer = await page.pdf({
            format: papersize,
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

async function renderData(yourname, yourdob, firstcat, secondcat, thirdcat, marganum, year, marganumber, birth, callback) {
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

    const response = await generatePDF(html , 'A4');
    return response;
}


async function renderYatra(name ,dob, year, chakra, inputmain, months, top,  callback) {
    const data = {
        name , 
        year,dob,
        chakra,
        inputmain,
        months,
        top
    };

    html = await ejs.renderFile('templateYatra.ejs', data);
    const response = await generatePDF(html , 'A4');

    return response;
}

 async function renderSitePlan( upload , map, currentyear, table, tag, link, callback) {

    // const imageUploaded = uploadedPlan;

    const data = {
        upload ,  map, currentyear, table, tag, link
    };

    html = await ejs.renderFile('realestate.ejs', data);
    
    // console.log(html);
    const response = await generatePDF(html , 'A5');

    // Now, you can send the PDF file as a download
    return response;
}


module.exports =
 { renderYatra, renderData, renderSitePlan };

