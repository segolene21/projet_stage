// Initialise l'arriere-plan anime au chargement de la page.
// Prepare les animations et les images de l'arriere-plan.
document.addEventListener('DOMContentLoaded', () => {
    const images = window.backgroundImages || [];
    const slides = document.querySelectorAll('.card-slide');

    const typeAnimation = (element, delay = 70, startAfter = 400) => {
        const text = element.textContent.trim();
        element.textContent = '';
        const chars = [...text];
        chars.forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            element.appendChild(span);
        });

        const spans = element.querySelectorAll('span');
        spans.forEach((span, index) => {
            setTimeout(() => {
                span.classList.add('visible');
            }, startAfter + index * delay);
        });
    };

    const yello = document.querySelector('#yello');
    const welcome = document.querySelector('#welcome');
    if (yello) typeAnimation(yello, 80, 250);
    if (welcome) typeAnimation(welcome, 70, 900);

    if (images.length > 0 && slides.length === 2) {
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        let currentImage = 0;
        let activeSlide = 0;

        slides[0].style.backgroundImage = `url('${images[0]}')`;
        slides[0].classList.add('active');

        if (images.length > 1) {
            slides[1].style.backgroundImage = `url('${images[1]}')`;
        }

        setInterval(() => {
            const nextImage = (currentImage + 1) % images.length;
            const nextSlide = 1 - activeSlide;

            slides[nextSlide].style.backgroundImage = `url('${images[nextImage]}')`;
            slides[nextSlide].classList.add('active');
            slides[activeSlide].classList.remove('active');

            currentImage = nextImage;
            activeSlide = nextSlide;
        }, 2000);
    }
});
