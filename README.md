# Public Feedback System

This project provides a full-stack solution for analyzing public feedback using a FastAPI backend and a React frontend. It classifies user feedback into positive, negative, or neutral sentiments, generates tags based on the analysis, and stores analytics per company. An email notification is triggered when negative feedback exceeds a configurable threshold.

## Features

- **Sentiment Classification:** Uses Hugging Face's Transformers and Sentence Transformers to analyze feedback.
- **Tag Generation:** Associates feedback with tags derived from semantic similarity and keyword checks.
- **Analytics Dashboard:** Tracks sentiment counts and tags per company.
- **Email Notifications:** Alerts administrators when negative feedback crosses a set threshold.
- **API Endpoints:**
  - `/classify/` – Accepts feedback and company name, performs analysis, and updates analytics.
  - `/analytics/` – Retrieves analytics data. Optionally filters data by company.
  - `/reset/` – Resets the analytics data for a specified company.
  - `/` – Health check endpoint confirming that the API is running.

## Prerequisites

- Python 3.8 or later
- Node.js and npm (for the frontend)
- Git

## Installation

### Backend

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Invincible1602/Public-Feedback-System.git
   cd Public-Feedback-System/backend

