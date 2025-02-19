const express = require('express');

const bodyParser = require('body-parser');
const { renderYatra, renderData, renderSitePlan } = require('./pdfgenerate');
const dotenv = require('dotenv');
const { connectDB } = require('./db');
const mongoose = require('mongoose');
const { calculateNumber } = require('./MailerLiteStuff/dharma-number');
const { getChakraInfo, margaNumberChakra } = require('./MailerLiteStuff/chakraUtils');
const fs = require('fs');
const cheerio = require('cheerio');
const cors = require('cors');


const axios = require('axios');
const MailerLite = require('@mailerlite/mailerlite-nodejs').default;


const app = express();

app.use(cors());
dotenv.config();

// Increase payload limit
app.use(bodyParser.json({ limit: '55200mb' }));
app.use(bodyParser.urlencoded({ limit: '55200mb', extended: true, parameterLimit: 10000000 }));


app.get("/", (req, res) => {
    res.send("Server is up and running!");
})

// Define the endpoint to fetch the date and rate
app.get('/update-rate', async (req, res) => {
    try {
        // Fetch and process the data
        const URL = 'https://www.federalreserve.gov/releases/h15/.';
        const response = await axios.get(URL);
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);

        // Extract the rate from the parent <th> with id="id93607b0"
        let rate_V;
        const rateParentTh = $('th').filter(function () {
            return $(this).text().trim().includes('Bank prime loan'); // Match based on inner text
        });

        if (rateParentTh.length) {
            // Find the associated <td class="data"> within the same row
            const rateTd = rateParentTh.closest('tr').find('td.data').last(); // Get the last <td class="data">
            rate_V = rateTd.text().trim(); // Get the rate value
        }


        let date_V;
        const dateParentTh = $('th#instruments'); // Find the <th> with id="instruments"
        if (dateParentTh?.length) {
            // Get the text for the date (from the header row)
            date_V = dateParentTh.nextAll('th').last().text().trim(); // Get the last <th> after instruments
        }

        // Add space between the year, month, and day
        if (date_V) {
            // Match the year, month, and day format and insert a space after the month
            date_V = date_V.replace(/(\d{4})([a-zA-Z]+)(\d{1,2})$/, '$1 $2 $3');
        }

        // If either rate or date is not found, send an error response
        if (!rate_V || !date_V) {
            return res.status(404).send('Could not find the rate or date.');
        }

        // Send the extracted data in the response
        res.json({
            date: date_V,
            rate: rate_V
        });

    } catch (err) {
        console.error('Error fetching the data:', err);
        res.status(500).send('Error fetching or processing the data.');
    }
});

app.post('/yantra-inputs', async (req, res) => {

    console.log("recieved response");
    const names = req.body.person_name;
    const year = req.body.year;
    const dob = req.body.dob;
    const chakra = req.body.chakra;

    const tableMain = {}, tableMonths = {}, tableTop = {};
    Object.keys(req.body).forEach(key => {
        if (key.startsWith('input')) {

            tableMain[key] = req.body[key];
        }
        else if (key.startsWith('month')) {
            tableMonths[key] = req.body[key];
        }
        else if (key.startsWith('top')) {
            tableTop[key] = req.body[key];
        }
    })

    try {
        var pdf2 = await renderYatra(names, dob, year, chakra, tableMain, tableMonths, tableTop)
        res.setHeader('Content-Type', 'application/pdf');
        console.log(names);
        res.setHeader('Content-Disposition', `attachment; filename="${names} Monthly & Daily Planner.pdf"`);

        console.log("sending response");
        res.send(pdf2);
    } catch (error) {
        console.error(error);
    }
});


app.post('/form1-inputs', async (req, res) => {
    const yourname = req.body.yourname;
    const yourdob = req.body.yourdob;
    const firstcat = req.body.firstcat;
    const secondcat = req.body.secondcat;
    const thirdcat = req.body.thirdcat;
    const marganum = req.body.marganum;


    const year = {}, marganumber = {}, birth = {};

    Object.keys(req.body).forEach(key => {

        if (key.startsWith('year')) {
            year[key] = req.body[key];
        }
        if (key.startsWith('marga_')) {
            marganumber[key] = req.body[key];
        }
        if (key.startsWith('birth')) {
            birth[key] = req.body[key];
        }
    });

    try {
        var pdf = await renderData(yourname, yourdob, firstcat, secondcat, thirdcat, marganum, year, marganumber, birth);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${yourname} Yearly Planner.pdf"`);

        console.log(yourname, yourdob);
        // Send the PDF buffer as the response body

        console.log("sending response");
        res.send(pdf);
    } catch (error) {
        console.error(error);
    }
});

