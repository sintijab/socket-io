import express from 'express';
import { sound_source, technicalPath } from './assets/answers_listening.js';
import { emotional_connection, openPath } from './assets/answers_listening_simple.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const app = express();
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const server = http.createServer(app);

import { Server } from "socket.io";
const io = new Server(server);

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/health', (req, res) => {
  res.send({ message: 'Welcome to socket-io!' });
});

io.on('connection', (socket) => {
  socket.on('init', (callback) => {
    callback({
      activeKey: "listening_init",
      questions: ["Hey, we would like to collect more details from your most recent sound listening experience. The answers will be collected and refined to select the artists on our platform.",  "Would you have time to answer a few questions?"],
      suggestions: [{ answer: `Let's do it`, key: true }, { answer: `Not now`, key: false }],
    });
  });
  socket.on('update_item', (arg1, arg2, callback) => {
    if (arg1 === "listening_init" ) {
      const consent = arg2 === true || arg2 === "Let's do it" || arg2.toLowerCase().includes('yes');
      if (consent) {
        return callback({
          activeKey: "title",
          id: "title",
          questions: ["AI Assistant in Sound Moderation", "What is the song title?"]
        });
      } else {
        return callback({
          activeKey: "listening_closed",
          questions: ["Thank you for your feedback!"]
        });
      }
    }
    if (arg1 === "title") {
      return callback({
        activeKey: "author",
        id: "author",
        questions: ["Who is the author?"],
      });
    }
    if (arg1 === "author") {
      return callback({
        activeKey: "source",
        id: "source",
        questions: ["Where did you hear this song?", "Please provide any link or reference."],
      });
    }
    if (arg1 === "source") {
      return callback({
        questions: ["Would you prefer more technical and advanced or open questions?"],
        suggestions: [{ answer: `More technical`, key: 'technical' }, { answer: `Open-ended`, key: 'open' }],
      });
    }
    if (arg2 === "technical") {
      return callback({
        questions: ["Please select one of the options below:"],
        ...sound_source,
        activeKey: "rhytmic_scale",
      });
    } else if (arg2 === "open") {
      return callback({
        questions: ["Please select one of the options below:"],
        ...emotional_connection,
        activeKey: 'association',
      });
    }
    technicalPath(arg1, callback, arg2);
    openPath(arg1, callback);
  });
});

io.engine.on("connection_error", (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});

const port = process.env.PORT || 3333;
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
