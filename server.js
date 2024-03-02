const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

// Enable CORS for your front-end
const corsOptions = {
    origin: "http://localhost:3000",
};

app.use(cors(corsOptions));
app.use(express.json());

const openai = new OpenAI({
    apiKey: "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", // Replace with your OpenAI API key
});

const threadByUser = {}; // Store thread IDs by user

app.post("/createThread", async (req, res) => {
    try {
        const myThread = await openai.beta.threads.create();
        console.log("New thread created with ID: ", myThread.id, "\n");
        threadByUser[req.body.userId] = myThread.id; // Store the thread ID for this user
        res.status(200).json({ id: myThread.id, userId: req.body.userId });
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/run", async (req, res) => {
    try {
        // Logic to run the thread
        // This could involve processing the thread data and generating a response

        // For demonstration purposes, let's assume we have a function called runThread() to run the thread
        // const response = await runThread(req.body.userId); // Implement this function as needed

        // Send back a success response
        res.status(200).json({ message: "Thread run successfully", /* responseData: response */ });
    } catch (error) {
        console.error("Error running thread:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/threads", async (req, res) => {
    console.log("/threads", req);
    try {
        // Retrieve existing threads associated with the user
        const threads = Object.values(threadByUser); // Get all thread IDs
        res.status(200).json(threads);
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});




const https = require('https');

app.get("/list-messages/:threadId", async (req, res) => {
    try {
        const threadId = req.params.threadId;
        console.log("Trying to get messages for thread:", threadId);

        // Prepare options for the HTTP request to the OpenAI API
        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: `/v1/threads/${threadId}/messages`,
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer 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`, // Replace with your OpenAI API key
                "OpenAI-Beta": "assistants=v1"
            }
        };

        // Make the HTTP request to the OpenAI API
        const reqApi = https.request(options, (response) => {
            let data = '';

            // A chunk of data has been received
            response.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received
            response.on('end', () => {
                res.status(200).json(JSON.parse(data));
            });
        });

        // Handle request errors
        reqApi.on('error', (error) => {
            console.error('Error listing messages:', error);
            res.status(500).json({ error: "Internal server error" });
        });

        // End the request
        reqApi.end();
    } catch (error) {
        console.error('Error listing messages:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/chat", async (req, res) => {
    console.log(req.body)
    const assistantIdToUse = "asst_CMHjhTq6a2cIIiHDDHe45jx7"; // Replace with your assistant ID
    const modelToUse = "gpt-4-turbo-preview"; // Specify the model you want to use
    const userId = req.body.userId; // You should include the user ID in the request

    // Create a new thread if it's the user's first message
    if (!threadByUser[userId]) {
        try {
            const myThread = await openai.beta.threads.create();
            console.log("New thread created with ID: ", myThread.id, "\n");
            threadByUser[userId] = myThread.id; // Store the thread ID for this user
        } catch (error) {
            console.error("Error creating thread:", error);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    }

    const userMessage = req.body.message;

    // Add a Message to the Thread
    try {
        const myThreadMessage = await openai.beta.threads.messages.create(
            threadByUser[userId], // Use the stored thread ID for this user
            {
                role: "user",
                content: userMessage,
            }
        );
        console.log("This is the message object: ", myThreadMessage, "\n");

        // Run the Assistant
        const myRun = await openai.beta.threads.runs.create(
            threadByUser[userId], // Use the stored thread ID for this user
            {
                assistant_id: assistantIdToUse,
                instructions: "Your instructions here", // Your instructions here
                tools: [
                    { type: "code_interpreter" }, // Code interpreter tool
                    // { type: "retrieval" }, // Retrieval tool
                ],
            }
        );
        console.log("This is the run object: ", myRun, "\n");

        // Periodically retrieve the Run to check on its status
        const retrieveRun = async () => {
            let keepRetrievingRun;

            while (myRun.status !== "completed") {
                keepRetrievingRun = await openai.beta.threads.runs.retrieve(
                    threadByUser[userId], // Use the stored thread ID for this user
                    myRun.id
                );

                console.log(`Run status: ${keepRetrievingRun.status}`);

                if (keepRetrievingRun.status === "completed") {
                    console.log("\n");
                    break;
                }
            }
        };
        retrieveRun();

        // Retrieve the Messages added by the Assistant to the Thread
        const waitForAssistantMessage = async () => {
            await retrieveRun();

            const allMessages = await openai.beta.threads.messages.list(
                threadByUser[userId] // Use the stored thread ID for this user
            );
            console.log("allMessages",allMessages)
            // Send the response back to the front end
            res.status(200).json({
                response: allMessages.data[0].content[0].text.value,
            });
            console.log(
                "------------------------------------------------------------ \n"
            );

            console.log("User: ", myThreadMessage.content[0].text.value);
            console.log("Assistant: ", allMessages.data[0].content[0].text.value);
        };
        waitForAssistantMessage();
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
