// src/screens/Feedback.js
import React, { useState } from 'react';
import Dashboard from './Dashboard';

const API_BASE_URL = "https://public-feedback-system.onrender.com";

const Feedback = () => {
  const [company, setCompany] = useState('');
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dashboardKey, setDashboardKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/classify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, feedback }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      
      // If alertSent is true, show a pop-up notification.
      if (data.alertSent) {
        window.alert("Alert notification sent to company admin due to high negative feedback.");
      }
      
      // Force re-mount of Dashboard to fetch updated analytics.
      setDashboardKey(prevKey => prevKey + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetDashboard = async () => {
    try {
      const normalizedCompanyName = company.toLowerCase().trim();
      const response = await fetch(`${API_BASE_URL}/reset/?company=${encodeURIComponent(normalizedCompanyName)}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Error resetting dashboard: ${response.status} ${response.statusText}`);
      }
      setDashboardKey(prevKey => prevKey + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Analyze Your Feedback</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label htmlFor="company" style={styles.label}>Enter Company Name:</label>
        <input
          id="company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={styles.input}
          required
        />
        <label htmlFor="feedback" style={styles.label}>Enter your feedback:</label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows="4"
          style={styles.textarea}
          required
        />
        <button type="submit" style={styles.button}>Analyze</button>
      </form>
      {error && <p style={styles.error}>Error: {error}</p>}
      {result && (
        <div style={styles.result}>
          <h2>Analysis Result for {result.company}</h2>
          <p><strong>Sentiment:</strong> {result.sentiment}</p>
          <p><strong>Tag:</strong> {result.tag}</p>
        </div>
      )}
      {company.trim() !== "" && (
        <div style={styles.dashboardContainer}>
          <h2>Analytics Dashboard for {company}</h2>
          <Dashboard key={dashboardKey} company={company} />
          <button onClick={handleResetDashboard} style={{ ...styles.button, marginTop: '1rem', backgroundColor: '#dc3545' }}>
            Reset Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '600px', margin: '2rem auto', padding: '1rem', fontFamily: 'Arial, sans-serif' },
  form: { marginTop: '1rem' },
  label: { fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '1rem' },
  textarea: { width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '1rem' },
  button: { padding: '0.75rem 1.5rem', fontSize: '1rem', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  error: { color: 'red', marginTop: '1rem' },
  result: { marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '5px' },
  dashboardContainer: { marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '5px' },
};

export default Feedback;
