from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import torch
import json
import os
import gdown
import smtplib
from email.mime.text import MIMEText
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline

app = FastAPI()

# Enable CORS so that your React frontend can communicate with this backend.
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend's origin.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Drive File IDs for required resources.
MODEL_ID = "1jhqYRxfj8pfr9xqS4ytPPyeBtB5aH7KB"
TAGS_ID = "1SYGEgtgG4Pd-BQ1Au9czqbvkwiXmVycx"
EMBEDDINGS_ID = "1VbCx1_qinwQ2YwylUNmQRLB1ts3dE0L4"

# Local file paths.
MODEL_PATH = "saved_model.pkl"
TAGS_PATH = "saved_tags.json"
EMBEDDINGS_PATH = "saved_embeddings.json"
ANALYTICS_DATA_PATH = "analytics_data.json"

def download_file(url, path):
    if not os.path.exists(path):
        gdown.download(url, path, quiet=False)

download_file(f"https://drive.google.com/uc?export=download&id={MODEL_ID}", MODEL_PATH)
download_file(f"https://drive.google.com/uc?export=download&id={TAGS_ID}", TAGS_PATH)
download_file(f"https://drive.google.com/uc?export=download&id={EMBEDDINGS_ID}", EMBEDDINGS_PATH)

# Lazy-loaded resources.
model = None
sentiment_pipeline = None
tags = None
embeddings = None

# In-memory analytics data per company.
# Each company now stores sentiment counts and a tags array.
analytics_data = {}  # Example: {"acme corp": {"positive": 0, "negative": 0, "neutral": 0, "tags": []}}

def load_analytics_data():
    global analytics_data
    if os.path.exists(ANALYTICS_DATA_PATH):
        with open(ANALYTICS_DATA_PATH, "r") as f:
            analytics_data = json.load(f)
    else:
        analytics_data = {}

def save_analytics_data():
    with open(ANALYTICS_DATA_PATH, "w") as f:
        json.dump(analytics_data, f)

# Load persisted analytics data on startup.
load_analytics_data()

def load_resources():
    global model, sentiment_pipeline, tags, embeddings
    if model is None:
        model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    if sentiment_pipeline is None:
        sentiment_pipeline = pipeline("sentiment-analysis", 
                                      model="distilbert-base-uncased-finetuned-sst-2-english", 
                                      trust_remote_code=False)
    if tags is None:
        with open(TAGS_PATH, "r") as f:
            tags = json.load(f)
    if embeddings is None:
        with open(EMBEDDINGS_PATH, "r") as f:
            embeddings = json.load(f)
        for key in embeddings:
            embeddings[key] = torch.tensor(embeddings[key], dtype=torch.float16, device="cpu")

# Set a threshold for triggering alerts.
ALERT_THRESHOLD = 5

# Helper function to send an email notification.
def send_notification(company: str, negative_count: int):
    sender_email = "alert@example.com"       # Update with your sender email.
    receiver_email = "admin@example.com"       # Update with the recipient (e.g., company admin's) email.
    subject = f"Alert: High Negative Feedback for {company}"
    body = f"The company '{company}' has received {negative_count} negative feedback submissions. Please review the dashboard for details."
    
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = receiver_email

    try:
        with smtplib.SMTP("smtp.example.com", 587) as server:
            server.starttls()
            server.login("your_username", "your_password")
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print("Notification email sent successfully.")
    except Exception as e:
        print("Failed to send notification email:", str(e))

# Request model includes both company and feedback.
class FeedbackRequest(BaseModel):
    company: str = Field(..., min_length=1, description="Company name must not be empty")
    feedback: str = Field(..., min_length=1, description="Feedback text must not be empty")

