// Amiibo API Integration
class AmiiboApp {
    constructor() {
        this.allAmiibos = [];
        this.currentFilter = 'all';
        this.currentAmiibo = null;
        this.ownedAmiibos = new Set(JSON.parse(localStorage.getItem('ownedAmiibos') || '[]'));
        this.wishlistAmiibos = new Set(JSON.parse(localStorage.getItem('wishlistAmiibos') || '[]'));
        
        this.init();
    }

    async init() {
        await this.loadAllAmiibos();
        this.setupEventListeners();
        this.displayRandomAmiibo();
    }

    async loadAllAmiibos() {
        try {
            this.showLoading();
            const response = await fetch('https://amiiboapi.com/api/amiibo/');
            const data = await response.json();
            this.allAmiibos = data.amiibo || [];
            this.hideLoading();
            this.renderAmiiboGrid();
        } catch (error) {
            console.error('Error loading amiibo data:', error);
            this.hideLoading();
        }
    }

    setupEventListeners() {
        // Title click to go back to start
        document.getElementById('titleHeader').addEventListener('click', () => {
            this.goBackToStart();
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Action buttons
        document.getElementById('toggleOwnedBtn').addEventListener('click', () => {
            this.toggleOwned();
        });

        document.getElementById('toggleWishlistBtn').addEventListener('click', () => {
            this.toggleWishlist();
        });

        document.getElementById('showSeriesBtn').addEventListener('click', () => {
            this.showSameSeries();
        });

        // Game Boy buttons
        document.getElementById('showOwnedBtn').addEventListener('click', () => {
            this.showOwnedAmiibos();
        });

        document.getElementById('showWishlistBtn').addEventListener('click', () => {
            this.showWishlistAmiibos();
        });
    }

    goBackToStart() {
        // Clear search input
        document.getElementById('searchInput').value = '';
        
        // Show all amiibos in grid
        this.renderAmiiboGrid();
        
        // Display a random amiibo in the main card
        this.displayRandomAmiibo();
    }

    performSearch() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        if (!query) {
            this.renderAmiiboGrid();
            this.displayRandomAmiibo();
            return;
        }

        const filtered = this.allAmiibos.filter(amiibo => 
            amiibo.name.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            this.displayAmiibo(filtered[0]);
            this.renderAmiiboGrid(filtered);
        } else {
            // If no results found, clear the grid
            this.renderAmiiboGrid([]);
        }
    }

    setActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    filterAmiibos() {
        if (this.currentFilter === 'all') {
            return this.allAmiibos;
        }

        return this.allAmiibos.filter(amiibo => {
            switch(this.currentFilter) {
                case 'figure':
                    return amiibo.type === 'Figure';
                case 'card':
                    return amiibo.type === 'Card';
                case 'yarn':
                    return amiibo.amiiboSeries === 'Yarn';
                default:
                    return true;
            }
        });
    }

    displayRandomAmiibo() {
        if (this.allAmiibos.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.allAmiibos.length);
        this.displayAmiibo(this.allAmiibos[randomIndex]);
    }

    displayAmiibo(amiibo) {
        this.currentAmiibo = amiibo;
        
        document.getElementById('amiiboImage').src = amiibo.image;
        document.getElementById('amiiboImage').alt = amiibo.name;
        document.getElementById('amiiboName').textContent = amiibo.name;
        document.getElementById('character').textContent = amiibo.character;
        document.getElementById('gameSeries').textContent = amiibo.gameSeries;
        document.getElementById('type').textContent = amiibo.type;
        
        // Format release date
        const releaseDate = amiibo.release?.na || 'Unknown';
        document.getElementById('releaseDate').textContent = releaseDate;

        // Update button states
        this.updateButtonStates();
    }

    updateButtonStates() {
        if (!this.currentAmiibo) return;

        const ownedBtn = document.getElementById('toggleOwnedBtn');
        const wishlistBtn = document.getElementById('toggleWishlistBtn');

        // Update owned button
        if (this.ownedAmiibos.has(this.currentAmiibo.head + this.currentAmiibo.tail)) {
            ownedBtn.classList.add('owned');
            ownedBtn.textContent = 'Owned ✓';
        } else {
            ownedBtn.classList.remove('owned');
            ownedBtn.textContent = 'Toggle Owned';
        }

        // Update wishlist button
        if (this.wishlistAmiibos.has(this.currentAmiibo.head + this.currentAmiibo.tail)) {
            wishlistBtn.classList.add('wishlist');
            wishlistBtn.textContent = 'In Wishlist ★';
        } else {
            wishlistBtn.classList.remove('wishlist');
            wishlistBtn.textContent = 'Toggle Wishlist';
        }
    }

    toggleOwned() {
        if (!this.currentAmiibo) return;

        const amiiboId = this.currentAmiibo.head + this.currentAmiibo.tail;
        if (this.ownedAmiibos.has(amiiboId)) {
            this.ownedAmiibos.delete(amiiboId);
        } else {
            this.ownedAmiibos.add(amiiboId);
        }

        // Save to localStorage
        localStorage.setItem('ownedAmiibos', JSON.stringify([...this.ownedAmiibos]));
        this.updateButtonStates();
    }

    toggleWishlist() {
        if (!this.currentAmiibo) return;

        const amiiboId = this.currentAmiibo.head + this.currentAmiibo.tail;
        if (this.wishlistAmiibos.has(amiiboId)) {
            this.wishlistAmiibos.delete(amiiboId);
        } else {
            this.wishlistAmiibos.add(amiiboId);
        }

        // Save to localStorage
        localStorage.setItem('wishlistAmiibos', JSON.stringify([...this.wishlistAmiibos]));
        this.updateButtonStates();
    }

    showSameSeries() {
        if (!this.currentAmiibo) return;

        const sameSeries = this.allAmiibos.filter(amiibo => 
            amiibo.gameSeries === this.currentAmiibo.gameSeries
        );

        this.renderAmiiboGrid(sameSeries);
        
        // Clear search input
        document.getElementById('searchInput').value = '';
    }

    showOwnedAmiibos() {
        const ownedAmiibos = this.allAmiibos.filter(amiibo => {
            const amiiboId = amiibo.head + amiibo.tail;
            return this.ownedAmiibos.has(amiiboId);
        });

        this.renderAmiiboGrid(ownedAmiibos);
        
        // Clear search input and show first owned amiibo if any
        document.getElementById('searchInput').value = '';
        if (ownedAmiibos.length > 0) {
            this.displayAmiibo(ownedAmiibos[0]);
        }
    }

    showWishlistAmiibos() {
        const wishlistAmiibos = this.allAmiibos.filter(amiibo => {
            const amiiboId = amiibo.head + amiibo.tail;
            return this.wishlistAmiibos.has(amiiboId);
        });

        this.renderAmiiboGrid(wishlistAmiibos);
        
        // Clear search input and show first wishlist amiibo if any
        document.getElementById('searchInput').value = '';
        if (wishlistAmiibos.length > 0) {
            this.displayAmiibo(wishlistAmiibos[0]);
        }
    }

    renderAmiiboGrid(amiibos = null) {
        const container = document.getElementById('amiiboGrid');
        const amiiboList = amiibos || this.filterAmiibos();
        
        container.innerHTML = '';

        // Limit to first 50 items for performance
        const displayList = amiiboList.slice(0, 50);

        displayList.forEach(amiibo => {
            const amiiboElement = this.createAmiiboElement(amiibo);
            container.appendChild(amiiboElement);
        });

        if (amiiboList.length > 50) {
            const moreElement = document.createElement('div');
            moreElement.className = 'amiibo-item';
            moreElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 120px; background: #f0f0f0; border-radius: 10px;">
                    <p>+${amiiboList.length - 50} more...</p>
                </div>
            `;
            container.appendChild(moreElement);
        }
    }

    createAmiiboElement(amiibo) {
        const element = document.createElement('div');
        element.className = 'amiibo-item';
        element.innerHTML = `
            <img src="${amiibo.image}" alt="${amiibo.name}" loading="lazy">
            <h4>${amiibo.name}</h4>
            <p>${amiibo.character}</p>
        `;
        
        element.addEventListener('click', () => {
            this.displayAmiibo(amiibo);
        });

        return element;
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AmiiboApp();
});
