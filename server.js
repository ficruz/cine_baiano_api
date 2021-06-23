const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
//const port = process.env.DB_PORT || 3001;
const port = 3001;

require("dotenv").config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};

const mysql = require("promise-mysql");
let connection;
let tempData = {};

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

function parsedFnc(obj) {
  let filmObjects;
  if (Array.isArray(obj)) filmObjects = obj;
  else filmObjects = Object.values(obj);

  const newObject = filmObjects.reduce(
    (accumulator, object) => {
      const id = object.cod_filme;

      //Create the new Object or grab it from the accumulator
      accumulator[id] = accumulator[id] || {};

      //loop through the properties to ful fill the object information
      const properties = Object.keys(object);
      properties.forEach((property) => {
        const value = object[property];

        //here chosse how to do it with information duplicated
        //if the property exists, check if the value is equal or different
        if (accumulator[id][property] && accumulator[id][property] != value) {
          //     //check if the property is an array so just push it
          if (Array.isArray(accumulator[id][property])) {
            if (accumulator[id][property].indexOf(value) === -1)
              accumulator[id][property].push(value);
          } else {
            accumulator[id][property] = [accumulator[id][property], value];
          }
          //if is not turn it into an array
        } else {
          accumulator[id][property] = value;
        }
      });

      return accumulator;
    },

    {}
  );
  return newObject;
}

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

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(fetchSqlData1);
    })
    .then((fetch1) => {
      resultObj.tipoSoporte.values = fetch1;
      return connection.query(fetchSqlData2);
    })
    .then((fetch2) => {
      resultObj.tipoMetragem.values = fetch2;
      return connection.query(fetchSqlData3);
    })
    .then((fetch3) => {
      resultObj.generoFilme.values = fetch3;
      connection.end();
      connection = {};
      return res.send(resultObj);
    })
    .catch((err) => {
      if (connection && connection.end) connection.end();
      return console.log(err);
    });
});

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

  const querybyfilter = `SELECT filme.cod_filme FROM filme LEFT JOIN genero_filme ON filme.cod_genero_filme = genero_filme.cod_genero_filme LEFT JOIN tipo_metragem ON filme.cod_tipo_metragem=tipo_metragem.cod_tipo_metragem
  WHERE des_nome_filme LIKE '%${nome}%'
  AND (IFNULL(sts_mudo,0) LIKE '${mudo}')
  AND (IFNULL(sts_colorido,0) LIKE '${colorido}')
  AND (IFNULL(sts_peb,0) LIKE '${peb}')
  AND (IFNULL(num_ano_lancamento,0)  LIKE '%${ano}%')
  AND (IFNULL(des_origem,0)  LIKE '%${origem}%')
  AND (IFNULL(des_fonte,0)  LIKE '%${fonte}%')
  AND (des_observacao LIKE '%${observacao}%')
  AND (IFNULL(des_sinopse,0) LIKE '%${sinopse}%')
  AND (IFNULL(des_genero_filme,0) LIKE '%${genero}%')
  AND (IFNULL(des_tipo_metragem,0) LIKE '%${metragem}%')
  AND (filme.cod_filme like '${codFilme}')
  AND (cod_filme in (select filme.cod_filme from filme LEFT JOIN filme_tiposuporte ON filme_tiposuporte.cod_filme=filme.cod_filme LEFT join tipo_suporte ON tipo_suporte.cod_tipo_suporte=filme_tiposuporte.cod_tipo_suporte
      WHERE IFNULL(des_tipo_suporte,0) LIKE '%${suporte}%'))
  AND (cod_filme in (SELECT filme.cod_filme FROM filme
      LEFT JOIN filme_subcategoria_pessoa ON filme.cod_filme=filme_subcategoria_pessoa.cod_filme
      LEFT JOIN pessoa ON filme_subcategoria_pessoa.cod_pessoa = pessoa.cod_pessoa
      WHERE IFNULL(pessoa.des_pessoa,0) LIKE '%${pessoasempresas}%'
      OR IFNULL(pessoa.des_pessoa02,0) LIKE '%${pessoasempresas}%'
      OR IFNULL(pessoa.des_pessoa03,0) LIKE '%${pessoasempresas}%')
      OR (cod_filme IN (SELECT filme.cod_filme FROM filme LEFT JOIN filme_companhiaprodutora ON filme.cod_filme = filme_companhiaprodutora.cod_filme LEFT JOIN companhia_produtora ON filme_companhiaprodutora.cod_companhia_produtora = companhia_produtora.cod_companhia_produtora
      WHERE (IFNULL(des_companhia_produtora,0) LIKE ('%${pessoasempresas}%'))
      OR (IFNULL(des_companhia_produtora02,0) LIKE ('%${pessoasempresas}%') )
      OR (IFNULL(des_companhia_produtora03,0) LIKE ('%${pessoasempresas}%') ))))`;

  let sql_main_response;

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(querybyfilter);
    })
    .then((resp) => {
      const returnEmpty = () => {
        return resp;
      };

      const continueQuery = () => {
        sql_main_response = resp.map((el) => el.cod_filme);
        return connection.query(
          `select fl.cod_filme, des_nome_filme AS Nome, ifnull(des_genero_filme,'-') AS Genero, num_ano_lancamento AS Ano, des_tipo_metragem AS Metragem, des_origem AS Origem, des_pessoa AS Diretor from filme fl left join genero_filme GF on fl.cod_genero_filme = GF.cod_genero_filme left join tipo_metragem TP on fl.cod_tipo_metragem = TP.cod_tipo_metragem left join filme_diretor FD on fl.cod_filme = FD.cod_filme left join pessoa PS on FD.cod_pessoa = PS.cod_pessoa where fl.cod_filme IN (${sql_main_response})`
        );
      };

      if (!resp[0]) {
        return returnEmpty();
      } else {
        return continueQuery();
      }
    })
    .then((resp) => {
      connection.end();

      connection = {};

      if (!resp[0]) {
        return res.send([]);
      } else {
        return res.send(Object.values(parsedFnc(resp)));
      }
    })
    .catch((err) => {
      if (connection && connection.end) connection.end();
      return console.log(err);
    });
});

