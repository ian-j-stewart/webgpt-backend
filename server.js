import axios from 'axios';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
const app = express();
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Ensure your API key is stored in environment variables
});
const key = process.env.OPENAI_API_KEY

console.log("assistantid", process.env.OPENAI_ASSISTANT_ID)
console.log(`API Key from .env: ${process.env.OPENAI_API_KEY}`);
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://main--fascinating-cactus-e3b278.netlify.app",
    "https://fascinating-cactus-e3b278.netlify.app",
    "https://webgpt-frontend-git-exc-ian-stewarts-projects.vercel.app",
    "https://excgpt.vercel.app",
    "https://webgpt.vercel.app",
    "https://webgpt-frontend-ker5-git-exc-ian-stewarts-projects.vercel.app",

];

const corsOptions = {
    origin: function(origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));
app.use(express.json());


const openaiUrl = `https://api.openai.com/v2/assistants/${process.env.OPENAI_ASSISTANT_ID}/completions`; // Update with the correct v2 Assistant endpoint
const apiKey = process.env.OPENAI_API_KEY;
const assistantId = process.env.OPENAI_ASSISTANT_ID// Replace with your actual assistant ID
const config = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'OpenAI-Beta': 'assistants=v2'
    }
};
const host = process.env.REACT_APP_ENDPOINT; // Update with your backend host



app.post('/createThread', async (req, res) => {
    try {
        // Assuming the request body contains the user ID
        const { initialMessage } = req.body;
        //console.log("req.body",req.body)
        // Prepare the data payload with an initial message
        const data = {
            messages: [initialMessage]
        };
        console.log("data", data)
        // Call the OpenAI API to create a thread with the initial message
        const response = await axios.post('https://api.openai.com/v1/threads', {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        // If the API call is successful, the response will contain the thread details
        const newThread = response.data;
        res.status(200).json(newThread);
        //console.log(response.data)
    } catch (error) {
        console.error('Error creating thread:', error);
        // Handle errors from API call or other exceptions
        res.status(error.response?.status || 500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
});


app.post('/chat', async (req, res) => {
    // Validate the required parameters
    if (!req.body.message || !req.body.threadId) {
        return res.status(400).json({ error: "Bad Request", details: "Missing message or threadId in request body." });
    }

    const { message, threadId } = req.body;
    console.log("Received thread ID:", threadId);

    const data = {
        role: 'user',
        content: message
    };
    //console.log("data passed", data)
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'OpenAI-Beta': 'assistants=v2'
        }
    };

    //console.log("Preparing to send message response to OpenAI");

    try {

        console.log("in try")

        // Send a POST request to OpenAI to add the message to the thread
        const response =  await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'OpenAI-Beta': 'assistants=v2'
            }}
        );



        res.json(response.data.id); // Only send the response data received from OpenAI
        //console.log(response.data.id)
    } catch (error) {
        //console.error('Error submitting message to OpenAI:', error);
        // Determine the status code to return
        const statusCode = error.response ? error.response.status : 500;
        const errorMessage = error.response ? (error.response.data || error.response.statusText) : error.message;
        res.status(statusCode).json({ error: "Failed to submit message to OpenAI", details: errorMessage });
    }
});


app.get('/stream', (req, res) => {
    const threadId = req.query.threadId;
    console.log(`Starting new stream for threadId: ${threadId}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let stream;
    openai.beta.threads.runs.create(threadId, { assistant_id: process.env.OPENAI_ASSISTANT_ID, stream: true })
        .then(async (generatedStream) => {
            stream = generatedStream;
            for await (const event of stream) {
                console.log(`Streaming event: ${event.event}`);
                if (event.event === 'thread.message.delta' && event.data && event.data.delta && event.data.delta.content) {
                    const textContent = event.data.delta.content.map(item => item.text && item.text.value ? item.text.value : "").join(' ');
                    res.write(`data: ${JSON.stringify({ message: textContent })}\n\n`);
                } else if (event.event === 'thread.run.completed') {
                    console.log("Thread run completed, ending stream.");
                    res.write(`data: ${JSON.stringify({ message: "Stream completed" })}\n\n`);
                    break;  // Exit the loop on completion
                }
            }
            res.end();  // Ensure the response is closed after the loop
        })
        .catch((error) => {
            console.error(`Error in stream for threadId ${threadId}: ${error.message}`);
            res.write(`data: ${JSON.stringify({ error: "Failed to stream events", details: error.message })}\n\n`);
            res.end();  // Close the response on error
        });

    req.on('close', () => {
        console.log("Client disconnected, cancelling stream if active.");
        if (stream && stream.cancel) {
            stream.cancel();
        }
        res.end();
    });
});











app.get('/last', async (req, res) => {
    try {
        // Access threadId from the query parameters
        const { threadId } = req.query;

        if (!threadId) {
            return res.status(400).json({ message: "Thread ID is required as a query parameter." });
        }

        const url = `https://api.openai.com/v1/threads/${threadId}/messages`;
        const response = await axios.get(url, config); // Using axios to send a GET request with appropriate headers
        const messages = response.data.data;

        if (!messages || messages.length === 0) {
            return res.status(404).json({ message: "No messages found in this thread." });
        }

        // Assuming the last two messages are the most recent interaction
        const lastInteraction = messages.slice(-1); // Retrieves the last two messages (user and assistant)

        res.status(200).json({

            messsages: messages
        });
    } catch (error) {
        //console.error('Error retrieving the last message:', error);
        res.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} and listening on all network interfaces`);
});
