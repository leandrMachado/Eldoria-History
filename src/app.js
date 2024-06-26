require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const knexfile = require('../knexfile');

app.db = require('knex')(knexfile[process.env.DB_ENVIRONMENT]);

app.db
  .raw("SELECT VERSION()")
  .then(() =>
    console.log(
        "[server] Connection to the database has been established successfully"
    )
  )
  .catch((err) => console.error("Unable to connect to the database:", err));



app.use(require("body-parser").json());

app.use(
  require("cors")({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const sessionPoll = require('pg').Pool;
var sessionDBaccess;

if (process.env.DB_ENVIRONMENT === 'prod') {
  sessionDBaccess = new sessionPoll({
    connectionString: knexfile[process.env.DB_ENVIRONMENT].connection
  })
}
else
  sessionDBaccess = new sessionPoll(knexfile[process.env.DB_ENVIRONMENT].connection)

app.use(
    session({
        store: new pgSession({
            pool: sessionDBaccess, 
            tableName: 'session'
        }),
        name: 'SID',
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
    })
)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, './public')))

app.use('/auths', require('./routes/auths.route')(app));
app.use('/pages', require('./routes/pages.route'));
app.use('/utilitys/users', require('./routes/users.route'));

app.get('/', (req, res, next) => {
    res.status(200).redirect('/pages');
})

app.use((req, res, next) => {
    const err = {};
    err.status = 404;
    err.message = "Page not found";
    next(err);
});

app.use((err, req, res, next) => {
    const { name, message, stack } = err;
    console.log(err);

    if (err.status === 404) res.status(404).json(message);
});

module.exports = app;
