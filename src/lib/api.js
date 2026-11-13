import { sleep, error } from './helpers.js';

/**
 * @typedef {import('./meal.types.js').Ingredient} Ingredient
 * @typedef {import('./meal.types.js').MealSummary} MealSummary
 * @typedef {import('./meal.types.js').Meal} Meal
 */

/** Hámarksfjöldi hráefna í svari frá API. */
const MAX_INGREDIENTS = 20;

/** Hversu lengi er beðið ef `slow` er í leitarstreng. */
const SLOW_SECONDS = 2;

/**
 * Skilar `value` sem streng án bila í byrjun og enda, eða tómum streng ef
 * `value` er ekki strengur (t.d. `null`).
 * @param {unknown} value Gildi frá API
 * @returns {string}
 */
function toText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Tekur saman `strIngredient1..20` og `strMeasure1..20` í einn lista.
 * Ónotuð hráefni (tóm eða `null`) eru hunsuð.
 * @param {Record<string, unknown>} raw Uppskrift frá API
 * @returns {Ingredient[]}
 */
function parseIngredients(raw) {
  /** @type {Ingredient[]} */
  const ingredients = [];

  for (let i = 1; i <= MAX_INGREDIENTS; i++) {
    const name = toText(raw[`strIngredient${i}`]);

    if (name) {
      ingredients.push({ name, measure: toText(raw[`strMeasure${i}`]) });
    }
  }

  return ingredients;
}

/**
 * Staðfestir og breytir uppskrift frá API í `MealSummary`.
 * @param {unknown} raw Uppskrift frá API
 * @returns {MealSummary | null} `null` ef gögn eru ekki á réttu formi
 */
function parseMealSummary(raw) {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const id = toText(raw.idMeal);
  const title = toText(raw.strMeal);

  if (!id || !title) {
    return null;
  }

  return { id, title, image: toText(raw.strMealThumb) };
}

/**
 * Staðfestir og breytir uppskrift frá API í `Meal`.
 * @param {unknown} raw Uppskrift frá API
 * @returns {Meal | null} `null` ef gögn eru ekki á réttu formi
 */
function parseMeal(raw) {
  const summary = parseMealSummary(raw);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    category: toText(raw.strCategory),
    area: toText(raw.strArea),
    instructions: toText(raw.strInstructions),
    ingredients: parseIngredients(raw),
  };
}

/**
 * Sér um öll samskipti við TheMealDB API.
 */
export class MealApi {
  /**
   * @param {string} baseUrl API base url.
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Sækir JSON frá API. Kastar villu ef ekki tókst að sækja gögn.
   * @param {string} path Slóð miðað við `baseUrl`, t.d. `search.php`
   * @param {Record<string, string>} params Query string færibreytur
   * @returns {Promise<unknown>} Gögn úr svari
   */
  async fetchJson(path, params) {
    const url = new URL(path, this.baseUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Svar frá API ekki í lagi: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Nær í `meals` fylki úr svari frá API.
   * `{ meals: null }` og `{ meals: "Invalid ID" }` þýða að ekkert fannst.
   * @param {unknown} data Gögn úr svari
   * @returns {unknown[]} Uppskriftir, tómt fylki ef ekkert fannst
   */
  getMeals(data) {
    if (typeof data !== 'object' || data === null || !('meals' in data)) {
      throw new Error('Svar frá API er á röngu formi');
    }

    if (Array.isArray(data.meals)) {
      return data.meals;
    }

    if (data.meals === null || typeof data.meals === 'string') {
      return [];
    }

    throw new Error('Svar frá API er á röngu formi');
  }

  /**
   * Leitar að uppskriftum eftir nafni.
   * Ef `slow` er í leitarstreng er beðið, ef `error` er í honum er kastað villu.
   * @param {string} query Leitarstrengur
   * @returns {Promise<MealSummary[]>} Uppskriftir sem fundust
   */
  async search(query) {
    if (query.includes('slow')) {
      await sleep(SLOW_SECONDS);
    }

    if (query.includes('error')) {
      error('Hermd villa við leit');
    }

    const cleanQuery = query.replace('slow', '').trim();
    const data = await this.fetchJson('search.php', { s: cleanQuery });

    return this.getMeals(data)
      .map(parseMealSummary)
      .filter((meal) => meal !== null);
  }

  /**
   * Sækir allar upplýsingar um eina uppskrift.
   * @param {string} id Auðkenni uppskriftar
   * @returns {Promise<Meal | null>} Uppskrift, `null` ef hún fannst ekki
   */
  async lookup(id) {
    const data = await this.fetchJson('lookup.php', { i: id });
    const [first] = this.getMeals(data);

    if (!first) {
      return null;
    }

    const meal = parseMeal(first);

    if (!meal) {
      throw new Error('Uppskrift frá API er á röngu formi');
    }

    return meal;
  }
}
