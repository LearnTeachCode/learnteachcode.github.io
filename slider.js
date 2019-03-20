let slideIndex = 1;
showSlides(slideIndex);

// next/previous slide controls
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// thumbnail controls
function currentSlide(n) {
    showSlides(slideIndex = n);
}

// slider
function showSlides(n) {
    let i;
    let slides = document.querySelectorAll('.slide');
    let dots = document.querySelectorAll('.dot');
    console.log(slides.length);
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = 'none';
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(' active', '');
    }
    slides[slideIndex-1].style.display = 'flex';
    dots[slideIndex-1].className += ' active';
}