app.get("/api/Institutional", (req, resp) => {
  iContentQuery = "SELECT * from conteudo_institucional";

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(iContentQuery);
    })
    .then((res) => {
      connection.end();
      return resp.send(res);
    })
    .catch((err) => {
      connection.end();
      return console.log(err);
    });
});

//** Fetch data about a specific film
// @ param {int} req - film code */
app.get("/api/aboutfilme", (req, res) => {
  const codfilme = parseInt(req.query.cod_filme);

  const filmeInfoQuery =
    `SELECT FF.des_nome_filme Nome, FF.des_nome_filme_alternativo NomeAlternativo, FF.dtc_lancamento, ifnull(des_fonte,'') AS des_fonte, ifnull(des_observacao,'') AS des_observacao, ifnull(des_contato,'')` +
    ` AS des_contato, ifnull(des_sinopse,'') AS des_sinopse,  ifnull(des_critica,'') AS des_critica,  ifnull(des_premio,'') AS des_premio,` +
    ` ifnull(des_copia_disponivel,'') AS des_copia_disponivel,  ifnull(des_link,'') AS des_link,` +
    ` ifnull(des_censura,'') AS des_censura,  ifnull(des_etreia,'') AS des_etreia, FF.cod_tipo_metragem, TM.des_tipo_metragem Metragem, ` +
    `FF.sts_mudo, FF.sts_colorido Colorido, FF.sts_destaque,` +
    `GF.des_genero_filme Genero, FF.cod_genero_filme, TS.des_tipo_suporte Suporte, FF.sts_peb sts_peb, FF.des_material_original ` +
    `Material_Original, FF.des_origem Origem, FF.num_ano_producao Ano_Producao, FF.num_ano_lancamento Ano_Lancamento, ifnull(FF.des_etreia,'')` +
    ` AS Estreia, FF.des_locacao Locacao, SB.des_subcategoria, PS.des_pessoa, ifnull(FF.des_credito_completo,'') AS Elenco FROM filme FF ` +
    `LEFT JOIN genero_filme GF ON FF.cod_genero_filme = GF.cod_genero_filme LEFT JOIN tipo_metragem TM ON FF.cod_tipo_metragem= ` +
    `TM.cod_tipo_metragem LEFT JOIN filme_subcategoria_pessoa FSP ON FF.cod_filme= FSP.cod_filme LEFT JOIN pessoa PS ON FSP.cod_pessoa=PS.cod_pessoa ` +
    `LEFT JOIN subcategoria SB ON FSP.cod_subcategoria = SB.cod_subcategoria LEFT JOIN filme_tiposuporte FT ON FT.cod_filme=FF.cod_filme` +
    ` LEFT JOIN tipo_suporte TS ON TS.cod_tipo_suporte= FT.cod_tipo_suporte WHERE FF.cod_filme LIKE ?`;

  const filmePhotos = `Select FF.cod_filme, PH.nom_foto_p, PH.nom_foto, PH.sts_cartaz FROM filme FF LEFT JOIN foto PH ON FF.cod_filme = PH.cod_filme WHERE FF.cod_filme LIKE ?`;

  let movieInfo = [];
  let moviePhoto = [];

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(filmeInfoQuery, codfilme);
    })
    .then((resp) => {
      movieInfo = resp;

      return connection.query(filmePhotos, codfilme);
    })
    .then((resp) => {
      resp[0].nom_foto
        ? (moviePhoto = resp.map((el) => {
            el.sts_cartaz === "S"
              ? (movieInfo[0]["Portrait"] = {
                  nom_foto: el.nom_foto
                    .replace(/\s+/g, "+")
                    .replace(".JPG", ".jpg")
                    .replace(".BMP", ".bmp")
                    .replace(".PNG", ".png"),
                  nom_foto_p: el.nom_foto_p
                    .replace(/\s+/g, "+")
                    .replace(".JPG", ".jpg")
                    .replace(".BMP", ".bmp")
                    .replace(".PNG", ".png"),
                })
              : null;

            return {
              ...el,
              ["nom_foto"]: el.nom_foto
                .replace(/\s+/g, "+")
                .replace(".JPG", ".jpg")
                .replace(".BMP", ".bmp")
                .replace(".PNG", ".png"),
              ["nom_foto_p"]: el.nom_foto_p
                .replace(/\s+/g, "+")
                .replace(".JPG", ".jpg")
                .replace(".BMP", ".bmp")
                .replace(".PNG", ".png"),
            };
          }))
        : null;

      movieInfo[0]["photo"] = moviePhoto;

      connection.end();

      return res.send(movieInfo);
    })
    .catch((err) => {
      if (connection && connection.end) connection.end();
      return console.log(err);
    });
});

