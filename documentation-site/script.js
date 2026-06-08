document.addEventListener('DOMContentLoaded', () => {
  // --- Navigation Tab Switching ---
  const navButtons = document.querySelectorAll('.nav-item button');
  const sections = document.querySelectorAll('.tab-section');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      // Remove active classes
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));

      // Add active classes to target
      button.parentElement.classList.add('active');
      const targetSection = document.getElementById(targetTab);
      if (targetSection) {
        targetSection.classList.add('active');
        // Scroll to top of content smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // --- FAQ Accordions ---
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      const answer = faqItem.querySelector('.faq-answer');
      const isOpen = faqItem.classList.contains('open');

      // Close all other FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
          item.classList.remove('open');
          item.querySelector('.faq-answer').style.maxHeight = null;
        }
      });

      // Toggle current item
      if (isOpen) {
        faqItem.classList.remove('open');
        answer.style.maxHeight = null;
      } else {
        faqItem.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // --- Copy to Clipboard helper ---
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const codeElement = document.getElementById(targetId);
      if (codeElement) {
        const text = codeElement.innerText || codeElement.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const originalText = btn.innerText;
          btn.innerText = 'Copié !';
          btn.style.backgroundColor = '#10b981'; // Green accent
          setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });

  // --- Suggestion form submit (Static feedback) ---
  const suggestionForm = document.getElementById('suggestion-form');
  if (suggestionForm) {
    suggestionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert("Votre suggestion a été enregistrée avec succès. Merci pour votre retour !");
      suggestionForm.reset();
    });
  }
});
