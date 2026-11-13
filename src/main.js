import { MealApi } from './lib/api.js';
import { MealSearcher } from './lib/meals.js';

/** Grunnslóð á API, `1` er ókeypis prófunarlykill. */
const API_BASE = 'https://www.themealdb.com/api/json/v1/1/';

/** API virkni. */
const api = new MealApi(API_BASE);

const baseElement = document.querySelector('.meal-searcher');

if (baseElement) {
  const searcher = new MealSearcher(api, baseElement);
  const id = new URLSearchParams(window.location.search).get('id');

  searcher.render(id);
}
