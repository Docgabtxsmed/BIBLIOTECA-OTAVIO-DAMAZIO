/* Apresentações JS - Dynamic Loader */

document.addEventListener('DOMContentLoaded', () => {
    // Initial setup if needed
});

async function loadPresentation(jsonUrl) {
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        renderHero(data.meta);
        renderNav(data.sections);
        renderSections(data.sections);
        
        // Initialize Scroll Spy after rendering
        initScrollSpy();
        
    } catch (error) {
        console.error("Could not load presentation:", error);
        document.body.innerHTML = `<div class="container"><p>Erro ao carregar apresentação: ${error.message}</p></div>`;
    }
}

function renderHero(meta) {
    const heroSection = document.getElementById('hero-section');
    if (!heroSection) return;

    if (meta.backgroundImage) {
        heroSection.style.backgroundImage = `linear-gradient(rgba(0, 74, 173, 0.9), rgba(0, 42, 96, 0.9)), url('${meta.backgroundImage}')`;
    }

    const container = heroSection.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <h1 style="font-size: 2.2rem; max-width: 900px; margin: 0 auto;">${meta.title}</h1>
            <p style="margin-top: 1rem; font-size: 1.2rem;">${meta.subtitle}</p>
            <p style="margin-top: 0.5rem; font-size: 1.1rem; font-weight: 500;">${meta.authors.join(' & ')}</p>
            <p style="font-size: 0.9rem; opacity: 0.8;">Orientadora: ${meta.advisor}</p>
        `;
    }
}

function renderNav(sectionsData) {
    const navContainer = document.getElementById('presentation-nav');
    if (!navContainer) return;
    
    let html = '';
    sectionsData.forEach((section, index) => {
        const activeClass = index === 0 ? 'active' : '';
        html += `<a href="#${section.id}" class="nav-link ${activeClass}">${section.title}</a>`;
    });
    navContainer.innerHTML = html;
    
    // Smooth scroll for new links
    navContainer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function renderSections(sectionsData) {
    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    sectionsData.forEach(section => {
        const sectionEl = document.createElement('section');
        sectionEl.id = section.id;
        sectionEl.className = 'slide-section';
        
        let contentHtml = '';
        
        section.content.forEach(item => {
            contentHtml += renderItem(item);
        });

        sectionEl.innerHTML = `
            <div class="slide-header">
                <h2 class="slide-title">${section.title}</h2>
            </div>
            <div class="slide-content">
                ${contentHtml}
            </div>
        `;
        
        mainContainer.appendChild(sectionEl);

        // Render charts if any
        section.content.forEach(item => {
            if (item.type === 'chart') {
                renderChart(item.chartId, item.config);
            }
        });
    });
}

function renderItem(item) {
    switch (item.type) {
        case 'text':
            return `<p>${item.value}</p>`;
        
        case 'highlight-box':
            let listHtml = '';
            if (item.items) {
                listHtml = '<ul>' + item.items.map(li => `<li>${li}</li>`).join('') + '</ul>';
            }
            const textHtml = item.text ? `<p>${item.text}</p>` : '';
            return `
                <div class="highlight-box" style="${item.style || ''}">
                    <h3>${item.title}</h3>
                    ${textHtml}
                    ${listHtml}
                </div>`;
        
        case 'badges':
            const badgesHtml = item.items.map(badge => 
                `<span class="badge" style="padding: 0.5rem 1rem; border-radius: 20px; ${badge.style}">${badge.text}</span>`
            ).join('');
            return `<div style="display: flex; gap: 1rem; margin-top: 1rem; align-items: center; justify-content: center; flex-wrap: wrap;">${badgesHtml}</div>`;
            
        case 'grid':
            const cardsHtml = item.cards.map(card => `
                <div class="data-card">
                    <div class="stat-label">${card.label}</div>
                    <div class="big-stat" style="font-size: 1.5rem;">${card.value}</div>
                </div>
            `).join('');
            return `
                <h3 style="margin-top: 2rem;">${item.title}</h3>
                <div class="data-grid">${cardsHtml}</div>`;
                
        case 'chart':
            return `
             <div class="chart-container" style="position: relative; height:350px; width:100%; margin: 2rem 0;">
                <canvas id="${item.chartId}"></canvas>
            </div>`;
            
        case 'table':
            const headers = item.headers.map(h => `<th style="padding: 1rem;">${h}</th>`).join('');
            const rows = item.rows.map(row => 
                `<tr style="border-bottom: 1px solid #eee;">
                    ${row.map((cell, i) => `<td style="padding: 1rem; ${i > 0 ? 'font-weight: bold;' : ''}">${cell}</td>`).join('')}
                 </tr>`
            ).join('');
            
            return `
            <div class="table-responsive" style="margin-top: 2rem;">
                <table style="width: 100%; border-collapse: collapse; text-align: center;">
                    <thead style="background: var(--color-primary); color: white;">
                        <tr>${headers}</tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
            
        default:
            return '';
    }
}

function renderChart(canvasId, config) {
    // Delay slightly to ensure DOM is ready if needed, though appendChild is sync
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (ctx && window.Chart) {
        new Chart(ctx, config);
    }
}

function initScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.slide-section');

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(`#${current}`)) {
                link.classList.add('active');
            }
        });
    });
}
