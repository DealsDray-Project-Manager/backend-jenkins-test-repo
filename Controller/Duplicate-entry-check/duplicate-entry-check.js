module.exports = {
  mainItemsArrayOnly: (data) => {
    let dupFindUic = [];
    for (let actUic of data.items) {
      if (dupFindUic.includes(actUic.uic)) {
        actUic["dup_uic_status"] = "Duplicate";
      }
      dupFindUic.push(actUic.uic);
    }
    return data;
  },
  tempArrayAndActArray: (data) => {
    let dupFindUic = [];
    let tempFindUic = [];
    for (let actUic of data.actual_items) {
      if (dupFindUic.includes(actUic.uic)) {
        actUic["dup_uic_status"] = "Duplicate";
      }

      dupFindUic.push(actUic.uic);
    }
    for (let tempUic of data.temp_array) {
      if (tempFindUic.includes(tempUic.uic)) {
        tempUic["dup_uic_status"] = "Duplicate";
      }

      tempFindUic.push(tempUic.uic);
    }

    return data;
  },
  onlyItemsArrayForSortingLevel: (data) => {
    let tempFindUic = [];
    for (let tempUic of data?.[1].items) {
      if (tempFindUic.includes(tempUic.uic)) {
        tempUic["dup_uic_status"] = "Duplicate";
      }
      tempFindUic.push(tempUic.uic);
    }
    return data;
  },
  itemsArrayAndActualArray: (data) => {
    let dupFindUic = [];
    let actFindUic = [];
    for (let actUic of data.actual_items) {
      if (dupFindUic.includes(actUic.uic)) {
        actUic["dup_uic_status"] = "Duplicate";
      }
      dupFindUic.push(actUic.uic);
    }
    for (let tempUic of data.items) {
      if (actFindUic.includes(tempUic.uic)) {
        console.log("s");
        tempUic["dup_uic_status"] = "Duplicate";
      }
      actFindUic.push(tempUic.uic);
    }

    return data;
  },
};
