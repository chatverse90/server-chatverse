const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = 8080;

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

const { mongoUrl } = require('./dbConnection');
const RoomModel = require('./models/roomsdata'); // Path to your roomModel.js file
const Message = require('./models/message');
const badgeModel = require('./models/badges');
const User = require('./models/user');
const userRoutes = require('./routes/userRoutes');
const { connect } = require('./models/user');
const Notification = require('./models/notifications'); //
const server = http.createServer(app);

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('DB connection successful');
});

mongoose.connection.on('error', (err) => {
  console.log('DB connection failed', err);
});

app.use(userRoutes);

app.get('/fetchData', async (req, res) => {
  try {
    console.log('fetch data');
    // Use the Mongoose model to fetch data
    const documents = await RoomModel.find();
    console.log(documents);
    res.json(documents);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/users/:userId/increment-likes', async (req, res) => {
  const { userId } = req.params; // Get the user's ID from the route parameter

  try {
    const user = await User.findOneAndUpdate(
      { email: userId },
      { $inc: { likes: 1 } }, // Increment the 'likes' field by 1
      { new: true } // Return the updated user document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new notification
app.post('/notifications', async (req, res) => {
  try {
    const { sender, recipient, message,type } = req.body;
    const notification = new Notification({ sender, recipient, message,type });
    await notification.save();
    res.status(201).json({ message: 'Notification created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get unread notifications for a user
app.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ recipient: userId, read: false }).populate('sender');
    res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add message endpoint
app.post('/addmessageroom', async (req, res) => {
  try {
    const { mymessage, roomid } = req.body.reqdata1;
    const currenttime = moment().tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss');

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let room = await Message.findOne({ room_id: roomid }).session(session);

      if (!room) {
        console.error('Room not found');
        const messagebox = {
          room_id: roomid,
          messages: [],
        };

        const newMessage = new Message(messagebox);
        await newMessage.save({ session });

        console.log('Created New Chat...');
      }

      const newmessage = {
        user_id: mymessage.user_id,
        content: mymessage.content,
        time: currenttime,
      };

      if (room) {
        room.messages.push(newmessage);
        await room.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      console.log('Message Inserted!');
      res.json({ code: 200, message: 'Message inserted successfully' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error Inserting Message!', error);
    return res.status(500).send('Error Inserting Message!');
  }
});



app.post('/muteuser', async (req, res) => {

  const {u,t}=req.body.mutedata;
  console.log(u, t);
  try {
    // Use a transaction to handle the message insertion
    const session = await mongoose.startSession();
    session.startTransaction();
  
    const roomx = await RoomModel.findOne(); // Use findOne instead of find
    if (roomx) {
      // Modify the muted array
      roomx.muted.push(u);
      roomx.muted.push(t);
  
      await roomx.save({ session });
    }
  
    await session.commitTransaction();
    session.endSession();
  console.log("Muted Sucessfully!");
  }
  catch(e)
  {
    console.log("error muting "+ e);
  }
});
app.post('/blockuser', async (req, res) => {

  const {u}=req.body.blockdata;
  // console.log(u);
  try {
    // Use a transaction to handle the message insertion
    const session = await mongoose.startSession();
    session.startTransaction();
  
    const roomx = await RoomModel.findOne(); // Use findOne instead of find
    if (roomx) {
      // Modify the muted array
      roomx.blocked.push(u);

  
      await roomx.save({ session });
    }
  
    await session.commitTransaction();
    session.endSession();
  console.log("User Blocked Sucessfully!");
  }
  catch(e)
  {
    console.log("error Blocking user:  "+ e);
  }
});

// WebSocket connection handling
const wss = new WebSocket.Server({ server });

const roomDataMap = new Map();

// Define a function to fetch and send updates for a specific room
async function fetchAndSendUpdates(roomid) {
  try {
    const result = await getfromdb(roomid);

    // Get the connected clients for the specific room
    const clients = roomDataMap.get(roomid) || [];

    // Send the result to all connected clients of this room
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(result));
      }
    });
  } catch (error) {
    console.error(`Error in background data retrieval for room ${roomid}:`, error);
  }
}

// Run the fetchAndSendUpdates function for each room every 3 seconds
setInterval(() => {
  for (const roomid of roomDataMap.keys()) {
    fetchAndSendUpdates(roomid);
  }
}, 2000);


wss.on('connection', (socket) => {
  console.log('WebSocket client connected');
  var roomid = '';
  var finaldatax;
  var userid;
  socket.on('message', async (message) => {
    try {
      const jsonData = JSON.parse(message);
      const roomid = jsonData.roomId;

      // Store the client in the roomDataMap based on the roomid
      if (!roomDataMap.has(roomid)) {
        roomDataMap.set(roomid, []);
      }
      roomDataMap.get(roomid).push(socket);

      // Fetch initial data for this specific room and send it to the client
      fetchAndSendUpdates(roomid);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
  

});


async function getfromdb( r) {
  try {
    const roomid = r;
    // const userid = u;

    const mess = await Message.aggregate([
      {
        $match: { room_id: roomid },
      },
      {
        $project: {
          _id: 0,
          room_id: 1,
          messages: {
            $map: {
              input: '$messages',
              as: 'message',
              in: {
                user_id: '$$message.user_id',
                content: '$$message.content',
                time: '$$message.time',
              },
            },
          },
        },
      },
    ]);

    const bad = await badgeModel.aggregate([
      {
        $match: { badgeid: '123' },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    let useremails = [];
    if (mess[0] !== undefined) {
      useremails = [...new Set(mess[0].messages.map((message) => message.user_id))];
    }

    const userdetails = await User.aggregate([
      {
        $match: { email: { $in: useremails } },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    const roomdetails = await RoomModel.aggregate([
      {
        $match: { roomId: roomid },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    const userdata = userdetails.reduce((result, item) => {
      const { username, password, email, badge, pic, backgroundPic, bio } = item;
      result[email] = {
        name: username,
        email: email,
        password: password,
        badge: badge,
        pic: pic,
        backgroundPic: backgroundPic,
        bio: bio,
      };
      return result;
    }, {});

    const newData = {
      ...roomdetails[0],
      users: useremails,
    };
    
    const finaldata = {
      mess: mess[0],
      userdetails: userdata,
      badges: bad[0],
      roomdata: newData,
    };

    return finaldata;
  } catch (error) {
    console.error('Error in getfromdb:', error);
    throw error;
  }
}
app.post('/updatebadge', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, badgeUrl } = req.body.badgedata;

    const user = await User.findOneAndUpdate(
      { email }, // Search condition
      { badge: badgeUrl }, // Update field
      { new: true } // Return the updated document
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Badge updated successfully', user });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

app.post('/updateprofilepic', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { useremail, profileurl } = req.body.imgdata;
    console.log(useremail);
    console.log(profileurl);

    const user = await User.findOneAndUpdate(
      { email: useremail }, // Search condition
      { pic: profileurl }, // Update field
      { new: true } // Return the updated document
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Profile Pic updated successfully', user });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});


server.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