app.get("/news", (req, res) => {
  const sqlQuery = `SELECT cod_noticia, des_titulo, des_texto, des_release, des_foto, des_foto_p, DATE_FORMAT(dtc_noticia, '%d/%m/%Y') as date, sts_destaque, sts_ativo, dtc_noticia from cms_noticia ORDER BY dtc_noticia`;

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(sqlQuery);
    })
    .then((resp) => {
      connection.end();
      return res.send(resp);
    })
    .catch((err) => {
      if (connection && connection.end) connection.end();
      return console.log(err);
    });
});

app.patch("/news/edit", (req, resp) => {
  const queryData = req.body.info;

  const patchNewsQuery =
    "UPDATE cms_noticia SET des_titulo=?,des_release=?,des_texto=?,des_foto=?,sts_destaque=?,sts_ativo=?,des_foto_p=? WHERE cod_noticia LIKE ? AND cod_noticia>0";

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query({ sql: patchNewsQuery }, [
        queryData.des_titulo,
        queryData.des_release,
        queryData.des_texto,
        queryData.des_foto,
        queryData.sts_destaque,
        queryData.sts_ativo,
        queryData.des_foto_p,
        queryData.cod_noticia,
      ]);
    })
    .then((res) => {
      connection.end();

      return resp.send("Successfully Modified Entry");
    })
    .catch((err) => {
      connection.end();
      return console.log(err);
    });
});

app.post("/news/new", (req, resp) => {
  const queryData = req.body.info;

  const addNewsQuery =
    "INSERT INTO cms_noticia (des_titulo,des_release,des_texto,dtc_noticia,des_foto,sts_destaque,sts_ativo,des_foto_p) VALUES (?,?,?,NOW(),?,?,?,?);";

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query({ sql: addNewsQuery }, [
        queryData.des_titulo,
        queryData.des_release,
        queryData.des_texto,
        queryData.des_foto,
        queryData.sts_destaque,
        queryData.sts_ativo,
        queryData.des_foto_p,
      ]);
    })
    .then((res) => {
      connection.end();

      return resp.send({
        texto: "Successfully added new entry",
        insertId: res.insertId,
      });
    })
    .catch((err) => {
      connection.end();
      return console.log(err);
    });
});

