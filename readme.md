# OpenAI API Integration Server

This project is an Express server designed to interface with the OpenAI API, specifically focusing on managing threads and messages. It utilizes environment variables and supports CORS for specified domains.

## Features

- Create threads with an initial message using OpenAI's API.
- Add messages to existing threads.
- Execute and manage thread runs.
- Retrieve the last message from a thread.
- CORS support for multiple specified domains.

## Prerequisites

Before you can run this server, you will need:

- Node.js installed on your machine.
- An OpenAI API key.
- An environment file (`.env`) configured with your API key and other necessary environment variables.

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <project-directory>
Install dependencies:
bash
Copy code
npm install
Set up the .env file:
Create a .env file in the root of your project directory with the following content:
plaintext
Copy code
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_assistant_id_here
REACT_APP_ENDPOINT=your_react_app_endpoint_here
PORT=3000
Usage
Start the server:
bash
Copy code
npm start
This will start the server on the port specified in your .env file (default 3000).
API Endpoints
POST /createThread: Creates a new thread with an initial message. Requires initialMessage in the request body.
POST /chat: Adds a message to an existing thread. Requires message and threadId in the request body.
POST /run: Executes the thread identified by threadId in the request body.
GET /last: Retrieves the last message from the thread specified by threadId in the query parameters.
Contributing
Contributions are welcome! Please feel free to submit pull requests or create issues for bugs and feature requests.

License
Specify your license here or indicate if the project is open-source.

vbnet
Copy code

Make sure to replace `<repository-url>` and `<project-directory>` with the actual URL of your Git repository and the name of your project directory respectively. Also, adjust the environment variables and any specific details according to your project's configuration. This README template assumes you're familiar with Node.js development practices and environment management.