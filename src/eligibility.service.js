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
    let allCriteriaPassed = true;

    if (Object.keys(criterias).length === 0) {
      return allCriteriaPassed;
    }

    for (const element in criterias) {
      const criteria = criterias[element];
      const cartElementToCheck = this.getNestedValue(cart, element);

      console.log("cartElementToCheck:", cartElementToCheck);
      console.log("criteria:", criteria);
      console.log("cart", cart);

      if (cartElementToCheck === undefined || cartElementToCheck === null) {
        allCriteriaPassed = false;
        break;
      }

      if (typeof criteria !== "object" || Array.isArray(criteria)) {
        if (cartElementToCheck != criteria) {
          allCriteriaPassed = false;
          break;
        }
        continue;
      }

      if (criteria.hasOwnProperty("and")) {
        let isValid = Array.isArray(criteria.and)
          ? criteria.and.every((element) =>
              this.checkComparison(cartElementToCheck, element)
            )
          : Object.entries(criteria.and).every(([key, value]) =>
              this.checkComparison(cartElementToCheck, { [key]: value })
            );
        if (!isValid) {
          allCriteriaPassed = false;
          break;
        }
      } else if (criteria.hasOwnProperty("or")) {
        let isValid = Object.entries(criteria.or).some(([key, value]) =>
          this.checkComparison(cartElementToCheck, { [key]: value })
        );
        if (!isValid) {
          allCriteriaPassed = false;
          break;
        }
      } else {
        const condition = this.checkComparison(cartElementToCheck, criteria);

        if (!condition) {
          allCriteriaPassed = false;
          break;
        }
      }
    }


    return allCriteriaPassed;
  }

  checkComparison(cartValue, criteria) {
    if (cartValue === undefined || cartValue === null) {
      return false;
    }

    if (Array.isArray(cartValue)) {
      return cartValue.some((item) => this.checkComparison(item, criteria));
    }

    if (typeof cartValue === "object" && !Array.isArray(cartValue)) {
      for (let key in criteria) {
        if (cartValue[key] !== criteria[key]) return false;
        else if (!this.checkComparison(cartValue[key], criteria[key])) {
          return false;
        }
      }
    }

    if (criteria.hasOwnProperty("gt") && cartValue <= criteria.gt) {
      return false;
    } else if (criteria.hasOwnProperty("lt") && cartValue >= criteria.lt) {
      return false;
    } else if (criteria.hasOwnProperty("gte") && cartValue < criteria.gte) {
      return false;
    } else if (criteria.hasOwnProperty("lte") && cartValue > criteria.lte) {
      return false;
    } else if (
      criteria.hasOwnProperty("in") &&
      !criteria.in.includes(cartValue)
    ) {
      return false;
    }

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
