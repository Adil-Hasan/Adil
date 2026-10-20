import contact from '../../public/contact.json';

const feedback = document.querySelector('#contact-feedback');
const fallback = document.querySelector('.contact-copy-fallback');
let feedbackTimer;

document.querySelectorAll('[data-copy-email]').forEach(button => {
  let copying = false;
  button.addEventListener('click', async () => {
    if (copying) return;
    copying = true;
    clearTimeout(feedbackTimer);
    const detail = button.querySelector('.contact-card-detail');
    detail.textContent = contact.copy.pending;
    fallback.hidden = true;
    feedback.textContent = '';
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      detail.textContent = contact.copy.copied;
      button.dataset.copied = 'true';
      feedback.textContent = contact.copy.success;
      feedbackTimer = setTimeout(() => {
        detail.textContent = contact.copy.label;
        delete button.dataset.copied;
        feedback.textContent = '';
      }, 2400);
    } catch {
      delete button.dataset.copied;
      detail.textContent = contact.copy.label;
      feedback.textContent = contact.copy.error;
      fallback.hidden = false;
      const address = fallback.querySelector('input');
      address.focus({ preventScroll: true });
      address.select();
    } finally {
      copying = false;
    }
  });
});
