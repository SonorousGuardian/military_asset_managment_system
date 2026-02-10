# Troubleshooting Guide

## Error: `invalid ELF header` (SQLite/Bindings)

**Symptoms:**
When starting the backend in a Docker container, you see an error like:

```
Error: /app/node_modules/sqlite3/build/Release/node_sqlite3.node: invalid ELF header
```

**Cause:**
This error occurs when `node_modules` are installed on one operating system (e.g., Windows) but the application is run on another (e.g., Linux/Docker). specific libraries like `sqlite3` are "native modules" and must be compiled for the specific system running the code.

- You likely ran `npm install` on your Windows machine.
- Then you mounted the `backend` folder into a Linux Docker container.
- The Linux container tried to use the Windows version of `sqlite3`, which failed.

**Solution:**

You need to reinstall the dependencies _inside_ the Linux environment (the container).

### Option 1: Reinstall inside the Container (Recommended)

1.  **Stop the container** if it's restarting loop.
2.  **Delete** the `node_modules` folder and `package-lock.json` file in your `backend` directory on your Windows machine.
    ```bash
    # Run in backend directory on Host
    rm -rf node_modules package-lock.json
    ```
3.  **Start the container**.
4.  **Open a terminal inside the container** and run install:

    ```bash
    # If using Docker Compose:
    docker-compose exec backend npm install

    # Or if running manually:
    docker exec -it <container_id> npm install
    ```

5.  **Restart the backend** process.

### Option 2: Use Docker Volume for node_modules (Permanent Fix)

To prevent the Windows `node_modules` from overwriting the container's version, configure your `docker-compose.yml` or `docker run` command to use an anonymous volume for `/app/node_modules`.

**If using `docker-compose.yml`:**

```yaml
services:
  backend:
    volumes:
      - ./backend:/app # Your code mount
      - /app/node_modules # <--- Add this line! This keeps node_modules internal to the container.
```

## Error: `address already in use`

**Symptoms:**

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**

1.  Check if another instance of the server is running.
2.  On Windows, you can find the process using the port:
    ```powershell
    netstat -ano | findstr :5000
    ```
3.  Kill the process using the PID found:
    ```powershell
    taskkill /PID <PID> /F
    ```