const mailerlite = new MailerLite({
    api_key: process.env.MAILER_LITE_API_KEY
});

const formatDate = (date) => {
    const pad = (num) => (num < 10 ? `0${num}` : num); // Helper function to pad single-digit numbers
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

function sendMailtoMiler(email, first_name, date_of_birth) {
    const subscriberData = {
        email: email,
        fields: {
            first_name: first_name,
            name: first_name,
            date_of_birth: date_of_birth
        },
        groups: ['126813082419726124'],
        status: 'active',
        subscribed_at: formatDate(new Date()),
        ip_address: '',
        opted_in_at: '',
        optin_ip: '',
        unsubscribed_at: ''
    };

    mailerlite.subscribers?.createOrUpdate(subscriberData)
        .then(response => {
            console.log("Subscriber created through custom HTML form", response?.data);
        })
        .catch(err => {
            console.error("Error creating or updating subscriber:", err.message);

            if (err.response) {
                console.error(`Status: ${err.response.status}, Data:`, err.response.data);
            } else if (err.request) {
                console.error("No response received:", err.request);
            } else {
                console.error("Unexpected error:", err);
            }
        });
}


app.post('/add-subscriber', async (req, res) => {
    console.log("coming data", req.body);
    const { first_name, email, date_of_birth, recaptcha_token } = req?.body
    try {
        const secretKey = "6LdUvNAqAAAAADEr6Bh5vUWuQE-CsT_TnaakvI01";
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptcha_token}`;
        const { data } = await axios.post(verificationUrl);

        if (data.success || data.score >= 0.5) {
            sendMailtoMiler(email, first_name, date_of_birth)
        }
        console.log("Verified successfully:", { first_name, email, date_of_birth });
    } catch (error) {
        console.error("reCAPTCHA verification error:", error);
    }
    res.redirect('https://chakra-cycles.com/success')
})


app.post('/process-email-data', async (req, res) => {
    const event = req?.body.events?.[0] || req?.body;

    console.log("incoming Event =", JSON.stringify(req?.body));

    let name, email, dob;

    // Iterate over each event in the events array

    if (!!event?.subscriber) {
        name = event.subscriber.fields?.first_name || "user";
        dob = event.subscriber.fields?.date_of_birth;
        email = event.subscriber.email || "";
    } else if (event?.fields) {
        name = event?.fields?.first_name || "user";
        email = event?.email || "";
        dob = event?.fields?.date_of_birth;
    } else {
        name = event?.first_name || "user";
        email = event?.email || "";
        dob = event?.date_of_birth;
    }

    if (!email) {
        console.error("Missing email!")
        return res.status(400).json({ error: 'Missing email!' });
    }
    if (!dob) {
        console.error("Missing date of birth!")
        return res.status(400).json({ error: 'Missing date of birth!' });
    }

const chakraPages = [
    'https://reading.chakra-cycles.com/muladhara',
    'https://reading.chakra-cycles.com/Swadhistana',
    'https://reading.chakra-cycles.com/Manipura',
    'https://reading.chakra-cycles.com/Anahata',
    'https://reading.chakra-cycles.com/Vishuddha',
    'https://reading.chakra-cycles.com/Anja',
    'https://reading.chakra-cycles.com/Sahasrara',
    'https://reading.chakra-cycles.com/Narayanana',
    'https://reading.chakra-cycles.com/Brahmananda'
];

try {
    // Process the data to get the marga_number
    const margaNumber = await calculateNumber(dob);

    if (!margaNumber || !margaNumber?.margaNumber) {
        console.error('Error: margaNumber is undefined or invalid:', margaNumber);
        return res.status(500).json({ error: 'Failed to calculate marga number' });
    }

    // Get chakra info
    if (margaNumber && margaNumber?.margaNumber && margaNumber?.roots) {

        const chakraInfo = getChakraInfo(margaNumber?.roots);
        const margaChakra = margaNumberChakra(margaNumber?.margaNumber);
        if (!chakraInfo || !Array.isArray(chakraInfo) || chakraInfo.length < 3) {
            console.error('Error: chakraInfo is invalid:', chakraInfo);
            return res.status(500).json({ error: 'Failed to get chakra information' });
        }

        const params = {
            filter: {
                status: "active"
            },
            limit: 10
        };

        // Fetch subscribers
        const response = await mailerlite.subscribers.get(params);
        const allSubscribers = response?.data?.data;

        // // Check if API response is valid
        if (!allSubscribers || !Array.isArray(allSubscribers)) {
            console.error('Error: Invalid MailerLite response:', response);
            return res.status(500).json({ error: 'Failed to fetch subscribers' });
        }

        // Find the subscriber with the given email
        const target_subscriber = allSubscribers.find(sub => sub?.email === email);

        if (!target_subscriber) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        // Select the correct website link based on the margaNumber
        const margaIndex = Number(margaNumber.margaNumber) - 1;
        const website = chakraPages[margaIndex];
        if (!website) {
            console.error('Error: Invalid marga number index:', margaIndex);
            return res.status(500).json({ error: 'Invalid Marga number for website link' });
        }

        // Prepare update parameters
        const updateParams = {
            fields: {
                marganumber: margaNumber?.margaNumber,
                rulechakra: margaChakra,

                first_chakra: margaNumber?.roots[0],
                chakra_title_0_27: chakraInfo[0]?.title,
                chakra_description_0_27: chakraInfo[0]?.description,
                chakra_image_0_27: chakraInfo[0]?.image,

                second_chakra: margaNumber?.roots[1],
                chakra_title_27_54: chakraInfo[1]?.title,
                chakra_description_27_54: chakraInfo[1]?.description,
                chakra_image_27_54: chakraInfo[1]?.image,

                third_chakra: margaNumber?.roots[2],
                chakra_title_54_81: chakraInfo[2]?.title,
                chakra_description_54_81: chakraInfo[2]?.description,
                chakra_image_54_81: chakraInfo[2]?.image,

                email1_landing_link: website
            },
            status: "active"
        };

        // Construct email2_landing_link URL
        const email2LandingLinkp = `https://chakracycles.github.io/Chakra_Landing_Page/?` +
            `&first_chakra=${encodeURIComponent(updateParams.fields.first_chakra)}` +
            `&chakra_title_0_27=${encodeURIComponent(updateParams.fields.chakra_title_0_27)}` +
            `&chakra_description_0_27=${encodeURIComponent(updateParams.fields.chakra_description_0_27)}` +
            `&chakra_image_0_27=${encodeURIComponent(updateParams.fields.chakra_image_0_27)}` +
            `&marganumber=${encodeURIComponent(updateParams.fields.marganumber)}`;

        const email2LandingLinkptwo =
            `&second_chakra=${encodeURIComponent(updateParams.fields.second_chakra)}` +
            `&chakra_title_27_54=${encodeURIComponent(updateParams.fields.chakra_title_27_54)}` +
            `&chakra_description_27_54=${encodeURIComponent(updateParams.fields.chakra_description_27_54)}` +
            `&chakra_image_27_54=${encodeURIComponent(updateParams.fields.chakra_image_27_54)}` +
            `&rulechakra=${encodeURIComponent(updateParams.fields.rulechakra)}`

        const email2LandingLinkpthree =
            `&third_chakra=${encodeURIComponent(updateParams.fields.third_chakra)}` +
            `&chakra_title_54_81=${encodeURIComponent(updateParams.fields.chakra_title_54_81)}` +
            `&chakra_description_54_81=${encodeURIComponent(updateParams.fields.chakra_description_54_81)}` +
            `&chakra_image_54_81=${encodeURIComponent(updateParams.fields.chakra_image_54_81)}` +
            `&name=${encodeURIComponent(name)}`;

        // Add the email2_landing_link to updateParams
        updateParams.fields.email2_landing_linkp1 = email2LandingLinkp;
        updateParams.fields.email2_landing_linkp2 = email2LandingLinkptwo;
        updateParams.fields.email2_landing_linkp3 = email2LandingLinkpthree;

        // Update subscriber using their ID
        const updateResponse = await mailerlite.subscribers.update(target_subscriber.id, updateParams);

        if (!updateResponse || !updateResponse.data || !updateResponse.data.data) {
            console.error('Error: Failed to update subscriber:', updateResponse);
            return res.status(500).json({ error: 'Failed to update subscriber' });
        }

        const updatedData = {
            id: updateResponse.data.data.id,
            email: updateResponse.data.data.email,
            status: updateResponse.data.data.status,
            fields: updateResponse.data.data.fields
        };

        console.log('Subscriber updated:', updatedData);



    }
    // Send back the result and subscriber data
    return res.json({ message: "API executed successfully!" });
} catch (error) {
    console.error('Error processing data or updating subscriber:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
}
});

