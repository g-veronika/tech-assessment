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
    console.log("criterias", criterias);

    const criteriaLength = Object.keys(criterias).length;

    if (criteriaLength === 0) {
      return allCriteriaPassed;
    }

    for (const element in criterias) {
      const criteria = criterias[element];
      console.log("////////criteria", criteria);
      console.log("//////// cart", cart);
      console.log("//////// element", element);

      const cartElementToCheck = this.getNestedValue(cart, element);

      console.log("cartElementToCheck", cartElementToCheck);

      if (cartElementToCheck === undefined || cartElementToCheck === null) {
        allCriteriaPassed = false;
        break;
      }

      if (typeof criteria === "object") {
        console.log("in if typeof criteria");

        const condition = this.checkComparison(cartElementToCheck, criteria);

        console.log("condition", condition);

        if (condition === false) {
          allCriteriaPassed = false;
          break;
        }
        if (condition === true) {
          continue;
        }
      }

      if (cartElementToCheck != criteria) {
        allCriteriaPassed = false;
        break;
      }
    }

    return allCriteriaPassed;
  }

  checkComparison(cartValue, criteria) {
    if (Array.isArray(cartValue)) {
      return cartValue.some((item) => this.checkComparison(item, criteria));
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
    } else if (criteria.hasOwnProperty("and")) {
      let isValid = false;
      if (Array.isArray(criteria.and)) {
        isValid = criteria.and.every((element) => {
          return this.checkComparison(cartValue, element);
        });
      } else {
        isValid = true;
        for (const key in criteria.and) {
          const value = criteria.and[key];

          let checked = this.checkComparison(cartValue, { [key]: value });

          if (!checked) {
            isValid = false;
            break;
          }
        }
      }
      return isValid;
    } else if (criteria.hasOwnProperty("or")) {
      let isValid = false;

      for (const key in criteria.or) {
        const value = criteria.or[key];

        let checked = this.checkComparison(cartValue, { [key]: value });
        if (checked) {
          isValid = true;
        }
      }
      return isValid;
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
      result = result ? result[key] : undefined;
    }

    if (Array.isArray(result)) {
      return result;
    }

    return result;
  }
}

module.exports = {
  EligibilityService,
};
