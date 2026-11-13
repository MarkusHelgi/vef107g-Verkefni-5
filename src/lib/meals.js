import { el, empty } from './elements.js';

/**
 * @typedef {import('./meal.types.js').MealSummary} MealSummary
 * @typedef {import('./meal.types.js').Meal} Meal
 */

/**
 * Viðmót fyrir uppskriftaleit: leitarform, niðurstöður og stök uppskrift.
 */
export class MealSearcher {
  /**
   * @param {import('./api.js').MealApi} api Tenging við API
   * @param {HTMLElement} baseElement Element sem viðmót er birt í
   */
  constructor(api, baseElement) {
    this.api = api;
    this.baseElement = baseElement;
  }

  /**
   * Tæmir grunnelement og setur `children` í staðinn.
   * @param {...HTMLElement} children Element sem á að birta
   */
  show(...children) {
    empty(this.baseElement);

    for (const child of children) {
      this.baseElement.appendChild(child);
    }
  }

  /**
   * Býr til skilaboð til notanda.
   * @param {string} text Texti skilaboða
   * @returns {HTMLElement}
   */
  message(text) {
    return el('p', { class: 'message' }, text);
  }

  /**
   * Býr til hlekk aftur á forsíðu.
   * @returns {HTMLElement}
   */
  backLink() {
    return el('p', {}, el('a', { href: '/' }, 'Til baka'));
  }

  /**
   * Birtir leitarform og tómt svæði fyrir niðurstöður.
   */
  renderSearch() {
    const input = el('input', {
      type: 'search',
      name: 'query',
      placeholder: 'Leitarorð á ensku, t.d. bread',
      'aria-label': 'Leitarorð',
    });
    const results = el('div', { class: 'results' });

    const form = el(
      'form',
      {
        class: 'form',
        submit: (event) => {
          event.preventDefault();
          this.search(input.value, results);
        },
      },
      el('div', { class: 'form-row' }, input, el('button', {}, 'Leita')),
    );

    this.show(form, results);
    input.focus();
  }

  /**
   * Leitar að uppskriftum og birtir niðurstöður, biðskilaboð eða villu.
   * @param {string} value Leitarstrengur frá notanda
   * @param {HTMLElement} results Element sem niðurstöður eru birtar í
   */
  async search(value, results) {
    const query = value.trim();
    empty(results);

    if (!query) {
      results.appendChild(this.message('Sláðu inn leitarorð til að leita.'));
      return;
    }

    results.appendChild(this.message(`Leita að „${query}“…`));

    /** @type {MealSummary[]} */
    let meals;
    try {
      meals = await this.api.search(query);
    } catch (err) {
      console.error(err);
      empty(results);
      results.appendChild(
        this.message('Villa kom upp við að sækja uppskriftir. Reyndu aftur.'),
      );
      return;
    }

    empty(results);

    if (meals.length === 0) {
      results.appendChild(
        this.message(`Engar uppskriftir fundust fyrir „${query}“.`),
      );
      return;
    }

    results.appendChild(this.renderResults(meals));
  }

  /**
   * Býr til lista af leitarniðurstöðum, mynd og titill eru hlekkur.
   * @param {MealSummary[]} meals Uppskriftir
   * @returns {HTMLElement}
   */
  renderResults(meals) {
    const items = meals.map((meal) =>
      el(
        'li',
        { class: 'results-item' },
        el(
          'a',
          { href: `?id=${encodeURIComponent(meal.id)}` },
          el('img', { src: meal.image, alt: '' }),
          meal.title,
        ),
      ),
    );

    return el('ul', { class: 'results-list' }, ...items);
  }

  /**
   * Sækir og birtir staka uppskrift.
   * @param {string} id Auðkenni uppskriftar
   */
  async renderMeal(id) {
    this.show(this.backLink(), this.message('Sæki uppskrift…'));

    /** @type {Meal | null} */
    let meal;
    try {
      meal = await this.api.lookup(id);
    } catch (err) {
      console.error(err);
      this.show(
        this.backLink(),
        this.message('Villa kom upp við að sækja uppskrift. Reyndu aftur.'),
      );
      return;
    }

    if (!meal) {
      this.show(this.backLink(), this.message('Uppskrift fannst ekki.'));
      return;
    }

    this.show(this.backLink(), this.renderMealDetails(meal));
  }

  /**
   * Býr til birtingu á stakri uppskrift.
   * @param {Meal} meal Uppskrift
   * @returns {HTMLElement}
   */
  renderMealDetails(meal) {
    const ingredients = meal.ingredients.map((ingredient) =>
      el(
        'li',
        {},
        ingredient.measure
          ? `${ingredient.measure} ${ingredient.name}`
          : ingredient.name,
      ),
    );

    const instructions = meal.instructions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => el('p', {}, line));

    return el(
      'article',
      { class: 'meal' },
      el('h2', {}, meal.title),
      el('img', { class: 'meal-image', src: meal.image, alt: meal.title }),
      el('h3', {}, 'Hráefni'),
      el('ul', { class: 'meal-ingredients' }, ...ingredients),
      el('h3', {}, 'Leiðbeiningar'),
      el('div', { class: 'meal-instructions' }, ...instructions),
    );
  }

  /**
   * Birtir annaðhvort leitarform eða ákveðna uppskrift.
   * @param {string|null} id ID uppskriftar, ef ekki null er hún birt.
   */
  render(id = null) {
    if (id) {
      this.renderMeal(id);
    } else {
      this.renderSearch();
    }
  }
}
