# Phishing Website Detector 🔍

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-v3.8+-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-13.0+-000000.svg)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)

### This project is an Internal Assigment on Computer Science by Krestinin Luka

A sophisticated web application combining machine learning and modern web technologies to detect phishing websites. The system utilizes both the VirusTotal API and a custom-trained machine learning model to provide comprehensive security assessments.

→ [**View Machine Learning Documentation**](ml/) ←

## Features

- **Dual Analysis System**
    - VirusTotal API Integration for real-time threat detection
    - Custom ML model for independent analysis
    - Combined risk assessment and scoring

- **Modern Web Interface**
    - Real-time URL scanning
    - Interactive safety score visualization
    - Comprehensive scan history
    - Export functionality for scan results

- **Advanced Security Features**
    - URL validation and sanitization
    - Rate limiting and error handling
    - Cross-site request forgery protection
    - Input validation and sanitization

## Architecture

The project consists of two main components:

1. **Frontend** (Next.js)
    - Modern, responsive user interface
    - Real-time safety score visualization
    - Historical data visualization
    - Export functionality

2. **Backend**
    - VirusTotal API integration
    - [Custom ML model server](ml/)
    - SQLite database for scan history
    - RESTful API endpoints

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- VirusTotal API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/LuKresXD/phishing-website-detector.git
   cd phishing-website-detector
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install ML server dependencies:
   ```bash
   cd ml
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory:
   ```env
   VIRUSTOTAL_API_KEY=your_api_key_here
   ML_SERVER_PORT=5002
   ```

### Running the Application

1. Start the frontend development server:
   ```bash
   npm run dev
   ```

2. Start the ML server:
   ```bash
   cd ml
   python server.py
   ```

The application will be available at `http://localhost:3001`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Contact

Luka - [@lukres](https://t.me/lukres) - [me@lukres.dev](mailto:me@lukres.dev)

Project Link: [https://github.com/LuKresXD/phishing-website-detector](https://github.com/LuKresXD/phishing-website-detector)