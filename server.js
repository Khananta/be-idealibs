import express from 'express';
import usersRouter from './src/routes/user.js';
import filesRouter from './src/routes/file.js';
import cookieParser from 'cookie-parser';
import { config } from "dotenv";
import fileUpload from "express-fileupload"
import cors from 'cors'; // Import middleware CORS
config({ path: '.env' });

const app = express();
const port = 8080;

app.use(express.json());
app.use(cookieParser());
app.use(cors()); 
app.use(fileUpload())

app.use("/users", usersRouter);
app.use("/files", filesRouter);

app.get("/", (req, res) => {
res.send("welcome to idealibs")
})

app.listen(port, () => {
  console.log(`Server berjalan pada http://localhost:${port}`);
});