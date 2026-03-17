const destinationInput = document.getElementById("destinationInput");
const searchButton = document.getElementById("searchBtn");
const clearButton = document.getElementById("clearBtn");
const recommendationsContainer = document.getElementById("recommendations");

const SEARCH_PAGE = "search.html";
let places = [];

function isSearchPage() {
    const currentPath = window.location.pathname.toLowerCase();
    return currentPath.endsWith(`/${SEARCH_PAGE}`) || currentPath.endsWith(SEARCH_PAGE);
}

function mapApiData(data) {
    const countries = (data.countries || []).flatMap(country =>
        (country.cities || []).map(city => ({
            name: city.name,
            imageUrl: city.imageUrl,
            description: city.description,
            category: `Country: ${country.name}`
        }))
    );

    const temples = (data.temples || []).map(temple => ({
        name: temple.name,
        imageUrl: temple.imageUrl,
        description: temple.description,
        category: "Temple"
    }));

    const beaches = (data.beaches || []).map(beach => ({
        name: beach.name,
        imageUrl: beach.imageUrl,
        description: beach.description,
        category: "Beach"
    }));

    return [...countries, ...temples, ...beaches];
}

function getQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
}

function updateQueryInUrl(query) {
    if (!isSearchPage()) {
        return;
    }

    const nextUrl = new URL(window.location.href);

    if (query) {
        nextUrl.searchParams.set("q", query);
    } else {
        nextUrl.searchParams.delete("q");
    }

    window.history.replaceState({}, "", nextUrl);
}

function filterPlaces(query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return places;
    }

    return places.filter(place =>
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.description.toLowerCase().includes(normalizedQuery) ||
        place.category.toLowerCase().includes(normalizedQuery)
    );
}

function createCard(place) {
    const card = document.createElement("article");
    card.className = "recommendation-card";

    card.innerHTML = `
        <img src="${place.imageUrl}" alt="${place.name}">
        <div class="recommendation-card-content">
            <p class="recommendation-category">${place.category}</p>
            <h3>${place.name}</h3>
            <p>${place.description}</p>
        </div>
    `;

    return card;
}

function renderPlaces(items) {
    if (!recommendationsContainer) {
        return;
    }

    recommendationsContainer.innerHTML = "";

    if (items.length === 0) {
        recommendationsContainer.innerHTML = "<p class=\"no-results\">No places found for this search.</p>";
        return;
    }

    items.forEach(place => {
        recommendationsContainer.appendChild(createCard(place));
    });
}

function runSearch(query) {
    const trimmedQuery = query.trim();
    renderPlaces(filterPlaces(trimmedQuery));
    updateQueryInUrl(trimmedQuery);
}

function goToSearchPage(query) {
    const trimmedQuery = query.trim();
    const targetUrl = trimmedQuery
        ? `${SEARCH_PAGE}?q=${encodeURIComponent(trimmedQuery)}`
        : SEARCH_PAGE;

    window.location.href = targetUrl;
}

function handleSearch(event) {
    if (event) {
        event.preventDefault();
    }

    const query = destinationInput ? destinationInput.value : "";

    if (!isSearchPage()) {
        goToSearchPage(query);
        return;
    }

    runSearch(query);
}

function clearSearch() {
    if (destinationInput) {
        destinationInput.value = "";
    }

    if (isSearchPage()) {
        runSearch("");
    }
}

window.clearSearch = clearSearch;

function initializeEvents() {
    if (searchButton) {
        searchButton.addEventListener("click", handleSearch);
    }

    if (destinationInput) {
        destinationInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                handleSearch(event);
            }
        });
    }

    if (clearButton) {
        clearButton.addEventListener("click", event => {
            event.preventDefault();
            clearSearch();
        });
    }
}

function initializeSearchPage() {
    if (!isSearchPage()) {
        return;
    }

    const urlQuery = getQueryFromUrl();

    if (destinationInput) {
        destinationInput.value = urlQuery;
    }

    runSearch(urlQuery);
}

initializeEvents();

fetch("travel_recomendation_api.json")
    .then(response => response.json())
    .then(data => {
        places = mapApiData(data);
        initializeSearchPage();
    })
    .catch(error => {
        console.error("Could not load places:", error);

        if (recommendationsContainer && isSearchPage()) {
            recommendationsContainer.innerHTML = "<p class=\"no-results\">Could not load recommendations right now.</p>";
        }
    });