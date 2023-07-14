const express = require('express');
const app = express();
const mysql = require('mysql');
require('dotenv').config();
const routes = require('./route/route'); 

app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
}); 
 
connection.connect((err) => {
  if (err) {   
    handleConnectionError(err);
    createDatabaseIfNotExists();
    return;
  }
  console.log('Hello! I am connected to the MySQL database and running with the server.');
});
 
const handleConnectionError = (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  } else {
    console.error('Error connecting to the database:', err.stack);
  }
};

const createDatabaseIfNotExists = () => {
  const createDbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  createDbConnection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
    }

    createDbConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE}`, (err) => {
      if (err) {
        console.error('Error creating the database:', err.stack);
      } else {
        console.log('Database created successfully!');
      }
  
      createDbConnection.end();
    }); 
  });
};

app.use((req, _res, next) => {
  req.con = connection;
  next();
});

app.use('/', routes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Hello! I am the local server, and I am running at http://localhost:${port}`);
});


