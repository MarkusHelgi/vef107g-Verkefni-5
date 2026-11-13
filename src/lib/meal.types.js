/**
 * Hráefni í uppskrift, nafn og magn tekið saman.
 * @typedef {object} Ingredient
 * @property {string} name Nafn hráefnis, t.d. `Flour`
 * @property {string} measure Magn, t.d. `2 cups`, getur verið tómur strengur
 */

/**
 * Uppskrift eins og hún birtist í leitarniðurstöðum.
 * @typedef {object} MealSummary
 * @property {string} id Auðkenni uppskriftar
 * @property {string} title Heiti uppskriftar
 * @property {string} image Slóð á mynd
 */

/**
 * Öll gögn um staka uppskrift.
 * @typedef {object} Meal
 * @property {string} id Auðkenni uppskriftar
 * @property {string} title Heiti uppskriftar
 * @property {string} image Slóð á mynd
 * @property {string} category Flokkur, t.d. `Dessert`
 * @property {string} area Uppruni, t.d. `British`
 * @property {string} instructions Leiðbeiningar
 * @property {Ingredient[]} ingredients Hráefni með magni
 */

// Verður að vera amk eitt export
export default {};
