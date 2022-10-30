import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";
dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", async (req, res) => {
  
  let data = await axios.get('https://api.ipify.org/?format=json');
  console.log(data.data.ip);
  res.send(
    JSON.stringify({
      "ip server" : data.data.ip,
      "version"   : "1.0.0", 
    })
  );
})

app.post("/", async (req, res) => {
  const method = req.body.method;
  const destUrl = req.body.destUrl;
  if (method.toLowerCase() == "post") {
    const Authorization = req.body.authorization;
    const body = req.body;
    delete body.dest;
    delete body.Authorization;

    var headersPost;
    if (Authorization == undefined) {
      headersPost = {
        "Content-Type": "application/json",
      };
    } else {
      headersPost = {
        "Content-Type": "application/json",
        Authorization: Authorization,
      };
    }

    var data = await axios
      .post(destUrl, body, {
        headers: headersPost,
      })
      .then(function (response) {
        return response;
      })
      .catch(function (error) {
        return error.response;
      });

      try{
        res.status(data.status).send(data.data);

      }catch{
        res.status(400).send("terjadi kesalahan");
      }

  } else {
    let data = await axios.get(destUrl);
    res.status(data.status).send(data.data);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`apps running on port ${port}`);
});
