import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";
import cheerio from 'cheerio';
import qs from 'qs';
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


app.post("/transaksi", async (req, res) => {
  console.log('transaksiGet');
  try{
    console.log(req.body);
    const destUrl = req.body.destUrl;
    let data = await axios.get(destUrl);
    console.log(data.data);
    const text =  data.data;
    const regex1 = /R#(\d+)\s+([^@]+)\s+akan diproses @(\d+:\d+).+?Saldo ([^\s]+) - ([^\s]+) = ([^\s]+) ([^\d]+)/;
    const regex2 = /#R([^@]+)\s+([^@]+)\s+@([^@]+), status ([^@]+).+?Sal ([^\s]+)/;
    const regex3 = /R#([^@]+)\s+([^@]+)\s+SUKSES. SNRef: ([^@]+).+?Saldo ([^@]+) - ([^@]+)=([^@]+)\s/;
    const regex4 = /R#([^@]+)\s+([^@]+)\s+?GAGAL. . Saldo ([^@]+)+@(\d+:\d+)/;
    var  match = null
    var loop = 0;
    while(match == null){
      loop++
      if(loop == 1){
        match = text.match(regex1);
      }else if(loop == 2){
        match = text.match(regex2);
      }else if(loop == 3){
        match = text.match(regex3);
      }else if(loop == 4){
        match = text.match(regex4);
      }else{
        break;
      }
    }

    var jsonResult;
    if (match) {
      if(loop == 1){
        jsonResult = {
          Reference: match[1],
          Type: match[2],
          ProcessTime: match[3],
          StartingBalance: match[4],
          Amount: match[5],
          EndingBalance: match[6],
          TransactionType:  match[7],
          Status:"Menunggu Jawaban"
        };
      }else if(loop == 2){
        jsonResult = {
          Reference: match[1],
          Type: match[2],
          ProcessTime: match[3],
          Status: match[4],
          Amount: match[5]
        };
      }else if(loop == 3){
        jsonResult = {
          Reference: match[1],
          Type: match[2],
          SN: match[3],
          Status: "SUKSES",
          StartingBalance: match[4],
          Amount: match[5],
          EndingBalance: match[6],
          TransactionType:  match[7]
        };
      }else if(loop == 4){
        jsonResult = {
          Reference: match[1],
          Type: match[2],
          StartingBalance: match[3],
          Status: "GAGAL",
          ProcessTime: match[4]
        };
      }

      res.json(jsonResult);
    } else {
      if (text.includes("Nomor tujuan salah")) {
        jsonResult = {
          error: "Nomor tujuan salah"
        };
      }else if(text.includes("Saldo tidak cukup")){
        jsonResult = {
          error: "Saldo tidak cukup"
        };
      }else if(text.includes("Invalid Signature")){
        jsonResult = {
          error: "Invalid Signature"
        };
      } else {
        jsonResult = {
          error: text
        };
      }
      res.json(jsonResult);
    }
  }catch(e){
    res.json({ error: "terjadi kesalahan 0" });
  }
})

app.post("/saldo", async (req, res) => {
  console.log(req.body)
  try{
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: req.body.destUrl,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': req.body.cookie
      }
    };
    var respondLogin = "";
  
    await axios.request(config)
    .then((response) => {
      respondLogin = response.data;
    })
    .catch((error) => {
      console.log(error);
    });
    const $ = cheerio.load(respondLogin);
    const saldoElement = $('div[style*="text-transform:uppercase"]');
    const saldoText = saldoElement.text();
    const saldoMatch = saldoText.match(/Saldo:\s*([\d,.]+)/);
    if (saldoMatch) {
      res.json({ status:true, saldo: saldoMatch[1].replaceAll('','') });
    } else {
      res.json({ status:false, error: "terjadi kesalahan 1" });
    }
  }catch(e){
    res.json({ error: "terjadi kesalahan 0" });
  }
})

app.post("/produk", async (req, res) => {
  console.log(req.body)
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: req.body.destUrl,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': req.body.cookie
      }
    };
    
    var respondLogin = "";
  
    await axios.request(config)
    .then((response) => {
      respondLogin = response.data;
    })
    .catch((error) => {
      console.log(error);
    });
    const $ = cheerio.load(respondLogin);
    const data = [];
    $('tr').each((index, row) => {
      if (index !== 0) { // Melewatkan baris judul
        const columns = $(row).find('td');
        const rowData = {
          No: columns.eq(0).text().trim(),
          Provider: columns.eq(1).text().trim(),
          Kode_Produk: columns.eq(2).text().trim(),
          Keterangan: columns.eq(3).text().trim(),
          Harga: columns.eq(4).text().trim(),
          Status: columns.eq(5).text().trim(),
        };
        data.push(rowData);
      }
    });
    if(data.length == 0){
      res.json({ error: "terjadi kesalahan 1" });
    }else{
      res.json({ status:true, data:data});
    }
  } catch (error) {
    res.json({ error: "terjadi kesalahan 0" });
  }
  
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`apps running on port ${port}`);
});
