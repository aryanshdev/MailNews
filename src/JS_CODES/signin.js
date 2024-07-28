document
  .querySelector("#login-with-google-button")
  .addEventListener("click", () => {
    window.location.href='/google-login';
  });

fetch("/autologin", {
  method: "GET",
})
  .then((res) => {
    if (res.status === 202) {
      showPopup("Attempting Auto Login", "info", 2000);
    }
  })
  .then(async () => {
    setTimeout(() => {
      fetch("/autologin", {
        method: "POST",
      }).then((res) => {
        if (res.status === 406) {
          showPopup(
            "Auto Login Failed, Login and Select Save Login Information To Save Info Again",
            "err",
            7500
          );
        } else if (res.status === 200) {
            window.location.href="/dashboard";
        }
       
      });}, 2250);
  });

function validateEmail(ele) {
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(ele.value)) {
    (ele.style.border = "2px solid rgb(34, 197, 94)"),
      document
        .querySelector("button[type='submit']")
        .removeAttribute("disabled");
  } else {
    (ele.style.border = "2px solid red"),
      (ele.value = ""),
      ele.setAttribute("placeholder", "Enter a Valid E-Mail"),
      document
        .querySelector("button[type='submit']")
        .setAttribute("disabled", "disabled");
  }
}

function submitForm() {
  var processedData = new URLSearchParams(new FormData(document.forms[0]));
  processedData.append(
    "saveLogin",
    document.forms[0].querySelector("input[name='saveInfo']").checked
  );
  fetch("/signin", {
    method: "POST",
    body: processedData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then(async (res) => {
    if (res.status == 401) {
      showPopup(await res.text(), "err", 7500);
    } else if (res.status == 404) {
      showPopup(await res.text(), "err", 7500);
    } else if (res.status == 200) {
      window.location.href = "/dashboard";
    }
  });
}
document.querySelector("input[name='email']").addEventListener("blur", (listner)=>{
    validateEmail(listner.target);
})

document.querySelector("form").addEventListener("submit", (e) => {
  submitForm();
});