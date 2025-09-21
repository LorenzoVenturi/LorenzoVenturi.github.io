<template>
  <div class="projects">
    <section class="projects-hero">
      <div class="container">
        <div class="hero-content fade-in-up">
          <h1 class="page-title">My Projects</h1>
          <p class="page-subtitle">
            A showcase of my recent work and creative solutions
          </p>
        </div>
      </div>
    </section>

    <section class="projects-grid-section">
      <div class="container">
        <div class="projects-grid">
          <div class="project-card">
            <div class="project-image">
              <div class="project-placeholder">🚀</div>
            </div>
            <div class="project-content">
              <h3 class="project-title">E-Commerce Platform</h3>
              <p class="project-description">
                A full-stack e-commerce solution built with Vue.js and Node.js, featuring real-time inventory management and secure payment processing.
              </p>
              <div class="project-tags">
                <span class="tag">Vue.js</span>
                <span class="tag">Node.js</span>
                <span class="tag">MongoDB</span>
              </div>
              <div class="project-links">
                <a href="#" class="btn btn-primary">Live Demo</a>
                <a href="#" class="btn btn-secondary">GitHub</a>
              </div>
            </div>
          </div>

          <div class="project-card">
            <div class="project-image">
              <div class="project-placeholder">📱</div>
            </div>
            <div class="project-content">
              <h3 class="project-title">Task Management App</h3>
              <p class="project-description">
                A modern task management application with drag-and-drop functionality, real-time collaboration, and beautiful animations.
              </p>
              <div class="project-tags">
                <span class="tag">React</span>
                <span class="tag">TypeScript</span>
                <span class="tag">Firebase</span>
              </div>
              <div class="project-links">
                <a href="#" class="btn btn-primary">Live Demo</a>
                <a href="#" class="btn btn-secondary">GitHub</a>
              </div>
            </div>
          </div>

          <div class="project-card">
            <div class="project-image">
              <div class="project-placeholder">🎨</div>
            </div>
            <div class="project-content">
              <h3 class="project-title">Design System</h3>
              <p class="project-description">
                A comprehensive design system and component library for building consistent user interfaces across multiple applications.
              </p>
              <div class="project-tags">
                <span class="tag">Figma</span>
                <span class="tag">Storybook</span>
                <span class="tag">CSS</span>
              </div>
              <div class="project-links">
                <a href="#" class="btn btn-primary">View System</a>
                <a href="#" class="btn btn-secondary">Documentation</a>
              </div>
            </div>
          </div>

          <div class="project-card">
            <div class="project-image">
              <div class="project-placeholder">⚡</div>
            </div>
            <div class="project-content">
              <h3 class="project-title">Performance Dashboard</h3>
              <p class="project-description">
                Real-time analytics dashboard with interactive charts and data visualizations for monitoring application performance.
              </p>
              <div class="project-tags">
                <span class="tag">D3.js</span>
                <span class="tag">Express</span>
                <span class="tag">WebSocket</span>
              </div>
              <div class="project-links">
                <a href="#" class="btn btn-primary">Live Demo</a>
                <a href="#" class="btn btn-secondary">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.projects {
  min-height: 100vh;
}

.projects-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6rem 2rem 4rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.projects-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
}

.page-subtitle {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 auto;
}

.projects-grid-section {
  padding: 5rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.project-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.project-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.project-image {
  height: 200px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.project-placeholder {
  font-size: 4rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.project-content {
  padding: 2rem;
}

.project-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
}

.project-description {
  color: #718096;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.project-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.8rem 1.5rem;
  font-size: 0.9rem;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2.5rem;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .project-links {
    justify-content: center;
  }
}
</style>