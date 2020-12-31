const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
app = express();
const port = 3001;

const sql = require("mssql");
const config = {
  user: "cinema",
  password: "paobrasil1",
  server: "mssql.filmografiabaiana.com.br",
  database: "cinema",
};

// const pool = new sql.ConnectionPool({config});
// const poolConnect = pool.connect();

// pool.on("error", (err) => {
//   console.log(err);
// });

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/buscanombre", (req, res) => {
  // const objeto = req.body.buscaNombre;
  // const obj2 = req.body.test;
  const objeto = req.query.q;
  //const obj4 = req.param;

  //console.log(obj3);
  const sqlbusca = `SELECT * FROM [cinema].[dbo].[filme] WHERE [des_nome_filme] LIKE '%${objeto}%'`;

  sql
    .connect(config)
    .then(() => {
      return sql.query(sqlbusca);
    })
    .then((result) => {
      console.log(result.recordset);
      return res.send(result.recordset);
    })
    .catch((err) => {
      // ... error checks
    });

  sql.on("error", (err) => {
    // ... error handler
  });
});

app.get("/birds", (req, res) => {
  res.send("pajarillos pajarillos1");
});

app.get("/", (req, res) => {
  res.send("hello world 2");
});

app.listen(port, () => {
  console.log(`server listening at port http://localhost:${port}`);
});
