let currency_list = [];
let convert_btn = document.querySelector("#convert_btn");
let currency_1_select = document.querySelector("#currency_1");
let currency_2_select = document.querySelector("#currency_2");
let result_input = document.querySelector("#result");
let result_box = document.querySelector("#result_box");
let amount_input = document.querySelector("#amount");
let conversion_display = document.querySelector("#conversion_display");
let loader = document.querySelector("#loader");
const API_URL = "https://free.currencyconverterapi.com/api/v5";

//updates the select fields 
let updateSelect = currency_list => {

  if (Object.keys(currency_list).length !== 0) {
    for (let currency in currency_list) {
      let new_option = new Option(
        currency_list[currency]["currencyName"],
        currency_list[currency]["id"]
      );
      let new_option_2 = new_option.cloneNode(true);

      new_option.innerHTML += ` <i class="right">${
        currency_list[currency]["id"]
      }</i>`;

      currency_1_select.options[currency_1_select.options.length] = new_option;
      currency_2_select.options[
        currency_2_select.options.length
      ] = new_option_2;
    }
  }
};


//dbPromise
let dbPromise = idb.open("currency-converter", 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      let rateStore = upgradeDB.createObjectStore("rates");
  }
});

let storeRate = (query, rate) => {
  let query_currencies = query.split("_");

  dbPromise
    .then(db => {
      let tx = db.transaction("rates", "readwrite");
      let rateStore = tx.objectStore("rates");

      if (query_currencies[0] == query_currencies[1]) {
        rateStore.put(parseFloat(rate).toFixed(6), query);
        return tx.complete;
      }

      rateStore.put(parseFloat(rate).toFixed(6), query);
      rateStore.put(
        parseFloat(1 / rate).toFixed(6),
        `${query_currencies[1]}_${query_currencies[0]}`
      );
      return tx.complete;
    })
    .then(() => console.log("currency rates stored: ", query))
    .catch((err) => console.log("Error occured when saving query to db", err));
};

let updateDisplay = (rate, query) => {
 
  conversion_display.classList.remove("hide");
  let currencies = query.split("_");
 
  conversion_display.innerHTML = `<h4 class="center-align">${currency_list[
    currencies[0]
  ]["currencySymbol"] || currencies[0]} 1 (${
    currencies[0]
  })  =  ${currency_list[currencies[1]]["currencySymbol"] ||
    currencies[1]} ${rate} (${currencies[1]})</h4>`;

  if (!amount_input.value) {
    M.toast({
      html: "No amount was selected"
    });
    return;
  }

  result_input.value = parseFloat(amount_input.value * rate).toFixed(3);
  result_box.classList.remove('hide');
  M.updateTextFields();
};

let getRatesOnline = (query) => {
  fetch(`${API_URL}/convert?q=${query}&compact=ultra`)
    .then(res => res.json())
    .then(res => {
      let rate = res[query];
      loader.classList.add("hide");
      updateDisplay(rate, query);
      //store rate in db
      storeRate(query, rate);
    })
    .catch(err => {
      loader.classList.add("hide");
      M.toast({
        html: "You Have To Connect To The Internet To Make This Conversion"
      });
    });
};

let convert = () => {
  result_box.classList.add('hide');
  if (!currency_1_select.value || !currency_2_select.value) {
    M.toast({
      html: "You didnt select two currencies!"
    });
    return;
  }

  let query = `${currency_1_select.value}_${currency_2_select.value}`;
  let rate;

  //remove  conversion detail
  if (!conversion_display.classList.contains("hide")) {
    conversion_display.classList.add("hide");
  }

  //display loading icon
  loader.classList.remove("hide");

  dbPromise
    .then(db => {
      let tx = db.transaction("rates");
      let rateStore = tx.objectStore("rates");
      return rateStore.get(query);
    })
    .then(rate => {
      if (!rate) {
        getRatesOnline(query)
        return;
      }

      loader.classList.add("hide");
      updateDisplay(rate, query);
      console.log(`rate for query ${query} from db`)
    });
};

let checkBtnState = () => {
  if (!currency_1_select.value || !currency_2_select.value || !amount_input.value) {
    convert_btn.setAttribute('disabled', 'disabled');
  } else {
    convert_btn.removeAttribute('disabled');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  result_box.classList.add('hide');
  checkBtnState();

  fetch(`${API_URL}/currencies`)
    .then(res => res.json())
    .then(res => {
      currency_list = res.results;
      updateSelect(currency_list);
      M.AutoInit();
    })
    .catch(err => {
      M.toast({
        html: 'An error occured when fetching currencies, Please check your connection'
      })
      console.log("An error occured when fetching currencies", err);
      currency_list = [];
    });
});

 if ('serviceWorker' in navigator) {
   navigator.serviceWorker.register(`${window.location.pathname}sw.js`)
     .then(() => console.log("[Service Worker] successfully register"))
     .catch((e) => console.log(e, "[Service Worker] An error occured"))
 } else {
   console.log("an error occured")
 }