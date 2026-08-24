let countries = [];
let filteredCountries = [];
let favorites = [];
let showFavoritesOnly = false;

const searchInput = document.getElementById("search");
const regionSelect = document.getElementById("regionFilter");
const sortSelect = document.getElementById("sortFilter");
const container = document.getElementById("countryContainer");
const count = document.getElementById("countryCount");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const showFavBtn = document.getElementById("showFav");
const darkModeBtn = document.getElementById("darkModeBtn");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const modalFlag = document.getElementById("modalFlag");
const modalName = document.getElementById("modalName");
const officialName = document.getElementById("officialName");
const capital = document.getElementById("capital");
const region = document.getElementById("region");
const subregion = document.getElementById("subregion");
const population = document.getElementById("population");
const area = document.getElementById("area");
const languages = document.getElementById("languages");
const currencies = document.getElementById("currencies");

const favoritesKey = "favoriteCountries";
const themeKey = "countryExplorerTheme";
const apiUrl = "https://api.restcountries.com/countries/v5";
const apiHeaders = {
    Authorization: "Bearer rc_live_0031682cff6f41aca75c95351320491a"
};

function normalizeCountry(country) {
    if (!country) return null;

    const capitalName = country.capitals?.[0]?.name;

    return {
        id: country.codes?.alpha_3 || country.names?.common || "unknown",
        name: {
            common: country.names?.common || "N/A",
            official: country.names?.official || country.names?.common || "N/A"
        },
        capital: capitalName ? [capitalName] : ["N/A"],
        region: country.region || "N/A",
        subregion: country.subregion || "N/A",
        population: country.population || 0,
        area: country.area?.kilometers || 0,
        flags: {
            png: country.flag?.url_png || ""
        },
        
        languages: Object.fromEntries(
            (country.languages || []).map((l, i) => [
                l.code || l.iso639_1 || String(i),
                l.name || l.common || String(l)
            ])
        ),
        currencies: Object.fromEntries(
            (country.currencies || []).map(c => [
                c.code,
                { name: c.name, symbol: c.symbol }
            ])
        ),
        cca3: country.codes?.alpha_3 || ""
    };
}