def classify_feedback(feedback: str):
    load_resources()  # Ensure resources are loaded.
    feedback = feedback.strip()
    if not feedback:
        raise HTTPException(status_code=400, detail="Feedback cannot be empty or just spaces")
    
    feedback_embedding = model.encode(feedback, convert_to_tensor=True, device="cpu").half()

    # Check for explicit neutral keywords.
    neutral_keywords = {"normal", "basic", "average", "fine", "okay", "decent",
                        "standard", "ordinary", "regular", "common", "nothing",
                        "usual", "necessary", "general", "typical", "neutral", "okk", "ok"}
    if any(word in feedback.lower() for word in neutral_keywords):
        best_match_index = torch.argmax(util.pytorch_cos_sim(feedback_embedding, embeddings["neutral"])).item()
        return "neutral", tags["neutral"][best_match_index]
    
    # Check semantic similarity with neutral tags.
    neutral_similarity_scores = util.pytorch_cos_sim(feedback_embedding, embeddings["neutral"])
    if torch.max(neutral_similarity_scores).item() > 0.7:
        best_match_index = torch.argmax(neutral_similarity_scores).item()
        return "neutral", tags["neutral"][best_match_index]
    
    # Perform sentiment analysis.
    sentiment_result = sentiment_pipeline(feedback)[0]
    sentiment_label = sentiment_result["label"]
    sentiment_score = sentiment_result["score"]

    if sentiment_label == "POSITIVE" and sentiment_score >= 0.65:
        tag_category = "positive"
        tag_embeddings = embeddings["positive"]
        tag_list = tags["positive"]
    elif sentiment_label == "NEGATIVE" and sentiment_score >= 0.65:
        tag_category = "negative"
        tag_embeddings = embeddings["negative"]
        tag_list = tags["negative"]
    else:
        tag_category = "neutral"
        tag_embeddings = embeddings["neutral"]
        tag_list = tags["neutral"]

    similarity_scores = util.pytorch_cos_sim(feedback_embedding, tag_embeddings)
    best_match_index = torch.argmax(similarity_scores).item()
    best_tag = tag_list[best_match_index]
    return tag_category, best_tag

@app.post("/classify/")
async def classify(request: FeedbackRequest):
    sentiment, tag = classify_feedback(request.feedback)
    # Normalize the company name: strip whitespace and convert to lower-case.
    company = request.company.strip().lower()
    if company == "":
        raise HTTPException(status_code=400, detail="Company name cannot be empty")
    
    # Initialize analytics for company if not present.
    if company not in analytics_data:
        analytics_data[company] = {"positive": 0, "negative": 0, "neutral": 0, "tags": []}
    
    analytics_data[company][sentiment] += 1
    analytics_data[company]["tags"].append(tag)
    save_analytics_data()  # Persist changes

    alert_triggered = False
    if analytics_data[company]["negative"] >= ALERT_THRESHOLD:
        send_notification(company, analytics_data[company]["negative"])
        alert_triggered = True
    
    return {"company": company, "sentiment": sentiment, "tag": tag, "alertSent": alert_triggered}

@app.get("/analytics/")
async def analytics(company: str = Query(None, description="Optional company name to filter analytics")):
    if company:
        company = company.strip().lower()  # Normalize the company name here
        return analytics_data.get(company, {"positive": 0, "negative": 0, "neutral": 0, "tags": []})
    else:
        return analytics_data

@app.post("/reset/")
async def reset_analytics(company: str = Query(..., description="Company name to reset analytics for")):
    company = company.strip().lower()  # Normalize the company name here
    if not company:
        raise HTTPException(status_code=400, detail="Company name cannot be empty")
    analytics_data[company] = {"positive": 0, "negative": 0, "neutral": 0, "tags": []}
    save_analytics_data()  # Persist changes
    return {"message": f"Analytics for {company} have been reset.", "data": analytics_data[company]}

@app.get("/")
async def home():
    return {"message": "Public Sentiment Analysis API is running!"}

if __name__ == "__main__":
    import uvicorn    
    uvicorn.run(app, host="0.0.0.0", port=8000)
