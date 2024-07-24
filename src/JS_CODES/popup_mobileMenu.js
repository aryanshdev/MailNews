var popup = document.querySelector("#popup");
function toggleError(visibility) {
  popup.style.display = visibility;
}

document
.getElementById("navbar-solid-bg-btn")
.addEventListener("click", function () {
  document.getElementById("navArrow").classList.toggle("rotate-180");
  document.getElementById("mobile-menu").classList.toggle("hidden");
});

  //POPUP JS

  var currentPopUpTimeoutID;
  
  function showPopup(textMessage, type = "info", durartion = 5000) {
    clearTimeout(currentPopUpTimeoutID);
    if (type === "err") {
      popup.style.backgroundColor = "rgb(153, 27, 27)";
    } else if (type === "info") {
      popup.style.backgroundColor = "rgb(29, 78, 216)";
    } else if (type === "success") {
      popup.style.backgroundColor = "rgb(38, 193, 0)";
    }
    else if (type === "warn") {
      popup.style.backgroundColor = "rgb(202, 138, 4)";
    }
    popup.textContent = textMessage;
    popup.classList.add("mr-7");
    popup.classList.remove("translate-x-100");

    currentPopUpTimeoutID = setTimeout(() => {
      popup.classList.remove("mr-7");
      popup.classList.add("translate-x-100");
    }, durartion);
  }
