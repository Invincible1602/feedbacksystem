// src/screens/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = "https://public-feedback-system.onrender.com";

const Dashboard = ({ company }) => {
  const [analyticsData, setAnalyticsData] = useState({ positive: 0, negative: 0, neutral: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (companyName) => {
    try {
      const normalizedCompanyName = companyName.toLowerCase().trim();
      const url = normalizedCompanyName
        ? `${API_BASE_URL}/analytics/?company=${encodeURIComponent(normalizedCompanyName)}`
        : `${API_BASE_URL}/analytics/`;
      const res = await fetch(url);
      const data = await res.json();
      setAnalyticsData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (company && company.trim() !== "") {
      fetchAnalytics(company);
    } else {
      setAnalyticsData({ positive: 0, negative: 0, neutral: 0 });
    }
  }, [company]);

  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      label: 'Feedback Count',
      data: [analyticsData.positive, analyticsData.negative, analyticsData.neutral],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: company ? `Analytics for ${company}` : 'Global Analytics' },
      legend: { display: false },
    },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  return (
    <div style={styles.container}>
      {loading ? <p>Loading analytics...</p> : <Bar data={chartData} options={options} />}
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '1rem auto', textAlign: 'center', fontFamily: 'Arial, sans-serif' },
};

export default Dashboard;
