import streamlit as st
import requests
import pandas as pd
import matplotlib.pyplot as plt

# -----------------------------
# PAGE CONFIG
# -----------------------------
st.set_page_config(page_title="MetaCapital", layout="wide")

# -----------------------------
# CUSTOM CSS (MAROON + BEIGE THEME)
# -----------------------------
st.markdown("""
<style>
body {
    background-color: #F5E6D3;
}

.title {
    font-size: 36px;
    font-weight: bold;
    color: #4A0F0F;
}

.subtext {
    color: #6D1A1A;
}

.card {
    padding: 20px;
    border-radius: 15px;
    background: #FFFFFF;
    border: 1px solid #E8D5C4;
    text-align: center;
    box-shadow: 2px 2px 10px rgba(0,0,0,0.1);
}

.stButton>button {
    background-color: #6D1A1A;
    color: white;
    border-radius: 10px;
    padding: 10px;
}

.stButton>button:hover {
    background-color: #4A0F0F;
}
</style>
""", unsafe_allow_html=True)

# -----------------------------
# SIDEBAR
# -----------------------------
st.sidebar.title("⚙️ Controls")
run = st.sidebar.button("Run Simulation")

st.sidebar.markdown("---")
st.sidebar.write("💡 MetaCapital v1.0")
st.sidebar.write("AI Agent Allocation Engine")

# -----------------------------
# HEADER
# -----------------------------
st.markdown('<p class="title">💰 MetaCapital</p>', unsafe_allow_html=True)
st.markdown('<p class="subtext">AI-driven Capital Allocation Dashboard</p>', unsafe_allow_html=True)

st.markdown("---")

# -----------------------------
# MAIN CONTENT
# -----------------------------
if run:
    response = requests.get("http://127.0.0.1:8000/simulate")
    data = response.json()

    # -----------------------------
    # KPI CARDS
    # -----------------------------
    col1, col2, col3, col4 = st.columns(4)

    best_agent = max(data["allocation"], key=data["allocation"].get)
    worst_agent = min(data["allocation"], key=data["allocation"].get)

    col1.markdown(f'<div class="card">💰<br>Total Capital<br><b>{sum(data["allocation"].values())}</b></div>', unsafe_allow_html=True)
    col2.markdown(f'<div class="card">🏆<br>Best Agent<br><b>{best_agent}</b></div>', unsafe_allow_html=True)
    col3.markdown(f'<div class="card">⚠️<br>Worst Agent<br><b>{worst_agent}</b></div>', unsafe_allow_html=True)
    col4.markdown(f'<div class="card">🤖<br>Total Agents<br><b>{len(data["results"])}</b></div>', unsafe_allow_html=True)

    st.markdown("---")

    # -----------------------------
    # CHARTS
    # -----------------------------
    col5, col6 = st.columns(2)

    with col5:
        st.subheader("📊 Agent Scores")
        st.bar_chart(data["scores"])

    with col6:
        st.subheader("💸 Allocation Distribution")

        fig, ax = plt.subplots()
        ax.pie(
            data["allocation"].values(),
            labels=data["allocation"].keys(),
            autopct='%1.1f%%',
            colors=["#6D1A1A", "#8B3A3A", "#B56565", "#D9A5A5"]
        )
        st.pyplot(fig)

    st.markdown("---")

    # -----------------------------
    # TABLE
    # -----------------------------
    st.subheader("📈 Detailed Performance")

    table_data = []
    for agent in data["results"]:
        table_data.append({
            "Agent": agent,
            "Final Capital": data["results"][agent]["final_capital"],
            "Score": round(data["scores"][agent], 3),
            "Allocation": data["allocation"][agent]
        })

    df = pd.DataFrame(table_data)
    st.dataframe(df, use_container_width=True)

    st.markdown("---")

    # -----------------------------
    # INSIGHTS
    # -----------------------------
    st.subheader("🧠 Insights")

    st.write(f"✔️ Best performing agent is **{best_agent}**.")
    st.write("✔️ Allocation is based on risk-adjusted returns.")
    st.write("✔️ Weak agents automatically receive less capital.")

else:
    st.info("👉 Click 'Run Simulation' from sidebar to start.")