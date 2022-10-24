import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";
dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.post("/", async (req, res) => {
    const destUrl = req.body.destUrl
    const body = req.body;
    delete body.dest

  var data = await axios
    .post(
        destUrl,body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then(function (response) {
      return response;
    })
    .catch(function (error) {
      return error.response;
    });
    
  res.status(data.status).send(data.data);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`apps running on port ${port}`);
});
