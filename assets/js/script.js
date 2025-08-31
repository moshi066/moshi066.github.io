'use strict';

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const mobileNavLinks = document.querySelectorAll('#mobile-menu a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    const typedText = document.getElementById('typed-text');
    const text = "4+ years of experience  •  Problem Solver  •  Tech Enthusiast";

    const scrollProgress = document.getElementById('scroll-progress');
    const backToTop = document.getElementById('back-to-top');

    const expandBtn = document.getElementById('expand-details-btn');
    const detailedAchievements = document.getElementById('detailed-achievements');

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.id;
                const currentNavLink = document.querySelector(`nav a[href="#${currentId}"]`);
                const currentMobileLink = document.querySelector(`#mobile-menu a[href="#${currentId}"]`);

                navLinks.forEach(link => link.classList.remove('active'));
                mobileNavLinks.forEach(link => link.classList.remove('active'));

                if (currentNavLink) {
                    currentNavLink.classList.add('active');
                }
                if (currentMobileLink) {
                    currentMobileLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    const heroLink = document.querySelector('nav a[href="#hero"]');
    const heroMobileLink = document.querySelector('#mobile-menu a[href="#hero"]');
    if (heroLink) heroLink.classList.add('active');
    if (heroMobileLink) heroMobileLink.classList.add('active');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
            const icon = themeToggle.querySelector('i');
            if (html.classList.contains('dark')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });

        if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            html.classList.add('dark');
            const icon = themeToggle.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            const icon = mobileMenuToggle.querySelector('i');
            if (mobileMenu.classList.contains('open')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            if (mobileMenu) {
                mobileMenu.classList.remove('open');
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    if (typedText) {
        let index = 0;
        const cursor = typedText.querySelector('.typing-cursor');

        function typeWriter() {
            if (index < text.length) {
                const textNode = document.createTextNode(text.charAt(index));
                typedText.insertBefore(textNode, cursor);
                index++;
                setTimeout(typeWriter, 50);
            } else {
                if (cursor) {
                    cursor.style.display = 'none';
                }
            }
        }

        setTimeout(typeWriter, 1000);
    }

    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            scrollProgress.style.width = scrollPercent + '%';
        });
    }

    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.remove('opacity-0');
                backToTop.classList.add('opacity-100');
            } else {
                backToTop.classList.remove('opacity-100');
                backToTop.classList.add('opacity-0');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const animationObserverOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, animationObserverOptions);

    document.querySelectorAll('section').forEach(section => {
        animationObserver.observe(section);
    });

    document.querySelectorAll('.card-hover').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.05)';
            card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '';
        });
    });

    if (expandBtn && detailedAchievements) {
        const chevronIcon = expandBtn.querySelector('.fas');
        const buttonText = expandBtn.querySelector('span');

        let isExpanded = false;

        function toggleAchievements() {
            if (isExpanded) {
                detailedAchievements.classList.remove('achievements-expanded');
                detailedAchievements.classList.add('achievements-collapsed');

                if (chevronIcon) {
                    chevronIcon.classList.remove('fa-chevron-up');
                    chevronIcon.classList.add('fa-chevron-down');
                }
                if (buttonText) {
                    buttonText.textContent = 'View detailed achievements';
                }

                isExpanded = false;
            } else {
                detailedAchievements.classList.remove('achievements-collapsed');
                detailedAchievements.classList.add('achievements-expanded');

                if (chevronIcon) {
                    chevronIcon.classList.remove('fa-chevron-down');
                    chevronIcon.classList.add('fa-chevron-up');
                }
                if (buttonText) {
                    buttonText.textContent = 'Hide detailed achievements';
                }

                isExpanded = true;
            }
        }

        expandBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleAchievements();
        });

        expandBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAchievements();
            }
        });

        expandBtn.addEventListener('focus', function() {
            expandBtn.style.outline = '2px solid #00ff88';
            expandBtn.style.outlineOffset = '2px';
        });

        expandBtn.addEventListener('blur', function() {
            expandBtn.style.outline = '';
            expandBtn.style.outlineOffset = '';
        });
    }
});
