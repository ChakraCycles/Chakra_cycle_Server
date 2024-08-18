import express from 'express';
const app = express();
import bodyParser from 'body-parser';
import { renderYatra, renderData, renderSitePlan } from './pdfgenerate.mjs';
import dotenv from 'dotenv';
import { connectDB } from './db.js'; // Import the connectDB function
import mongoose from 'mongoose';

dotenv.config();

// Increase payload limit
app.use(bodyParser.json({ limit: '55200mb' }));
app.use(bodyParser.urlencoded({ limit: '55200mb', extended: true, parameterLimit: 10000000 }));


app.get("/", (req, res) => {
    res.send("Server is up and running!");
})
app.post('/yantra-inputs', async (req, res) => {

    console.log("recieved response");
    const names = req.body.name;
    const year = req.body.year;
    const dob = req.body.dob;
    const chakra = req.body.chakra;

    const tableMain = {}, tableMonths = {} , tableTop = {};
    Object.keys(req.body).forEach(key => {
        if (key.startsWith('input')) {

            tableMain[key] = req.body[key];
        }
        else if (key.startsWith('month')) {
            tableMonths[key] = req.body[key];
        }
        else if(key.startsWith('top')){
            tableTop[key] = req.body[key];
        }
    })

    try {
        var pdf2 = await renderYatra(names,dob, year, chakra, tableMain, tableMonths , tableTop)
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
    else if(developmentPlan == "residential"){
        link =  "https://i.ibb.co/HNZ1b8t/Exterior-3-1.jpg";
    }
    else if (developmentPlan == 'duptrip') {
        link = "https://i.ibb.co/52Kssp3/Hawthorne-Streetscape-4k-Extra-Revision-1-1.jpg"
    }



    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
 
    const table = [address, houseSize + "m²", siteArea + "m²", developmentPlan, zoning, capital, dwelling + " dwellings", Askingprice, comment];
    const tags = ["Address", "House", "Land", "Development Plan", "Zoning", "Capital Value", "Possible Yield", "Asking Price", "Comments"]

    try {
        var pdf = await renderSitePlan(upload, map , currentYear, table, tags, link);

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
var port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

