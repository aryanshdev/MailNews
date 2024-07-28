
function getSlot() {
  var d = new Date();
  d.setHours(7, 0, 0, 0);
  return parseInt(d.getUTCHours() * 2 + parseInt(d.getUTCMinutes() / 30));
}

document.querySelector('input[name="slot"]').value = getSlot();
function checkNameFill(ele) {
  if (ele.value) {
    (ele.style.border = "2px solid rgb(34, 197, 94)"),
      document
        .querySelector("button[type='submit']")
        .removeAttribute("disabled");
  } else {
    ele.style.border = "2px solid red";
    document
      .querySelector("button[type='submit']")
      .setAttribute("disabled", "disabled");
  }
}
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

function validatePasswordPattern(ele) {
  if (
    /(?=^.*[A-Za-z])(?=^.*\d)(?=^.*[!@#$%^&*+.-])^.+$/.test(ele.value) &&
    ele.value.length >= 6
  ) {
    (ele.style.border = "2px solid rgb(34, 197, 94)"),
      document
        .querySelector("button[type='submit']")
        .removeAttribute("disabled");
  } else {
    (ele.style.border = "2px solid red"),
      document
        .querySelector("button[type='submit']")
        .setAttribute("disabled", "disabled");
    validateSamePassword(ele.form.conpass);
  }
}

function validateSamePassword(ele) {
  if (ele.value == ele.form.pass.value && ele.value) {
    ele.style.border = "2px solid rgb(34, 197, 94)";
    document.querySelector("button[type='submit']").removeAttribute("disabled");
  } else {
    (ele.style.border = "2px solid red"),
      document
        .querySelector("button[type='submit']")
        .removeAttribute("disabled");
    (ele.vlaue = ""),
      ele.value
        ? ele.setAttribute("placeholder", "Passwords Should Match")
        : null,
      document
        .querySelector("button[type='submit']")
        .setAttribute("disabled", "disabled");
  }
}

function submitForm() {
  var form = document.forms[0];
  var data = new FormData(form);
  if (
    !Array.from(form.querySelectorAll("input[type='checkbox']:checked")).length
  ) {
    form.querySelector("h2").style.color = "red";
    return;
  }
  var formData = new URLSearchParams();
  data.forEach((value, key) => {
    formData.append(key, value);
  });
  formData.append(
    "topics",
    Array.from(form.querySelectorAll("input[type='checkbox']:checked"))
      .map((ele) => ele.value)
      .join(",")
  );
  document
    .querySelector("button[type='submit']")
    .setAttribute("disabled", "disabled");
  document.querySelector("button[type='submit']").innerHTML = `
    <svg class="animate-spin  h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-50" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path  fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>`;
  fetch("/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(), // Convert to URL-encoded string
  }).then((res) => {
    if (res.status == 200) {
      window.location.href = "/verify";
    } else if (res.status == 409) {
      toggleError("block");
      popup.textContent = "Email Already Registered With An Account";
      document
        .querySelector("button[type='submit']")
        .removeAttribute("disabled");
      document.querySelector("button[type='submit']").innerHTML = `Subscribe`;
    } else {
      document
        .querySelector("button[type='submit']")
        .removeAttribute("disabled");
      document.querySelector("button[type='submit']").innerHTML = `Subscribe`;
    }
  });
}

document.querySelector("#signup").addEventListener("submit" , ()=>{
    submitForm()
});

document.querySelector("input[name='email']").addEventListener("input" , (listner)=>{
    validateEmail(listner.target);
});

document.querySelector("input[name='name']").addEventListener("input" , (listner)=>{
    checkNameFill(listner.target);
});

document.querySelector("input[name='pass']").addEventListener("input" , (listner)=>{
    validatePasswordPattern(listner.target);
});

document.querySelector("input[name='conpass']").addEventListener("input" , (listner)=>{
    validateSamePassword(listner.target);
});

for (var ele of document.querySelectorAll("input[type='checkbox']")){
    ele.addEventListener("click", (listner)=>{
       listner.target.parentElement.parentElement.parentElement.querySelector('h2').style.color = 'white'
               
    })
}