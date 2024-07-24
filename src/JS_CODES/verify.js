function verify() {
  var form = document.forms[0];
  const formData = new FormData(form);
  var data = new URLSearchParams();
  document
    .querySelector("button[type='submit']")
    .setAttribute("disabled", "disabled");
  document.querySelector("button[type='submit']").innerHTML = `
  <svg class="animate-spin  h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-50" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path  fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>`;
  const response = fetch("/verifyEmail", {
    method: "POST",
    body: new URLSearchParams(formData).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((res) => {
    if (res.status === 200) {
      window.location.href = "/registration-successful";
    } else {
      document
        .querySelector("button[type='submit']")
        .removeAttribute("disabled");
      document.querySelector("button[type='submit']").innerHTML = `Verify`;
    showPopup("Check Your Code Again And Retry", "err")
    }
  });
}

document.querySelector("#verifyForm").addEventListener("submit", verify);
