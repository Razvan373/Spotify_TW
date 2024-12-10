const socket = io("http://127.0.0.1:8888")

socket.on("connect", () => {
    console.log("Connected to WebSocket server");
});

// When disconnected
socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server");
});

// Example: Send a message to the server
socket.emit("message", { data: "Hello, server!" });

// Example: Receive a message from the server
socket.on("message", (data) => {
    console.log("Message from server:", data);});