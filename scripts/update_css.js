const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'src', 'components', 'styles');

const globalCssPath = path.join(__dirname, 'src', 'app', 'globals.css');
const globalCss = `
:root {
  --primary: #4F46E5;
  --primary-hover: #4338CA;
  --bg-color: #F8FAFC;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --card-bg: rgba(255, 255, 255, 0.85);
  --border-color: rgba(0, 0, 0, 0.05);
  --shadow: 0 20px 40px -15px rgba(0,0,0,0.05);
  --nav-bg: rgba(255, 255, 255, 0.8);
}

body.dark-mode {
  --primary: #818CF8;
  --primary-hover: #A5B4FC;
  --bg-color: #0B1120;
  --text-main: #F8FAFC;
  --text-muted: #94A3B8;
  --card-bg: rgba(30, 41, 59, 0.5);
  --border-color: rgba(255, 255, 255, 0.08);
  --shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
  --nav-bg: rgba(15, 23, 42, 0.8);
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
  transition: background-color 0.4s ease, color 0.4s ease;
  overflow-x: hidden;
}

h1, h2, h3 {
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Common Layout Components */
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-navbar {
  background: var(--nav-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), #C084FC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links span {
  color: var(--text-muted);
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  font-size: 0.95rem;
}

.nav-links span:hover, .nav-links span.active {
  color: var(--primary);
}

/* Common Card & Form Styles */
.premium-card {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  box-shadow: var(--shadow);
  padding: 2.5rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 60px -15px rgba(0,0,0,0.1);
}

.form-group { margin-bottom: 1.5rem; }
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-main);
  font-weight: 600;
  font-size: 0.9rem;
}

.form-control, .form-group input, .form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-main);
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.form-control:focus, .form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

body.dark-mode .form-control, body.dark-mode .form-group input, body.dark-mode .form-group textarea {
  background: rgba(0, 0, 0, 0.2);
}

.btn-primary, .btn-submit {
  width: 100%;
  padding: 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
}

.btn-primary:hover, .btn-submit:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6);
}

/* Dashboard Action Cards */
.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 3rem 0;
}

.action-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow);
}
.action-card:hover {
  transform: translateY(-8px);
  border-color: var(--primary);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  border: none;
  background: rgba(79, 70, 229, 0.1);
  color: var(--primary);
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}
.action-card:hover .action-btn {
  background: var(--primary);
  color: white;
}

/* Tabs */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  background: var(--card-bg);
  padding: 0.5rem;
  border-radius: 99px;
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
}
.tab-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.tab-btn:hover:not(.active) {
  color: var(--text-main);
}

/* Footer */
footer {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}
`;
fs.writeFileSync(globalCssPath, globalCss);

// Overwrite all specific CSS files to just import globals or add minimal specific tweaks
const files = ['Dashboard.css', 'LostForm.css', 'FoundForm.css', 'Gallery.css', 'Login.css', 'Register.css'];
files.forEach(file => {
  const filePath = path.join(cssDir, file);
  if (fs.existsSync(filePath)) {
    let content = `
/* Enhanced Styles for ${file} */
.form-page, .dashboard-page, .gallery-page, .login-page, .register-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.form-container, .dashboard-container, .gallery-container {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  width: 100%;
  box-sizing: border-box;
}

.form-box {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: var(--shadow);
  max-width: 600px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.form-box h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text-main);
}

.form-subtitle {
  color: var(--text-muted);
  margin-bottom: 2rem;
  font-size: 1.05rem;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow);
}
.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

/* Steps */
.info-section { margin-top: 4rem; }
.steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
.step {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.step-number {
  background: var(--primary);
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
}

/* Gallery Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}
.item-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: transform 0.3s, box-shadow 0.3s;
}
.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
}
.item-image img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-bottom: 1px solid var(--border-color);
}
.item-content {
  padding: 1.5rem;
}
.item-content h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.item-description {
  color: var(--text-muted);
  margin-bottom: 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
}
.item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--primary);
  font-weight: 600;
}
`;
    fs.writeFileSync(filePath, content);
  }
});
