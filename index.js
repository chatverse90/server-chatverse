const express=require('express')
const mongoose=require('mongoose')
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const group = require('./models/group');
const bodyParser=require('body-parser')

const app=express();
const PORT=8080;
const cors = require("cors");
app.use(cors({origin: true, credentials: true}));
const {mongoUrl}=require('./dbConnection');

require('./models/user')
// require('./models/message')
const RoomModel = require('./models/roomsdata'); // Path to your roomModel.js file
const Message = require('./models/message'); // Path to your roomModel.js file
const badgeModel = require('./models/badges'); // Path to your roomModel.js file
const userRoutes=require('./routes/userRoutes');
const User = require('./models/user'); // Path to your roomModel.js file
const moment = require('moment-timezone');
app.use(bodyParser.json())
app.use(userRoutes)

mongoose.connect(mongoUrl,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})

mongoose.connection.on('connected',()=>{
    console.log("db connection successfully")
})

mongoose.connection.on('error',(err)=>{
    console.log("db connection  fail ",err)
})

app.get('/fetchData', async (req, res) => {
    try {
      // Use the Mongoose model to fetch data
      const documents = await RoomModel.find();
      // console.log(documents);
      res.json(documents);
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
});

app.get("/getroomdata", (req, res) => {
    res.send("This is the data endpoint");
    console.log("Received data:");
  });
  app.post("/getroomdata", (req, res) => {
   
    
    
      const {useremail,roomid} = req.body.reqdata;
    // console.log("USER EAMIL "+ useremail + roomid);
   
                                             // LOADING ROOM MESSAGES
    Message.aggregate([
        {
          $match: { room_id: roomid }
        },
        {
          $project: {
            _id: 0, // Exclude the _id field
            room_id: 1,
            messages: {
              $map: {
                input: "$messages",
                as: "message",
                in: {
                  user_id: "$$message.user_id",
                  content: "$$message.content",
                  time: "$$message.time"
                }
              }
            }
          }
        }
      ]).then(mess => {
//    console.log(mess[0]);


badgeModel.aggregate([
  {
    $match: { badgeid: '123' }
  },
  {
    $project: {
      _id: 0, // Exclude the _id field
    }}]).then(
      bad=>{
        let useremails=[];
        if(mess[0]!=undefined){
        
           useremails = [...new Set(mess[0].messages.map(message => message.user_id))];
        }
        User.aggregate([
          {
            $match: { email: { $in: useremails } }
          },
          {
            $project: {
              _id: 0, // Exclude the _id field
            }}]).then(userdetails=>{


              RoomModel.aggregate([
                {
                  $match: { roomId:  roomid }
                },
                {
                  $project: {
                    _id: 0, // Exclude the _id field
                  }}]).then(roomdetails=>{


                    const userdata = userdetails.reduce((result, item) => {
                      const { username, password, email,badge,pic,backgroundPic,bio } = item;
                      result[email] = {
                        name: username,
                        email: email,
                        password: password,
                        badge: badge,
                        pic: pic,
                        backgroundPic: backgroundPic,
                        bio: bio
                      };
                      return result;
                    }, {});
                   
        // bad[0] BADGES

        const newData = {
          ...roomdetails[0],
          users: useremails,
        };
        console.log(newData);
const finaldata={
  mess: mess[0],
  userdetails: userdata,
  badges: bad[0],
  roomdata: newData
}



        res.json(finaldata)
            
                  })
              
              
      
      })
     
      }
    )

    


})    

  });

  app.get("/addmessageroom", (req, res) => {
    res.send("This is the data endpoint");
    console.log("Received data:");
  });
  app.post("/addmessageroom", async (req, res) => {
    try {
      const { mymessage, roomid } = req.body.reqdata1;
      console.log("USER MSG " + JSON.stringify(mymessage));
  
      const currenttime = moment().tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss');
  
      const room = await Message.findOne({ room_id: roomid });
  
      if (!room) {
        console.error('Room not found');
        const messagebox = {
          room_id: roomid,
          messages: []
        };
  
        const newMessage = new Message(messagebox);
        await newMessage.save();
  
        return res.status(200).send('Room not found, created a new one.');
      }
  
      const newmessage = {
        user_id: mymessage.user_id,
        content: mymessage.content,
        time: currenttime
      };
      room.messages.push(newmessage);
  
      await room.save();
      console.log('Message Inserted!', newmessage);
      return res.status(200).send('Message Inserted!');
    } catch (error) {
      console.error('Error Inserting Message!', error);
      return res.status(500).send('Error Inserting Message!');
    }
  });



app.listen(PORT ,()=>{
    console.log("server running on port: " +PORT);
})