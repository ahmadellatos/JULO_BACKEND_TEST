const axios = require("axios");

let config = {
    method: "get",
    url: "http://localhost:3000/api/v1/wallet",
    headers: {
        Authorization: "Token eyJhbGciOiJIUzI1NiJ9.ZWEwMjEyZDMtYWJkNi00MDZmLThjNjctODY4ZTgxNGEyNDM2.nuL9WQpegiNAq1Sw77Djp-xYK7tnMmgqUZRsDS_chIM",
    },
};

axios(config)
    .then(response => {
        console.log(JSON.stringify(response.data));
    })
    .catch(error => {
        console.log(error);
    });
