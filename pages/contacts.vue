<template>
  <div class="contacts">
    <section class="contacts-hero">
      <div class="container">
        <div class="hero-content fade-in-up">
          <h1 class="page-title">Get In Touch</h1>
          <p class="page-subtitle">
            Let's discuss your next project or just say hello
          </p>
        </div>
      </div>
    </section>

    <section class="contact-content">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <h2>Let's Connect</h2>
            <p class="contact-description">
              I'm always interested in new opportunities and collaborations. 
              Whether you have a project in mind or just want to chat about technology, 
              feel free to reach out!
            </p>
            
            <div class="contact-methods">
              <div class="contact-method">
                <div class="method-icon">📧</div>
                <div class="method-content">
                  <h3>Email</h3>
                  <a href="mailto:lorenzo.venturi@example.com">lorenzo.venturi@example.com</a>
                </div>
              </div>
              
              <div class="contact-method">
                <div class="method-icon">�</div>
                <div class="method-content">
                  <h3>LinkedIn</h3>
                  <a href="https://linkedin.com/in/lorenzoventuri" target="_blank">linkedin.com/in/lorenzoventuri</a>
                </div>
              </div>
              
              <div class="contact-method">
                <div class="method-icon">🐙</div>
                <div class="method-content">
                  <h3>GitHub</h3>
                  <a href="https://github.com/LorenzoVenturi" target="_blank">github.com/LorenzoVenturi</a>
                </div>
              </div>
              
              <div class="contact-method">
                <div class="method-icon">🐦</div>
                <div class="method-content">
                  <h3>Twitter</h3>
                  <a href="https://twitter.com/lorenzoventuri" target="_blank">@lorenzoventuri</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="contact-form-container">
            <form class="contact-form">
              <h2>Send Message</h2>
              
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required>
              </div>
              
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="subject">Subject</label>
                <input type="text" id="subject" name="subject" required>
              </div>
              
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>
              
              <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.contacts {
  min-height: 100vh;
}

.contacts-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6rem 2rem 4rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.contacts-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="circles" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="3" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23circles)"/></svg>');
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

.contact-content {
  padding: 5rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

.contact-info h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
}

.contact-description {
  color: #718096;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-method {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.contact-method:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.method-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
}

.method-content h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.method-content a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.method-content a:hover {
  color: #764ba2;
}

.contact-form-container {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.contact-form h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3748;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f7fafc;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  font-size: 1rem;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2.5rem;
  }
  
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .contact-method {
    flex-direction: column;
    text-align: center;
  }
  
  .contact-form-container {
    padding: 1.5rem;
  }
}
</style>