app.patch("/news/delete", (req, resp) => {
  const sqlconnect = async () => {
    try {
      const connect = await mysql.createConnection(config);
      const sqlDelete = await connect.query(
        "DELETE FROM cms_noticia WHERE cod_noticia LIKE ? AND COD_NOTICIA>16",
        [req.body.cod_noticia]
      );

      resp.send("Borrado exitosamente");
    } catch (err) {
      console.log(err);
    }
  };
  sqlconnect();
});

app.get("/movies/initialdata", (req, resp) => {
  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(
        "SELECT cod_subcategoria AS value,des_subcategoria AS label FROM subcategoria"
      );
    })
    .then((res) => {
      tempData["subcategoria"] = res;
      return connection.query(
        "SELECT cod_filme FROM filme ORDER BY cod_filme DESC LIMIT 1"
      );
    })
    .then((res) => {
      tempData["cod_filme"] = res;
      return connection.query(
        `SELECT cod_pessoa AS value, CONCAT(des_pessoa," / ",des_pessoa02) AS label FROM pessoa`
      );
    })
    .then((res) => {
      tempData["pessoa"] = res;
      return connection.query(
        "SELECT cod_pessoa FROM pessoa ORDER BY cod_pessoa DESC LIMIT 1"
      );
    })
    .then((res) => {
      tempData["cod_pessoa"] = res;

      connection.end();
      return resp.send(tempData);
    })
    .catch((err) => {
      connection.end();
      return console.log(err);
    });
});

app.post("/movies/new", (req, resp) => {
  const cod_filme = req.body.lastMovieID.cod_filme + 1;

  const photoData = req.body.photo.map((el) => {
    return [cod_filme, el.thumb, el.large, el.sts_cartaz ? "S" : "N"];
  });
  const personData = req.body.pessoa.map((el) => {
    return [cod_filme, el.cod_subcategoria, el.cod_pessoa];
  });

  const movieData = [
    cod_filme,
    req.body.info.des_nome_filme,
    req.body.info.des_nome_filme_alternativo,
    req.body.info.dtc_lancamento,
    req.body.info.des_fonte,
    req.body.info.des_observacao,
    req.body.info.des_material_original,
    req.body.info.des_origem,
    req.body.info.des_contato,
    req.body.info.cod_genero_filme,
    req.body.info.sts_colorido,
    req.body.info.sts_peb,
    req.body.info.cod_tipo_metragem,
    req.body.info.sts_mudo,
    req.body.info.num_ano_producao,
    req.body.info.num_ano_lancamento,
    req.body.info.des_sinopse,
    req.body.info.des_critica,
    req.body.info.des_premio,
    req.body.info.des_copia_disponivel,
    req.body.info.des_link,
    req.body.info.des_credito_completo,
    req.body.info.sts_destaque,
    req.body.info.des_censura,
    req.body.info.des_locacao,
    req.body.info.des_etreia,
  ];

  const insertMovie =
    `insert into filme (cod_filme,des_nome_filme,des_nome_filme_alternativo,dtc_lancamento,des_fonte,des_observacao,des_material_original, des_origem` +
    `,des_contato,cod_genero_filme,sts_colorido,sts_peb,cod_tipo_metragem,sts_mudo,num_ano_producao,num_ano_lancamento,des_sinopse,des_critica` +
    `,des_premio,des_copia_disponivel,des_link,des_credito_completo,sts_destaque,des_censura,des_locacao,des_etreia) VALUES ? `;

  const insertDirector = `INSERT INTO filme_diretor (cod_filme,cod_pessoa) VALUES ? `;
  const insertProducer = `INSERT INTO filme_produtor (cod_filme,cod_pessoa) VALUES ?`;

  const insertFilmeSubcat = `INSERT INTO filme_subcategoria_pessoa (cod_filme,cod_subcategoria,cod_pessoa) VALUES ?`;
  const insertPhoto = `INSERT INTO foto (cod_filme,nom_foto_p,nom_foto,sts_cartaz) VALUES ?`;

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(insertMovie, [[movieData]]);
    })
    .then((res) => {
      return photoData[0]
        ? connection.query(insertPhoto, [photoData])
        : console.log("pass");
    })
    .then((res) => {
      return personData[0]
        ? connection.query(insertFilmeSubcat, [personData])
        : console.log("pass");
    })
    .then((res) => {
      connection.end();

      return resp.send({ cod_filme: cod_filme });
    })
    .catch((err) => {
      console.log(err);
      return connection.end();
    });
});

