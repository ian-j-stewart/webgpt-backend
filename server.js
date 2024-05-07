import axios from 'axios';
import express from 'express';
import cors from 'cors';

const app = express();
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.OPENAI_API_KEY
console.log(`API Key from .env: ${process.env.OPENAI_API_KEY}`);
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://main--fascinating-cactus-e3b278.netlify.app",
    "https://fascinating-cactus-e3b278.netlify.app",
    "https://webgpt-frontend-git-exc-ian-stewarts-projects.vercel.app",
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

const openaiUrl = 'https://api.openai.com/v2/assistants/asst_IdLjHl0AGDauW5C3ysOz8UEH/completions'; // Update with the correct v2 Assistant endpoint
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
        //console.log("data", data)
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
    console.log("data passed", data)
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'OpenAI-Beta': 'assistants=v2'
        }
    };

    console.log("Preparing to send message response to OpenAI");

    try {



        // Send a POST request to OpenAI to add the message to the thread
        const response =  axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'OpenAI-Beta': 'assistants=v2'
            }}
        );

        console.log("Message response from OpenAI:", response);
        res.json({ success: true }); // Only send the response data received from OpenAI
    } catch (error) {
        console.error('Error submitting message to OpenAI:', error);
        // Determine the status code to return
        const statusCode = error.response ? error.response.status : 500;
        const errorMessage = error.response ? (error.response.data || error.response.statusText) : error.message;
        res.status(statusCode).json({ error: "Failed to submit message to OpenAI", details: errorMessage });
    }
});


app.post('/run', async (req, res) => {
    console.log("in run")
    const { threadId } = req.body;
    console.log("run id", threadId)
    try {
        // Optional: Post a message to the thread if needed

        // Run the thread
        const runResponse = await  axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, { "assistant_id": "asst_IdLjHl0AGDauW5C3ysOz8UEH" }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`, // Using environment variable
                'OpenAI-Beta': 'assistants=v2'
            }});
        console.log("Thread run response:", runResponse);



        res.status(200).json({
            message: "thread run successfully.",
            // messageResponse: messageResponse.data,  // Uncomment if you are handling messages
            runResponse: runResponse.data
        });
    } catch (error) {
        console.error('Error during  thread run:', error);
        res.status(500).json({
            message: "Failed to submit message or run thread.",
            error: error.message
        });
    }
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
        console.error('Error retrieving the last message:', error);
        res.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});