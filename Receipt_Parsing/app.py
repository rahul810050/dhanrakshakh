import streamlit as st
import os
from datetime import datetime
from pathlib import Path
import json

# Import functions from extract.py (previously ocr_json.py)
from extract import (
    extract_receipt_data,
    parse_with_gemini,
    extract_json,
    plot_expense_pie,
    answer_query_on_receipts,
    translate_text
)

# 📁 Set up folders
UPLOAD_DIR = "uploads"
INSIGHT_DIR = "insights"
Path(UPLOAD_DIR).mkdir(exist_ok=True)
Path(INSIGHT_DIR).mkdir(exist_ok=True)

# 🌐 Streamlit page config
st.set_page_config(page_title="Receipt Upload & Insight", layout="centered")
if "uploaded_filename" not in st.session_state:
    st.session_state["uploaded_filename"] = None

st.title("📤 Upload Your Receipt")

uploaded_file = st.file_uploader("Upload a receipt (Image or PDF)", type=["png", "jpg", "jpeg", "pdf","webp"])

if uploaded_file and uploaded_file.name != st.session_state["uploaded_filename"]:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{uploaded_file.name}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    st.session_state["uploaded_filename"] = uploaded_file.name
    st.success("✅ Uploaded successfully!")
    st.rerun()

st.divider()

# 🧾 Receipt History
st.subheader("📁 Your Uploaded Receipts")

files = sorted(os.listdir(UPLOAD_DIR), reverse=True)

if files:
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file)
        col1, col2, col3 = st.columns([4, 1, 1])

        with col1:
            st.write(f"📄 {file}")

        with col2:
            if st.button("View Insight", key=f"view_{file}"):
                st.session_state["selected_file"] = file

        with col3:
            if st.button("🗑️ Delete", key=f"delete_{file}"):
                os.remove(file_path)
                insight_file = os.path.join(INSIGHT_DIR, f"{file}.json")
                if os.path.exists(insight_file):
                    os.remove(insight_file)
                st.success(f"Deleted {file}")
                st.rerun()

    # Display Insights
    if "selected_file" in st.session_state:
        selected_file = st.session_state["selected_file"]
        selected_path = os.path.join(UPLOAD_DIR, selected_file)
        insight_path = os.path.join(INSIGHT_DIR, f"{selected_file}.json")

        st.markdown(f"### 📊 Insights for: `{selected_file}`")

        if os.path.exists(insight_path):
            st.info("📦 Loaded cached insight from file.")
            with open(insight_path, "r") as f:
                parsed_json = json.load(f)
        else:
            with st.spinner("🔍 Running OCR + Gemini Parsing..."):
                ocr_text = extract_receipt_data(selected_path)
                translated_text=translate_text(ocr_text)
                parsed_text = parse_with_gemini(translated_text)
                parsed_json_str = extract_json(parsed_text)

                if parsed_json_str:
                    try:
                        parsed_json = json.loads(parsed_json_str)
                        with open(insight_path, "w") as f:
                            json.dump(parsed_json, f, indent=2)
                    except json.JSONDecodeError:
                        st.error("❌ Gemini response is not valid JSON.")
                        parsed_json = None
                else:
                    st.error("❌ Could not extract structured JSON.")
                    parsed_json = None

        if parsed_json:
            st.subheader("🧠 Extracted Receipt Details")

            # Basic info
            vendor = parsed_json.get("vendor", "N/A")
            date = parsed_json.get("date", "N/A")
            total = parsed_json.get("total_amount", "N/A")

            col1, col2, col3 = st.columns(3)
            col1.metric("🏪 Vendor", vendor)
            col2.metric("📅 Date", date)
            col3.metric("💰 Total", f"₹{total}")

            # Items table
            items = parsed_json.get("items", [])
            if items:
                st.markdown("#### 🧾 Items Purchased")
                st.dataframe(items, use_container_width=True)
            else:
                st.warning("No items found in the receipt.")

            st.subheader("📈 Expense Breakdown")
            fig = plot_expense_pie(parsed_json.get("items", []))
            st.plotly_chart(fig, use_container_width=True)

            # 4️⃣ Chat interface for all receipts
            st.subheader("💬 Ask about all receipts")

            # Load all insights
            all_receipts_data = []
            for f in os.listdir(INSIGHT_DIR):
                with open(os.path.join(INSIGHT_DIR, f), "r") as jf:
                    try:
                        all_receipts_data.append(json.load(jf))
                    except:
                        pass

            user_query = st.text_input("Ask anything like 'How much did I spend on food?' or 'Any tips for saving?'")

            if user_query:
                with st.spinner("Thinking..."):
                    response = answer_query_on_receipts(all_receipts_data, user_query)
                    st.markdown(f"**🧠 Assistant says:**\n\n{response}")
else:
    st.warning("No receipts uploaded yet.")
