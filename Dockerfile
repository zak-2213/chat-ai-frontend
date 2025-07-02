 # Use a Node image (on Debian Bullseye) that comes with Python3 preinstalled.
FROM node:18-bullseye

# Install pip and supervisor (and any other OS dependencies)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    supervisor && \
    rm -rf /var/lib/apt/lists/*

# Set working directory to /app
WORKDIR /app

# -------------------- Install Frontend (Client) --------------------

# Copy the client package files and install npm dependencies first
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy all client source files
COPY client ./client

# -------------------- Install Backend (Flask Server) --------------------

# Copy the Flask requirements file and install pip dependencies 
COPY flask-server/requirements.txt ./flask-server/
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r flask-server/requirements.txt

# Copy the Flask server code (includes allowed_extensions.json and other files)
COPY flask-server ./flask-server

# -------------------- Supervisor Configuration --------------------

# Copy the supervisor configuration file into the container
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose the ports for the Flask backend (5000) and Vite dev server (5173)
EXPOSE 5000 5173

# By default, run supervisor which in turn starts both servers
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]