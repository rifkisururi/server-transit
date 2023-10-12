import unirest from "unirest";
var req = unirest('POST', 'http://103.137.8.26:60/action.php')
  .headers({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
  .send('username=KZ0453')
  .send('password=1234')
  .end(function (res) { 
    console.log(res)
    if (res.error) throw new Error(res.error); 
    console.log(res.raw_body);
  });
