
  let lastScroll = 0;
  const nav = document.querySelector('.nav');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > lastScroll && currentScroll > 80) {
      nav.classList.add('hide');
    } else {
      nav.classList.remove('hide');
    }

    lastScroll = currentScroll;
  });