app.post('/property-feasibility', async (req, res) => {
    var link;


    const address = req.body.addressfield;
    const houseSize = req.body.housesize;
    const siteArea = req.body.sitearea;
    const year = req.body.yearbuilt;
    const zoning = req.body.firstcat;
    const dwelling = req.body.numofdwelling;
    const capital = req.body.capitalvalue;

    const Askingprice = req.body.asking;
    const comment = req.body.comment;

    const map = req.body.mapgenerated;
    const upload = req.body.siteplanuploaded;

    // const uploadedPlan = req.file.path;

    const developmentPlan = req.body.developmentplan;
    if (developmentPlan == 'townhouse') {
        link = "https://i.ibb.co/CWSdLdt/Street-V-300-DPI-1-2.jpg"
    }
    else if (developmentPlan == "residential") {
        link = "https://i.ibb.co/HNZ1b8t/Exterior-3-1.jpg";
    }
    else if (developmentPlan == 'duptrip') {
        link = "https://i.ibb.co/52Kssp3/Hawthorne-Streetscape-4k-Extra-Revision-1-1.jpg"
    }



    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const table = [address, houseSize + "m²", siteArea + "m²", developmentPlan, zoning, capital, dwelling + " dwellings", Askingprice, comment];
    const tags = ["Address", "House", "Land", "Development Plan", "Zoning", "Capital Value", "Possible Yield", "Asking Price", "Comments"]

    try {
        var pdf = await renderSitePlan(upload, map, currentYear, table, tags, link);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="SitePlan.pdf"`);

        console.log("sending response");
        res.send(pdf);
        // res.end(pdf);
    } catch (error) {
        console.error(error);
    }

});


// Define a schema
const formDataSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true }, // Changed to String
    borrowerFirstName: { type: String, required: true },
    borrowerLastName: { type: String, required: true },
    borrowerDateofBirth: { type: String, required: true },
    coBorrowerFirstName: { type: String, default: "" },
    coBorrowerLastName: { type: String, default: "" },
    coBorrowerDateofBirth: { type: String, default: "" },
    income: { type: Number, required: true },
    housingExpense: { type: Number, required: true },
    members: { type: Number, required: true },
    debt: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true }, // Changed to String
    market: { type: Number, required: true },
    firstMortgage: { type: Number, required: true },
    creditEvaluation: { type: [String], required: true }, // Changed to array of strings
    isThisForPurchase: { type: String, required: true },
});

// Create a model
const FormData = mongoose.model('ReverseFormData', formDataSchema);

// Route to handle form submission
app.post('/reverseinputs', async (req, res) => {
    // Connect to the database
    if (mongoose.connection.readyState === 0) {
        await connectDB();
    }

    const formData = new FormData({
        email: req.body.email,
        phoneNumber: req.body.phone,
        borrowerFirstName: req.body.firstName,
        borrowerLastName: req.body.lastName,
        borrowerDateofBirth: req.body.dob,
        coBorrowerFirstName: req.body.cofirstName || "",
        coBorrowerLastName: req.body.colastName || "",
        coBorrowerDateofBirth: req.body.codob || "",
        income: req.body.income,
        housingExpense: req.body.housingExpenses,
        members: req.body.householdMembers,
        debt: req.body.creditDebt,
        address: req.body.subject_property_address,
        city: req.body.subject_property_city,
        state: req.body.subject_property_state,
        zip: req.body.subject_property_zip,
        market: req.body.market_value,
        firstMortgage: req.body.first_mortgage_balance,
        creditEvaluation: req.body.credit_evaluation,
        isThisForPurchase: req.body.is_purchase,
    });

    try {
        await formData.save();
        res.send('Data saved successfully!');
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).send('Error saving data.');
    }
});

// Start the server
var port = 1337;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

