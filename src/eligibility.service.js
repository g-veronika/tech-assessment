class EligibilityService {
  /**
   * Compare cart data with criteria to compute eligibility.
   * If all criteria are fulfilled then the cart is eligible (return true).
   *
   * @param cart
   * @param criterias
   * @return {boolean}
   */

  isEligible(cart, rawCriterias) {
    const criterias = this.transformCriteria(rawCriterias);

    if (Object.keys(criterias).length === 0) return true;

    for (const element in criterias) {
      const criteria = criterias[element];
      const cartElementToCheck = this.getNestedValue(cart, element);

      if (!this.isCriteriaMet(cartElementToCheck, criteria)) {
        return false;
      }
    }

    return true;
  }

  isCriteriaMet(cartElement, criteria) {
    if (cartElement === undefined || cartElement === null) return false;

    if (typeof criteria !== "object" || Array.isArray(criteria)) {
      return cartElement == criteria;
    }

    if (criteria.hasOwnProperty("and")) {
      return this.checkLogicalCondition(cartElement, criteria.and, "and");
    }

    if (criteria.hasOwnProperty("or")) {
      return this.checkLogicalCondition(cartElement, criteria.or, "or");
    }

    return this.checkComparison(cartElement, criteria);
  }

  checkLogicalCondition(cartElement, logicalCriteria, conditionType) {
    if (Array.isArray(logicalCriteria)) {
      return conditionType === "and"
        ? logicalCriteria.every((criterion) =>
            this.checkComparison(cartElement, criterion)
          )
        : logicalCriteria.some((criterion) =>
            this.checkComparison(cartElement, criterion)
          );
    }

    return conditionType === "and"
      ? Object.entries(logicalCriteria).every(([key, value]) =>
          this.checkComparison(cartElement, { [key]: value })
        )
      : Object.entries(logicalCriteria).some(([key, value]) =>
          this.checkComparison(cartElement, { [key]: value })
        );
  }

  checkComparison(cartValue, criteria) {
    if (cartValue === undefined || cartValue === null) return false;

    if (Array.isArray(cartValue)) {
      return cartValue.some((item) => this.checkComparison(item, criteria));
    }

    if (typeof cartValue === "object" && !Array.isArray(cartValue)) {
      return Object.keys(criteria).every((key) => {
        return (
          cartValue[key] === criteria[key] &&
          this.checkComparison(cartValue[key], criteria[key])
        );
      });
    }

    if (criteria.hasOwnProperty("gt") && cartValue <= criteria.gt) return false;
    if (criteria.hasOwnProperty("lt") && cartValue >= criteria.lt) return false;
    if (criteria.hasOwnProperty("gte") && cartValue < criteria.gte)
      return false;
    if (criteria.hasOwnProperty("lte") && cartValue > criteria.lte)
      return false;
    if (criteria.hasOwnProperty("in") && !criteria.in.includes(cartValue))
      return false;

    return true;
  }

  transformCriteria(criteria) {
    const result = {};

    for (const key in criteria) {
      const keys = key.split(".");

      let temp = result;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!temp[keys[i]]) {
          temp[keys[i]] = {};
        }
        temp = temp[keys[i]];
      }

      temp[keys[keys.length - 1]] = criteria[key];
    }

    return result;
  }

  getNestedValue(obj, path) {
    const keys = path.split(".");
    let result = obj;

    for (let key of keys) {
      if (result === undefined || result === null || !(key in result)) {
        return undefined;
      }
      result = result[key];
    }

    return result;
  }
}

module.exports = {
  EligibilityService,
};
