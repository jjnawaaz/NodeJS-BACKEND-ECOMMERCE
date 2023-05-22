const app = require("./app");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");
// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
    console.log(`Error:${err.message}`);
    console.log(`Shutting down the server due to uncaught Exception`)
    process.exit(1)
});

//config

dotenv.config({path:"backend/config/config.env"})


// Connecting to database
connectDatabase();




const server = app.listen(process.env.PORT, () => {
    console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

// Unhandled Promise Rejection
process.on("unhandledRejection", err => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to handled Promise Rejection`);
    server.close(() => {
        process.exit(1);
    });
});