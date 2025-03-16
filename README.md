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
  - `/reset/` – (For testing purposes only) Resets the analytics data for a specified company. Note: In the final product, this endpoint will be removed or secured since resetting will delete stored data.
- `/` – Health check endpoint confirming that the API is running.

## Prerequisites

- Python 3.8 or later
- Node.js and npm (for the frontend)
- Git

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Invincible1602/Public-Feedback-System.git
   ```

   Screenshots:
<img width="872" alt="Screenshot 2025-03-16 at 6 51 09 PM" src="https://github.com/user-attachments/assets/a7b6f7d2-3e04-498f-820b-b61e86af3415" />
<img width="872" alt="Screenshot 2025-03-16 at 6 51 19 PM" src="https://github.com/user-attachments/assets/aa96561d-d446-424a-8c30-58fe7b99775b" />
<img width="872" alt="Screenshot 2025-03-16 at 6 53 09 PM" src="https://github.com/user-attachments/assets/b3a92310-6499-42c2-a96e-a4296c3aeb59" />
<img width="872" alt="Screenshot 2025-03-16 at 6 53 20 PM" src="https://github.com/user-attachments/assets/b68d7523-badf-40e7-9e8e-493843dbbb8b" />
<img width="872" alt="Screenshot 2025-03-16 at 6 56 55 PM" src="https://github.com/user-attachments/assets/045c0cc6-abc1-4530-b27b-0fad2a772726" />



