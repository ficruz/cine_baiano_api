const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3001;

const sql = require("mssql");
const config = {
  user: "cinema",
  password: "paobrasil1",
  server: "mssql.filmografiabaiana.com.br",
  database: "cinema",
};

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

//** Fetch data about a specific film
// @ param {int} req - film code */
app.get("/api/aboutfilme", (req, res) => {
  const codfilme = req.query.cod_filme;
  const filmeInfoQuery = `SELECT FF.des_nome_filme [Nome], TM.des_tipo_metragem [Metragem], REPLACE(REPLACE(FF.sts_mudo,'N','Sonoro'),'Y','Mudo') [Sonoro], GF.des_genero_filme [Genero], TS.des_tipo_suporte [Suporte], REPLACE(REPLACE(FF.sts_peb,'S','B&P'),'N','') [PyB], FF.des_material_original [Material_Original], FF.des_origem [Origem], FF.num_ano_producao [Ano_Producao], FF.num_ano_lancamento [Ano_Lancamento], FF.des_etreia [Estreia], FF.des_locacao [Locacao], SB.des_subcategoria, PS.des_pessoa, FF.des_credito_completo [Elenco] FROM filme FF LEFT JOIN genero_filme GF ON FF.cod_genero_filme = GF.cod_genero_filme LEFT JOIN tipo_metragem TM ON FF.cod_tipo_metragem= TM.cod_tipo_metragem LEFT JOIN filme_subcategoria_pessoa FSP ON FF.cod_filme= FSP.cod_filme LEFT JOIN pessoa PS ON FSP.cod_pessoa=PS.cod_pessoa JOIN subcategoria SB ON FSP.cod_subcategoria = SB.cod_subcategoria FULL OUTER join filme_tiposuporte FT ON FT.cod_filme=FF.cod_filme FULL OUTER join tipo_suporte TS ON TS.cod_tipo_suporte= FT.cod_tipo_suporte WHERE FF.cod_filme LIKE ${codfilme}`;

  console.log(req.query.cod_filme);
  sql
    .connect(config)
    .then(() => sql.query(`${filmeInfoQuery}`))
    .then((result) => {
      return res.send(result.recordset);
    });
});

