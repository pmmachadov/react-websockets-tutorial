// Import necessary modules
const { WebSocketServer } = require('ws'); // WebSocket module for real-time communication
const http = require('http'); // HTTP module to create HTTP server
const uuidv4 = require('uuid').v4; // UUID module for generating unique identifiers
const url = require('url'); // URL module to parse the URLs

// Create an HTTP server instance
const server = http.createServer();
// Create a WebSocket server instance tied to the HTTP server
const wsServer = new WebSocketServer({ server });

const port = 8000; // Define the port on which the server will listen
const connections = {}; // Object to store WebSocket connections using UUIDs as keys
const users = {}; // Object to store user data, also keyed by UUID

/**
 * Handle incoming messages from clients.
 * @param bytes - Buffer containing the incoming message
 * @param uuid - UUID of the client sending the message
 */
const handleMessage = (bytes, uuid) => {
  const message = JSON.parse(bytes.toString()); // Convert bytes to string and parse JSON
  const user = users[uuid]; // Retrieve user information using UUID
  user.state = message; // Update user's state with the received message
  broadcast(); // Broadcast updated state to all connected clients

  console.log(`${user.username} updated their state: ${JSON.stringify(user.state)}`);
};

/**
 * Handle client disconnections.
 * @param uuid - UUID of the client that disconnected
 */
const handleClose = uuid => {
  console.log(`${users[uuid].username} disconnected`); // Log the username of the disconnected user
  delete connections[uuid]; // Remove the connection from the connections object
  delete users[uuid]; // Remove the user from the users object
  broadcast(); // Broadcast the update to remaining connected clients
};

/**
 * Broadcasts messages to all connected clients.
 */
const broadcast = () => {
  Object
    .keys(connections)
    .forEach(uuid => {
      const connection = connections[uuid]; // Retrieve the connection object
      const message = JSON.stringify(users); // Convert the users object to a JSON string
      connection.send(message); // Send the message to the client
    });
};

// Event listener for new WebSocket connections
wsServer.on('connection', (connection, request) => {
  const { username } = url.parse(request.url, true).query; // Parse the URL to extract the username from query params
  console.log(`${username} connected`); // Log the connection with username
  const uuid = uuidv4(); // Generate a unique identifier for the new connection
  connections[uuid] = connection; // Store the connection object, indexed by UUID
  users[uuid] = { // Store the user data, indexed by UUID
    username,
    state: {}
  };
  connection.on('message', message => handleMessage(message, uuid)); // Setup message handler for this connection
  connection.on('close', () => handleClose(uuid)); // Setup close handler for this connection
});

// Start the server and listen on the defined port
server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`); // Log the server start and the listening port
});
