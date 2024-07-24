document.addEventListener("DOMContentLoaded", (event) => {
  document.getElementById("arrow-right").addEventListener("click", moveRight);
  document.getElementById("arrow-left").addEventListener("click", moveLeft);
});

let sectionArrays = [
  "#world",
  "#science",
  "#tech",
  "#business",
  "#sports",
  "#entertainment",
];
let lastHundred = null;
let lastZero = null;
let currentSlide = 0;
let lastAuto = false;
try {
  currentSlide = sectionArrays.indexOf(
    "#" +
      (window.location.href.split("#")[1].trim() == ""
        ? "world"
        : window.location.href.split("#")[1].trim().toLowerCase())
  );
} catch (error) {
  currentSlide = 0;
}
console.log(currentSlide);
console.log(sectionArrays[currentSlide]);

async function updatePanelAuto() {
  await document
    .querySelector(sectionArrays[currentSlide] + "-btn")
    .scrollIntoView({
      block: "center",
      behavior: "instant",
    });
  if (currentSlide == 0) {
    document.querySelector("#arrow-left").setAttribute("disabled", "disabled");
  } else if (currentSlide == 5) {
    document.querySelector("#arrow-right").setAttribute("disabled", "disabled");
  } else {
    document.querySelector("#arrow-left").removeAttribute("disabled");
    document.querySelector("#arrow-right").removeAttribute("disabled");
  }
}

async function updateSectionProgress() {
  if (window.innerWidth < 1024) {
    for (let j = 0; j < 6; j++) {
      var sectionId = sectionArrays[j].replace("#", "");
      var ele = document.getElementById(sectionId);

      let value =
        Math.round(
          ((ele.offsetHeight - ele.getBoundingClientRect().bottom) /
            ele.offsetHeight) *
            10000
        ) / 100;
      if (
        value >= 100 &&
        sectionArrays.indexOf(lastHundred) <
          sectionArrays.indexOf("#" + sectionId)
      ) {
        lastHundred = "#" + sectionId;
        currentSlide = sectionArrays.indexOf(lastHundred) + 1;
        currentSlide = currentSlide > 5 ? 5 : currentSlide;
        await updatePanelAuto();

        document.querySelector(sectionArrays[currentSlide]).scrollIntoView({
          block: "start",
          behavior: "auto",
        });
      }
      if (value < 0) {
        let index =
          sectionArrays.indexOf(lastHundred) < 0
            ? 0
            : sectionArrays.indexOf(lastHundred);

        if (value < 0) {
          try {
            if (
              parseInt(
                document
                  .getElementById(
                    `progress-${sectionArrays[currentSlide - 1].replace(
                      "#",
                      ""
                    )}`
                  )
                  .style.width.replace("%", "")
              ) < 99
            ) {
              currentSlide--;
              lastHundred = sectionArrays[currentSlide - 1];
              currentSlide = currentSlide < 0 ? 0 : currentSlide;

              await updatePanelAuto();
              await document
                .querySelector(sectionArrays[currentSlide])
                .scrollIntoView({
                  block: "end",
                });
            }
          } catch (e) {}
        }
      }

      value = value > 100 ? 100 : value;
      value = value < 0 ? 0 : value;

      document.getElementById(`progress-${sectionId}`).style.width =
        value + "%";
    }
  } else {
    for (let j = 0; j < 6; j++) {
      var sectionId = sectionArrays[j].replace("#", "");
      var ele = document.getElementById(sectionId);

      let value = Math.floor(
        ((ele.offsetHeight - ele.getBoundingClientRect().bottom) /
          ele.offsetHeight) *
          100
      );

      if (value >= -2.5 && value <= 97.5) {
        document
          .querySelector(sectionArrays[j] + "-txt")
          .classList.remove("text-white");
        document
          .querySelector(sectionArrays[j] + "-txt")
          .classList.add("text-fuchsia-700");
        document
          .querySelector(sectionArrays[j] + "-txt")
          .classList.add("text-xl");
        document
          .querySelector(sectionArrays[j] + "-txt")
          .classList.add("font-bold");
      } else {
        try {
          document
            .querySelector(sectionArrays[j] + "-txt")
            .classList.remove("text-fuchsia-700");
          document
            .querySelector(sectionArrays[j] + "-txt")
            .classList.remove("font-bold");
          document
            .querySelector(sectionArrays[j] + "-txt")
            .classList.remove("text-xl");
          document
            .querySelector(sectionArrays[j] + "-txt")
            .classList.add("text-white");
        } catch (error) {
          console.log(j, document.querySelector(sectionArrays[j]));
        }
      }
    }
  }
}
function moveRight() {
  currentSlide++;
  document.querySelector("#arrow-left").removeAttribute("disabled");

  document.querySelector(sectionArrays[currentSlide]).scrollIntoView({
    block: "start",
  });
  document.querySelector(sectionArrays[currentSlide] + "-btn").scrollIntoView({
    behavior: "smooth",
  });

  if (currentSlide == 5) {
    document.querySelector("#arrow-right").setAttribute("disabled", "disabled");
  }
  lastHundred = sectionArrays[currentSlide - 1];
}
function moveLeft() {
  currentSlide--;
  if (currentSlide < 0) {
    document.querySelector("#arrow-left").setAttribute("disabled", "disabled");
    lastHundred = null;
    currentSlide = 0;
    return;
  }

  document.querySelector("#arrow-right").removeAttribute("disabled");
  console.log(sectionArrays[currentSlide]);
  document.querySelector(sectionArrays[currentSlide]).scrollIntoView();
  document.querySelector(sectionArrays[currentSlide] + "-btn").scrollIntoView();

  if (currentSlide == 0) {
    console.log("here");
    document.querySelector("#arrow-left").setAttribute("disabled", "disabled");
    document.querySelector("a[name='world']").style.display = "block";
    document.querySelector("a[name='world']").scrollIntoView({
      block: "start",
      behavior: "instant",
    });
    document
      .querySelector(sectionArrays[currentSlide] + "-btn")
      .scrollIntoView({
        behavior: "instant",
      });
    document.querySelector("a[name='world']").style.display = "inline";
  }

  lastHundred = sectionArrays[currentSlide - 1];
}
document
  .getElementById("progressAttach")
  .addEventListener("scroll", updateSectionProgress);
document.addEventListener("DOMContentLoaded", updatePanelAuto);
