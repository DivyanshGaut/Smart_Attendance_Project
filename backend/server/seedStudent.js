const mongoose = require("mongoose");
const Student = require("./models/Student");

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/attendance_system";

mongoose.connect(mongoUri);

async function createStudent() {
  try {
    await Student.create([
      {
      SrNo: 2,
      studentName: "Aadrika Srivastava",
      rollNo: "2401331520002",
      password: "0241CSAI138",
      section: "CSE-A",
    },
    {
      SrNo: 3,
      studentName: "Aakarsh Krishna ",
      rollNo: "2401331520003",
      password: "0241CSAI006",
      section: "CSE-A",
  },
  {
      SrNo: 4,
      studentName: "Aakrity Singh ",
      rollNo: "2401331520004",
      password: "0241CSAI048",
      section: "CSE-A",
  },
  {
      SrNo:5,
      studentName: "Aayushi gupta",
      rollNo: "2401331520005",
      password: "0241CSAI141",
      section: "CSE-A",
  },
  {
      SrNo: 6,
      studentName: "Abdus sami",
      rollNo: "2401331520006",
      password: "0241CSAI032",
      section: "CSE-A",
  },
  {
      SrNo: 7,
      studentName: "Abeer saxena",
      rollNo: "2401331520007",
      password: "0241CSAI077",
      section: "CSE-A",
  },{
      SrNo: 8,
      studentName: "Abhay Chauhan",
      rollNo: "2401331520008",
      password: "0241CSAI049",
      section: "CSE-A",
  },{
      SrNo: 9,
      studentName: "Abhay Pratap singh",
      rollNo: "240133152000",
      password: "0241CSAI026",
      section: "CSE-A",},
      {
      SrNo: 10,
      studentName: "Abhijeet yadav",
      rollNo: "2401331520010",
      password: "0241CSAI182",
      section: "CSE-A",
      },{

      SrNo: 11,
      studentName: "Abhishek",
      rollNo: "24013315200",
      password: "0241CSAI162",
      section: "CSE-A",},
      {
      SrNo: 12,
      studentName: "Abhishek Agarawal",
      rollNo: "2401331520012",
      password: "0241CSAI123",
      section: "CSE-A",
      },
      {
      SrNo: 13,
      studentName: "Abhishek Raj",
      rollNo: "2401331520013",
      password: "0241CSAI225",
      section: "CSE-A",
      },{
      SrNo: 14,
      studentName: "Adarsh Krishna",
      rollNo: "2401331520014",
      password: "0241CSAI075",
      section: "CSE-A",
      },{
      SrNo: 15,
      studentName: "Aditi Gupta",
      rollNo: "2401331520015",
      password: "0241CSAI075",
      section: "CSE-A",
      },{
      SrNo: 53,
      studentName: "Aryansh Gupta",
      rollNo: "2401331520053",
      password: "0241CSAI021",
      section: "CSE-A",
    },
      {
      SrNo: 69,
      studentName: "Divyansh Gautam",
      rollNo: "2401331520069",
      password: "0241CSAI022",
      section: "CSE-A",
      },
      {
        SrNo: 70,
      studentName: "Divyanshi Goyal",
      rollNo: "2401331520070",
      password: "0241CSAI095",
      section: "CSE-A",
      }
      
      

    ]);

    console.log("✅ Student created with hashed password");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createStudent();