app.patch("/movies/edit", (req, resp) => {
  const editMovieQuery =
    "UPDATE filme SET des_nome_filme=?,des_nome_filme_alternativo=?,dtc_lancamento=?,des_fonte=?,des_observacao=?," +
    "des_material_original=?,des_origem=?,des_contato=?,cod_genero_filme=?,sts_colorido=?,sts_peb=?,cod_tipo_metragem=?,sts_mudo=?," +
    "num_ano_producao=?,num_ano_lancamento=?,des_sinopse=?,des_critica=?,des_premio=?,des_copia_disponivel=?,des_link=?,des_credito_completo=?," +
    "sts_destaque=?,des_censura=?,des_locacao=?,des_etreia=? WHERE cod_filme LIKE ? AND cod_filme>0;";

  const movieData = [
    req.body.info.des_nome_filme,
    req.body.info.des_nome_filme_alternativo,
    req.body.info.dtc_lancamento,
    req.body.info.des_fonte,
    req.body.info.des_observacao,
    req.body.info.des_material_original,
    req.body.info.des_origem,
    req.body.info.des_contato,
    req.body.info.cod_genero_filme,
    req.body.info.sts_colorido,
    req.body.info.sts_peb,
    req.body.info.cod_tipo_metragem,
    req.body.info.sts_mudo,
    req.body.info.num_ano_producao,
    req.body.info.num_ano_lancamento,
    req.body.info.des_sinopse,
    req.body.info.des_critica,
    req.body.info.des_premio,
    req.body.info.des_copia_disponivel,
    req.body.info.des_link,
    req.body.info.des_credito_completo,
    req.body.info.sts_destaque,
    req.body.info.des_censura,
    req.body.info.des_locacao,
    req.body.info.des_etreia,
    req.body.movieID,
  ];

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(editMovieQuery, movieData);
    })
    .then((res) => {
      connection.end();
      return resp.send(res);
    })
    .catch((err) => {
      connection.end();
      return console.log(err);
    });
});

app.post("/movies/delete", (req, resp) => {
  const id = req.body.id;

  const deleteFilmPerson = `delete from filme_subcategoria_pessoa where cod_filme like ? and cod_filme>1`;
  const deleteFilm = `delete from filme where cod_filme like ? and cod_filme>3216`;

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(deleteFilmPerson, [id]);
    })
    .then((res) => {
      return connection.query(deleteFilm, [id]);
    })
    .then((res) => {
      connection.end();
      return resp.send("Success");
    })
    .catch((err) => {
      connection.end();
      return console.log(err);
    });
  return;
});

app.get("/people/InitialData", (req, resp) => {
  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(
        `SELECT cod_pessoa AS value, CONCAT(des_pessoa,"  /  ",des_pessoa02) AS label FROM pessoa`
      );
    })
    .then((res) => {
      tempData["pessoa"] = res;
      return connection.query(
        "SELECT cod_pessoa FROM pessoa ORDER BY cod_pessoa DESC LIMIT 1"
      );
    })
    .then((res) => {
      tempData["cod_pessoa"] = res;

      connection.end();
      return resp.send(tempData);
    })
    .catch((err) => console.log(err));
});

app.post("/people/new", (req, resp) => {
  const personData = req.body.pessoa.map((el) => {
    return [
      el.cod_pessoa,
      el.des_pessoa,
      el.des_pessoa02,
      el.des_pessoa03,
      null,
    ];
  });

  const insertPeople = `INSERT INTO pessoa (cod_pessoa,des_pessoa,des_pessoa02,des_pessoa03,cod_companhia_produtora) VALUES ? `;

  mysql
    .createConnection(config)
    .then((con) => {
      connection = con;
      return connection.query(insertPeople, [personData]);
    })
    .then((res) => {
      connection.end();
      return resp.send("Modificado con exito");
    })
    .catch((err) => console.log(err));
});

app.get("/", (req, res) => {
  res.send("Welcome to the Cinema Baiano server");
});

app.listen(port, () => {
  console.log(`server listening at port http://localhost:${port}`);
});
