// src/screens/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = "https://public-feedback-system.onrender.com";

const Home = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  // Fetch the list of companies from the analytics endpoint.
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/`);
        const data = await response.json();
        const companyNames = Object.keys(data);
        setCompanies(companyNames);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // When a company is selected, fetch its analytics data (including tags).
  const handleCompanySelect = async (company) => {
    setSelectedCompany(company);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/?company=${encodeURIComponent(company)}`);
      const data = await response.json();
      setCompanyData(data);
      setFadeIn(false);
      setTimeout(() => setFadeIn(true), 10);
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  // Filter companies based on search term (case-insensitive).
  const filteredCompanies = companies.filter(company =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare the pie chart data using the sentiment counters.
  const pieData = companyData
    ? {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [
          {
            data: [companyData.positive, companyData.negative, companyData.neutral],
            backgroundColor: ['green', 'red', 'yellow'],
            hoverBackgroundColor: ['darkgreen', 'darkred', 'goldenrod'],
          },
        ],
      }
    : null;

  // Animated style for the result container.
  const containerStyle = {
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.5s ease, transform 0.5s ease',
  };

  return (
    <div style={styles.container}>
      <h1>Welcome to Public Sentiment Analysis</h1>
      <p>Gain insights into customer opinions by analyzing online feedback.</p>
      <div style={styles.buttonContainer}>
        <Link to="/feedback">
          <button style={styles.button}>Get Started</button>
        </Link>
      </div>

      <div style={styles.searchContainer}>
        <h2>Search Company Analytics</h2>
        <input
          type="text"
          placeholder="Search for a company..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            if (value === "") {
              // Reset selected company and company data when input is cleared.
              setSelectedCompany("");
              setCompanyData(null);
            }
          }}
          style={styles.searchInput}
        />
        {searchTerm && !selectedCompany && (
          <ul style={styles.dropdownList}>
            {filteredCompanies.map((company, index) => (
              <li
                key={index}
                style={styles.dropdownItem}
                onClick={() => handleCompanySelect(company)}
              >
                {company}
              </li>
            ))}
            {filteredCompanies.length === 0 && (
              <li style={styles.noResults}>No companies found.</li>
            )}
          </ul>
        )}
      </div>

      {selectedCompany && companyData && (
        <div style={{ ...styles.companyTagsContainer, ...containerStyle }}>
          <h3>Tags for {selectedCompany}</h3>
          {companyData.tags && companyData.tags.length > 0 ? (
            <ul style={styles.tagList}>
              {companyData.tags.map((tag, idx) => (
                <li key={idx} style={styles.tagItem}>
                  {tag}
                </li>
              ))}
            </ul>
          ) : (
            <p>No tags available for this company.</p>
          )}
          {pieData && (
            <div style={styles.chartContainer}>
              <h3>Tag Sentiment Distribution</h3>
              <Pie data={pieData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '2rem auto',
    textAlign: 'center',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  searchContainer: {
    marginTop: '2rem',
    textAlign: 'left',
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    transition: 'border 0.3s ease',
  },
  dropdownList: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#fff',
    maxHeight: '150px',
    overflowY: 'auto',
    position: 'absolute',
    width: '100%',
    zIndex: 1000,
  },
  dropdownItem: {
    padding: '0.5rem',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  noResults: {
    padding: '0.5rem',
    fontStyle: 'italic',
  },
  companyTagsContainer: {
    marginTop: '2rem',
    textAlign: 'left',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
  },
  tagList: {
    listStyleType: 'none',
    padding: 0,
    marginBottom: '1rem',
  },
  tagItem: {
    padding: '0.5rem 0',
    borderBottom: '1px solid #eee',
  },
  chartContainer: {
    marginTop: '2rem',
    textAlign: 'center',
  },
};

export default Home;