async function loadCountries() {
    loading.style.display = "block";
    error.style.display = "none";
    error.innerHTML = "";

    try {
        let allObjects = [];
        let offset = 0;
        const limit = 100; 
        let more = true;

        while (more) {
            const response = await fetch(`${apiUrl}?limit=${limit}&offset=${offset}`, {
                headers: { Authorization: "Bearer rc_live_0031682cff6f41aca75c95351320491a" }
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const result = await response.json();
            const objects = result?.data?.objects || [];
            allObjects = allObjects.concat(objects);

            more = result?.data?.meta?.more || false;
            offset += limit;
        }

        countries = allObjects.map(normalizeCountry);
        applyFiltersAndSort();
    } catch (err) {
        console.error(err);
        error.innerHTML = `<h2>${err.message}</h2>`;
        error.style.display = "block";
    } finally {
        loading.style.display = "none";
    }
}

function getCountryId(country) {
    return country.id || country.cca3 || country.ccn3 || country.name?.common || country.name?.official;
}

function saveFavorites() {
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
}

function loadFavorites() {
    const stored = localStorage.getItem(favoritesKey);
    favorites = stored ? JSON.parse(stored) : [];
}

function updateFavoritesButton() {
    showFavBtn.textContent = showFavoritesOnly ? "🌍 All Countries" : "❤️ Favourites";
}

function applyTheme() {
    const isDark = localStorage.getItem(themeKey) === "dark";
    document.body.classList.toggle("dark", isDark);
    darkModeBtn.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i> Light Mode'
        : '<i class="fa-solid fa-moon"></i> Dark Mode';
}

function updateCount() {
    count.innerHTML = `Showing ${filteredCountries.length} of ${countries.length} countries`;
}

function sortCountries(list) {
    const sortedList = [...list];
    const sortValue = sortSelect.value;

    if (sortValue === "az") {
        sortedList.sort((a, b) => a.name.common.localeCompare(b.name.common));
    } else if (sortValue === "za") {
        sortedList.sort((a, b) => b.name.common.localeCompare(a.name.common));
    } else if (sortValue === "high") {
        sortedList.sort((a, b) => b.population - a.population);
    } else if (sortValue === "low") {
        sortedList.sort((a, b) => a.population - b.population);
    }

    return sortedList;
}

function applyFiltersAndSort() {
    const text = searchInput.value.trim().toLowerCase();
    const regionValue = regionSelect.value;

    let filtered = countries.filter((country) => {
        const matchesSearch = country.name.common.toLowerCase().includes(text);
        const matchesRegion = regionValue === "All" || country.region === regionValue;
        return matchesSearch && matchesRegion;
    });

    if (showFavoritesOnly) {
        filtered = filtered.filter((country) => favorites.includes(getCountryId(country)));
    }

    filteredCountries = sortCountries(filtered);
    displayCountries(filteredCountries);
    updateCount();
}

function displayCountries(data) {
    container.innerHTML = "";

    if (!data.length) {
        container.innerHTML = "<p>No countries found.</p>";
        return;
    }

    data.forEach((country) => {
        const countryId = getCountryId(country);
        const isFavorite = favorites.includes(countryId);

        container.insertAdjacentHTML(
            "beforeend",
            `
            <article class="country-card" data-country-id="${countryId}">
                <button class="favBtn ${isFavorite ? "active" : ""}" aria-label="Toggle favorite">
                    ${isFavorite ? "💛" : "🤍"}
                </button>
                <img class="flag" src="${country.flags?.png || ""}" alt="Flag of ${country.name.common}">
                <div class="card-body">
                    <h2 class="country-name">${country.name.common}</h2>
                    <p><strong>Capital:</strong> <span class="country-capital">${country.capital?.[0] || "N/A"}</span></p>
                    <p><strong>Region:</strong> <span class="country-region">${country.region || "N/A"}</span></p>
                    <p><strong>Population:</strong> <span class="country-population">${country.population?.toLocaleString() || "N/A"}</span></p>
                </div>
            </article>
            `
        );
    });
}

function openCountryModal(countryId) {
    const country = countries.find((item) => getCountryId(item) === countryId);

    if (!country) return;

    modalFlag.src = country.flags?.png || "";
    modalFlag.alt = `Flag of ${country.name.common}`;
    modalName.textContent = country.name.common;
    officialName.textContent = country.name.official || "N/A";
    capital.textContent = country.capital?.[0] || "N/A";
    region.textContent = `${country.region || "N/A"} / ${country.subregion || "N/A"}`;
    subregion.textContent = country.subregion || "N/A";
    population.textContent = country.population?.toLocaleString() || "N/A";
    area.textContent = country.area?.toLocaleString() || "N/A";
    languages.textContent = Object.values(country.languages || {}).join(", ") || "N/A";
    currencies.textContent = Object.entries(country.currencies || {})
        .map(([code, info]) => `${info.name} (${code})`)
        .join(", ") || "N/A";

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeCountryModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
}

function toggleFavorite(countryId) {
    if (favorites.includes(countryId)) {
        favorites = favorites.filter((item) => item !== countryId);
    } else {
        favorites.push(countryId);
    }

    saveFavorites();
    applyFiltersAndSort();
}


searchInput.addEventListener("input", applyFiltersAndSort);
regionSelect.addEventListener("change", applyFiltersAndSort);
sortSelect.addEventListener("change", applyFiltersAndSort);
showFavBtn.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    updateFavoritesButton();
    applyFiltersAndSort();
});
darkModeBtn.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem(themeKey, nextTheme);
    applyTheme();
});
closeModalBtn.addEventListener("click", closeCountryModal);
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeCountryModal();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeCountryModal();
    }
});
container.addEventListener("click", (event) => {
    const card = event.target.closest(".country-card");
    if (!card) return;

    const countryId = card.dataset.countryId;

    if (event.target.closest(".favBtn")) {
        event.stopPropagation();
        toggleFavorite(countryId);
        return;
    }

    openCountryModal(countryId);
});

loadFavorites();
applyTheme();
updateFavoritesButton();
loadCountries();