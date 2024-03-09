import express from 'express';
const app = express();
import bodyParser from 'body-parser';
import fs from 'fs';
import { generatePDF, renderData } from './pdfgenerate.mjs';
import { config } from 'dotenv';

config();

// Increase payload limit
app.use(bodyParser.json({ limit: '520mb' }));
app.use(bodyParser.urlencoded({ limit: '520mb', extended: true , parameterLimit: 1000000 }));


app.get("/" , (req,res) => {
    res.send("Server is up and running!");
})

app.post('/form1-inputs', async (req, res) => {

    console.log("recieved response");
    const yourname = req.body.yourname;
    const yourdob = req.body.yourdob;
    const firstcat = req.body.firstcat;
    const secondcat = req.body.secondcat;
    const thirdcat = req.body.thirdcat;
    const marganum = req.body.marganum;

   
    const year = {} , marganumber = {} , birth = {};

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
        var pdf = await renderData(yourname , yourdob , firstcat , secondcat , thirdcat , marganum , year , marganumber , birth);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${yourname}.pdf`);


        console.log(yourname , yourdob);
        // Send the PDF buffer as the response body
        
    console.log("sending response");
        res.send(pdf);
        } catch (error) {
          console.error(error);
        }
});


// Start the server
var port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