//** Fetch main search */
app.get("/api/advancedsearch", (req, res) => {
  const nome = req.query.nome;
  const mudo = req.query.cinemamudo || "%";
  const genero = req.query.genero;
  const metragem = req.query.metragem;
  const suporte = req.query.soporte;
  const colorido = req.query.colorido || "%";
  const peb = req.query.peb || "%";
  const ano = req.query.ano;
  const origem = req.query.origem;
  const fonte = req.query.fontes;
  const observacao = req.query.observacao;
  const sinopse = req.query.sinopse;
  const pessoasempresas = req.query.pessoasempresas;
  const codFilme = req.query.codfilme;

  let array = [];

  console.log(req.query);

  const querybyfilter = `SELECT filme.cod_filme FROM filme LEFT JOIN genero_filme ON FILME.cod_genero_filme = genero_filme.cod_genero_filme LEFT JOIN tipo_metragem ON FILME.cod_tipo_metragem=tipo_metragem.cod_tipo_metragem   
  WHERE [des_nome_filme] LIKE '%${nome}%' 
  AND (ISNULL([sts_mudo],0) LIKE '${mudo}')
  AND (ISNULL([sts_colorido],0) LIKE '${colorido}')
  AND (ISNULL(sts_peb,0) LIKE '${peb}')
  AND (ISNULL(num_ano_lancamento,0)  LIKE '%${ano}%')
  AND (ISNULL(des_origem,0)  LIKE '%${origem}%')
  AND (ISNULL(des_fonte,0)  LIKE '%${fonte}%')
  AND (des_observacao LIKE '%${observacao}%')
  AND (ISNULL(des_sinopse,0) LIKE '%${sinopse}%')
  AND (ISNULL(des_genero_filme,0) LIKE '%${genero}%')
  AND (ISNULL(des_tipo_metragem,0) LIKE '%${metragem}%')
  AND (filme.cod_filme like '${codFilme}')
  AND (cod_filme in (select FILME.cod_filme from filme FULL OUTER join filme_tiposuporte ON filme_tiposuporte.cod_filme=filme.cod_filme FULL OUTER join tipo_suporte ON tipo_suporte.cod_tipo_suporte=filme_tiposuporte.cod_tipo_suporte 
      WHERE ISNULL(des_tipo_suporte,0) LIKE '%${suporte}%'))
  AND (cod_filme in (SELECT FILME.cod_filme FROM filme 
      LEFT JOIN filme_subcategoria_pessoa ON filme.cod_filme=filme_subcategoria_pessoa.cod_filme 
      LEFT JOIN pessoa ON filme_subcategoria_pessoa.cod_pessoa = pessoa.cod_pessoa
      WHERE ISNULL(pessoa.des_pessoa,0) LIKE '%${pessoasempresas}%'
      OR ISNULL(pessoa.des_pessoa02,0) LIKE '%${pessoasempresas}%' 
      OR ISNULL(pessoa.des_pessoa03,0) LIKE '%${pessoasempresas}%') 
      OR (cod_filme IN (SELECT FILME.cod_filme FROM FILME LEFT JOIN filme_companhiaprodutora ON filme.cod_filme = filme_companhiaprodutora.cod_filme LEFT JOIN companhia_produtora ON filme_companhiaprodutora.cod_companhia_produtora = companhia_produtora.cod_companhia_produtora 
      WHERE (ISNULL(des_companhia_produtora,0) LIKE ('%${pessoasempresas}%')) 
      OR (ISNULL(des_companhia_produtora02,0) LIKE ('%${pessoasempresas}%') ) 
      OR (ISNULL(des_companhia_produtora03,0) LIKE ('%${pessoasempresas}%') ))))`;

  sql
    .connect(config)
    .then(() => {
      return sql.query(querybyfilter);
    })
    .then((result) => {
      const sql_main_response = result.recordset.map((el) => el.cod_filme);

      return sql_main_response[0]
        ? sql.query(`SELECT fl.cod_filme, fl.num_ano_lancamento as Ano, FL.des_nome_filme as Nome, GF.des_genero_filme AS Genero, TM.des_tipo_metragem AS Metragem, FL.des_origem as Origem,
      STUFF((SELECT ', ' + PS.des_pessoa FROM filme_subcategoria_pessoa FS join pessoa PS ON FS.cod_pessoa=PS.cod_pessoa WHERE FS.cod_subcategoria LIKE '1'
      AND FS.cod_filme = FL.cod_filme FOR XML PATH('')),1,2,'') AS Director FROM FILME FL JOIN genero_filme GF ON FL.cod_genero_filme=GF.cod_genero_filme 
      JOIN tipo_metragem TM ON TM.cod_tipo_metragem = FL.cod_tipo_metragem WHERE FL.cod_filme IN (${sql_main_response})`)
        : ["Empty"];
    })
    .then((result) => {
      return res.send(result.recordset);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/api/InitialData", (req, res) => {
  const fetchSqlData1 = "select distinct des_tipo_suporte from tipo_suporte;";
  const fetchSqlData2 = "select distinct des_tipo_metragem from tipo_metragem;";
  const fetchSqlData3 = "select distinct des_genero_filme from genero_filme";

  let resultObj = {
    tipoSoporte: {
      label: "Tipo Suporte",
      values: [],
    },
    tipoMetragem: {
      label: "Tipo Metragem",
      values: [],
    },

    generoFilme: {
      label: "Genero Filme",
      values: [],
    },
  };
  sql
    .connect(config)
    .then(() => {
      return sql.query(fetchSqlData1);
    })
    .then((result) => {
      resultObj.tipoSoporte.values = result.recordset;
    })
    .then(() => {
      return sql.query(fetchSqlData2);
    })
    .then((result) => {
      resultObj.tipoMetragem.values = result.recordset;
    })
    .then(() => {
      return sql.query(fetchSqlData3);
    })
    .then((result) => {
      resultObj.generoFilme.values = result.recordset;
      return res.send(resultObj);
    })
    .catch((err) => {
      // ... error checks
    });
});

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, () => {
  console.log(`server listening at port http://localhost:${port}`);
});
