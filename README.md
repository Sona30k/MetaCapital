# MetaCapital

MetaCapital is an AI-powered multi-agent stock market simulation and analysis platform that helps in predicting market trends and evaluating trading strategies.

It combines multiple AI agents, data pipelines, and visualization tools to simulate real-world trading decisions and provide actionable insights.

---

## Features

* Multi-Agent System
  Multiple AI agents generate BUY / SELL / HOLD signals based on different strategies.

* Market Simulation Engine
  Simulates trading performance using historical stock data.

* Insights Dashboard
  Visualizes returns, trends, and agent performance.

* Real-time Data Integration
  Fetches and processes stock data dynamically.

* Strategy Comparison
  Compare how different AI agents perform over time.

---

## Tech Stack

* Frontend: React, Recharts
* Backend: FastAPI (Python)
* Data Processing: Pandas, NumPy
* API Handling: Axios
* AI Logic: Rule-based / ML Agents

---

## Project Structure

```
MetaCapital/
│── backend/
│   ├── main.py
│   ├── agents/
│   ├── data/
│
│── frontend/
│   ├── src/
│   ├── components/
│
│── README.md
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Sona30k/MetaCapital.git
cd MetaCapital
```

---

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## Usage

* Start backend server
* Run frontend
* Open dashboard in browser
* View insights, predictions, and simulations

---

## Example Workflow

1. Fetch stock data
2. Run AI agents
3. Generate trading signals
4. Simulate portfolio performance
5. Visualize results

---

## Future Improvements

* Advanced ML/DL models for prediction
* Live trading integration
* Plug-and-play agent framework
* Cloud deployment





Consider giving it a star on GitHub.
