import connectDB from "./db/index.js";
import { configDotenv } from "dotenv";
import { app } from "./app.js";
configDotenv({path:'./.env'})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server running at ${process.env.PORT}`);
        
    })
}).catch((err)=>{
    console.log("MONGOBD connection error",err);
    
})