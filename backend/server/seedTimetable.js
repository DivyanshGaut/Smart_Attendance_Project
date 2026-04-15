// const mongoose = require("mongoose");
// const Timetable = require("./models/Timetable");

// mongoose.connect("mongodb://127.0.0.1:27017/attendance_system");

// async function seedTimetable() {
//   try {
//     await Timetable.insertMany([
      
// {
//  subject: "Data Structures and Algorithms lab",
//  rollNo: "",
//  dayOfWeek": "MON",
//  "startTime": "09:10",
//  "endTime": "10:50",
//  "room": "202E lab",
//  "batch": "A"
// },
// {
//  "subject": "DBMS lab",
//  "rollNo": "",
//  "dayOfWeek": "MON",
//  "startTime": "10:50",
//  "endTime": "12:30",
//  "room": "202E lab",
//  "batch": "A"
// },
// {
//  "subject": "Data structures and algorithms",
//  "rollNo": "",
//  "dayOfWeek": "MON",
//  "startTime": "13:30",
//  "endTime": "14:30",
//  "room": "201B",
//  "batch": "A"
// },
// {
//  "subject": "Theory of Computation",
//  "rollNo": "",
//  "dayOfWeek": "MON",
//  "startTime": "14:30",
//  "endTime": "15:20",
//  "room": "201B",
//  "batch": "A"
// },
// {
//  "subject": "AI and cyber ethics",
//  "rollNo": "",
//  "dayOfWeek": "MON",
//  "startTime": "15:20",
//  "endTime": "16:10",
//  "room": "201B",
//  "batch": "A"
// },
// {
//  "subject": "Theory of computation",
//  "rollNo": "",
//  "dayOfWeek": "MON",
//  "startTime": "16:10",
//  "endTime": "17:00",
//  "room": "201B",
//  "batch": "A"
// }

//     ]);

//     console.log("✅ Timetable inserted");
//     process.exit();
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }
// }

// seedTimetable();