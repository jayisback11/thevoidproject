import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const isLocal = process.env.NODE_ENV !== "production";
var socket = "";

if (isLocal) {
  socket = io("http://localhost:4000");
} else {
  socket = io("https://thevoidproject.onrender.com");
}

function App() {
  const [users, setUsers] = useState([]);
  const [availableNames, setAvailableNames] = useState([]);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // existing code...

    socket.on("room_users", (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off("receive_message");
      socket.off("room_users");
    };
  }, []);

  useEffect(() => {
    // Fetch 5 random usernames
    const fetchUsernames = async () => {
      try {
        const response = await fetch(
          "https://randomuser.me/api/?results=5&inc=login",
        );
        const data = await response.json();
        setAvailableNames(data.results.map((user) => user.login.username));
      } catch (e) {
        setAvailableNames(["User1", "User2", "User3", "User4", "User5"]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsernames();

    // Join via URL link check
    const params = new URLSearchParams(window.location.search);
    if (params.get("room")) setRoom(params.get("room"));

    socket.on("receive_message", (data) => {
      setChatLog((prev) => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, []);

  const joinRoom = () => {
    if (username && room) {
      socket.emit("join_room", { username, room });
      setJoined(true);
      window.history.pushState({}, "", `?room=${room}`);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const data = {
        room,
        user: username,
        text: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      socket.emit("send_message", data);
      setChatLog((prev) => [...prev, data]);
      setMessage("");
    }
  };

  function showNotification(message) {
    const toast = document.getElementById("notification-toast");
    const msgSpan = document.getElementById("toast-message");

    msgSpan.innerText = message;
    toast.className = "toast show";

    //Hide after 3 seconds
    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000);
  }

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}?room=${room}`;

    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        showNotification("Invite link copied");
      })
      .catch(() => {
        showNotification("Failed to copy link");
      });
  };

  if (!joined) {
    return (
      <div style={styles.setupScreen}>
        <h1 style={styles.title}>THE VOID</h1>
        <p>Choose an identity to enter the silence.</p>

        {loading ? (
          <p>Loading names...</p>
        ) : (
          <div style={styles.nameGrid}>
            {availableNames.map((name) => (
              <button
                key={name}
                onClick={() => setUsername(name)}
                style={{
                  ...styles.nameBtn,
                  border:
                    username === name ? "1px solid #fff" : "1px solid #333",
                  color: username === name ? "#fff" : "#888",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <input
          style={styles.input}
          placeholder="Room Name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button
          onClick={joinRoom}
          style={styles.enterBtn}
          disabled={!username || !room}
        >
          ENTER
        </button>
      </div>
    );
  }

  return (
    <div style={styles.chatWrapper}>
      <div style={styles.usersBar}>
        <span style={styles.usersTitle}>ONLINE</span>
        {users.map((u) => (
          <span
            key={u}
            style={{
              ...styles.userBadge,
              border: u === username ? "1px solid #fff" : "1px solid #333",
            }}
          >
            {u}
          </span>
        ))}
      </div>
      <div id="notification-toast" class="toast">
        <span id="toast-message"></span>
      </div>
      <div style={styles.header}>
        <small>ROOM: {room}</small>
        <button onClick={copyInviteLink} style={styles.copyBtn}>
          Copy Invite Link
        </button>
      </div>
      <div style={styles.chatBox}>
        {chatLog.map((msg, i) => (
          <div
            key={i}
            style={msg.user === username ? styles.myMsg : styles.theirMsg}
          >
            <span style={styles.msgUser}>{msg.user}</span>
            <p style={styles.msgText}>{msg.text}</p>
            <span style={styles.msgTime}>{msg.time}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={styles.inputArea}>
        <input
          style={styles.chatInput}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type into the void..."
        />
        <button type="submit" style={styles.sendBtn}>
          SEND
        </button>
      </form>
    </div>
  );
}

const styles = {
  setupScreen: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    color: "#fff",
    fontFamily: "monospace",
  },
  title: { fontSize: "3rem", letterSpacing: "10px", marginBottom: "40px" },
  nameGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "30px",
  },
  nameBtn: {
    padding: "10px",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
  },
  input: {
    padding: "15px",
    width: "250px",
    backgroundColor: "#111",
    border: "1px solid #333",
    color: "#fff",
    marginBottom: "10px",
    textAlign: "center",
  },
  enterBtn: {
    padding: "15px 50px",
    backgroundColor: "#fff",
    color: "#000",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  chatWrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#000",
    color: "#fff",
    fontFamily: "monospace",
  },
  header: {
    fontSize: "20px",
    padding: "10px",
    borderBottom: "1px solid #222",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyBtn: {
    fontSize: "20px",
    background: "none",
    color: "#888",
    border: "1px solid #444",
    cursor: "pointer",
    padding: "5px",
  },
  chatBox: { flex: 1, overflowY: "auto", padding: "20px" },
  myMsg: {
    marginLeft: "auto",
    maxWidth: "70%",
    textAlign: "right",
    marginBottom: "20px",
  },
  theirMsg: {
    marginRight: "auto",
    maxWidth: "70%",
    textAlign: "left",
    marginBottom: "20px",
  },
  msgUser: { fontSize: "20px", color: "#666", display: "block" },
  msgText: { margin: "5px 0", fontSize: "26px" },
  msgTime: { fontSize: "19px", color: "#444" },
  inputArea: { display: "flex", borderTop: "1px solid #222" },
  chatInput: {
    fontSize: "19px",
    flex: 1,
    padding: "20px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    outline: "none",
  },
  sendBtn: {
    fontSize: "19px",
    padding: "0 30px",
    backgroundColor: "#fff",
    border: "none",
    cursor: "pointer",
  },
  usersBar: {
    padding: "10px",
    borderBottom: "1px solid #222",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  usersTitle: {
    fontSize: "20px",
    color: "#666",
    marginRight: "10px",
  },
  userBadge: {
    padding: "3px 8px",
    fontSize: "21px",
    color: "#aaa",
  },
};

export default App;
